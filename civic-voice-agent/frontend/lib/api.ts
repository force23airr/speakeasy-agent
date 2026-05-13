export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface Incident {
  id: number;
  video_path: string;
  category: string;
  confidence: number;
  summary: string;
  created_at: string;
}

export interface LiveDetection {
  category: string;
  confidence: number;
  summary: string;
  at: string;
}

export interface LiveState {
  current: LiveDetection | null;
  recent: LiveDetection[];
}

export async function uploadVideo(file: File): Promise<Incident> {
  const form = new FormData();
  form.append("video", file);
  const res = await fetch(`${API_URL}/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as { incident: Incident };
  return data.incident;
}

export async function fetchIncidents(): Promise<Incident[]> {
  const res = await fetch(`${API_URL}/incidents`, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as { incidents: Incident[] };
  return data.incidents;
}

export async function sendFrame(blob: Blob): Promise<LiveDetection> {
  const form = new FormData();
  form.append("frame", blob, "frame.jpg");
  const res = await fetch(`${API_URL}/frame`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as { detection: LiveDetection };
  return data.detection;
}

export async function fetchState(): Promise<LiveState> {
  const res = await fetch(`${API_URL}/state`, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as LiveState;
}

export async function askAgent(
  question: string,
  sector?: string,
  agent?: string,
): Promise<{ answer: string; agent: string }> {
  const res = await fetch(`${API_URL}/agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, sector, agent }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as { answer: string; agent?: string };
  return { answer: data.answer, agent: data.agent ?? agent ?? "assistant" };
}
