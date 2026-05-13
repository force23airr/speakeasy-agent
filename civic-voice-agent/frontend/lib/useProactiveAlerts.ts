"use client";

import { useEffect, useRef } from "react";
import { LiveDetection } from "./api";

interface Options {
  enabled: boolean;
  confidenceThreshold?: number;
  cooldownMs?: number;
  onAlert: (text: string, detection: LiveDetection) => void;
}

export function useProactiveAlerts(
  live: LiveDetection | null,
  options: Options,
) {
  const {
    enabled,
    confidenceThreshold = 0.8,
    cooldownMs = 25000,
    onAlert,
  } = options;
  const lastRef = useRef<{ category: string; at: number } | null>(null);

  useEffect(() => {
    if (!enabled || !live) return;
    if (live.category === "normal_traffic") return;
    if (live.confidence < confidenceThreshold) return;

    const last = lastRef.current;
    const now = Date.now();
    const categoryChanged = !last || last.category !== live.category;
    const cooldownElapsed = !last || now - last.at >= cooldownMs;
    if (!categoryChanged && !cooldownElapsed) return;

    lastRef.current = { category: live.category, at: now };
    onAlert(formatAlert(live), live);
  }, [live, enabled, confidenceThreshold, cooldownMs, onAlert]);
}

function formatAlert(d: LiveDetection): string {
  const pct = Math.round(d.confidence * 100);
  if (d.category === "vehicle_accident") {
    return `Alert. Possible collision detected. Confidence ${pct} percent. Recommend review.`;
  }
  if (d.category === "road_obstruction") {
    return `Heads up. ${d.summary} Confidence ${pct} percent.`;
  }
  if (d.category === "pedestrian_activity") {
    return `Note. Pedestrian movement detected. Confidence ${pct} percent.`;
  }
  return `Update. ${d.summary} Confidence ${pct} percent.`;
}
