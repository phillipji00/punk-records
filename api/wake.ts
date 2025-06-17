import { NextApiRequest, NextApiResponse } from 'next';
import { getDbPool } from '@/lib/dbClient';

const pool = getDbPool();
await pool.query('...');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    return res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    return res.status(503).json({ 
      status: 'sleeping',
      error: error instanceof Error ? error.message : 'Connection failed'
    });
  }
}