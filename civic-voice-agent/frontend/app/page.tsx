"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchIncidents,
  fetchState,
  askAgent,
  Incident,
  LiveDetection,
} from "@/lib/api";
import { DEFAULT_SECTOR_ID, getSector } from "@/lib/sectors";
import { useProactiveAlerts } from "@/lib/useProactiveAlerts";
import { speak } from "@/lib/speech";
import Header from "@/components/Header";
import StatTiles from "@/components/StatTiles";
import CameraPanel from "@/components/CameraPanel";
import RecentActivity from "@/components/RecentActivity";
import VoiceAgent from "@/components/VoiceAgent";
import AgentTranscript, { AgentTurn } from "@/components/AgentTranscript";
import IncidentList from "@/components/IncidentList";
import VideoUpload from "@/components/VideoUpload";
import Integrations from "@/components/Integrations";

export default function Home() {
  const [sectorId, setSectorId] = useState<string>(DEFAULT_SECTOR_ID);
  const sector = getSector(sectorId);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [live, setLive] = useState<LiveDetection | null>(null);
  const [recent, setRecent] = useState<LiveDetection[]>([]);
  const [framesAnalyzed, setFramesAnalyzed] = useState(0);
  const [apiOk, setApiOk] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<AgentTurn[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [agentBusy, setAgentBusy] = useState(false);

  const refreshIncidents = useCallback(async () => {
    try {
      setIncidents(await fetchIncidents());
      setApiOk(true);
      setError(null);
    } catch (err) {
      setApiOk(false);
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const refreshState = useCallback(async () => {
    try {
      const s = await fetchState();
      setLive(s.current);
      setRecent(s.recent);
      setApiOk(true);
    } catch {
      setApiOk(false);
    }
  }, []);

  useEffect(() => {
    refreshIncidents();
    refreshState();
    const id = window.setInterval(refreshState, 2500);
    return () => window.clearInterval(id);
  }, [refreshIncidents, refreshState]);

  const handleAlert = useCallback((text: string) => {
    speak(text);
    setTranscript((t) => [
      ...t,
      { kind: "alert", a: text, at: new Date().toISOString() },
    ]);
  }, []);

  useProactiveAlerts(live, {
    enabled: alertsEnabled,
    onAlert: handleAlert,
  });

  function recordVoiceTurn(q: string, a: string) {
    setTranscript((t) => [
      ...t,
      { kind: "ask", q, a, agent: "assistant", at: new Date().toISOString() },
    ]);
  }

  async function submitChat(text: string, agentId: string) {
    setAgentBusy(true);
    try {
      const { answer, agent } = await askAgent(text, sector.label, agentId);
      speak(answer);
      setTranscript((t) => [
        ...t,
        { kind: "ask", q: text, a: answer, agent, at: new Date().toISOString() },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setTranscript((t) => [
        ...t,
        {
          kind: "ask",
          q: text,
          a: `Error: ${msg}`,
          agent: agentId,
          at: new Date().toISOString(),
        },
      ]);
    } finally {
      setAgentBusy(false);
    }
  }

  return (
    <div className="app">
      <Header
        apiOk={apiOk}
        liveCategory={live?.category ?? null}
        sector={sector}
        onSectorChange={setSectorId}
        alertsEnabled={alertsEnabled}
        onAlertsToggle={() => setAlertsEnabled((v) => !v)}
      />

      <div className="content">
        <StatTiles
          framesAnalyzed={framesAnalyzed}
          live={live}
          recent={recent}
          incidents={incidents}
        />

        <div className="main-row">
          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Live feed</h2>
              <span className="panel-hint">webcam or mock · 2s sampling</span>
            </div>
            <CameraPanel
              onDetection={(d) => {
                setLive(d);
                setRecent((r) => [d, ...r].slice(0, 10));
              }}
              onFrameSent={() => setFramesAnalyzed((n) => n + 1)}
            />
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Recent activity</h2>
              <span className="panel-hint">last 10</span>
            </div>
            <RecentActivity detections={recent} />
          </section>
        </div>

        <div className="bottom-row">
          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Ask by voice</h2>
              <span className="panel-hint">{sector.label}</span>
            </div>
            <VoiceAgent sector={sector} onTurn={recordVoiceTurn} />
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Transcript & chat</h2>
              <span className="panel-hint">{transcript.length} turns</span>
            </div>
            <AgentTranscript
              turns={transcript}
              busy={agentBusy}
              onSubmit={submitChat}
            />
          </section>
        </div>

        <section className="panel" style={{ marginTop: "0.9rem" }}>
          <div className="panel-head">
            <h2 className="panel-title">Integrations</h2>
            <span className="panel-hint">connect external APIs · all placeholders</span>
          </div>
          <Integrations />
        </section>

        <section className="panel" style={{ marginTop: "0.9rem" }}>
          <div className="panel-head">
            <h2 className="panel-title">Confirmed incidents</h2>
            <span className="panel-hint">Postgres history</span>
          </div>
          <IncidentList incidents={incidents} />
          <div
            style={{
              marginTop: "0.9rem",
              borderTop: "1px solid var(--border)",
              paddingTop: "0.9rem",
            }}
          >
            <VideoUpload onUploaded={refreshIncidents} />
          </div>
        </section>

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
