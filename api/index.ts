import serverless from "serverless-http";
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import crypto from 'crypto';
import pool from '../lib/db'; // Usar o pool corrigido

dotenv.config();

// Importação segura do orchestrator
let orchestrate: any;
try {
  // Tentar importar o orchestrator
  const orchestratorModule = require('../lib/runtimeOrchestrator');
  orchestrate = orchestratorModule.orchestrate;
  console.log('✅ Runtime Orchestrator carregado com sucesso');
} catch (error) {
  console.error('⚠️ Runtime Orchestrator não encontrado, usando modo fallback');
  // Implementar fallback mínimo
  orchestrate = async (event: any) => {
    console.log('🔄 Orchestrator em modo fallback:', event);
    // Salvar no banco mas não processar
    return { 
      status: 'fallback_mode',
      message: 'Sistema em modo degradado - análise manual necessária' 
    };
  };
}

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
      : (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || 'unknown-ip',
});
app.use(limiter);

// ─── Map para rastrear orchestrations ativas ─────────────────────────
interface OrchestrationTracker {
  promise: Promise<any>;
  startTime: number;
  status: 'processing' | 'completed' | 'failed';
  error?: string;
}

const activeOrchestrations = new Map<string, OrchestrationTracker>();

// Limpar orchestrations antigas a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 minutos
  
  for (const [traceId, tracker] of activeOrchestrations.entries()) {
    if (now - tracker.startTime > maxAge) {
      activeOrchestrations.delete(traceId);
    }
  }
}, 5 * 60 * 1000);

// ─── Middleware de autenticação JWT ───────────────────────────────────
const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    return res.status(500).json({ error: 'JWT_SECRET não configurado' });
  }
  
  // Em desenvolvimento, permitir sem token
  if (!secret && process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ JWT_SECRET não configurado - modo desenvolvimento ativo');
    return next();
  }
  
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token Bearer ausente.' });
  }
  
  try {
    jwt.verify(authHeader.substring(7), secret!);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

// ─── Error Handler Middleware ─────────────────────────────────────────
const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Erro não tratado:', err);
  
  // Não expor detalhes em produção
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      traceId: req.headers['x-trace-id'] || 'unknown'
    });
  }
  
  // Em desenvolvimento, mostrar mais detalhes
  return res.status(500).json({ 
    error: err.message,
    stack: err.stack,
    traceId: req.headers['x-trace-id'] || 'unknown'
  });
};

// ─── Healthcheck ──────────────────────────────────────────────────────
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    const poolStatus = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    };
    
    res.status(200).json({
      status: 'operational',
      db: 'connected',
      poolStatus,
      orchestrator: orchestrate ? 'loaded' : 'fallback',
      activeOrchestrations: activeOrchestrations.size,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ 
      status: 'degraded',
      db: 'error',
      error: 'DB connection failed', 
      message: err.message 
    });
  }
});

// ─── Ingestão de eventos ──────────────────────────────────────────────
app.post('/api/ingest', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
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

  const traceId = crypto.randomUUID();
  req.headers['x-trace-id'] = traceId;

  try {
    await schema.validateAsync(req.body, { abortEarly: false });

    const { tipo_registro, autor, dados } = req.body;

    // Salva registro bruto com traceId
    const result = await pool.query(
      'INSERT INTO registros (tipo_registro, autor, dados, trace_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [tipo_registro, autor, dados, traceId]
    );

    const registroId = result.rows[0].id;

    // Criar evento enriquecido para orchestrator
    const enrichedEvent = {
      ...req.body,
      id: registroId,
      trace_id: traceId,
      timestamp: new Date().toISOString(),
    };

    // Criar promise para tracking
    const orchestrationPromise = orchestrate(enrichedEvent);
    
    // Armazenar promise para monitoramento
    activeOrchestrations.set(traceId, {
      promise: orchestrationPromise,
      startTime: Date.now(),
      status: 'processing'
    });
    
    // Processar em background com tratamento de erro
    orchestrationPromise
      .then(() => {
        console.log(`✅ Orchestration concluída para ${traceId}`);
        const tracker = activeOrchestrations.get(traceId);
        if (tracker) {
          tracker.status = 'completed';
        }
      })
      .catch((error: Error) => {
        console.error(`❌ Orchestration falhou para ${traceId}:`, error);
        const tracker = activeOrchestrations.get(traceId);
        if (tracker) {
          tracker.status = 'failed';
          tracker.error = error.message;
        }
      })
      .finally(() => {
        // Limpar após 5 minutos
        setTimeout(() => {
          activeOrchestrations.delete(traceId);
        }, 5 * 60 * 1000);
      });

    // Responde imediatamente com status e link
    return res.status(202).json({ 
      status: 'processing',
      traceId,
      registroId,
      statusUrl: `/api/status/${traceId}`,
      message: 'Registro recebido e processamento iniciado'
    });
    
  } catch (err: any) {
    if (err.isJoi) {
      return res.status(400).json({
        error: 'Payload inválido',
        detalhes: err.details,
        traceId
      });
    }
    // Passar para error handler
    return next(err);
  }
});

// ─── Status de orchestration ─────────────────────────────────────────
app.get('/api/status/:traceId', async (req: Request, res: Response) => {
  const { traceId } = req.params;
  
  // Validar formato UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(traceId)) {
    return res.status(400).json({ error: 'Trace ID inválido' });
  }
  
  const tracker = activeOrchestrations.get(traceId);
  
  if (!tracker) {
    // Tentar buscar no banco se não está na memória
    try {
      const result = await pool.query(
        'SELECT * FROM registros WHERE trace_id = $1 LIMIT 1',
        [traceId]
      );
      
      if (result.rows.length > 0) {
        return res.json({
          traceId,
          status: 'completed',
          message: 'Processamento concluído (histórico)',
          registro: result.rows[0]
        });
      }
    } catch (error) {
      console.error('Erro ao buscar registro:', error);
    }
    
    return res.status(404).json({ 
      error: 'Trace ID não encontrado',
      message: 'O registro pode ter expirado ou não existe'
    });
  }
  
  const duration = Date.now() - tracker.startTime;
  
  return res.json({
    traceId,
    status: tracker.status,
    duration: `${duration}ms`,
    error: tracker.error,
    message: tracker.status === 'processing' 
      ? 'Análise em andamento...' 
      : tracker.status === 'completed'
      ? 'Análise concluída com sucesso'
      : 'Análise falhou - verifique os logs'
  });
});

// ─── Busca por tag ────────────────────────────────────────────────────
app.get('/api/search', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  const tag = (req.query.tag as string) || '';
  const limit = Math.min(Number(req.query.limit || 10), 100); // Máximo 100
  const offset = Math.max(Number(req.query.offset || 0), 0);

  if (!tag || tag.length < 2) {
    return res.status(400).json({ 
      error: 'Parâmetro "tag" é obrigatório e deve ter pelo menos 2 caracteres' 
    });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM registros
       WHERE tipo_registro ILIKE $1 OR autor ILIKE $1 OR dados::text ILIKE $1
       ORDER BY timestamp DESC
       LIMIT $2 OFFSET $3`,
      [`%${tag}%`, limit, offset]
    );
    
    // Contar total para paginação
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM registros
       WHERE tipo_registro ILIKE $1 OR autor ILIKE $1 OR dados::text ILIKE $1`,
      [`%${tag}%`]
    );
    
    const totalCount = parseInt(countResult.rows[0].count);
    
    return res.status(200).json({ 
      total_count: totalCount,
      page_size: limit,
      page: Math.floor(offset / limit) + 1,
      total_pages: Math.ceil(totalCount / limit),
      snippets: result.rows 
    });
  } catch (err: any) {
    return next(err);
  }
});

// ─── 404 handler ──────────────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Endpoint não encontrado',
    path: req.path,
    method: req.method
  });
});

// ─── Error handler (deve ser o último) ────────────────────────────────
app.use(errorHandler);

// ─── Graceful shutdown ────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('📛 SIGTERM recebido, finalizando servidor...');
  
  // Parar de aceitar novas requisições
  server.close(() => {
    console.log('✅ Servidor HTTP fechado');
  });
  
  // Aguardar orchestrations ativas (máximo 30 segundos)
  const timeout = setTimeout(() => {
    console.log('⚠️ Timeout aguardando orchestrations - forçando saída');
    process.exit(0);
  }, 30000);
  
  if (activeOrchestrations.size > 0) {
    console.log(`⏳ Aguardando ${activeOrchestrations.size} orchestrations ativas...`);
    await Promise.allSettled(
      Array.from(activeOrchestrations.values()).map(t => t.promise)
    );
  }
  
  clearTimeout(timeout);
  process.exit(0);
});

// ─── Inicialização do servidor (apenas em desenvolvimento) ────────────
let server: any;
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  server = app.listen(PORT, () => {
    console.log(`🚀 Syndicate API rodando em http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
}

// ─── Exporta o app Express (Vercel resolve o handler) ─────────────────
export default app;