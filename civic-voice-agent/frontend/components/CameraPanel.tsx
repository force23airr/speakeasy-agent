"use client";

import { useEffect, useRef, useState } from "react";
import { sendFrame, LiveDetection } from "@/lib/api";
import { useMockAnimation } from "@/lib/useMockAnimation";

type Source = "webcam" | "mock";

interface Props {
  intervalMs?: number;
  onDetection: (d: LiveDetection) => void;
  onFrameSent?: () => void;
}

export default function CameraPanel({
  intervalMs = 2000,
  onDetection,
  onFrameSent,
}: Props) {
  const [source, setSource] = useState<Source>("webcam");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<LiveDetection | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mockCanvasRef = useRef<HTMLCanvasElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);

  useMockAnimation(mockCanvasRef, running && source === "mock");

  async function start() {
    setError(null);
    if (source === "webcam") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        return;
      }
    }
    setRunning(true);
  }

  function stop() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setRunning(false);
  }

  function switchSource(next: Source) {
    if (running) stop();
    setSource(next);
  }

  useEffect(() => {
    if (!running) return;
    timerRef.current = window.setInterval(() => {
      if (inFlightRef.current) return;
      captureAndSend();
    }, intervalMs);
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, intervalMs, source]);

  function captureAndSend() {
    const cap = captureCanvasRef.current;
    if (!cap) return;
    const ctx = cap.getContext("2d");
    if (!ctx) return;

    if (source === "webcam") {
      const v = videoRef.current;
      if (!v || v.readyState < 2) return;
      cap.width = v.videoWidth;
      cap.height = v.videoHeight;
      ctx.drawImage(v, 0, 0);
    } else {
      const mc = mockCanvasRef.current;
      if (!mc) return;
      cap.width = mc.width;
      cap.height = mc.height;
      ctx.drawImage(mc, 0, 0);
    }

    inFlightRef.current = true;
    cap.toBlob(
      async (blob) => {
        if (!blob) {
          inFlightRef.current = false;
          return;
        }
        try {
          const detection = await sendFrame(blob);
          setLive(detection);
          onDetection(detection);
          onFrameSent?.();
        } catch (err) {
          console.error("frame error", err);
        } finally {
          inFlightRef.current = false;
        }
      },
      "image/jpeg",
      0.7,
    );
  }

  useEffect(() => () => stop(), []);

  const pct = live ? Math.round(live.confidence * 100) : null;
  const pillCls = live
    ? live.category === "normal_traffic"
      ? "normal"
      : live.category === "vehicle_accident"
        ? "alert"
        : live.category === "road_obstruction"
          ? "warn"
          : ""
    : "";

  return (
    <div>
      <div className="segment" style={{ marginBottom: "0.7rem" }}>
        <button
          className={source === "webcam" ? "active" : ""}
          onClick={() => switchSource("webcam")}
        >
          Webcam
        </button>
        <button
          className={source === "mock" ? "active" : ""}
          onClick={() => switchSource("mock")}
        >
          Mock feed
        </button>
      </div>

      <div className="camera-wrap">
        {!running && <div className="camera-empty">Feed off</div>}
        {source === "webcam" && (
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ display: running ? "block" : "none" }}
          />
        )}
        {source === "mock" && (
          <canvas
            ref={mockCanvasRef}
            style={{
              display: running ? "block" : "none",
              width: "100%",
              height: "100%",
            }}
          />
        )}
        {running && live && (
          <div className="camera-overlay">
            <span className="status-dot live" />
            <span className={`category-pill ${pillCls}`}>
              {live.category.replace(/_/g, " ")}
            </span>
            <span className="muted" style={{ fontSize: "0.78rem" }}>
              {pct}% · {new Date(live.at).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      <canvas ref={captureCanvasRef} style={{ display: "none" }} />

      <div className="camera-controls">
        {!running ? (
          <button className="btn-live" onClick={start}>
            ● Start {source === "webcam" ? "camera" : "mock feed"}
          </button>
        ) : (
          <button className="btn-ghost" onClick={stop}>
            ■ Stop
          </button>
        )}
        <span className="muted" style={{ fontSize: "0.8rem" }}>
          {running ? `sampling every ${intervalMs / 1000}s` : "idle"}
        </span>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
