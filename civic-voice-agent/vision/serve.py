"""
FastAPI sidecar for civic-voice-agent vision.

Loads the YOLO model exactly once at startup and exposes:

  POST /detect   { "path": "<absolute path to jpg or video>" }
                 -> { category, confidence, summary, objects, ... }
  GET  /health   -> { ok, model_loaded }

Run with:
    uvicorn serve:app --host 127.0.0.1 --port 5005

The Node backend (backend/src/vision.ts) calls /detect for every live frame.
Keeping the model resident in this process means per-frame inference is
~80–150ms instead of the ~2–4s subprocess cold-start it would otherwise be.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from pydantic import BaseModel

from detect import analyze, get_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    model = get_model()
    if model is not None:
        print("[vision] model loaded — ready for inference", flush=True)
    else:
        print(
            "[vision] WARNING: ultralytics not available, using mock fallback",
            flush=True,
        )
    yield


app = FastAPI(title="civic-voice-agent vision sidecar", lifespan=lifespan)


class DetectRequest(BaseModel):
    path: str


@app.post("/detect")
def detect(req: DetectRequest):
    return analyze(req.path)


@app.get("/health")
def health():
    return {"ok": True, "model_loaded": get_model() is not None}
