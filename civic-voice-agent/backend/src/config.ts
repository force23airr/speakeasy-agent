import path from "path";

const root = path.resolve(__dirname, "..");

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl:
    process.env.DATABASE_URL ?? "postgres://civic:civic@localhost:5433/civic",
  uploadDir: path.resolve(root, process.env.UPLOAD_DIR ?? "../uploads"),
  visionScript: path.resolve(
    root,
    process.env.VISION_SCRIPT ?? "../vision/detect.py",
  ),
  visionServerUrl: process.env.VISION_SERVER_URL ?? "http://localhost:5005",
  pythonBin: process.env.PYTHON_BIN ?? "python3",
  ollamaUrl: process.env.OLLAMA_URL ?? "http://localhost:11434",
  ollamaModel: process.env.OLLAMA_MODEL ?? "llama3.2",
  ollamaTimeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS ?? 20000),
  visionTimeoutMs: Number(process.env.VISION_TIMEOUT_MS ?? 10000),
};
