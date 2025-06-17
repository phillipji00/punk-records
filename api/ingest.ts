import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { insertRegistro, initializeDatabase } from '../lib/dbClient';

// Schema base genérico de registro
const RegistroSchemaBase = z.object({
  tipo_registro: z.enum([
    'hipotese',
    'evidencia',
    'perfil_personagem',
    'entrada_timeline',
    'registro_misc'
  ]),
  autor: z.string().min(1, "Autor é obrigatório"),
  dados: z.record(z.any()),
  timestamp: z.string().optional(),
  id_caso: z.string().min(1, "id_caso é obrigatório"),
  etapa: z.string().min(1, "etapa é obrigatória"),
  especialista: z.string().min(1, "especialista é obrigatório"),
  probabilidade: z.number().min(0).max(1).optional()
});

// Schemas específicos por tipo_registro
const SchemaPorTipo = {
  hipotese: z.object({
    hipotese: z.string().min(5, "Hipótese deve conter uma descrição textual"),
    justificativa: z.string().min(5).optional(),
    acoes_recomendadas: z.array(z.string()).optional(),
    nivel_confianca: z.number().min(0).max(1).optional()
  }),
  evidencia: z.object({
    descricao: z.string().min(5),
    origem: z.string().optional(),
    confiabilidade: z.number().min(0).max(1).optional()
  }),
  perfil_personagem: z.object({
    nome: z.string().min(2),
    motivacoes: z.string().optional(),
    riscos: z.array(z.string()).optional()
  }),
  entrada_timeline: z.object({
    descricao: z.string().min(3),
    horario: z.string().optional()
  }),
  registro_misc: z.object({
    conteudo: z.string().min(2)
  })
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // === DEBUG LOGS ===
  console.log('=== HEADERS ===', JSON.stringify(req.headers));
  console.log('=== BODY TYPE ===', typeof req.body);
  console.log('=== BODY RAW ===', JSON.stringify(req.body));
  
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido', permitido: 'POST' });
  }

  if (!req.body) {
    return res.status(400).json({ erro: 'Corpo da requisição vazio', mensagem: 'É necessário enviar dados no corpo da requisição' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Validação inicial
    const parsedBase = RegistroSchemaBase.safeParse(body);
    if (!parsedBase.success) {
      return res.status(400).json({
        erro: "Validação falhou (campos principais)",
        detalhes: parsedBase.error.flatten()
      });
    }

    // Validação dinâmica de dados
    const tipo = body.tipo_registro;
    if (!(tipo in SchemaPorTipo)) {
      return res.status(400).json({ erro: "Tipo de registro não suportado" });
    }
    const schemaDados = SchemaPorTipo[tipo as keyof typeof SchemaPorTipo];

    const parsedDados = schemaDados.safeParse(body.dados);
    if (!parsedDados.success) {
      return res.status(400).json({
        erro: "Validação específica falhou",
        mensagem: parsedDados.error.errors[0]?.message || "Erro no campo 'dados'"
      });
    }

    // Insere no banco
    const registroFinal = {
      ...parsedBase.data,
      dados: parsedDados.data,
      timestamp: parsedBase.data.timestamp || new Date().toISOString()
    };

    await initializeDatabase();
    const id_registro = await insertRegistro(registroFinal);

    return res.status(200).json({
      status: "created",
      id_registro,
      recebido_em: registroFinal.timestamp
    });

  } catch (err) {
    console.error("Erro ao processar ingest:", err);
    return res.status(500).json({ erro: "Erro interno no servidor", detalhes: err instanceof Error ? err.message : String(err) });
  }
}