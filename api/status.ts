import type { NextApiRequest, NextApiResponse } from 'next';
import { getCaseStatusFromDB } from '@/lib/casoStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const idCaso = req.query.idCaso as string;
  const context = await getCaseStatusFromDB(idCaso);

  if (!context) return res.status(404).json({ error: 'Caso não encontrado.' });

  res.status(200).json({ context });
}
