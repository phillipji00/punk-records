"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const joi_1 = __importDefault(require("joi"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = __importDefault(require("../lib/db"));
dotenv_1.default.config();
let orchestrate;
try {
    const orchestratorModule = require('../lib/runtimeOrchestrator');
    orchestrate = orchestratorModule.orchestrate;
    console.log('✅ Runtime Orchestrator carregado com sucesso');
}
catch (error) {
    console.error('⚠️ Runtime Orchestrator não encontrado, usando modo fallback');
    orchestrate = async (event) => {
        console.log('🔄 Orchestrator em modo fallback:', event);
        return {
            status: 'fallback_mode',
            message: 'Sistema em modo degradado - análise manual necessária'
        };
    };
}
const app = (0, express_1.default)();
app.set('trust proxy', 1);
app.use(express_1.default.json({ limit: '10mb' }));
app.use((0, cors_1.default)({ origin: process.env.CORS_ORIGIN || '*' }));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => Array.isArray(req.headers['x-forwarded-for'])
        ? req.headers['x-forwarded-for'][0]
        : req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown-ip',
});
app.use(limiter);
const activeOrchestrations = new Map();
setInterval(() => {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000;
    for (const [traceId, tracker] of activeOrchestrations.entries()) {
        if (now - tracker.startTime > maxAge) {
            activeOrchestrations.delete(traceId);
        }
    }
}, 5 * 60 * 1000);
const verifyToken = (req, res, next) => {
    const secret = process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
        return res.status(500).json({ error: 'JWT_SECRET não configurado' });
    }
    if (!secret && process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ JWT_SECRET não configurado - modo desenvolvimento ativo');
        return next();
    }
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token Bearer ausente.' });
    }
    try {
        jsonwebtoken_1.default.verify(authHeader.substring(7), secret);
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
};
const errorHandler = (err, req, res, _next) => {
    console.error('❌ Erro não tratado:', err);
    if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({
            error: 'Erro interno do servidor',
            traceId: req.headers['x-trace-id'] || 'unknown'
        });
    }
    return res.status(500).json({
        error: err.message,
        stack: err.stack,
        traceId: req.headers['x-trace-id'] || 'unknown'
    });
};
app.get('/api/health', async (_req, res) => {
    try {
        const client = await db_1.default.connect();
        await client.query('SELECT 1');
        client.release();
        const poolStatus = {
            totalCount: db_1.default.totalCount,
            idleCount: db_1.default.idleCount,
            waitingCount: db_1.default.waitingCount,
        };
        res.status(200).json({
            status: 'operational',
            db: 'connected',
            poolStatus,
            orchestrator: orchestrate ? 'loaded' : 'fallback',
            activeOrchestrations: activeOrchestrations.size,
            timestamp: new Date().toISOString(),
        });
    }
    catch (err) {
        res.status(500).json({
            status: 'degraded',
            db: 'error',
            error: 'DB connection failed',
            message: err.message
        });
    }
});
app.post('/api/ingest', verifyToken, async (req, res, next) => {
    const schema = joi_1.default.object({
        tipo_registro: joi_1.default.string()
            .valid('hipotese', 'evidencia', 'perfil_personagem', 'entrada_timeline', 'registro_misc', 'cross_validation_result')
            .required(),
        autor: joi_1.default.string().required(),
        dados: joi_1.default.object().required().unknown(true),
    });
    const traceId = crypto_1.default.randomUUID();
    req.headers['x-trace-id'] = traceId;
    try {
        await schema.validateAsync(req.body, { abortEarly: false });
        const { tipo_registro, autor, dados } = req.body;
        const result = await db_1.default.query('INSERT INTO registros (tipo_registro, autor, dados, trace_id) VALUES ($1, $2, $3, $4) RETURNING id', [tipo_registro, autor, dados, traceId]);
        const registroId = result.rows[0].id;
        const enrichedEvent = {
            ...req.body,
            id: registroId,
            trace_id: traceId,
            timestamp: new Date().toISOString(),
        };
        const orchestrationPromise = orchestrate(enrichedEvent);
        activeOrchestrations.set(traceId, {
            promise: orchestrationPromise,
            startTime: Date.now(),
            status: 'processing'
        });
        orchestrationPromise
            .then(() => {
            console.log(`✅ Orchestration concluída para ${traceId}`);
            const tracker = activeOrchestrations.get(traceId);
            if (tracker) {
                tracker.status = 'completed';
            }
        })
            .catch((error) => {
            console.error(`❌ Orchestration falhou para ${traceId}:`, error);
            const tracker = activeOrchestrations.get(traceId);
            if (tracker) {
                tracker.status = 'failed';
                tracker.error = error.message;
            }
        })
            .finally(() => {
            setTimeout(() => {
                activeOrchestrations.delete(traceId);
            }, 5 * 60 * 1000);
        });
        return res.status(202).json({
            status: 'processing',
            traceId,
            registroId,
            statusUrl: `/api/status/${traceId}`,
            message: 'Registro recebido e processamento iniciado'
        });
    }
    catch (err) {
        if (err.isJoi) {
            return res.status(400).json({
                error: 'Payload inválido',
                detalhes: err.details,
                traceId
            });
        }
        return next(err);
    }
});
app.get('/api/status/:traceId', async (req, res) => {
    const { traceId } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(traceId)) {
        return res.status(400).json({ error: 'Trace ID inválido' });
    }
    const tracker = activeOrchestrations.get(traceId);
    if (!tracker) {
        try {
            const result = await db_1.default.query('SELECT * FROM registros WHERE trace_id = $1 LIMIT 1', [traceId]);
            if (result.rows.length > 0) {
                return res.json({
                    traceId,
                    status: 'completed',
                    message: 'Processamento concluído (histórico)',
                    registro: result.rows[0]
                });
            }
        }
        catch (error) {
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
app.get('/api/search', verifyToken, async (req, res, next) => {
    const tag = req.query.tag || '';
    const limit = Math.min(Number(req.query.limit || 10), 100);
    const offset = Math.max(Number(req.query.offset || 0), 0);
    if (!tag || tag.length < 2) {
        return res.status(400).json({
            error: 'Parâmetro "tag" é obrigatório e deve ter pelo menos 2 caracteres'
        });
    }
    try {
        const result = await db_1.default.query(`SELECT * FROM registros
       WHERE tipo_registro ILIKE $1 OR autor ILIKE $1 OR dados::text ILIKE $1
       ORDER BY timestamp DESC
       LIMIT $2 OFFSET $3`, [`%${tag}%`, limit, offset]);
        const countResult = await db_1.default.query(`SELECT COUNT(*) FROM registros
       WHERE tipo_registro ILIKE $1 OR autor ILIKE $1 OR dados::text ILIKE $1`, [`%${tag}%`]);
        const totalCount = parseInt(countResult.rows[0].count);
        return res.status(200).json({
            total_count: totalCount,
            page_size: limit,
            page: Math.floor(offset / limit) + 1,
            total_pages: Math.ceil(totalCount / limit),
            snippets: result.rows
        });
    }
    catch (err) {
        return next(err);
    }
});
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint não encontrado',
        path: req.path,
        method: req.method
    });
});
app.use(errorHandler);
process.on('SIGTERM', async () => {
    console.log('📛 SIGTERM recebido, finalizando servidor...');
    server.close(() => {
        console.log('✅ Servidor HTTP fechado');
    });
    const timeout = setTimeout(() => {
        console.log('⚠️ Timeout aguardando orchestrations - forçando saída');
        process.exit(0);
    }, 30000);
    if (activeOrchestrations.size > 0) {
        console.log(`⏳ Aguardando ${activeOrchestrations.size} orchestrations ativas...`);
        await Promise.allSettled(Array.from(activeOrchestrations.values()).map(t => t.promise));
    }
    clearTimeout(timeout);
    process.exit(0);
});
let server;
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    server = app.listen(PORT, () => {
        console.log(`🚀 Syndicate API rodando em http://localhost:${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
}
exports.default = app;
//# sourceMappingURL=index.js.map