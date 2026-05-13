"use client";

import { useState } from "react";
import { uploadVideo } from "@/lib/api";

export default function VideoUpload({ onUploaded }: { onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await uploadVideo(file);
      setFile(null);
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="voice-row">
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={busy}
        />
        <button className="btn-ghost" onClick={submit} disabled={!file || busy}>
          {busy ? "Analyzing..." : "Upload & analyze"}
        </button>
      </div>
      <p className="muted" style={{ fontSize: "0.78rem", marginTop: "0.5rem" }}>
        Persists as a confirmed incident in Postgres.
      </p>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
