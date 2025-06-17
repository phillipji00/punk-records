import pool from '../lib/dbClient';

export default async function handler(req, res) {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return res.json({ status: 'ok', timestamp: new Date() });
  } catch (error) {
    return res.status(503).json({ status: 'sleeping' });
  }
}