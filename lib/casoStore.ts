// lib/casoStore.ts
import { Pool } from 'pg';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function getCaseStatus(idCaso: string) {
  const { rows } = await pool.query(
    'SELECT * FROM casos WHERE id_caso = $1 ORDER BY timestamp DESC LIMIT 1',
    [idCaso]
  );
  return rows[0] || null;
}

export async function saveCaseStatus(
  idCaso: string,
  { etapa, especialista, probabilidade, timestamp }: {
    etapa: string;
    especialista: string;
    probabilidade?: number;
    timestamp: string;
  }
) {
  await pool.query(
    `INSERT INTO casos (id_caso, etapa, especialista, probabilidade, timestamp)
     VALUES ($1, $2, $3, $4, $5)`,
    [idCaso, etapa, especialista, probabilidade ?? null, timestamp]
  );
}
