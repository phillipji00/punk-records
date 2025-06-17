import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCasoStatus, initializeDatabase } from '../lib/dbClient';

// Interface para o retorno do status
interface StatusResponse {
  id_caso: string;
  etapa: string;
  especialista: string;
  probabilidade: number | null;
  timestamp: string;
}

// Interface para erro
interface ErrorResponse {
  erro: string;
  detalhes?: string;
}

// Handler principal
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Validação do método HTTP
  if (req.method !== 'GET') {
    return res.status(405).json({
      erro: 'Método não permitido',
      detalhes: 'Este endpoint aceita apenas requisições GET'
    } as ErrorResponse);
  }

  try {
    // Inicializa o banco se necessário
    await initializeDatabase();

    // Extrai o parâmetro idCaso da query string
    const { idCaso } = req.query;

    // Validação do parâmetro
    if (!idCaso) {
      return res.status(400).json({
        erro: 'Parâmetro obrigatório ausente',
        detalhes: 'É necessário fornecer o parâmetro idCaso na query string'
      } as ErrorResponse);
    }

    // Garante que idCaso é uma string
    const idCasoString = Array.isArray(idCaso) ? idCaso[0] : idCaso;

    // Validação adicional do formato
    if (!idCasoString || idCasoString.trim() === '') {
      return res.status(400).json({
        erro: 'Parâmetro inválido',
        detalhes: 'O parâmetro idCaso não pode estar vazio'
      } as ErrorResponse);
    }

    // Busca o status do caso no banco
    const statusCaso = await getCasoStatus(idCasoString);

    // Verifica se o caso foi encontrado
    if (!statusCaso) {
      return res.status(404).json({
        erro: 'Caso não encontrado',
        detalhes: `Nenhum caso encontrado com o id: ${idCasoString}`
      } as ErrorResponse);
    }

    // Formata a resposta
    const resposta: StatusResponse = {
      id_caso: statusCaso.id_caso,
      etapa: statusCaso.etapa,
      especialista: statusCaso.especialista,
      probabilidade: statusCaso.probabilidade,
      timestamp: statusCaso.timestamp.toISOString()
    };

    // Retorna o status encontrado
    return res.status(200).json(resposta);

  } catch (error) {
    // Log do erro no servidor
    console.error('Erro ao consultar status:', error);

    // Resposta de erro genérico
    return res.status(500).json({
      erro: 'Erro interno do servidor',
      detalhes: 'Ocorreu um erro ao consultar o status do caso. Por favor, tente novamente.'
    } as ErrorResponse);
  }
}

// Função auxiliar para validar formato de ID (opcional)
export function isValidCaseId(id: string): boolean {
  // Aceita letras, números, underscore e hífen
  const pattern = /^[a-zA-Z0-9_-]+$/;
  return pattern.test(id) && id.length > 0 && id.length <= 255;
}