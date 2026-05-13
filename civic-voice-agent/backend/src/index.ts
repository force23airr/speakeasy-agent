import express from "express";
import cors from "cors";
import { config } from "./config";
import { ensureSchema } from "./db";
import { uploadRouter } from "./routes/upload";
import { incidentsRouter } from "./routes/incidents";
import { agentRouter } from "./routes/agent";
import { frameRouter } from "./routes/frame";
import { stateRouter } from "./routes/state";

async function main() {
  await ensureSchema();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use(uploadRouter);
  app.use(incidentsRouter);
  app.use(agentRouter);
  app.use(frameRouter);
  app.use(stateRouter);

  app.listen(config.port, () => {
    console.log(`civic-voice-agent backend listening on :${config.port}`);
  });
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
