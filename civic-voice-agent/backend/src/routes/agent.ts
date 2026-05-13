import { Router } from "express";
import { latestIncident, Incident } from "../db";
import { current, recent, LiveDetection } from "../state";
import { config } from "../config";

export const agentRouter = Router();

const AGENT_PERSONAS: Record<string, string> = {
  assistant:
    "Be friendly and conversational. Help the operator with whatever they need.",
  watcher:
    "You are TERSE and fact-only. Respond in ONE short sentence about the current detection. Do not speculate.",
  analyst:
    "You analyze patterns and trends. Reference the recent detection history when relevant. Identify anomalies or repeated categories.",
  dispatcher:
    "You are action-oriented. Recommend specific next steps based on the detection. Be decisive but flag uncertainty when confidence is low.",
};

agentRouter.post("/agent", async (req, res) => {
  const question: string = (req.body?.question ?? "").toString().trim();
  const sector: string = (req.body?.sector ?? "general operations").toString();
  const agentId: string = (req.body?.agent ?? "assistant").toString();
  const personaPrompt =
    AGENT_PERSONAS[agentId] ?? AGENT_PERSONAS.assistant;

  try {
    const live = current();
    const incident = await latestIncident();
    const recentBuf = recent(8);
    const answer = await llmAnswer(
      question,
      sector,
      personaPrompt,
      live,
      recentBuf,
      incident,
    );
    res.json({ answer, agent: agentId, live, incident });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

async function llmAnswer(
  question: string,
  sector: string,
  persona: string,
  live: LiveDetection | null,
  recentBuf: LiveDetection[],
  incident: Incident | null,
): Promise<string> {
  const system = buildSystemPrompt(sector, persona, live, recentBuf, incident);
  const userMsg = question || "What's the situation?";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.ollamaTimeoutMs);

  try {
    const resp = await fetch(`${config.ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.ollamaModel,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
        stream: false,
        options: { temperature: 0.3, num_predict: 150 },
      }),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Ollama ${resp.status}: ${body}`);
    }

    const data = (await resp.json()) as { message?: { content?: string } };
    const text = data.message?.content?.trim();
    if (!text) throw new Error("Ollama returned empty response");
    return text;
  } catch (err) {
    console.error("[agent] ollama error:", err);
    return "Agent service is unavailable. Make sure Ollama is running and the model is pulled.";
  } finally {
    clearTimeout(timer);
  }
}

function buildSystemPrompt(
  sector: string,
  persona: string,
  live: LiveDetection | null,
  recentBuf: LiveDetection[],
  incident: Incident | null,
): string {
  const lines: string[] = [
    `You are a voice agent assisting a ${sector} operator monitoring a live camera feed.`,
    `Responses are spoken aloud — keep them BRIEF (one or two short sentences). No bullet points, no headers.`,
    `Speak plain English. State facts directly. Do not invent details not present in the data below.`,
    ``,
    `PERSONA: ${persona}`,
  ];

  lines.push("");
  if (live) {
    const pct = Math.round(live.confidence * 100);
    lines.push("CURRENT DETECTION (right now):");
    lines.push(`- Summary: ${live.summary}`);
    lines.push(`- Category: ${live.category.replace(/_/g, " ")}`);
    lines.push(`- Confidence: ${pct}%`);
  } else {
    lines.push("CURRENT DETECTION: none (no feed active).");
  }

  if (recentBuf.length > 0) {
    const cats = Array.from(
      new Set(recentBuf.map((d) => d.category.replace(/_/g, " "))),
    );
    lines.push("");
    lines.push(
      `RECENT (last ${recentBuf.length} detections): ${cats.join(", ")}`,
    );
  }

  if (incident) {
    lines.push("");
    lines.push(
      `LAST CONFIRMED INCIDENT (from history): ${incident.summary} — ${incident.category.replace(/_/g, " ")} at ${new Date(incident.created_at).toLocaleString()}.`,
    );
  }

  lines.push("");
  lines.push(
    `Answer the operator's question naturally and briefly. If the question is unrelated to the feed, politely refocus.`,
  );

  return lines.join("\n");
}
