import type { NextApiRequest, NextApiResponse } from 'next';
import { reviewAnalysis, ReviewInput, ReviewResult } from '../src/reviewEngine';
import { 
  ExecutionContext, 
  SpecialistResponse, 
  SPECIALIST_TO_PERSONA 
} from '../lib/types/common';

/**
 * Schema de entrada esperado para o endpoint (FLEXÍVEL)
 */
interface ReviewRequestBody {
  /** Nome do especialista que vai revisar */
  reviewer: string;
  /** Análise original feita por outro especialista */
  originalAnalysis: SpecialistResponse;
  /** Contexto - pode ser simples ou completo */
  context: any; // MUDANÇA: Aceitar qualquer formato
}

/**
 * Schema de resposta do endpoint
 */
interface ReviewResponseBody {
  /** Resultado da revisão */
  review: {
    /** Se a análise foi aprovada */
    approved: boolean;
    /** Lista de razões para a decisão */
    reasons: string[];
    /** Sugestões de melhoria (se aplicável) */
    suggestions: string[];
  };
  /** Metadados da revisão */
  metadata: {
    /** Especialista revisor */
    reviewer: string;
    /** Especialista original */
    originalSpecialist: string;
    /** Timestamp da revisão */
    timestamp: string;
    /** Score de qualidade calculado */
    qualityScore: number;
  };
}

/**
 * Schema de erro
 */
interface ErrorResponse {
  error: string;
  details: string | string[];
}

/**
 * NOVA FUNÇÃO: Constrói ExecutionContext a partir de contexto simples
 * (Inspirada na função createExecutionContext do obi.ts)
 */
function createExecutionContext(partialContext: any): ExecutionContext {
  // Se já é um ExecutionContext completo, retorna como está
  if (partialContext.executionId && partialContext.input && partialContext.state) {
    return partialContext as ExecutionContext;
  }
  
  // Caso contrário, constrói a partir dos campos simples
  const executionContext: ExecutionContext = {
    executionId: partialContext.executionId || `exec-review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    startTime: partialContext.startTime ? new Date(partialContext.startTime) : new Date(),
    input: {
      content: partialContext.contexto || partialContext.content || '',
      metadata: {
        specialist: partialContext.especialista || partialContext.autor || 'unknown',
        confidence: partialContext.probabilidade || partialContext.confidence || 0.75,
        caseId: partialContext.idCaso || partialContext.caseId || 'unknown',
        recordId: partialContext.idRegistro || partialContext.recordId,
        stage: partialContext.etapa || partialContext.stage,
        recordType: partialContext.tipo_registro || partialContext.recordType,
        timestamp: partialContext.timestamp || new Date().toISOString(),
        ...partialContext
      }
    },
    state: {
      phase: partialContext.etapa === 'validacao_cruzada' ? 'validation' : (partialContext.phase || 'analysis'),
      activatedSpecialists: partialContext.activatedSpecialists || [partialContext.especialista || partialContext.autor].filter(Boolean),
      partialResults: partialContext.partialResults || new Map(),
      flags: {
        debugMode: partialContext.debugMode || false,
        ...partialContext.flags
      }
    },
    config: {
      enabledSpecialists: partialContext.enabledSpecialists || ['L', 'Senku', 'Norman', 'Isagi', 'Obi'],
      confidenceThreshold: partialContext.confidenceThreshold || 0.6,
      ...partialContext.config
    },
    actionHistory: partialContext.actionHistory || [],
    effectLogs: partialContext.effectLogs || []
  };
  
  return executionContext;
}

/**
 * FUNÇÃO SIMPLIFICADA: Valida o corpo da requisição (mais flexível)
 */
function validateRequestBody(body: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validação do reviewer
  if (!body.reviewer || typeof body.reviewer !== 'string') {
    errors.push('Campo "reviewer" é obrigatório e deve ser string');
  } else {
    const validReviewers = ['L', 'Norman', 'Senku', 'Isagi', 'Obi'];
    if (!validReviewers.includes(body.reviewer)) {
      errors.push(`Campo "reviewer" deve ser um dos: ${validReviewers.join(', ')}`);
    }
  }

  // Validação básica da originalAnalysis
  if (!body.originalAnalysis) {
    errors.push('Campo "originalAnalysis" é obrigatório');
  } else {
    const analysis = body.originalAnalysis;
    
    if (!analysis.specialist || typeof analysis.specialist !== 'string') {
      errors.push('originalAnalysis.specialist é obrigatório e deve ser string');
    }
    
    if (!analysis.analysis) {
      errors.push('originalAnalysis.analysis é obrigatório');
    } else {
      const analysisContent = analysis.analysis;
      
      if (!analysisContent.summary || typeof analysisContent.summary !== 'string') {
        errors.push('originalAnalysis.analysis.summary é obrigatório e deve ser string');
      }
      
      if (!Array.isArray(analysisContent.keyPoints)) {
        errors.push('originalAnalysis.analysis.keyPoints deve ser array');
      }
      
      if (!Array.isArray(analysisContent.insights)) {
        errors.push('originalAnalysis.analysis.insights deve ser array');
      }
    }
    
    if (!analysis.metadata) {
      errors.push('originalAnalysis.metadata é obrigatório');
    }
  }

  // Validação FLEXÍVEL do context
  if (!body.context) {
    errors.push('Campo "context" é obrigatório');
  } else if (typeof body.context !== 'object') {
    errors.push('Campo "context" deve ser um objeto');
  }
  // MUDANÇA: Não validamos mais a estrutura específica - aceitamos qualquer objeto

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Converte o resultado da revisão para o formato de resposta
 */
function formatReviewResponse(
  result: ReviewResult,
  reviewer: string,
  originalAnalysis: SpecialistResponse
): ReviewResponseBody {
  // Determina se foi aprovado baseado no status
  const approved = result.status === 'approved';
  
  // Monta lista de razões
  const reasons: string[] = [result.justification];
  
  // Adiciona razões específicas baseadas no status
  if (result.status === 'approved') {
    reasons.push('Análise atende aos critérios de qualidade');
    reasons.push(`Score de qualidade: ${(result.qualityScore * 100).toFixed(0)}%`);
  } else if (result.status === 'refine') {
    reasons.push('Análise requer refinamentos específicos');
    reasons.push(`Score de qualidade: ${(result.qualityScore * 100).toFixed(0)}%`);
  } else {
    reasons.push('Análise não atende aos critérios mínimos');
    reasons.push(`Score de qualidade: ${(result.qualityScore * 100).toFixed(0)}%`);
  }

  return {
    review: {
      approved,
      reasons,
      suggestions: result.suggestions || []
    },
    metadata: {
      reviewer: SPECIALIST_TO_PERSONA[reviewer] || reviewer,
      originalSpecialist: SPECIALIST_TO_PERSONA[originalAnalysis.specialist] || originalAnalysis.specialist,
      timestamp: new Date().toISOString(),
      qualityScore: result.qualityScore
    }
  };
}

/**
 * Handler principal do endpoint de revisão (FLEXÍVEL)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReviewResponseBody | ErrorResponse>
): Promise<void> {
  // Configurar headers CORS
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  // Handler para métodos não suportados
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Método não suportado',
      details: 'Este endpoint aceita apenas requisições POST'
    });
  }

  try {
    // Parse do body da requisição
    let body: any;
    try {
      body = req.body;
      // Verifica se o body não está vazio
      if (!body || Object.keys(body).length === 0) {
        throw new Error('Body vazio');
      }
    } catch (error) {
      return res.status(400).json({
        error: 'Corpo da requisição deve ser JSON válido',
        details: error instanceof Error ? error.message : 'Erro de parsing JSON'
      });
    }

    // Validação FLEXÍVEL do input
    const validation = validateRequestBody(body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Dados de entrada inválidos',
        details: validation.errors
      });
    }

    // Extração dos dados validados
    const { reviewer, originalAnalysis, context: partialContext } = body as ReviewRequestBody;

    // MUDANÇA: Criar ExecutionContext completo a partir do contexto parcial
    const executionContext = createExecutionContext(partialContext);

    // Preparação do input para a função de revisão
    const reviewInput: ReviewInput = {
      reviewer,
      originalAnalysis,
      context: executionContext // Agora sempre passamos ExecutionContext completo
    };

    // Execução da lógica de revisão
    let reviewResult: ReviewResult;
    try {
      reviewResult = reviewAnalysis(reviewInput);
    } catch (error) {
      console.error('Erro durante execução da revisão:', error);
      return res.status(500).json({
        error: 'Erro interno durante a revisão',
        details: 'Falha na execução da lógica de validação cruzada'
      });
    }

    // Formatação da resposta
    const response = formatReviewResponse(reviewResult, reviewer, originalAnalysis);

    // Log da operação (para auditoria)
    console.log(`[REVIEW FLEXÍVEL] ${reviewer} revisou análise de ${originalAnalysis.specialist}: ${reviewResult.status} (score: ${(reviewResult.qualityScore * 100).toFixed(0)}%)`);

    // Retorno da resposta formatada
    return res.status(200).json(response);

  } catch (error) {
    // Tratamento de erros não capturados
    console.error('Erro não capturado no endpoint de revisão:', error);
    
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: 'Falha inesperada durante o processamento da revisão'
    });
  }
}

// Configuração do Next.js para o endpoint
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};