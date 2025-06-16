// src/api/pipeline.ts - Syndicate v3.2 Pipeline API Endpoint
// Endpoint para transição entre etapas do pipeline investigativo

import { NextApiRequest, NextApiResponse } from 'next';
import { advanceStage, getStageInfo, getPipelineMetrics } from '../../lib/pipelineEngine';
import { ExecutionContext, StageTransitionResult } from '../../lib/types/common';

// Tipos de resposta da API
interface PipelineResponse {
  result?: StageTransitionResult;
  stageInfo?: any;
  metrics?: any;
  error?: string;
}

// Validação do contexto de execução
function validateExecutionContext(context: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validações obrigatórias
  if (!context.currentStage || typeof context.currentStage !== 'string') {
    errors.push('currentStage é obrigatório e deve ser uma string');
  }

  if (!context.completedTasks || !Array.isArray(context.completedTasks)) {
    errors.push('completedTasks é obrigatório e deve ser um array');
  }

  if (!context.investigationType || !['rapid', 'standard', 'comprehensive'].includes(context.investigationType)) {
    errors.push('investigationType deve ser: rapid, standard ou comprehensive');
  }

  if (!context.stageConfidence || typeof context.stageConfidence !== 'object') {
    errors.push('stageConfidence é obrigatório e deve ser um objeto');
  }

  // Validações de tipos
  if (context.teamConsensus !== undefined && typeof context.teamConsensus !== 'number') {
    errors.push('teamConsensus deve ser um número');
  }

  if (context.contextCompleteness !== undefined && typeof context.contextCompleteness !== 'number') {
    errors.push('contextCompleteness deve ser um número');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Handler principal da API
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PipelineResponse>
): Promise<void> {
  // Apenas POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Método não permitido. Use POST.' 
    });
  }

  try {
    const { currentStage, context, action = 'advance' } = req.body;

    // Validação básica de entrada
    if (!currentStage || !context) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: currentStage e context'
      });
    }

    // Validação do contexto
    const validation = validateExecutionContext(context);
    if (!validation.valid) {
      return res.status(400).json({
        error: `Contexto inválido: ${validation.errors.join('; ')}`
      });
    }

    // Garantir estrutura mínima do contexto
    const executionContext: ExecutionContext = {
      currentStage,
      evidence: context.evidence || {},
      specialistAnalyses: context.specialistAnalyses || {},
      validationResults: context.validationResults || {},
      synthesis: context.synthesis || {},
      hypotheses: context.hypotheses || [],
      teamConsensus: context.teamConsensus || 0,
      conclusions: context.conclusions || {},
      completedTasks: context.completedTasks || [],
      stageConfidence: context.stageConfidence || {},
      qaRefinementActive: context.qaRefinementActive || false,
      contextCompleteness: context.contextCompleteness || 0,
      investigationType: context.investigationType || 'standard'
    };

    // Executar ação baseada no parâmetro
    switch (action) {
      case 'advance': {
        // Ação padrão: avançar para próxima etapa
        const result = advanceStage(currentStage, executionContext);
        
        // Log para debugging (em produção, usar sistema de logs apropriado)
        console.log(`[Pipeline API] Stage transition: ${currentStage} -> ${result.nextStage}`);
        
        return res.status(200).json({ result });
      }

      case 'info': {
        // Retornar informações sobre a etapa atual
        const stageInfo = getStageInfo(currentStage);
        
        if (!stageInfo) {
          return res.status(404).json({
            error: `Etapa '${currentStage}' não encontrada`
          });
        }

        return res.status(200).json({ stageInfo });
      }

      case 'metrics': {
        // Retornar métricas do pipeline
        const metrics = getPipelineMetrics(executionContext);
        
        return res.status(200).json({ metrics });
      }

      default:
        return res.status(400).json({
          error: `Ação '${action}' não reconhecida. Use: advance, info ou metrics`
        });
    }

  } catch (error) {
    // Tratamento de erros
    console.error('[Pipeline API] Erro:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return res.status(500).json({
      error: `Erro interno: ${errorMessage}`
    });
  }
}

// Configuração do Next.js para a API
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb', // Limite de tamanho do body
    },
  },
};