#!/usr/bin/env python3
"""
Vision placeholder.

Accepts a path to a video file OR a still image (from the live camera feed),
optionally peeks at it with OpenCV (if installed), and prints a JSON
detection to stdout.

The detection is currently mocked, but the mock rotates over time so the
demo feels alive. Replace `analyze()` with real logic later.
"""

import json
import sys
import time
from pathlib import Path

MOCKS = [
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

VIDEO_EXTS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}


def analyze(path: Path) -> dict:
    note = None
    try:
        import cv2  # type: ignore

        if path.suffix.lower() in VIDEO_EXTS:
            cap = cv2.VideoCapture(str(path))
            ok, _ = cap.read()
            cap.release()
            if not ok:
                note = "could not read first video frame"
        else:
            img = cv2.imread(str(path))
            if img is None:
                note = "could not decode image"
    except ImportError:
        pass

    result = _pick()
    if note:
        result["note"] = note
    return result


def _pick() -> dict:
    # Rotate every 30 seconds so the demo feels alive but answers stay
    # coherent within a conversation.
    idx = int(time.time() // 30) % len(MOCKS)
    return dict(MOCKS[idx])


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "usage: detect.py <video_or_image_path>"}))
        return 1
    path = Path(sys.argv[1])
    if not path.exists():
        print(json.dumps({"error": f"file not found: {path}"}))
        return 1
    print(json.dumps(analyze(path)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
