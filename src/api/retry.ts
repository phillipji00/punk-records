/**
 * @fileoverview API Endpoint para Sistema de Retry do SYNDICATE v3.2
 * @module api/retry
 * @version 3.2.0
 * 
 * Endpoint REST que expõe a lógica de recuperação inteligente do retryEngine
 * Usado pelo Capitão Obi para decisões de recuperação após falhas no pipeline
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  avaliarRetry, 
  gerarRelatorioRetry,
  avaliarForcaConclusao,
  type RetryInput,
  type RetryResponse,
  type TipoErro,
  type CategoriaFalha
} from '../../lib/retryEngine';
import { 
  ETAPAS_PIPELINE, 
  ESPECIALISTAS,
  isValidProbabilidade 
} from '../../lib/types/common';
import { API_CONFIG } from '../../lib/config/api';

/**
 * Schema de validação para o body da requisição
 */
interface RetryApiRequest {
  etapaAtual: string;
  tipoErro: string;
  especialista?: string;
  tentativaAtual: number;
  confiancaAtual?: number;
  contextoErro?: Record<string, any>;
  tentativasGlobais?: number;
}

/**
 * Schema da resposta da API
 */
interface RetryApiResponse {
  retry?: RetryResponse;
  error?: string;
  metadata?: {
    requestId: string;
    timestamp: string;
    version: string;
    debugInfo?: string;
  };
}
/**
 * Handler principal da rota /api/retry
 * 
 * @param req - Request do Next.js
 * @param res - Response do Next.js
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RetryApiResponse>
) {
  // Timestamp e ID da requisição para tracking
  const requestId = generateRequestId();
  const timestamp = new Date().toISOString();
  
  // Configurar CORS se necessário
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Validar método HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Método não permitido. Use POST.',
      metadata: {
        requestId,
        timestamp,
        version: API_CONFIG.VERSION
      }
    });
  }
  
  try {
    // Validar e sanitizar input
    const validatedInput = validateInput(req.body);
    
    // Log de entrada (desenvolvimento)
    if (API_CONFIG.ENABLE_DEBUG) {
      console.log(`[${requestId}] Retry request:`, validatedInput);
    }
    
    // Verificar se deve forçar conclusão antes de avaliar
    if (validatedInput.tentativasGlobais) {
      const shouldForceConclusion = avaliarForcaConclusao(
        validatedInput.tentativasGlobais,
        validatedInput.confiancaAtual
      );
      
      if (shouldForceConclusion) {
        // Sobrescrever com conclusão graciosa
        const forcedResponse: RetryResponse = {
          acao: 'concluir_gracioso',
          justificativa: 'Limite de tentativas globais atingido. Consolidando análise disponível.',
          cooldownMs: 0,
          estrategiaRecuperacao: 'graceful_conclusion'
        };
        
        return res.status(200).json({
          retry: forcedResponse,
          metadata: {
            requestId,
            timestamp,
            version: API_CONFIG.VERSION,
            debugInfo: API_CONFIG.ENABLE_DEBUG 
              ? 'Conclusão forçada por limite global'
              : undefined
          }
        });
      }
    }
    
    // Executar avaliação de retry
    const retryResponse = avaliarRetry(validatedInput);
    
    // Gerar relatório para logging interno
    const relatorio = gerarRelatorioRetry(validatedInput, retryResponse);
    
    // Log de saída (desenvolvimento)
    if (API_CONFIG.ENABLE_DEBUG) {
      console.log(`[${requestId}] Retry response:`, retryResponse);
      console.log(`[${requestId}] Report:\n${relatorio}`);
    }
    
    // Retornar resposta bem-sucedida
    return res.status(200).json({
      retry: retryResponse,
      metadata: {
        requestId,
        timestamp,
        version: API_CONFIG.VERSION,
        debugInfo: API_CONFIG.ENABLE_DEBUG ? relatorio : undefined
      }
    });
    
  } catch (error) {
    // Tratamento de erros
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    console.error(`[${requestId}] Erro ao processar retry:`, error);
    
    return res.status(400).json({
      error: errorMessage,
      metadata: {
        requestId,
        timestamp,
        version: API_CONFIG.VERSION
      }
    });
  }
}

/**
 * Valida e sanitiza o input da requisição
 * 
 * @param body - Body da requisição
 * @returns Input validado
 * @throws Error se validação falhar
 */
function validateInput(body: any): RetryInput {
  // Verificar se body existe
  if (!body || typeof body !== 'object') {
    throw new Error('Body da requisição inválido');
  }
  
  const { 
    etapaAtual, 
    tipoErro, 
    especialista, 
    tentativaAtual,
    confiancaAtual,
    contextoErro,
    tentativasGlobais
  } = body as RetryApiRequest;
  
  // Validações obrigatórias
  if (!etapaAtual || typeof etapaAtual !== 'string') {
    throw new Error('Campo "etapaAtual" é obrigatório e deve ser string');
  }
  
  if (!tipoErro || typeof tipoErro !== 'string') {
    throw new Error('Campo "tipoErro" é obrigatório e deve ser string');
  }
  
  if (typeof tentativaAtual !== 'number' || tentativaAtual < 1) {
    throw new Error('Campo "tentativaAtual" deve ser número >= 1');
  }
  
  // Validar etapa conhecida (opcional, mas recomendado)
  const etapasValidas = Object.values(ETAPAS_PIPELINE);
  if (!etapasValidas.includes(etapaAtual)) {
    console.warn(`Etapa "${etapaAtual}" não está na lista padrão de etapas`);
  }
  
  // Validar especialista se fornecido
  if (especialista) {
    if (typeof especialista !== 'string') {
      throw new Error('Campo "especialista" deve ser string');
    }
    
    const especialistasValidos = Object.values(ESPECIALISTAS);
    if (!especialistasValidos.includes(especialista)) {
      console.warn(`Especialista "${especialista}" não está na lista padrão`);
    }
  }
  
  // Validar confiança se fornecida
  if (confiancaAtual !== undefined) {
    if (!isValidProbabilidade(confiancaAtual)) {
      throw new Error('Campo "confiancaAtual" deve ser número entre 0 e 100');
    }
  }
  
  // Validar tentativas globais se fornecidas
  if (tentativasGlobais !== undefined) {
    if (typeof tentativasGlobais !== 'number' || tentativasGlobais < 1) {
      throw new Error('Campo "tentativasGlobais" deve ser número >= 1');
    }
  }
  
  // Validar contextoErro se fornecido
  if (contextoErro !== undefined && typeof contextoErro !== 'object') {
    throw new Error('Campo "contextoErro" deve ser um objeto');
  }
  
  // Retornar input validado
  return {
    etapaAtual,
    tipoErro,
    especialista,
    tentativaAtual,
    confiancaAtual,
    contextoErro,
    tentativasGlobais
  };
}

/**
 * Gera ID único para a requisição
 * 
 * @returns ID no formato retry-TIMESTAMP-RANDOM
 */
function generateRequestId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `retry-${timestamp}-${random}`;
}

/**
 * Configuração do Next.js para a API
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: API_CONFIG.MAX_PAYLOAD_SIZE
    },
    responseLimit: false,
    externalResolver: true
  }
};