import type { NextApiRequest, NextApiResponse } from 'next';
import { orchestrate } from '@/lib/runtimeOrchestrator';
import { saveCaseStatusToDB } from '@/lib/casoStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const event = req.body;
  const { context, triggered, actions, novaEtapa } = await orchestrate(event);

  await saveCaseStatusToDB(event.idCaso, context);

  res.status(200).json({ context, triggered, actions, novaEtapa });
}
