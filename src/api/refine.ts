/**
 * SYNDICATE v3.2 - API Route: /api/refine
 * 
 * Endpoint público para geração de perguntas de refinamento de análise
 * Usado pelo agente GPT "Capitão Obi" para enriquecer investigações
 * 
 * @module api/refine
 * @version 3.2.0
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { generateRefinementQuestions, executeRefinement } from '../../lib/qaRefiner';
import type { RefinementInput, RefinementQuestion } from '../../lib/types/common';

/**
 * Schema esperado para o body da requisição
 */
interface RefineRequestBody {
  specialist: string;
  context: string;
  hypothesis?: string;
  evidence?: string;
  missingElement?: string;
  userCommand?: string;
  currentConfidence?: number;
  // Modo opcional para usar executeRefinement ao invés de generateRefinementQuestions
  useFullRefinement?: boolean;
}

/**
 * Estrutura de resposta de sucesso
 */
interface RefineSuccessResponse {
  questions: RefinementQuestion[];
  // Campos adicionais quando useFullRefinement = true
  mode?: 'rapid' | 'deep' | 'collaborative';
  estimatedQuestions?: number;
  confidenceTarget?: number;
  escapeAvailable?: boolean;
}

/**
 * Estrutura de resposta de erro
 */
interface RefineErrorResponse {
  error: string;
  details?: string;
}

/**
 * Lista de especialistas válidos
 */
const VALID_SPECIALISTS = [
  'L Lawliet',
  'Senku Ishigami', 
  'Norman',
  'Isagi Yoichi',
  'Capitão Obi',
  // Aliases também aceitos
  'L',
  'Senku',
  'Isagi',
  'Obi'
];

/**
 * Valida o body da requisição
 */
function validateRequestBody(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Body deve ser um objeto JSON' };
  }

  const { specialist, context } = body;

  // Context é obrigatório
  if (!context || typeof context !== 'string' || context.trim().length === 0) {
    return { valid: false, error: 'Campo "context" é obrigatório e deve ser uma string não vazia' };
  }

  // Specialist é obrigatório
  if (!specialist || typeof specialist !== 'string') {
    return { valid: false, error: 'Campo "specialist" é obrigatório e deve ser uma string' };
  }

  // Validar specialist (se não vazio, pois o sistema pode auto-detectar)
  if (specialist && !VALID_SPECIALISTS.includes(specialist)) {
    return { 
      valid: false, 
      error: `Especialista inválido. Valores aceitos: ${VALID_SPECIALISTS.join(', ')}` 
    };
  }

  // Validar campos opcionais se presentes
  const optionalStringFields = ['hypothesis', 'evidence', 'missingElement', 'userCommand'];
  for (const field of optionalStringFields) {
    if (body[field] !== undefined && typeof body[field] !== 'string') {
      return { valid: false, error: `Campo "${field}" deve ser uma string` };
    }
  }

  // Validar currentConfidence se presente
  if (body.currentConfidence !== undefined) {
    const confidence = body.currentConfidence;
    if (typeof confidence !== 'number' || confidence < 0 || confidence > 100) {
      return { valid: false, error: 'Campo "currentConfidence" deve ser um número entre 0 e 100' };
    }
  }

  // Validar useFullRefinement se presente
  if (body.useFullRefinement !== undefined && typeof body.useFullRefinement !== 'boolean') {
    return { valid: false, error: 'Campo "useFullRefinement" deve ser um booleano' };
  }

  return { valid: true };
}

/**
 * Normaliza nomes de especialistas (converte aliases)
 */
function normalizeSpecialistName(specialist: string): string {
  const aliasMap: Record<string, string> = {
    'L': 'L Lawliet',
    'Senku': 'Senku Ishigami',
    'Isagi': 'Isagi Yoichi',
    'Obi': 'Capitão Obi'
  };

  return aliasMap[specialist] || specialist;
}

/**
 * Handler principal da rota
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RefineSuccessResponse | RefineErrorResponse>
) {
  // Configurar CORS se necessário
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Lidar com preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Aceitar apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Método não permitido',
      details: 'Esta rota aceita apenas requisições POST' 
    });
  }

  try {
    // Validar body
    const validation = validateRequestBody(req.body);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Requisição inválida',
        details: validation.error 
      });
    }

    // Extrair e normalizar dados
    const body = req.body as RefineRequestBody;
    const refinementInput: RefinementInput = {
      specialist: normalizeSpecialistName(body.specialist),
      context: body.context,
      hypothesis: body.hypothesis,
      evidence: body.evidence,
      missingElement: body.missingElement,
      userCommand: body.userCommand,
      currentConfidence: body.currentConfidence
    };

    // Gerar perguntas ou executar refinamento completo
    let response: RefineSuccessResponse;

    if (body.useFullRefinement) {
      // Usar executeRefinement para resposta completa
      const fullResult = executeRefinement(refinementInput);
      response = {
        questions: fullResult.questions,
        mode: fullResult.mode,
        estimatedQuestions: fullResult.estimatedQuestions,
        confidenceTarget: fullResult.confidenceTarget,
        escapeAvailable: fullResult.escapeAvailable
      };
    } else {
      // Usar generateRefinementQuestions para apenas as perguntas
      const questions = generateRefinementQuestions(refinementInput);
      response = { questions };
    }

    // Log para debugging (em produção, usar sistema de logs apropriado)
    if (process.env.NODE_ENV === 'development') {
      console.log('Refine API called:', {
        specialist: refinementInput.specialist,
        contextLength: refinementInput.context.length,
        questionsGenerated: response.questions.length,
        mode: response.mode
      });
    }

    // Retornar sucesso
    return res.status(200).json(response);

  } catch (error) {
    // Log do erro
    console.error('Erro na rota /api/refine:', error);

    // Retornar erro genérico (não expor detalhes internos)
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' 
        ? (error as Error).message 
        : 'Ocorreu um erro ao processar a requisição'
    });
  }
}

/**
 * Configuração do Next.js para parsing do body
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};