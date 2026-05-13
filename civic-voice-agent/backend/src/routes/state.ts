import { Router } from "express";
import { current, recent } from "../state";

export const stateRouter = Router();

stateRouter.get("/state", (_req, res) => {
  res.json({ current: current(), recent: recent() });
});
