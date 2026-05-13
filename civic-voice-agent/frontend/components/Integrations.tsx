"use client";

import { useState } from "react";

interface Integration {
  id: string;
  name: string;
  category: string;
  desc: string;
  badge?: string;
}

const INTEGRATIONS: Integration[] = [
  { id: "openweather", name: "OpenWeather", category: "Data", desc: "Live weather + air-quality context for the feed" },
  { id: "google-traffic", name: "Google Maps Traffic", category: "Data", desc: "Real-time congestion and incident overlays" },
  { id: "noaa", name: "NOAA Alerts", category: "Data", desc: "Severe weather, marine, and aviation alerts" },
  { id: "open311", name: "311 / Open311", category: "Data", desc: "Civic complaint and service-request stream" },
  { id: "twilio", name: "Twilio SMS", category: "Outbound", desc: "Page field staff when alerts fire" },
  { id: "slack", name: "Slack", category: "Outbound", desc: "Post alerts and clips to a channel" },
  { id: "teams", name: "Microsoft Teams", category: "Outbound", desc: "Push notifications into a Teams channel" },
  { id: "webhook", name: "Generic Webhook", category: "Outbound", desc: "POST every alert to any URL" },
  { id: "salesforce", name: "Salesforce", category: "CRM", desc: "Sync confirmed incidents as cases" },
  { id: "servicenow", name: "ServiceNow", category: "ITSM", desc: "Create tickets from alerts and incidents" },
  { id: "mapbox", name: "Mapbox", category: "Mapping", desc: "Geocode and map detection locations" },
  { id: "rtsp", name: "RTSP Camera", category: "Input", desc: "Ingest an IP camera stream as a feed source", badge: "next" },
];

const CATEGORY_ORDER = ["Data", "Input", "Outbound", "CRM", "ITSM", "Mapping"];

export default function Integrations() {
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  function connect(i: Integration) {
    setBusy(i.id);
    setNote(null);
    window.setTimeout(() => {
      setBusy(null);
      setNote(
        `${i.name} is a placeholder. Wire up an adapter in backend/src/integrations/ and add an env var to enable it.`,
      );
    }, 350);
  }

  const groups: Record<string, Integration[]> = {};
  for (const i of INTEGRATIONS) (groups[i.category] ??= []).push(i);

  return (
    <div>
      {CATEGORY_ORDER.filter((c) => groups[c]).map((category) => (
        <div key={category} className="integration-group">
          <div className="integration-group-title">{category}</div>
          <div className="integration-grid">
            {groups[category].map((i) => (
              <div key={i.id} className="integration-card">
                <div className="integration-name">
                  {i.name}
                  {i.badge && <span className="integration-badge">{i.badge}</span>}
                </div>
                <div className="integration-desc">{i.desc}</div>
                <button
                  className="btn-ghost integration-btn"
                  onClick={() => connect(i)}
                  disabled={busy === i.id}
                >
                  {busy === i.id ? "…" : "Connect"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
      {note && <p className="muted" style={{ marginTop: "0.6rem", fontSize: "0.8rem" }}>{note}</p>}
    </div>
  );
}
