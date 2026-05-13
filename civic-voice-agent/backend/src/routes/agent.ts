import { Router } from "express";
import { latestIncident, Incident } from "../db";
import { current, recent, LiveDetection } from "../state";

export const agentRouter = Router();

agentRouter.post("/agent", async (req, res) => {
  const question: string = (req.body?.question ?? "").toString().trim();
  try {
    const live = current();
    const incident = await latestIncident();
    const answer = answerFor(question, live, incident);
    res.json({ answer, live, incident });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

function answerFor(
  question: string,
  live: LiveDetection | null,
  incident: Incident | null,
): string {
  const q = question.toLowerCase();
  const historical =
    q.includes("earlier") ||
    q.includes("history") ||
    q.includes("past") ||
    q.includes("last incident");

  const source: LiveDetection | null = historical && incident
    ? toLive(incident)
    : live ?? (incident ? toLive(incident) : null);

  if (!source) {
    return "I'm not seeing any feed yet. Start the camera and I'll keep watch.";
  }

  const pct = Math.round(source.confidence * 100);
  const cat = source.category.replace(/_/g, " ");

  if (q.includes("confidence") || q.includes("sure")) {
    return `Confidence is about ${pct} percent.`;
  }
  if (q.includes("category") || q.includes("type") || q.includes("kind")) {
    return `Current category is ${cat}.`;
  }
  if (q.includes("when")) {
    const when = new Date(source.at).toLocaleTimeString();
    return `Last update was at ${when}.`;
  }
  if (q.includes("trend") || q.includes("recently") || q.includes("anything")) {
    const r = recent(5);
    if (r.length > 1) {
      const cats = Array.from(new Set(r.map((d) => d.category.replace(/_/g, " "))));
      return `Recently I've seen: ${cats.join(", ")}. Right now, ${source.summary.toLowerCase()}`;
    }
  }

  return `${source.summary} Category ${cat} at ${pct} percent confidence.`;
}

function toLive(i: Incident): LiveDetection {
  return {
    category: i.category,
    confidence: i.confidence,
    summary: i.summary,
    at: i.created_at,
  };
}
