/**
 * @fileoverview Endpoint da API do Capitão Obi - SYNDICATE v3.2
 * @module /api/obi
 * 
 * Expõe a inteligência decisória do Capitão Obi através de uma API REST.
 * Recebe contextos de execução e retorna comandos orquestrados pelo Obi.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { decidirAcaoObi, diagnosticarSistema } from '../src/obiStateManager';
import type { 
  RuntimeExecutionContext as ExecutionContext,
  ObiCommand,
  ObiSystemDiagnosis 
} from '../lib/types/common';

/**
 * Tipos de resposta da API
 */
type SuccessResponse = {
  commands: ObiCommand[];
  diagnostics?: ObiSystemDiagnosis;
  metadata?: {
    processedAt: string;
    version: string;
    contextId: string;
  };
};

type ErrorResponse = {
  error: string;
  code?: string;
  details?: any;
};

type ApiResponse = SuccessResponse | ErrorResponse;

/**
 * Valida se o contexto recebido tem os campos mínimos necessários
 */
function validateContext(context: any): context is Partial<ExecutionContext> {
  if (!context || typeof context !== 'object') {
    return false;
  }
  
  // Campos obrigatórios mínimos
  const requiredFields = ['idRegistro', 'contexto', 'autor', 'etapa', 'idCaso', 'timestamp'];
  
  for (const field of requiredFields) {
    if (!context[field] || typeof context[field] !== 'string') {
      return false;
    }
  }
  
  // Validação de campos opcionais mas tipados
  if (context.probabilidade !== undefined && 
      (typeof context.probabilidade !== 'number' || 
       context.probabilidade < 0 || 
       context.probabilidade > 100)) {
    return false;
  }
  
  return true;
}

/**
 * Cria um ExecutionContext completo a partir do contexto parcial recebido
 */
function createExecutionContext(partialContext: any): ExecutionContext {
  const baseContext = {
    idRegistro: partialContext.idRegistro,
    contexto: partialContext.contexto,
    autor: partialContext.autor,
    etapa: partialContext.etapa,
    especialista: partialContext.especialista || 'orquestrador_missao',
    idCaso: partialContext.idCaso,
    timestamp: partialContext.timestamp,
    tipo_registro: partialContext.tipo_registro,
    probabilidade: partialContext.probabilidade
  };
  
  // Adiciona os callbacks necessários (no contexto da API, são no-ops ou logs)
  const executionContext: ExecutionContext = {
    ...baseContext,
    log: (msg: string) => {
      console.log(`[OBI API LOG] ${msg}`);
    },
    advancePipeline: (toStage: string) => {
      console.log(`[OBI API] Pipeline advancement requested to: ${toStage}`);
    },
    activateSpecialist: async (id: string) => {
      console.log(`[OBI API] Specialist activation requested: ${id}`);
      // Em produção, isso poderia fazer uma chamada para outro serviço
      return Promise.resolve();
    },
    activateProtocol: async (name: string) => {
      console.log(`[OBI API] Protocol activation requested: ${name}`);
      return Promise.resolve();
    },
    modifyScore: (field: string, adjustment: number) => {
      console.log(`[OBI API] Score modification: ${field} += ${adjustment}`);
    },
    haltPipeline: (reason: string) => {
      console.log(`[OBI API] Pipeline halt requested: ${reason}`);
      // Em produção, isso poderia lançar uma exceção ou notificar outro sistema
    }
  };
  
  return executionContext;
}

/**
 * Handler principal da API
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Adiciona headers CORS se necessário
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Aceita apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Método não permitido. Use POST.',
      code: 'METHOD_NOT_ALLOWED'
    });
  }
  
  try {
    // Extrai o contexto do body
    const { context } = req.body;
    
    // Valida a presença do contexto
    if (!context) {
      return res.status(400).json({
        error: 'Contexto não fornecido. Envie um objeto com a propriedade "context".',
        code: 'MISSING_CONTEXT'
      });
    }
    
    // Valida a estrutura do contexto
    if (!validateContext(context)) {
      return res.status(400).json({
        error: 'Contexto inválido. Verifique se todos os campos obrigatórios estão presentes e corretos.',
        code: 'INVALID_CONTEXT',
        details: {
          requiredFields: ['idRegistro', 'contexto', 'autor', 'etapa', 'idCaso', 'timestamp'],
          optionalFields: ['especialista', 'tipo_registro', 'probabilidade']
        }
      });
    }
    
    // Cria o ExecutionContext completo
    const executionContext = createExecutionContext(context);
    
    // Executa a decisão do Obi
    const commands = decidirAcaoObi(executionContext);
    
    // Opcionalmente, inclui diagnóstico do sistema se solicitado
    let diagnostics: ObiSystemDiagnosis | undefined;
    if (req.body.includeDiagnostics) {
      diagnostics = diagnosticarSistema(executionContext);
    }
    
    // Prepara a resposta de sucesso
    const response: SuccessResponse = {
      commands,
      ...(diagnostics && { diagnostics }),
      metadata: {
        processedAt: new Date().toISOString(),
        version: 'v3.2',
        contextId: context.idRegistro
      }
    };
    
    // Log para debugging em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('[OBI API] Commands generated:', JSON.stringify(commands, null, 2));
    }
    
    return res.status(200).json(response);
    
  } catch (error) {
    // Tratamento de erros
    console.error('[OBI API ERROR]:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return res.status(500).json({
      error: 'Erro interno ao processar a decisão do Obi.',
      code: 'INTERNAL_ERROR'
    } as ErrorResponse);
  }
}

/**
 * Configuração do Next.js para o endpoint
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};