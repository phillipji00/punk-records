import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { Pool } from 'pg';
import { orchestrate } from '../lib/runtimeOrchestrator'; // NOVO IMPORT ✔️

dotenv.config();

const app = express();
app.set('trust proxy', 1);

app.use(express.json({ limit: '10mb' }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown-ip';
    return Array.isArray(ip) ? ip[0] : ip;
  },
});
app.use(limiter);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ JWT_SECRET não configurado. Pulando autenticação em DEV.');
      return next();
    }
  }
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token Bearer ausente.' });
  }
  const token = authHeader.substring(7);
  try {
    jwt.verify(token, secret!);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    res.status(200).json({ status: 'operational', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: 'DB connection failed', message: err.message });
  }
});

app.post('/api/ingest', verifyToken, async (req: Request, res: Response) => {
  // 1) Validação Joi
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

    // 2) Dispara o pipeline em background
    orchestrate(req.body).catch(console.error);   // NÃO usar await

    // 3) Responde rápido
    return res.status(202).json({ status: 'processing' });
  } catch (err: any) {
    if (err.isJoi) {
      return res.status(400).json({
        error: 'Payload inválido',
        detalhes: err.details
      });
    }
    return res.status(400).json({ error: err.message });
  }
});


      // Qualquer outro erro
      return res.status(400).json({ error: err.message });
    }
  }
);

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { tipo_registro, autor, dados } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO registros (tipo_registro, autor, dados) VALUES ($1, $2, $3) RETURNING id',
      [tipo_registro, autor, dados]
    );
    res.status(201).json({ status: 'created', id_registro: result.rows[0].id });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao salvar no banco de dados', message: err.message });
  }
});

app.get('/api/search', verifyToken, async (req: Request, res: Response) => {
  const { tag = '', limit = 10, offset = 0 } = req.query;

  if (!tag) return res.status(400).json({ error: 'Parâmetro "tag" é obrigatório' });

  try {
    const result = await pool.query(
      `SELECT * FROM registros 
       WHERE tipo_registro ILIKE $1 OR autor ILIKE $1 OR dados::text ILIKE $1
       ORDER BY timestamp DESC
       LIMIT $2 OFFSET $3`,
      [`%${tag}%`, Number(limit), Number(offset)]
    );
    res.status(200).json({ total_count: result.rows.length, snippets: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao buscar registros', message: err.message });
  }
});

// ⬇️ ESSA LINHA É A ÚNICA ADIÇÃO NECESSÁRIA:
app.use((req, res, next) => {
  if (req.url?.startsWith('/api')) {
    req.url = req.url.replace(/^\/api/, '') || '/';
  }
  next();
});
export default serverless(app);

