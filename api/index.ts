import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { Pool } from 'pg';
import { orchestrate } from '../lib/runtimeOrchestrator'; // ✅ Novo import

dotenv.config();

const app = express();
app.set('trust proxy', 1);

// ─── Middlewares básicos ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'));

// ─── Rate-limit por IP ────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    Array.isArray(req.headers['x-forwarded-for'])
      ? req.headers['x-forwarded-for'][0]
      : req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown-ip',
});
app.use(limiter);

// ─── Conexão ao PostgreSQL (Neon) ─────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ─── Middleware de autenticação JWT ───────────────────────────────────
const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    return res.status(500).json({ error: 'JWT_SECRET não configurado' });
  }
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token Bearer ausente.' });
  }
  try {
    jwt.verify(authHeader.substring(7), secret!);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

// ─── Healthcheck ──────────────────────────────────────────────────────
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    res.status(200).json({
      status: 'operational',
      db: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'DB connection failed', message: err.message });
  }
});

// ─── Ingestão de eventos ──────────────────────────────────────────────
app.post('/api/ingest', verifyToken, async (req: Request, res: Response) => {
  const schema = Joi.object({
    tipo_registro: Joi.string()
      .valid(
        'hipotese',
        'evidencia',
        'perfil_personagem',
        'entrada_timeline',
        'registro_misc',
        'cross_validation_result'
      )
      .required(),
    autor: Joi.string().required(),
    dados: Joi.object().required().unknown(true),
  });

  try {
    await schema.validateAsync(req.body, { abortEarly: false });

    const { tipo_registro, autor, dados } = req.body;

    // Salva registro bruto rapidamente
    await pool.query(
      'INSERT INTO registros (tipo_registro, autor, dados) VALUES ($1, $2, $3)',
      [tipo_registro, autor, dados]
    );

    // Dispara o pipeline em background (SEM await)
    orchestrate(req.body).catch(console.error);

    // Responde em < 1 s para evitar timeout
    return res.status(202).json({ status: 'processing' });
  } catch (err: any) {
    if (err.isJoi) {
      return res.status(400).json({
        error: 'Payload inválido',
        detalhes: err.details,
      });
    }
    return res.status(500).json({ error: err.message });
  }
});

// ─── Busca por tag ────────────────────────────────────────────────────
app.get('/api/search', verifyToken, async (req: Request, res: Response) => {
  const tag = (req.query.tag as string) || '';
  const limit = Number(req.query.limit || 10);
  const offset = Number(req.query.offset || 0);

  if (!tag) return res.status(400).json({ error: 'Parâmetro "tag" é obrigatório' });

  try {
    const result = await pool.query(
      `SELECT * FROM registros
       WHERE tipo_registro ILIKE $1 OR autor ILIKE $1 OR dados::text ILIKE $1
       ORDER BY timestamp DESC
       LIMIT $2 OFFSET $3`,
      [`%${tag}%`, limit, offset]
    );
    res.status(200).json({ total_count: result.rowCount, snippets: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao buscar registros', message: err.message });
  }
});

// ─── Exporta o app Express (Vercel resolve o handler) ─────────────────
export default app;
