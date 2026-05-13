# civic-voice-agent

Lean monorepo for an MVP that:

1. Uploads a video.
2. Saves it on the backend.
3. Runs a Python vision script (`vision/detect.py`) — currently returns a mock detection.
4. Stores the incident in Postgres.
5. Lists incidents on the frontend.
6. Lets the user ask "What happened?" via browser SpeechRecognition and hear the response via SpeechSynthesis.

## Stack

- **Frontend:** Next.js (App Router, TypeScript)
- **Backend:** Node.js + Express + TypeScript
- **Vision:** Python + OpenCV placeholder (`vision/detect.py`)
- **DB:** Postgres via Docker Compose
- **Voice:** Browser `SpeechRecognition` (STT) + `SpeechSynthesis` (TTS)

## Layout

```
civic-voice-agent/
  backend/      Express API
  frontend/     Next.js app
  vision/       Python detector
  uploads/      Saved videos (gitignored)
  docker-compose.yml
```

## Quick start

```bash
# 1. Postgres
docker compose up -d

# 2. Vision deps (optional — runs without OpenCV; placeholder returns mock)
cd vision && pip install -r requirements.txt && cd ..

# 3. Backend
cd backend
npm install
npm run dev      # http://localhost:4000

# 4. Frontend (new terminal)
cd frontend
npm install
npm run dev      # http://localhost:3000
```

Open http://localhost:3000, upload a video, then press the mic button and ask "What happened?".

## API

- `POST /upload` — multipart `video` file → runs detector, stores incident
- `GET /incidents` — list incidents (newest first)
- `POST /agent` — body `{ "question": "..." }` → short answer using latest incident
