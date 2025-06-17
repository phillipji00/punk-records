import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeDatabase } from '../../lib/dbClient';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      erro: 'Método não permitido',
      permitido: 'GET'
    });
  }

  try {
    await initializeDatabase();

    const result = await sql`
      SELECT id_caso, etapa, especialista, probabilidade, timestamp
      FROM casos
      ORDER BY timestamp DESC
      LIMIT 10
    `;

    return res.status(200).json({
      casos: result.rows
    });
  } catch (error) {
    console.error('Erro ao consultar casos recentes:', error);
    return res.status(500).json({
      erro: 'Erro interno ao buscar casos recentes',
      detalhes: error instanceof Error ? error.message : String(error)
    });
  }
}
