"use client";

import { LiveDetection } from "@/lib/api";

export default function RecentActivity({
  detections,
}: {
  detections: LiveDetection[];
}) {
  if (detections.length === 0) {
    return <p className="muted">No activity yet. Start the camera.</p>;
  }
  return (
    <ul className="activity">
      {detections.map((d, i) => (
        <li key={`${d.at}-${i}`}>
          <span className="t">{formatTime(d.at)}</span>
          <div>
            <span className={`category-pill ${pillClass(d)}`}>
              {d.category.replace(/_/g, " ")}
            </span>
            <div className="sum">{d.summary}</div>
            <div className="meta">{Math.round(d.confidence * 100)}% confidence</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function pillClass(d: LiveDetection): string {
  if (d.category === "normal_traffic") return "normal";
  if (d.category === "vehicle_accident") return "alert";
  if (d.category === "road_obstruction") return "warn";
  return "";
}
