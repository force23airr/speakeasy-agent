import path from "path";

const root = path.resolve(__dirname, "..");

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl:
    process.env.DATABASE_URL ?? "postgres://civic:civic@localhost:5433/civic",
  uploadDir: path.resolve(root, process.env.UPLOAD_DIR ?? "../uploads"),
  visionScript: path.resolve(root, process.env.VISION_SCRIPT ?? "../vision/detect.py"),
  pythonBin: process.env.PYTHON_BIN ?? "python3",
};
