"use client";

import { LiveDetection, Incident } from "@/lib/api";

interface Props {
  framesAnalyzed: number;
  live: LiveDetection | null;
  recent: LiveDetection[];
  incidents: Incident[];
}

export default function StatTiles({
  framesAnalyzed,
  live,
  recent,
  incidents,
}: Props) {
  const conf = live ? `${Math.round(live.confidence * 100)}%` : "—";
  const cat = live ? live.category.replace(/_/g, " ") : "—";
  const alerts = recent.filter(
    (d) => d.category !== "normal_traffic" && d.confidence >= 0.7,
  ).length;

  return (
    <div className="stats">
      <Tile label="Frames analyzed" value={framesAnalyzed} sub="this session" />
      <Tile label="Current state" value={cat} sub="from live feed" />
      <Tile label="Confidence" value={conf} sub="latest detection" />
      <Tile
        label="Alerts"
        value={alerts}
        sub={`${incidents.length} confirmed in DB`}
      />
    </div>
  );
}

function Tile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="tile">
      <div className="tile-label">{label}</div>
      <div className="tile-value">{value}</div>
      <div className="tile-sub">{sub}</div>
    </div>
  );
}
