import express from 'express';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import git from 'isomorphic-git';
import { createRequire } from 'module';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import os from 'os';
const require = createRequire(import.meta.url);
const http = require('isomorphic-git/http/node');
console.log('🔧 DEBUG - Variáveis de ambiente:');
console.log('GIT_REPO_URL:', process.env.GIT_REPO_URL);
console.log('GITHUB_TOKEN existe:', !!process.env.GITHUB_TOKEN);
console.log('GITHUB_TOKEN primeiros 10 chars:', process.env.GITHUB_TOKEN?.substring(0, 10));
console.log('NODE_ENV:', process.env.NODE_ENV);
const app = express();
// --- Middlewares ---
app.use(express.json({
    limit: '10mb'
}));
// --- Lógica Reutilizável de Git ---
const getRepo = async (traceId) => {
    const dir = path.join(os.tmpdir(), 'syndicate-vault');
    if (!process.env.GIT_REPO_URL) {
        throw new Error('GIT_REPO_URL não configurada');
    }
    try {
        const repoExists = await fsPromises.stat(path.join(dir, '.git')).catch(() => false);
        if (repoExists) {
            console.log(`[${traceId}] Pull existing repo...`);
            await git.pull({
                fs,
                http,
                dir,
                onAuth: () => ({
                    username: process.env.GITHUB_TOKEN,
                    password: ''
                }),
                author: { name: 'Syndicate Agent', email: 'bot@syndicate.dev' },
                singleBranch: true
            });
        }
        else {
            console.log(`[${traceId}] Cloning repo...`);
            await fsPromises.rm(dir, { recursive: true, force: true });
            await git.clone({
                fs,
                http,
                dir,
                url: process.env.GIT_REPO_URL,
                onAuth: () => ({
                    username: process.env.GITHUB_TOKEN,
                    password: ''
                }),
                singleBranch: true,
                depth: 1
            });
        }
        return dir;
    }
    catch (error) {
        console.error(`[${traceId}] Git error:`, error);
        throw error;
    }
};
// --- Middleware de Autenticação ---
const verifyToken = (req, res, next) => {
    if (!process.env.JWT_SECRET) {
        console.warn('⚠️ JWT_SECRET não configurado - MODO DE DESENVOLVIMENTO');
        return next();
    }
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token Bearer requerido' });
    }
    const token = authHeader.substring(7);
    try {
        jwt.verify(token, process.env.JWT_SECRET);
        next();
    }
    catch {
        res.status(401).json({ error: 'Token inválido' });
    }
};
// --- Rotas da API ---
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'operational',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development',
        gitConfigured: !!process.env.GIT_REPO_URL,
        tokenConfigured: !!process.env.GITHUB_TOKEN
    });
});
// ROTA DE INGESTÃO COM ENCODING CORRIGIDO
app.post('/api/ingest', verifyToken, async (req, res) => {
    const schema = Joi.object({
        tipo_registro: Joi.string().valid('hipotese', 'evidencia', 'perfil_personagem', 'entrada_timeline').required(),
        autor: Joi.string().required(),
        dados: Joi.object({
            arquivo_alvo: Joi.string().required(),
            conteudo: Joi.string().required()
        }).required()
    });
    const { error } = schema.validate(req.body);
    if (error)
        return res.status(400).json({ error: error.details[0].message });
    const { autor, dados } = req.body;
    const { arquivo_alvo, conteudo } = dados;
    const traceId = Math.random().toString(36).substring(2);
    console.log(`[${traceId}] 🚀 Starting ingest:`, { autor, arquivo_alvo });
    try {
        const repoDir = await getRepo(traceId);
        const filepath = path.join(repoDir, arquivo_alvo);
        // Garantir que o diretório existe
        await fsPromises.mkdir(path.dirname(filepath), { recursive: true });
        // CORREÇÃO: Escrita com encoding UTF-8 explícito
        const timestamp = new Date().toISOString();
        const formattedContent = `\n---\n[${timestamp}] ${conteudo}`;
        await fsPromises.writeFile(filepath, Buffer.from(formattedContent, 'utf8'), { flag: 'a' });
        await git.add({ fs, dir: repoDir, filepath: arquivo_alvo });
        await git.commit({
            fs,
            dir: repoDir,
            author: { name: autor, email: 'syndicate@vault.ai' },
            message: `docs: Nova entrada em ${arquivo_alvo} por ${autor}`
        });
        if (!process.env.GITHUB_TOKEN) {
            throw new Error('GITHUB_TOKEN não configurado');
        }
        console.log(`[${traceId}] 🔄 Pushing to GitHub...`);
        await git.push({
            fs,
            http,
            dir: repoDir,
            onAuth: () => ({
                username: process.env.GITHUB_TOKEN,
                password: ''
            })
        });
        console.log(`[${traceId}] ✅ Success!`);
        res.status(201).json({ status: "created", traceId });
    }
    catch (e) {
        console.error(`[${traceId}] ❌ Error:`, e.message);
        res.status(500).json({
            error: 'Falha na operação Git',
            traceId,
            details: process.env.NODE_ENV === 'development' ? e.message : undefined
        });
    }
});
// ROTA DE BUSCA COM ENCODING CORRIGIDO
app.get('/api/search', verifyToken, async (req, res) => {
    const traceId = Math.random().toString(36).substring(2);
    const { tag, limit = 10, offset = 0 } = req.query;
    if (!tag) {
        return res.status(400).json({ error: 'Parâmetro "tag" é obrigatório' });
    }
    try {
        const repoDir = await getRepo(traceId);
        const searchDir = path.join(repoDir, 'pandora-box');
        const dirExists = await fsPromises.stat(searchDir).catch(() => false);
        if (!dirExists) {
            return res.status(200).json({ total_count: 0, snippets: [] });
        }
        const allFiles = await fsPromises.readdir(searchDir, { recursive: true });
        let allSnippets = [];
        const searchRegex = new RegExp(tag, 'i');
        for (const file of allFiles) {
            if (typeof file === 'string' && file.endsWith('.md')) {
                const filePath = path.join(searchDir, file);
                // CORREÇÃO: Leitura com encoding UTF-8 explícito
                const buffer = await fsPromises.readFile(filePath);
                const content = buffer.toString('utf8');
                const lines = content.split('\n');
                lines.forEach((line, index) => {
                    if (searchRegex.test(line)) {
                        allSnippets.push({
                            texto: line.trim(),
                            fonte: path.join('pandora-box', file),
                            linha: index + 1,
                        });
                    }
                });
            }
        }
        const paginatedSnippets = allSnippets.slice(Number(offset), Number(offset) + Number(limit));
        console.log(`[${traceId}] 🔍 Busca por "${tag}": ${allSnippets.length} resultados`);
        res.status(200).json({
            total_count: allSnippets.length,
            snippets: paginatedSnippets,
        });
    }
    catch (e) {
        console.error(`[${traceId}] ❌ Search error:`, e.message);
        res.status(500).json({ error: 'Falha na busca', traceId });
    }
});
// Para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Syndicate Vault API rodando na porta ${PORT}`);
        console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
}
export default app;
//# sourceMappingURL=index.js.map