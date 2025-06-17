import { NextApiRequest, NextApiResponse } from 'next';
import { getDbPool, initializeDatabase } from '../lib/dbClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Aceitar apenas GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      erro: 'Método não permitido. Use GET.' 
    });
  }

  let client;

  try {
  await initializeDatabase(); // Primeiro: garante que o banco está acordado

  const pool = getDbPool(); // Garante pool tipado corretamente

    // Extrair parâmetros da query
    const { 
      termo, 
      id_caso, 
      tipo, 
      autor, 
      depois, 
      antes 
    } = req.query;

    // Validar termo obrigatório
    if (!termo || typeof termo !== 'string') {
      return res.status(400).json({ 
        erro: 'Parâmetro "termo" é obrigatório' 
      });
    }

    // Validar tamanho mínimo do termo
    if (termo.trim().length < 3) {
      return res.status(400).json({ 
        erro: 'O termo de busca deve ter pelo menos 3 caracteres' 
      });
    }

    // Construir query base
    let query = `
      SELECT 
        id_registro,
        id_caso,
        tipo_registro,
        autor,
        dados,
        timestamp
      FROM registros
      WHERE dados::text ILIKE $1
    `;

    // Array para armazenar parâmetros
    const params: any[] = [`%${termo}%`];
    let paramIndex = 2;

    // Adicionar filtros opcionais
    if (id_caso && typeof id_caso === 'string') {
      query += ` AND id_caso = $${paramIndex}`;
      params.push(id_caso);
      paramIndex++;
    }

    if (tipo && typeof tipo === 'string') {
      query += ` AND tipo_registro = $${paramIndex}`;
      params.push(tipo);
      paramIndex++;
    }

    if (autor && typeof autor === 'string') {
      query += ` AND autor = $${paramIndex}`;
      params.push(autor);
      paramIndex++;
    }

    // Filtro de data "depois"
    if (depois && typeof depois === 'string') {
      try {
        // Validar formato ISO 8601
        const dataDepois = new Date(depois);
        if (!isNaN(dataDepois.getTime())) {
          query += ` AND timestamp > $${paramIndex}`;
          params.push(dataDepois.toISOString());
          paramIndex++;
        }
      } catch (e) {
        // Ignorar data inválida silenciosamente
      }
    }

    // Filtro de data "antes"
    if (antes && typeof antes === 'string') {
      try {
        // Validar formato ISO 8601
        const dataAntes = new Date(antes);
        if (!isNaN(dataAntes.getTime())) {
          query += ` AND timestamp < $${paramIndex}`;
          params.push(dataAntes.toISOString());
          paramIndex++;
        }
      } catch (e) {
        // Ignorar data inválida silenciosamente
      }
    }

    // Ordenar por timestamp decrescente
    query += ` ORDER BY timestamp DESC`;

    // Executar query
    const result = await client.query(query, params);

    // Retornar resultados
    return res.status(200).json({
      resultados: result.rows
    });

  } catch (error) {
    console.error('Erro na busca:', error);
    
    // Tratamento específico para erro de timeout
    if (error instanceof Error && error.message.includes('timeout')) {
      return res.status(503).json({ 
        erro: 'Serviço temporariamente indisponível',
        detalhes: 'Timeout ao conectar com o banco de dados. Tente novamente em alguns instantes.'
      });
    }
    
    return res.status(500).json({ 
      erro: 'Erro interno ao realizar busca',
      detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}