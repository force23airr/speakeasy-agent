import { Pool } from "pg";
import { config } from "./config";

export const pool = new Pool({ connectionString: config.databaseUrl });

export interface Incident {
  id: number;
  video_path: string;
  category: string;
  confidence: number;
  summary: string;
  created_at: string;
}

export async function ensureSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS incidents (
      id           SERIAL PRIMARY KEY,
      video_path   TEXT NOT NULL,
      category     TEXT NOT NULL,
      confidence   REAL NOT NULL,
      summary      TEXT NOT NULL,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function insertIncident(
  videoPath: string,
  category: string,
  confidence: number,
  summary: string,
): Promise<Incident> {
  const { rows } = await pool.query<Incident>(
    `INSERT INTO incidents (video_path, category, confidence, summary)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [videoPath, category, confidence, summary],
  );
  return rows[0];
}

export async function listIncidents(limit = 50): Promise<Incident[]> {
  const { rows } = await pool.query<Incident>(
    `SELECT * FROM incidents ORDER BY created_at DESC LIMIT $1`,
    [limit],
  );
  return rows;
}

export async function latestIncident(): Promise<Incident | null> {
  const { rows } = await pool.query<Incident>(
    `SELECT * FROM incidents ORDER BY created_at DESC LIMIT 1`,
  );
  return rows[0] ?? null;
}
