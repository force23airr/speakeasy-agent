CREATE TABLE IF NOT EXISTS incidents (
  id           SERIAL PRIMARY KEY,
  video_path   TEXT NOT NULL,
  category     TEXT NOT NULL,
  confidence   REAL NOT NULL,
  summary      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS incidents_created_at_idx
  ON incidents (created_at DESC);
