import type { NextApiRequest, NextApiResponse } from 'next';
import { reviewAnalysis, ReviewInput, ReviewResult } from '../src/reviewEngine';
import { 
  ExecutionContext, 
  SpecialistResponse, 
  isValidExecutionContext,
  SPECIALIST_TO_PERSONA 
} from '../lib/types/common';

/**
 * Schema de entrada esperado para o endpoint
 */
interface ReviewRequestBody {
  /** Nome do especialista que vai revisar */
  reviewer: string;
  /** Análise original feita por outro especialista */
  originalAnalysis: SpecialistResponse;
  /** Contexto completo da execução */
  context: ExecutionContext;
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
 * Valida o corpo da requisição
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

  // Validação da originalAnalysis
  if (!body.originalAnalysis) {
    errors.push('Campo "originalAnalysis" é obrigatório');
  } else {
    // Verifica estrutura básica do SpecialistResponse
    const analysis = body.originalAnalysis;
    
    if (!analysis.specialist || typeof analysis.specialist !== 'string') {
      errors.push('originalAnalysis.specialist é obrigatório e deve ser string');
    }
    
    if (!analysis.analysisId || typeof analysis.analysisId !== 'string') {
      errors.push('originalAnalysis.analysisId é obrigatório e deve ser string');
    }
    
    if (!analysis.timestamp) {
      errors.push('originalAnalysis.timestamp é obrigatório');
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
    } else {
      if (typeof analysis.metadata.processingTime !== 'number') {
        errors.push('originalAnalysis.metadata.processingTime deve ser number');
      }
      
      if (typeof analysis.metadata.overallConfidence !== 'number') {
        errors.push('originalAnalysis.metadata.overallConfidence deve ser number');
      }
      
      if (typeof analysis.metadata.isComplete !== 'boolean') {
        errors.push('originalAnalysis.metadata.isComplete deve ser boolean');
      }
    }
  }

  // Validação do context
  if (!body.context) {
    errors.push('Campo "context" é obrigatório');
  } else {
    if (!isValidExecutionContext(body.context)) {
      errors.push('Campo "context" não possui estrutura válida de ExecutionContext');
    }
  }

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
 * Handler principal do endpoint de revisão
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

    // Validação rigorosa do input
    const validation = validateRequestBody(body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Dados de entrada inválidos',
        details: validation.errors
      });
    }

    // Extração dos dados validados
    const { reviewer, originalAnalysis, context } = body as ReviewRequestBody;

    // Preparação do input para a função de revisão
    const reviewInput: ReviewInput = {
      reviewer,
      originalAnalysis,
      context
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
    console.log(`[REVIEW] ${reviewer} revisou análise de ${originalAnalysis.specialist}: ${reviewResult.status} (score: ${(reviewResult.qualityScore * 100).toFixed(0)}%)`);

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