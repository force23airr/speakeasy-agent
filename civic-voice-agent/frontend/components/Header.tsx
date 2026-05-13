"use client";

import SectorPicker from "./SectorPicker";
import { Sector } from "@/lib/sectors";

interface Props {
  apiOk: boolean;
  liveCategory: string | null;
  sector: Sector;
  onSectorChange: (id: string) => void;
  alertsEnabled: boolean;
  onAlertsToggle: () => void;
}

export default function Header({
  apiOk,
  liveCategory,
  sector,
  onSectorChange,
  alertsEnabled,
  onAlertsToggle,
}: Props) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="brand">
          civic-voice-agent
          <span className="brand-sub">· {sector.tagline}</span>
        </div>
      </div>
      <div className="header-right">
        <SectorPicker value={sector.id} onChange={onSectorChange} />
        <button
          className="header-toggle"
          onClick={onAlertsToggle}
          title={alertsEnabled ? "Auto-alerts on — click to mute" : "Auto-alerts off — click to enable"}
        >
          <span className={`status-dot ${alertsEnabled ? "live" : ""}`} />
          alerts {alertsEnabled ? "on" : "off"}
        </button>
        <span>
          <span className={`status-dot ${apiOk ? "live" : "alert"}`} />
          API {apiOk ? "connected" : "offline"}
        </span>
        <span>
          <span className={`status-dot ${liveCategory ? "live" : ""}`} />
          {liveCategory
            ? `watching · ${liveCategory.replace(/_/g, " ")}`
            : "idle"}
        </span>
      </div>
    </header>
  );
}
