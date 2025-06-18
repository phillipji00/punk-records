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
    await initializeDatabase();
    const pool = getDbPool();
    client = await pool.connect();

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

    // Extrair keywords inteligentemente
    const keywords = extractKeywords(termo);
    
    // Construir query base com busca em múltiplos campos
    let query = `
      SELECT 
        id_registro,
        id_caso,
        tipo_registro,
        autor,
        dados,
        timestamp,
        especialista,
        probabilidade
      FROM registros
      WHERE (
        -- Busca no campo dados (JSONB)
        dados::text ILIKE ANY($1)
        OR 
        -- Busca no campo autor
        autor ILIKE ANY($1)
        OR
        -- Busca no campo id_caso
        id_caso ILIKE ANY($1)
        OR
        -- Busca no campo tipo_registro
        tipo_registro ILIKE ANY($1)
        OR
        -- Busca no campo especialista
        especialista ILIKE ANY($1)
      )
    `;

    // Preparar array de padrões de busca para cada keyword
    const searchPatterns = keywords.flatMap(keyword => [
      `%${keyword}%`,
      `%${keyword.toLowerCase()}%`,
      `%${keyword.toUpperCase()}%`
    ]);

    // Array para armazenar parâmetros
    const params: any[] = [searchPatterns];
    let paramIndex = 2;

    // Adicionar filtros opcionais APENAS se fornecidos
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

    // Ordenar por timestamp decrescente (mais recente primeiro)
    query += ` ORDER BY timestamp DESC`;

    // Executar query
    const result = await client.query(query, params);

    // Rankear resultados por relevância
    const rankedResults = rankResultsByRelevance(result.rows, keywords);

    // Retornar resultados
    return res.status(200).json({
      termo_original: termo,
      keywords_extraidas: keywords,
      total_encontrados: rankedResults.length,
      resultados: rankedResults
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

/**
 * Extrai palavras-chave relevantes de uma query de busca
 */
function extractKeywords(query: string): string[] {
  // Stop words em português e inglês
  const stopWords = new Set([
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
    'de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos',
    'por', 'para', 'com', 'sem', 'sobre', 'sob', 'entre', 'até',
    'que', 'quem', 'qual', 'quando', 'onde', 'como', 'por que', 'porque',
    'tem', 'há', 'existe', 'algo', 'algum', 'alguma', 'alguns', 'algumas',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might'
  ]);

  return query
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.replace(/[^\w\u00C0-\u017F]/g, '')) // Remove pontuação, mantém acentos
    .filter(word => 
      word.length >= 3 && // Mínimo 3 caracteres
      !stopWords.has(word) && // Não é stop word
      !/^\d+$/.test(word) // Não é apenas números
    )
    .slice(0, 10); // Máximo 10 keywords para evitar queries muito complexas
}

/**
 * Rankeia resultados por relevância baseado nas keywords
 */
function rankResultsByRelevance(results: any[], keywords: string[]): any[] {
  if (keywords.length === 0) return results;

  return results.map(result => {
    let score = 0;
    const searchableText = JSON.stringify(result).toLowerCase();
    
    // Calcular score baseado em ocorrências das keywords
    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const occurrences = (searchableText.match(new RegExp(keywordLower, 'g')) || []).length;
      
      // Diferentes pesos para diferentes campos
      if (result.autor && result.autor.toLowerCase().includes(keywordLower)) {
        score += occurrences * 3; // Autor tem peso 3
      }
      if (result.id_caso && result.id_caso.toLowerCase().includes(keywordLower)) {
        score += occurrences * 2; // ID do caso tem peso 2
      }
      if (result.tipo_registro && result.tipo_registro.toLowerCase().includes(keywordLower)) {
        score += occurrences * 2; // Tipo tem peso 2
      }
      if (result.especialista && result.especialista.toLowerCase().includes(keywordLower)) {
        score += occurrences * 2; // Especialista tem peso 2
      }
      if (result.dados && JSON.stringify(result.dados).toLowerCase().includes(keywordLower)) {
        score += occurrences * 1; // Dados têm peso 1
      }
    });

    return {
      ...result,
      relevance_score: score
    };
  })
  .sort((a, b) => b.relevance_score - a.relevance_score) // Ordenar por relevância decrescente
  .slice(0, 100); // Limitar a 100 resultados mais relevantes
}