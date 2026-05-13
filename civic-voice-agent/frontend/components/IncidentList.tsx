"use client";

import { Incident } from "@/lib/api";

export default function IncidentList({ incidents }: { incidents: Incident[] }) {
  if (incidents.length === 0) {
    return <p className="muted">No confirmed incidents yet.</p>;
  }
  return (
    <ul className="incidents">
      {incidents.map((i) => {
        const cls =
          i.category === "normal_traffic"
            ? "normal"
            : i.category === "vehicle_accident"
              ? "alert"
              : i.category === "road_obstruction"
                ? "warn"
                : "";
        return (
          <li key={i.id}>
            <div>
              <span className={`category-pill ${cls}`}>
                {i.category.replace(/_/g, " ")}
              </span>
              <div style={{ marginTop: "0.3rem" }}>{i.summary}</div>
              <div className="confidence">
                {Math.round(i.confidence * 100)}% confidence
              </div>
            </div>
            <div className="timestamp">
              {new Date(i.created_at).toLocaleString()}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
