import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import { runDetector } from "../vision";
import { record } from "../state";

const tmpDir = path.join(os.tmpdir(), "civic-frames");
fs.mkdirSync(tmpDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tmpDir),
  filename: (_req, _file, cb) => cb(null, `frame_${Date.now()}.jpg`),
});

const upload = multer({ storage });

export const frameRouter = Router();

frameRouter.post("/frame", upload.single("frame"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "frame required" });
  const framePath = req.file.path;
  try {
    const detection = await runDetector(framePath);
    const entry = record({
      category: detection.category,
      confidence: detection.confidence,
      summary: detection.summary,
      objects: detection.objects,
    });
    res.json({ detection: entry });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : String(err),
    });
  } finally {
    fs.promises.unlink(framePath).catch(() => {});
  }
});
