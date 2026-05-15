"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { sendFrame, LiveDetection } from "@/lib/api";

type Source = "webcam" | "video";

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
  const [videoUrl, setVideoUrl] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const localFileUrlRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);

  function teardownPlayback() {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute("src");
      videoRef.current.srcObject = null;
      videoRef.current.load();
    }
    if (localFileUrlRef.current) {
      URL.revokeObjectURL(localFileUrlRef.current);
      localFileUrlRef.current = null;
    }
  }

  async function startWebcam() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
      audio: false,
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      await videoRef.current.play();
    }
  }

  async function startVideo(url: string) {
    const v = videoRef.current;
    if (!v) return;
    v.crossOrigin = "anonymous";
    v.muted = true;
    v.loop = true;
    v.playsInline = true;

    const isHls = url.toLowerCase().includes(".m3u8");
    if (isHls && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(v);
      hlsRef.current = hls;
      await new Promise<void>((resolve, reject) => {
        hls.on(Hls.Events.MANIFEST_PARSED, () => resolve());
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) reject(new Error(`HLS error: ${data.details}`));
        });
      });
    } else {
      v.src = url;
    }
    await v.play();
  }

  async function start() {
    setError(null);
    try {
      if (source === "webcam") {
        await startWebcam();
      } else {
        if (!videoUrl) {
          setError("Pick a video file or paste a URL first.");
          return;
        }
        await startVideo(videoUrl);
      }
      setRunning(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      teardownPlayback();
    }
  }

  function stop() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    teardownPlayback();
    setRunning(false);
  }

  function switchSource(next: Source) {
    if (running) stop();
    setSource(next);
    setError(null);
  }

  function pickLocalFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (localFileUrlRef.current) URL.revokeObjectURL(localFileUrlRef.current);
    const url = URL.createObjectURL(file);
    localFileUrlRef.current = url;
    setVideoUrl(url);
    setError(null);
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
    const v = videoRef.current;
    if (!cap || !v || v.readyState < 2 || v.videoWidth === 0) return;
    const ctx = cap.getContext("2d");
    if (!ctx) return;

    cap.width = v.videoWidth;
    cap.height = v.videoHeight;
    try {
      ctx.drawImage(v, 0, 0);
    } catch (err) {
      setError(`Frame capture failed: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }

    inFlightRef.current = true;
    try {
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
    } catch (err) {
      inFlightRef.current = false;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("tainted") || msg.includes("CORS") || msg.includes("Security")) {
        setError(
          "This source's server doesn't allow cross-origin frame capture. Try a local file, or a URL with CORS headers.",
        );
        stop();
      } else {
        console.error("toBlob error", err);
      }
    }
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
          className={source === "video" ? "active" : ""}
          onClick={() => switchSource("video")}
        >
          Video source
        </button>
      </div>

      {source === "video" && !running && (
        <div className="video-source-controls">
          <div className="video-source-row">
            <input
              type="text"
              className="text-input"
              placeholder="Paste an .mp4 / .webm / .m3u8 URL"
              value={videoUrl.startsWith("blob:") ? "" : videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
            <label className="btn-ghost file-pick">
              Pick file…
              <input
                type="file"
                accept="video/*"
                onChange={pickLocalFile}
                style={{ display: "none" }}
              />
            </label>
          </div>
          {videoUrl.startsWith("blob:") && (
            <p className="muted" style={{ fontSize: "0.78rem", marginTop: "0.4rem" }}>
              Local file selected · ready to start
            </p>
          )}
          <p className="muted" style={{ fontSize: "0.75rem", marginTop: "0.4rem" }}>
            Tips: local files are most reliable. HLS streams (.m3u8) work via hls.js.
            Remote URLs without CORS headers can't be frame-captured.
          </p>
        </div>
      )}

      <div className="camera-wrap">
        {!running && <div className="camera-empty">Feed off</div>}
        <video
          ref={videoRef}
          playsInline
          muted
          style={{ display: running ? "block" : "none" }}
        />
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
            ● Start {source === "webcam" ? "camera" : "feed"}
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
