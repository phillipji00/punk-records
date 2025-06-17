import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { insertRegistro, initializeDatabase } from '../lib/dbClient';

// Schema de validação usando Zod
const RegistroSchema = z.object({
  tipo_registro: z.enum([
    'hipotese',
    'evidencia',
    'perfil_personagem',
    'entrada_timeline',
    'registro_misc'
  ]),
  autor: z.string().min(1, 'Autor é obrigatório'),
  dados: z.record(z.any()).refine(
    (val) => Object.keys(val).length > 0,
    { message: 'Dados não podem estar vazios' }
  ),
  timestamp: z.string().datetime().optional(),
  id_caso: z.string().min(1, 'ID do caso é obrigatório'),
  etapa: z.string().min(1, 'Etapa é obrigatória'),
  especialista: z.string().min(1, 'Especialista é obrigatório'),
  probabilidade: z.number().min(0).max(1).optional()
});

// Tipo inferido do schema
type RegistroInput = z.infer<typeof RegistroSchema>;

// Handler principal
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Validação do método HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({
      erro: 'Método não permitido',
      mensagem: 'Este endpoint aceita apenas requisições POST'
    });
  }

  try {
    // Inicializa o banco se necessário (cria tabelas)
    await initializeDatabase();

    // Validação do corpo da requisição
    if (!req.body) {
      return res.status(400).json({
        erro: 'Corpo da requisição vazio',
        mensagem: 'É necessário enviar dados no corpo da requisição'
      });
    }

    // Parse e validação dos dados usando Zod
    let dadosValidados: RegistroInput;
    try {
      dadosValidados = RegistroSchema.parse(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          erro: 'Dados inválidos',
          detalhes: error.errors.map(err => ({
            campo: err.path.join('.'),
            mensagem: err.message
          }))
        });
      }
      throw error;
    }

    // Validações adicionais específicas por tipo de registro
    const validacoesEspecificas = validarTipoRegistro(dadosValidados);
    if (!validacoesEspecificas.valido) {
      return res.status(400).json({
        erro: 'Validação específica falhou',
        mensagem: validacoesEspecificas.mensagem
      });
    }

    // Inserir no banco de dados
    const idRegistro = await insertRegistro(dadosValidados);

    // Resposta de sucesso
    return res.status(200).json({
      sucesso: true,
      id_registro: idRegistro,
      tipo_registro: dadosValidados.tipo_registro,
      timestamp: dadosValidados.timestamp || new Date().toISOString(),
      mensagem: 'Registro inserido com sucesso'
    });

  } catch (error) {
    // Log do erro no servidor
    console.error('Erro ao processar ingest:', error);

    // Resposta de erro genérico
    return res.status(500).json({
      erro: 'Erro interno do servidor',
      mensagem: 'Ocorreu um erro ao processar o registro. Por favor, tente novamente.'
    });
  }
}

// Função auxiliar para validações específicas por tipo
function validarTipoRegistro(registro: RegistroInput): { valido: boolean; mensagem?: string } {
  switch (registro.tipo_registro) {
    case 'hipotese':
      if (!registro.dados.descricao || typeof registro.dados.descricao !== 'string') {
        return { 
          valido: false, 
          mensagem: 'Hipótese deve conter uma descrição textual' 
        };
      }
      if (registro.probabilidade === undefined) {
        return { 
          valido: false, 
          mensagem: 'Hipótese deve incluir uma probabilidade (0-1)' 
        };
      }
      break;

    case 'evidencia':
      if (!registro.dados.tipo_evidencia || !registro.dados.conteudo) {
        return { 
          valido: false, 
          mensagem: 'Evidência deve conter tipo_evidencia e conteudo' 
        };
      }
      break;

    case 'perfil_personagem':
      if (!registro.dados.nome || !registro.dados.papel) {
        return { 
          valido: false, 
          mensagem: 'Perfil de personagem deve conter nome e papel' 
        };
      }
      break;

    case 'entrada_timeline':
      if (!registro.dados.data_evento || !registro.dados.descricao) {
        return { 
          valido: false, 
          mensagem: 'Entrada de timeline deve conter data_evento e descricao' 
        };
      }
      break;

    case 'registro_misc':
      // Registros miscelâneos são mais flexíveis
      if (!registro.dados.categoria) {
        return { 
          valido: false, 
          mensagem: 'Registro misc deve conter ao menos uma categoria' 
        };
      }
      break;
  }

  return { valido: true };
}