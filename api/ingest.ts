import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { insertRegistro, initializeDatabase, type RegistroData } from '../lib/dbClient';

// Schema unificado com todos os campos possíveis no root
// Necessário porque o GPT não consegue lidar com objetos genéricos/dinâmicos
const RegistroSchemaUnificado = z.object({
  // Campos obrigatórios
  tipo_registro: z.enum([
    'hipotese',
    'evidencia',
    'perfil_personagem',
    'entrada_timeline',
    'registro_misc'
  ]),
  autor: z.string().min(1, "Autor é obrigatório"),
  id_caso: z.string().min(1, "id_caso é obrigatório"),
  etapa: z.string().min(1, "etapa é obrigatória"),
  especialista: z.string().min(1, "especialista é obrigatório"),
  
  // Campos opcionais
  timestamp: z.string().optional(),
  probabilidade: z.number().min(0).max(1).optional(),
  
  // Campos específicos de hipótese (opcionais)
  hipotese: z.string().min(5).optional(),
  justificativa: z.string().min(5).optional(),
  acoes_recomendadas: z.array(z.string()).optional(),
  nivel_confianca: z.number().min(0).max(1).optional(),
  
  // Campos específicos de evidência (opcionais)
  descricao: z.string().min(5).optional(),
  origem: z.string().optional(),
  confiabilidade: z.number().min(0).max(1).optional(),
  
  // Campos específicos de perfil_personagem (opcionais)
  nome: z.string().min(2).optional(),
  motivacoes: z.string().optional(),
  riscos: z.array(z.string()).optional(),
  
  // Campos específicos de entrada_timeline (opcionais)
  horario: z.string().optional(),
  
  // Campos específicos de registro_misc (opcionais)
  conteudo: z.string().min(2).optional()
});

// Função para validar campos específicos por tipo
function validarCamposEspecificos(data: z.infer<typeof RegistroSchemaUnificado>) {
  const errors: string[] = [];
  
  switch (data.tipo_registro) {
    case 'hipotese':
      if (!data.hipotese) {
        errors.push("Campo 'hipotese' é obrigatório para tipo_registro 'hipotese'");
      }
      break;
      
    case 'evidencia':
      if (!data.descricao) {
        errors.push("Campo 'descricao' é obrigatório para tipo_registro 'evidencia'");
      }
      break;
      
    case 'perfil_personagem':
      if (!data.nome) {
        errors.push("Campo 'nome' é obrigatório para tipo_registro 'perfil_personagem'");
      }
      break;
      
    case 'entrada_timeline':
      if (!data.descricao) {
        errors.push("Campo 'descricao' é obrigatório para tipo_registro 'entrada_timeline'");
      }
      break;
      
    case 'registro_misc':
      if (!data.conteudo) {
        errors.push("Campo 'conteudo' é obrigatório para tipo_registro 'registro_misc'");
      }
      break;
  }
  
  return errors;
}

// Função para extrair apenas os campos relevantes para cada tipo
function extrairDadosEspecificos(data: z.infer<typeof RegistroSchemaUnificado>): Record<string, any> {
  const camposBase: Record<string, any> = {
    hipotese: data.hipotese,
    justificativa: data.justificativa,
    acoes_recomendadas: data.acoes_recomendadas,
    nivel_confianca: data.nivel_confianca,
    descricao: data.descricao,
    origem: data.origem,
    confiabilidade: data.confiabilidade,
    nome: data.nome,
    motivacoes: data.motivacoes,
    riscos: data.riscos,
    horario: data.horario,
    conteudo: data.conteudo
  };
  
  // Remove campos undefined e retorna como Record<string, any>
  const resultado: Record<string, any> = {};
  for (const [key, value] of Object.entries(camposBase)) {
    if (value !== undefined) {
      resultado[key] = value;
    }
  }
  return resultado;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // === DEBUG LOGS ===
  console.log('=== INGEST REQUEST ===');
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers));
  console.log('Body type:', typeof req.body);
  console.log('Body:', JSON.stringify(req.body));
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      erro: 'Método não permitido', 
      permitido: 'POST' 
    });
  }

  if (!req.body) {
    return res.status(400).json({ 
      erro: 'Corpo da requisição vazio', 
      mensagem: 'É necessário enviar dados no corpo da requisição' 
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Validação do schema unificado
    const parsed = RegistroSchemaUnificado.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({
        erro: "Validação falhou",
        detalhes: parsed.error.flatten()
      });
    }

    // Validação de campos específicos por tipo
    const errosEspecificos = validarCamposEspecificos(parsed.data);
    if (errosEspecificos.length > 0) {
      return res.status(400).json({
        erro: "Campos obrigatórios faltando",
        mensagens: errosEspecificos
      });
    }

    // Extrai apenas os dados relevantes para o campo 'dados'
    const dadosEspecificos = extrairDadosEspecificos(parsed.data);

    // Prepara o registro para inserção no banco
    const registroFinal: RegistroData = {
      tipo_registro: parsed.data.tipo_registro,
      autor: parsed.data.autor,
      dados: dadosEspecificos, // Agora é garantidamente Record<string, any>
      timestamp: parsed.data.timestamp || new Date().toISOString(),
      id_caso: parsed.data.id_caso,
      etapa: parsed.data.etapa,
      especialista: parsed.data.especialista,
      probabilidade: parsed.data.probabilidade // Remove o || null, deixa undefined se não existir
    };

    // Log do registro final
    console.log('Registro a ser inserido:', JSON.stringify(registroFinal));

    // Insere no banco
    await initializeDatabase();
    const id_registro = await insertRegistro(registroFinal);

    return res.status(200).json({
      status: "created",
      id_registro,
      tipo_registro: registroFinal.tipo_registro,
      recebido_em: registroFinal.timestamp,
      mensagem: `${registroFinal.tipo_registro} registrado com sucesso`
    });

  } catch (err) {
    console.error("Erro ao processar ingest:", err);
    return res.status(500).json({ 
      erro: "Erro interno no servidor", 
      detalhes: err instanceof Error ? err.message : String(err) 
    });
  }
}