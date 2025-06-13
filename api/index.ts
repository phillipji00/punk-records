import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { orchestrate } from '../lib/runtimeOrchestrator';
import { saveRegistro, getCaseStatus } from '../lib/casoStore';
import pool from '../lib/db';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 100 }));

function verifyToken(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token Bearer ausente.' });
  }

  const token = authHeader.split(' ')[1];

  // 🔍 DEBUG LOG
  console.log('🔐 JWT_SECRET no ambiente Vercel:', JSON.stringify(process.env.JWT_SECRET));
  console.log('🔐 Tipo do JWT_SECRET:', typeof process.env.JWT_SECRET);
  console.log('🔐 Token recebido:', token);

  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    next();
  } catch (err) {
    console.error('Erro ao verificar JWT:', err);
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

app.post('/api/ingest', verifyToken, async (req: Request, res: Response) => {
  console.log('### DEBUG: CONTEÚDO DO REQ.BODY:', req.body);

  const Joi = await import('joi');
  const schema = Joi.object({
    tipo_registro: Joi.string().valid(
      'hipotese', 'evidencia', 'perfil_personagem',
      'entrada_timeline', 'registro_misc', 'cross_validation_result'
    ).required(),
    autor: Joi.string().required(),
    dados: Joi.object().required().unknown(true),
    id_caso: Joi.string().required(),
    etapa: Joi.string().required()
  });

  try {
    await schema.validateAsync(req.body, { abortEarly: false });
    await saveRegistro(req.body);
    orchestrate(req.body).catch(console.error);
    return res.status(202).json({ status: 'processing' });
  } catch (err: any) {
    console.error('Erro de validação:', err);
    return res.status(400).json({ error: 'Payload inválido', detalhes: err.details });
  }
});

app.get('/api/health', async (_: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'db: connected' });
  } catch {
    res.status(500).json({ status: 'db: disconnected' });
  }
});

app.get('/api/status', verifyToken, async (req: Request, res: Response) => {
  const idCaso = req.query.idCaso as string;
  if (!idCaso) return res.status(400).json({ error: 'idCaso é obrigatório' });

  try {
    const status = await getCaseStatus(idCaso);
    if (!status) return res.status(404).json({ error: 'Caso não encontrado' });
    return res.status(200).json(status);
  } catch (err) {
    console.error('Erro ao buscar status do caso:', err);
    return res.status(500).json({ error: 'Erro interno ao buscar status' });
  }
});

app.get('/api/search', verifyToken, async (req: Request, res: Response) => {
  const { tag, autor } = req.query;
  const conditions = [];
  const values: any[] = [];

  if (tag) {
    conditions.push(`dados::text ILIKE $${conditions.length + 1}`);
    values.push(`%${tag}%`);
  }
  if (autor) {
    conditions.push(`autor = $${conditions.length + 1}`);
    values.push(autor);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `SELECT * FROM registros ${where} ORDER BY criado_em DESC LIMIT 100`;

  try {
    const result = await pool.query(query, values);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar registros:', err);
    return res.status(500).json({ error: 'Erro ao buscar registros' });
  }
});

export default app;
