import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const app = express();

// --- Configuração de Middlewares ---

app.use(helmet()); // 1. Adiciona headers de segurança
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' })); // 2. Configura o CORS
app.use(morgan('tiny')); // 3. Faz o log das requisições
app.use(express.json()); // 4. Permite que a API entenda JSON

// --- Middleware de Autenticação (CRÍTICO) ---
const verifyToken = (req, res, next) => {
  const bearerHeader = req.headers['authorization'];
  if (typeof bearerHeader !== 'undefined') {
    const bearerToken = bearerHeader.split(' ')[1];
    jwt.verify(bearerToken, process.env.AUTH_SECRET, (err, authData) => {
      if (err) {
        res.sendStatus(403); // Forbidden
      } else {
        req.authData = authData;
        next(); // Token válido, pode prosseguir
      }
    });
  } else {
    res.sendStatus(401); // Unauthorized
  }
};

// --- Rotas da API ---

// Endpoint público para verificação de status
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'operational' });
});

// Endpoint protegido para ingestão de dados
app.post('/api/ingest', verifyToken, (req, res) => {
  // Esquema de validação com Joi
  const schema = Joi.object({
    tipo_registro: Joi.string().valid('hipotese', 'evidencia', 'perfil_personagem', 'entrada_timeline', 'registro_misc').required(),
    autor: Joi.string().valid('estrategista_chefe', 'analista_forense', 'analista_comportamental', 'analista_espacial', 'orquestrador_missao').required(),
    dados: Joi.object().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  // Se a validação passou...
  console.log('Dados validados recebidos para ingestão:', req.body);
  // TODO: Implementar a lógica de salvamento no Git aqui.
  
  res.status(201).json({ status: "created" });
});

// Endpoint protegido para busca
app.get('/api/search', verifyToken, (req, res) => {
  // TODO: Implementar a lógica de busca no Git aqui.
  res.status(200).json({ total_count: 0, snippets: [] });
});

// Exporta o app para a Vercel
export default app;