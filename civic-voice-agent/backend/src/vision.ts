import { spawn } from "child_process";
import { config } from "./config";

export interface DetectedObject {
  class: string;
  count: number;
}

export interface Detection {
  category: string;
  confidence: number;
  summary: string;
  objects?: DetectedObject[];
  note?: string;
}

/**
 * Hot path — live frames. Calls the long-running Python sidecar (serve.py)
 * over HTTP so the YOLO model stays resident in RAM between frames.
 */
export async function runDetector(framePath: string): Promise<Detection> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.visionTimeoutMs);
  try {
    const resp = await fetch(`${config.visionServerUrl}/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: framePath }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      throw new Error(`vision sidecar ${resp.status}: ${await resp.text()}`);
    }
    const parsed = (await resp.json()) as Detection;
    if (!parsed.category || typeof parsed.confidence !== "number") {
      throw new Error(
        `vision sidecar returned invalid payload: ${JSON.stringify(parsed)}`,
      );
    }
    return parsed;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Cold path — one-off uploaded videos. Spawns detect.py via subprocess; the
 * ~3s torch + model load is fine for an explicit user upload action.
 */
export function runDetectorCli(videoPath: string): Promise<Detection> {
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
          return reject(
            new Error(`detect.py returned invalid payload: ${stdout}`),
          );
        }
        resolve(parsed);
      } catch (err) {
        reject(new Error(`detect.py returned non-JSON: ${stdout}`));
      }
    });
  });
}
