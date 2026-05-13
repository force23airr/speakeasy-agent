import { spawn } from "child_process";
import { config } from "./config";

export interface Detection {
  category: string;
  confidence: number;
  summary: string;
  note?: string;
}

export function runDetector(videoPath: string): Promise<Detection> {
  return new Promise((resolve, reject) => {
    const proc = spawn(config.pythonBin, [config.visionScript, videoPath]);

    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    proc.stderr.on("data", (chunk) => (stderr += chunk.toString()));

    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`detect.py exited ${code}: ${stderr.trim()}`));
      }
      try {
        const parsed = JSON.parse(stdout) as Detection;
        if (!parsed.category || typeof parsed.confidence !== "number") {
          return reject(new Error(`detect.py returned invalid payload: ${stdout}`));
        }
        resolve(parsed);
      } catch (err) {
        reject(new Error(`detect.py returned non-JSON: ${stdout}`));
      }
    });
  });
}
