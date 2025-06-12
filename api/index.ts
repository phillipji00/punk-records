import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import serverless from 'serverless-http';
import { MongoClient } from 'mongodb';
import Joi from 'joi';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();

app.set('trust proxy', 1); // ✅ ESSA LINHA RESOLVE O ERRO DE IP

app.use(express.json({ limit: '10mb' }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// --- MongoDB Connection ---
if (!process.env.DATABASE_URL) {
  console.error("ERRO: A variável de ambiente DATABASE_URL é necessária.");
  if (process.env.NODE_ENV === 'production') process.exit(1);
}

const client = new MongoClient(process.env.DATABASE_URL!);
let db: any;
let vaultCollection: any;

async function initMongo() {
  if (!db) {
    await client.connect();
    db = client.db("syndicateVault");
    vaultCollection = db.collection("registros");
    console.log("✅ Conectado com sucesso ao MongoDB Atlas.");
  }
}
initMongo().catch((err) => {
  console.error("❌ Falha ao conectar com o MongoDB Atlas.", err);
  process.exit(1);
});

// --- JWT Auth Middleware ---
const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ JWT_SECRET não configurado, pulando autenticação em MODO DE DESENVOLVIMENTO.');
      return next();
    }
  }
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acesso não autorizado. Token Bearer ausente.' });
  }
  const token = authHeader.substring(7);
  try {
    jwt.verify(token, secret!);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Acesso não autorizado. Token inválido ou expirado.' });
  }
};

// --- API Routes ---
app.get('/api/health', async (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'operational',
    db_connection_status: client.topology?.s.state || 'connecting',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/ingest', verifyToken, async (req: Request, res: Response) => {
  const schema = Joi.object({
    tipo_registro: Joi.string().valid('hipotese', 'evidencia', 'perfil_personagem', 'entrada_timeline', 'registro_misc', 'cross_validation_result').required(),
    autor: Joi.string().required(),
    dados: Joi.object().required().unknown(true)
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { tipo_registro, autor, dados } = req.body;
  const traceId = Math.random().toString(36).substring(2);

  try {
    const novoRegistro = {
      tipo_registro,
      autor,
      dados,
      timestamp: new Date(),
    };
    const result = await vaultCollection.insertOne(novoRegistro);
    res.status(201).json({ status: "created", id_registro: result.insertedId.toHexString(), traceId });
  } catch (e: any) {
    console.error(`[${traceId}] ❌ DB Error:`, e.message);
    res.status(500).json({ error: 'Falha ao salvar no banco de dados', traceId });
  }
});

app.get('/api/search', verifyToken, async (req: Request, res: Response) => {
  const traceId = Math.random().toString(36).substring(2);
  const { tag, limit = 10, offset = 0 } = req.query;

  if (!tag) {
    return res.status(400).json({ error: 'Parâmetro "tag" é obrigatório' });
  }

  try {
    const searchPipeline = [
      {
        $search: {
          index: 'default',
          text: {
            query: tag as string,
            path: { wildcard: '*' },
            fuzzy: { maxEdits: 1 }
          }
        }
      },
      { $skip: Number(offset) },
      { $limit: Number(limit) }
    ];

    const snippets = await vaultCollection.aggregate(searchPipeline).toArray();
    res.status(200).json({ total_count: snippets.length, snippets });
  } catch (e: any) {
    console.error(`[${traceId}] ❌ Search error:`, e.message);
    res.status(500).json({ error: 'Falha na busca no banco de dados', traceId });
  }
});

// 👇 Exportação correta para Vercel
export default serverless(app);
