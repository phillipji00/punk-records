import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

// Ferramentas para interagir com o MongoDB
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';

// Verificação de segurança na inicialização para garantir que as variáveis existam em produção
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('ERRO FATAL: JWT_SECRET não está configurado no ambiente de produção. Encerrando.');
  process.exit(1);
}
if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  console.error('ERRO FATAL: DATABASE_URL não está configurada no ambiente de produção. Encerrando.');
  process.exit(1);
}

const app = express();

// --- Middlewares ---
app.use(helmet());
app.use(cors());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'));
app.use(express.json({ limit: '10mb' }));

// --- Configuração da Conexão com o MongoDB ---
if (!process.env.DATABASE_URL) {
  console.error("ERRO: A variável de ambiente DATABASE_URL é necessária.");
  if (process.env.NODE_ENV === 'production') process.exit(1);
}

// Cria uma instância do cliente MongoDB para ser reutilizada
const client = new MongoClient(process.env.DATABASE_URL!, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});

// Conecta ao banco de dados uma vez na inicialização
client.connect().then(() => {
    console.log("✅ Conectado com sucesso ao MongoDB Atlas.");
}).catch(err => {
    console.error("❌ Falha ao conectar com o MongoDB Atlas.", err);
    process.exit(1);
});

const db = client.db("syndicateVault");
const vaultCollection = db.collection("registros");


// --- Middleware de Autenticação (Corrigido) ---
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

// --- Rotas da API ---

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'operational',
    db_connection_status: client.topology?.s.state || 'connecting',
    timestamp: new Date().toISOString()
  });
});

// Rota /ingest refatorada
app.post('/api/ingest', verifyToken, async (req: Request, res: Response) => {
  const schema = Joi.object({
    tipo_registro: Joi.string().valid('hipotese', 'evidencia', 'perfil_personagem', 'entrada_timeline', 'registro_misc', 'cross_validation_result').required(),
    autor: Joi.string().required(),
    dados: Joi.object().required().unknown(true) // Permite qualquer estrutura em 'dados'
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

// 🚀 ROTA /search FINALMENTE CORRIGIDA: Removido o .sort() e .project() incompatíveis com o plano M0
app.get('/api/search', verifyToken, async (req: Request, res: Response) => {
  const traceId = Math.random().toString(36).substring(2);
  const { tag, tipo_registro, limit = 10, offset = 0 } = req.query;

  if (!tag) {
    return res.status(400).json({ error: 'Parâmetro "tag" é obrigatório' });
  }
  
  try {
    const query: any = { $text: { $search: tag as string } }; 
    if (tipo_registro && tipo_registro !== 'todos') {
      query.tipo_registro = tipo_registro;
    }
    
    const total_count = await vaultCollection.countDocuments(query);
    
    // VERSÃO CORRIGIDA: Removemos .project() e .sort() que usavam 'textScore'
    const snippets = await vaultCollection.find(query)
      .skip(Number(offset))
      .limit(Number(limit))
      .toArray();

    res.status(200).json({ total_count, snippets });

  } catch (e: any) {
    console.error(`[${traceId}] ❌ Search error:`, e.message);
    res.status(500).json({ error: 'Falha na busca no banco de dados', traceId });
  }
});

// --- Rota Padrão e Exportação ---
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado.' });
});

export default app;