import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { config } from "../config";
import { insertIncident } from "../db";
import { runDetector } from "../vision";

fs.mkdirSync(config.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => {
    const stamp = Date.now();
    const safe = file.originalname.replace(/[^\w.\-]+/g, "_");
    cb(null, `${stamp}_${safe}`);
  },
});

const upload = multer({ storage });

export const uploadRouter = Router();

uploadRouter.post("/upload", upload.single("video"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "video file required" });

  const videoPath = path.resolve(req.file.path);
  try {
    const detection = await runDetector(videoPath);
    const incident = await insertIncident(
      videoPath,
      detection.category,
      detection.confidence,
      detection.summary,
    );
    res.json({ incident, detection });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});
