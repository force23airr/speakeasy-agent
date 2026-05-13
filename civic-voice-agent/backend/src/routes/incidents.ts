import { Router } from "express";
import { listIncidents } from "../db";

export const incidentsRouter = Router();

incidentsRouter.get("/incidents", async (_req, res) => {
  try {
    const incidents = await listIncidents();
    res.json({ incidents });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});
