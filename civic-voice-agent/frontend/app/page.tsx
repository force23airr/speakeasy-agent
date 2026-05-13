"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchIncidents,
  fetchState,
  Incident,
  LiveDetection,
} from "@/lib/api";
import { DEFAULT_SECTOR_ID, getSector } from "@/lib/sectors";
import Header from "@/components/Header";
import StatTiles from "@/components/StatTiles";
import CameraPanel from "@/components/CameraPanel";
import RecentActivity from "@/components/RecentActivity";
import VoiceAgent from "@/components/VoiceAgent";
import AgentTranscript, { AgentTurn } from "@/components/AgentTranscript";
import IncidentList from "@/components/IncidentList";
import VideoUpload from "@/components/VideoUpload";

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

  function recordTurn(q: string, a: string) {
    setTranscript((t) => [...t, { q, a, at: new Date().toISOString() }]);
  }

  return (
    <div className="app">
      <Header
        apiOk={apiOk}
        liveCategory={live?.category ?? null}
        sector={sector}
        onSectorChange={setSectorId}
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
              <h2 className="panel-title">Ask the agent</h2>
              <span className="panel-hint">{sector.label}</span>
            </div>
            <VoiceAgent sector={sector} onTurn={recordTurn} />
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Transcript</h2>
              <span className="panel-hint">{transcript.length} turns</span>
            </div>
            <AgentTranscript turns={transcript} />
          </section>
        </div>

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
