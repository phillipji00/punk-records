import type { NextApiRequest, NextApiResponse } from 'next';
import { gerarAnaliseEspecialista, refineAndAnalyze } from '../specialistAgent';
import { 
  ExecutionContext, 
  SpecialistResponse
} from '../../lib/types/common';

// Tipos de resposta da API
interface AnalysisSuccessResponse {
  analysis: SpecialistResponse;
}

interface AnalysisErrorResponse {
  error: string;
  details?: string;
}

type ApiResponse = AnalysisSuccessResponse | AnalysisErrorResponse;

// Função auxiliar para converter AnaliseEspecialista para SpecialistResponse
function convertToSpecialistResponse(
  analise: any, 
  context: ExecutionContext,
  startTime: number
): SpecialistResponse {
  const processingTime = Date.now() - startTime;
  
  return {
    specialist: analise.especialista as any,
    analysisId: `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    analysis: {
      summary: analise.analise.hipotese,
      keyPoints: [
        analise.analise.justificativa,
        ...analise.analise.acoes_recomendadas.slice(0, 2)
      ],
      insights: analise.analise.acoes_recomendadas.map((acao: string, index: number) => ({
        category: index === 0 ? 'primary_recommendation' : 'secondary_recommendation',
        description: acao,
        confidence: analise.analise.nivel_confianca
      }))
    },
    recommendations: analise.analise.acoes_recomendadas.map((acao: string, index: number) => ({
      action: acao,
      rationale: `Baseado na análise de ${analise.especialista}`,
      priority: index === 0 ? 'high' : 'medium'
    })),
    metadata: {
      processingTime,
      overallConfidence: analise.analise.nivel_confianca,
      isComplete: true
    }
  };
}

// Função auxiliar para construir ExecutionContext
function buildExecutionContext(requestBody: any): ExecutionContext {
  const { specialist, context } = requestBody;
  
  // Se context já é um ExecutionContext completo, use-o
  if (context.executionId && context.input && context.state) {
    return context;
  }
  
  // Caso contrário, construa um ExecutionContext a partir dos dados fornecidos
  return {
    executionId: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    startTime: new Date(),
    input: {
      content: context.contexto || context.content || '',
      metadata: {
        specialist: specialist || context.especialista || context.autor,
        confidence: context.probabilidade || context.confidence || 0.75,
        ...context
      }
    },
    state: {
      phase: 'analysis',
      activatedSpecialists: [specialist || context.especialista || context.autor],
      partialResults: new Map(),
      flags: {
        debugMode: false
      }
    },
    config: {
      enabledSpecialists: ['L', 'Senku', 'Norman', 'Isagi', 'Obi'],
      confidenceThreshold: 0.6
    },
    actionHistory: [],
    effectLogs: []
  };
}

// Handler principal da API
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
): Promise<void> {
  // Validar método HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Método não permitido',
      details: 'Esta rota aceita apenas requisições POST'
    });
  }

  // Validar corpo da requisição
  if (!req.body) {
    return res.status(400).json({ 
      error: 'Corpo da requisição vazio',
      details: 'É necessário enviar um JSON com os dados da análise'
    });
  }

  const { context: rawContext, specialist } = req.body;

  // Validar presença do contexto
  if (!rawContext) {
    return res.status(400).json({ 
      error: 'Contexto não fornecido',
      details: 'O campo "context" é obrigatório no corpo da requisição'
    });
  }

  try {
    const startTime = Date.now();
    
    // Construir ExecutionContext
    const executionContext = buildExecutionContext(req.body);
    
    // Verificar se deve usar refinamento baseado na confiança
    const confidence = executionContext.input.metadata?.confidence || 
                      executionContext.input.metadata?.probabilidade || 
                      0.75;
    
    let analysisResult;
    
    if (confidence < 0.8) {
      // Usar refineAndAnalyze para contextos de baixa confiança
      console.log(`[API] Confiança baixa detectada (${(confidence * 100).toFixed(0)}%). Usando análise refinada.`);
      analysisResult = await refineAndAnalyze(executionContext);
    } else {
      // Usar análise direta para alta confiança
      analysisResult = gerarAnaliseEspecialista(executionContext);
    }
    
    // Converter para formato SpecialistResponse
    const response = convertToSpecialistResponse(
      analysisResult, 
      executionContext,
      startTime
    );
    
    // Log de sucesso
    console.log(`[API] Análise concluída com sucesso. Especialista: ${response.specialist}, Confiança: ${(response.metadata.overallConfidence * 100).toFixed(0)}%`);
    
    // Retornar resposta de sucesso
    return res.status(200).json({ analysis: response });
    
  } catch (error) {
    // Log do erro
    console.error('[API] Erro ao processar análise:', error);
    
    // Determinar mensagem de erro apropriada
    let errorMessage = 'Erro ao processar análise';
    let errorDetails = 'Ocorreu um erro inesperado';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Verificar erros específicos
      if (error.message.includes('Especialista não reconhecido')) {
        errorDetails = 'O especialista fornecido não é válido. Use: L, Senku, Norman, Isagi ou Obi';
      } else if (error.message.includes('context')) {
        errorDetails = 'O contexto fornecido está incompleto ou mal formatado';
      }
    }
    
    // Retornar resposta de erro
    return res.status(400).json({ 
      error: errorMessage,
      details: errorDetails
    });
  }
}

// Configuração do Next.js para limites de tamanho
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};