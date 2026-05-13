#!/usr/bin/env python3
"""
Vision pipeline for civic-voice-agent.

Provides:
- `analyze(path)` — runs YOLOv8 object detection on an image or video frame
  and returns a JSON-shaped dict.
- `get_model()` — lazy-loads the YOLO model exactly once per process.
- CLI entrypoint — used by `backend/src/routes/upload.ts` for one-off video
  uploads, where ~3s startup cost is fine.

The hot path (live frames every 2s) goes through `serve.py`, which imports
`analyze` directly and serves it via FastAPI so the model stays warm.

If `ultralytics` is not installed, the script falls back to a time-rotating
mock so the demo never breaks during setup.
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from typing import Any

VEHICLE_CLASSES = {"car", "truck", "bus", "motorcycle", "bicycle"}
MODEL_PATH = Path(__file__).parent / "yolov8n.pt"
CONF_THRESHOLD = 0.4

_model: Any = None
_yolo_import_error: str | None = None


def _try_import_yolo() -> Any:
    """Return the YOLO class, or None if ultralytics isn't available."""
    global _yolo_import_error
    try:
        from ultralytics import YOLO  # type: ignore
        return YOLO
    except Exception as e:
        _yolo_import_error = f"{type(e).__name__}: {e}"
        return None


def get_model() -> Any:
    """Load and cache the YOLO model. Returns None if unavailable."""
    global _model
    if _model is not None:
        return _model
    YOLO = _try_import_yolo()
    if YOLO is None:
        return None
    try:
        _model = YOLO(str(MODEL_PATH))
    except Exception as e:
        global _yolo_import_error
        _yolo_import_error = f"model load failed: {e}"
        return None
    return _model


def analyze(path: str | Path) -> dict:
    p = Path(path)
    if not p.exists():
        return {"error": f"file not found: {p}"}

    model = get_model()
    if model is None:
        return _mock_fallback(note=f"ultralytics unavailable: {_yolo_import_error}")

    try:
        results = model(str(p), verbose=False)
    except Exception as e:
        return {
            "category": "normal_traffic",
            "confidence": 0.5,
            "summary": "Vision error.",
            "objects": [],
            "note": f"inference error: {type(e).__name__}: {e}",
        }

    if not results:
        return _empty()
    return _interpret(results[0])


def _interpret(r: Any) -> dict:
    counts: dict[str, int] = {}
    class_confs: dict[str, float] = {}

    boxes = getattr(r, "boxes", None)
    if boxes is None or len(boxes) == 0:
        return _empty()

    for cls_tensor, conf_tensor in zip(boxes.cls, boxes.conf):
        c = float(conf_tensor)
        if c < CONF_THRESHOLD:
            continue
        name = r.names[int(cls_tensor)]
        counts[name] = counts.get(name, 0) + 1
        if c > class_confs.get(name, 0.0):
            class_confs[name] = c

    if not counts:
        return _empty()

    has_person = "person" in counts
    has_vehicle = any(v in counts for v in VEHICLE_CLASSES)

    if has_person:
        category = "pedestrian_activity"
        confidence = class_confs["person"]
    elif has_vehicle:
        category = "normal_traffic"
        confidence = max(class_confs[v] for v in VEHICLE_CLASSES if v in class_confs)
    else:
        category = "normal_traffic"
        confidence = max(class_confs.values())

    objects = [
        {"class": cls, "count": n}
        for cls, n in sorted(counts.items(), key=lambda x: -x[1])
    ]

    return {
        "category": category,
        "confidence": round(confidence, 2),
        "summary": _summarize(counts),
        "objects": objects,
    }


def _empty() -> dict:
    return {
        "category": "normal_traffic",
        "confidence": 0.5,
        "summary": "No significant objects detected.",
        "objects": [],
    }


def _summarize(counts: dict[str, int]) -> str:
    persons = counts.get("person", 0)
    vehicles = sum(counts.get(v, 0) for v in VEHICLE_CLASSES)
    parts: list[str] = []

    if persons:
        parts.append(f"{persons} {'person' if persons == 1 else 'people'}")
    if vehicles:
        parts.append(f"{vehicles} {'vehicle' if vehicles == 1 else 'vehicles'}")

    if parts:
        return " and ".join(parts) + " in view."

    # No people or vehicles — fall back to listing top other classes.
    top = sorted(counts.items(), key=lambda x: -x[1])[:3]
    listed = ", ".join(f"{n} {cls}" for cls, n in top)
    return f"Detected: {listed}."


# ---------------------------------------------------------------------------
# Mock fallback (used only when ultralytics is missing during setup)
# ---------------------------------------------------------------------------

_MOCKS = [
    {
        "category": "normal_traffic",
        "confidence": 0.64,
        "summary": "Traffic flowing normally. No issues detected.",
    },
    {
        "category": "normal_traffic",
        "confidence": 0.71,
        "summary": "Steady vehicle flow. Conditions appear clear.",
    },
    {
        "category": "road_obstruction",
        "confidence": 0.78,
        "summary": "Possible stalled vehicle or blocked lane detected.",
    },
    {
        "category": "pedestrian_activity",
        "confidence": 0.69,
        "summary": "Pedestrian movement detected near the roadway.",
    },
    {
        "category": "vehicle_accident",
        "confidence": 0.82,
        "summary": "Possible collision or unusual vehicle behavior detected.",
    },
]


def _mock_fallback(note: str | None = None) -> dict:
    idx = int(time.time() // 30) % len(_MOCKS)
    result = dict(_MOCKS[idx])
    result["objects"] = []
    if note:
        result["note"] = note
    return result


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "usage: detect.py <video_or_image_path>"}))
        return 1
    print(json.dumps(analyze(sys.argv[1])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
