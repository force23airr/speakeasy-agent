"use client";

import SectorPicker from "./SectorPicker";
import { Sector } from "@/lib/sectors";

interface Props {
  apiOk: boolean;
  liveCategory: string | null;
  sector: Sector;
  onSectorChange: (id: string) => void;
}

export default function Header({
  apiOk,
  liveCategory,
  sector,
  onSectorChange,
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
