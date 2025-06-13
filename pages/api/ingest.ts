import type { NextApiRequest, NextApiResponse } from 'next';
import { orchestrate } from '@/lib/runtimeOrchestrator';
import { saveCaseStatusToDB } from '@/lib/casoStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const event = req.body;

    // Chama o orquestrador com o evento recebido
    const { context, triggered, actions, novaEtapa } = await orchestrate(event);

    // Persiste no banco usando o ID do caso
    await saveCaseStatusToDB(event.idCaso, context);

    return res.status(200).json({
      context,
      triggered,
      actions,
      novaEtapa
    });

  } catch (error: any) {
    console.error('Erro no ingest:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}
