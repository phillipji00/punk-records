// lib/casoStore.ts — acesso seguro ao PostgreSQL (Neon)

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export interface CasoStatus {
  etapa: string;
  especialista: string;
  probabilidade?: number | null;
  timestamp: string;
}

export async function getCaseStatus(idCaso: string): Promise<CasoStatus | null> {
  const { rows } = await pool.query<CasoStatus>(
    `SELECT etapa, especialista, probabilidade, timestamp
       FROM casos
      WHERE id_caso = $1
   ORDER BY timestamp DESC
      LIMIT 1`,
    [idCaso]
  );
  return rows[0] ?? null;
}

export async function saveCaseStatus(idCaso: string, status: CasoStatus): Promise<void> {
  const { etapa, especialista, probabilidade, timestamp } = status;
  await pool.query(
    `INSERT INTO casos (id_caso, etapa, especialista, probabilidade, timestamp)
         VALUES ($1, $2, $3, $4, $5)`,
    [idCaso, etapa, especialista, probabilidade ?? null, timestamp]
  );
}
