import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeDatabase, getCasosRecentes } from '../../lib/dbClient';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      erro: 'Método não permitido',
      permitido: 'GET'
    });
  }

  try {
    await initializeDatabase();

    const casos = await getCasosRecentes(10);

    return res.status(200).json({
      casos: casos
    });
  } catch (error) {
    console.error('Erro ao consultar casos recentes:', error);
    return res.status(500).json({
      erro: 'Erro interno ao buscar casos recentes',
      detalhes: error instanceof Error ? error.message : String(error)
    });
  }
}