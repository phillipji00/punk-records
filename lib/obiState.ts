// lib/obiState.ts — memória persistente do Capitão Obi

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export interface ObiState {
  id_caso: string;
  sinalizacaoManual?: 'PAUSADO' | 'ARQUIVADO' | 'NENHUM';
  ultimaEtapa?: string;
  historico?: string[];
  criado_em: string;
  atualizado_em: string;
}

export async function loadObiState(idCaso: string): Promise<ObiState | null> {
  const { rows } = await pool.query<ObiState>(
    `SELECT * FROM obi_state WHERE id_caso = $1 LIMIT 1`,
    [idCaso]
  );
  return rows[0] ?? null;
}

export async function updateObiState(idCaso: string, patch: Partial<ObiState>): Promise<void> {
  await pool.query(
    `INSERT INTO obi_state (id_caso, sinalizacao_manual, ultima_etapa, atualizado_em)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (id_caso)
     DO UPDATE SET
        sinalizacao_manual = COALESCE($2, obi_state.sinalizacao_manual),
        ultima_etapa = COALESCE($3, obi_state.ultima_etapa),
        atualizado_em = NOW()`,
    [idCaso, patch.sinalizacaoManual ?? null, patch.ultimaEtapa ?? null]
  );
}
