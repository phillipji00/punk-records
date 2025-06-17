import type { VercelRequest, VercelResponse } from '@vercel/node';
import { promoverCaso, initializeDatabase } from '../lib/dbClient';

// Interface para o corpo da requisição
interface PromoverRequest {
  id_caso: string;
  etapa: string;
  especialista: string;
  probabilidade?: number;
}

// Interface para a resposta de sucesso
interface PromoverResponse {
  status: 'criado' | 'atualizado';
  id_caso: string;
  message: string;
}

// Interface para erro
interface ErrorResponse {
  error: string;
  message?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Validação do método HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Método não permitido',
      message: 'Este endpoint aceita apenas requisições POST'
    } as ErrorResponse);
  }

  try {
    // Inicializa o banco se necessário
    await initializeDatabase();

    // Extrai os dados do corpo da requisição
    const { id_caso, etapa, especialista, probabilidade } = req.body as PromoverRequest;

    // Validação dos campos obrigatórios
    if (!id_caso || !etapa || !especialista) {
      return res.status(400).json({
        error: 'Campos obrigatórios ausentes',
        message: 'É necessário fornecer id_caso, etapa e especialista'
      } as ErrorResponse);
    }

    // Validação do formato dos campos
    if (typeof id_caso !== 'string' || id_caso.trim() === '') {
      return res.status(400).json({
        error: 'Campo inválido',
        message: 'O campo id_caso deve ser uma string não vazia'
      } as ErrorResponse);
    }

    if (typeof etapa !== 'string' || etapa.trim() === '') {
      return res.status(400).json({
        error: 'Campo inválido',
        message: 'O campo etapa deve ser uma string não vazia'
      } as ErrorResponse);
    }

    if (typeof especialista !== 'string' || especialista.trim() === '') {
      return res.status(400).json({
        error: 'Campo inválido',
        message: 'O campo especialista deve ser uma string não vazia'
      } as ErrorResponse);
    }

    // Validação da probabilidade se fornecida
    if (probabilidade !== undefined && probabilidade !== null) {
      if (typeof probabilidade !== 'number' || probabilidade < 0 || probabilidade > 1) {
        return res.status(400).json({
          error: 'Campo inválido',
          message: 'O campo probabilidade deve ser um número entre 0 e 1'
        } as ErrorResponse);
      }
    }

    // Chama a função de promoção do caso
    const resultado = await promoverCaso(
      id_caso.trim(),
      etapa.trim(),
      especialista.trim(),
      probabilidade || null
    );

    // Prepara a resposta baseada no resultado
    const resposta: PromoverResponse = {
      status: resultado,
      id_caso: id_caso.trim(),
      message: resultado === 'criado' 
        ? `Novo caso ${id_caso} criado com sucesso`
        : `Caso ${id_caso} atualizado com sucesso`
    };

    // Retorna resposta de sucesso com código apropriado
    const statusCode = resultado === 'criado' ? 201 : 200;
    return res.status(statusCode).json(resposta);

  } catch (error) {
    // Log do erro no servidor
    console.error('Erro ao promover caso:', error);

    // Resposta de erro genérico
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Ocorreu um erro ao processar a solicitação. Por favor, tente novamente.'
    } as ErrorResponse);
  }
}