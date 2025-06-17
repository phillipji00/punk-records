import { NextApiRequest, NextApiResponse } from 'next';
import { getDbPool, initializeDatabase } from '../lib/dbClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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

    const { 
      id_caso, 
      titulo,
      format = 'json' // 'json', 'markdown', ou 'raw'
    } = req.query;

    // Buscar registros_misc que sejam transcrições
    let query = `
      SELECT 
        id_registro,
        dados,
        timestamp,
        autor,
        id_caso,
        especialista,
        etapa
      FROM registros 
      WHERE tipo_registro = 'registro_misc'
      AND dados->>'conteudo' LIKE 'TIPO_DOCUMENTO: transcricao_completa%'
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (id_caso && typeof id_caso === 'string') {
      query += ` AND id_caso = $${paramIndex}`;
      params.push(id_caso);
      paramIndex++;
    }

    if (titulo && typeof titulo === 'string') {
      query += ` AND dados->>'conteudo' ILIKE $${paramIndex}`;
      params.push(`%TITULO: ${titulo}%`);
      paramIndex++;
    }

    query += ` ORDER BY timestamp DESC`;

    const result = await client.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: 'Nenhuma transcrição encontrada',
        dica: 'Procure por registros com TIPO_DOCUMENTO: transcricao_completa no campo conteudo'
      });
    }

    // Processar os resultados
    const transcricoes = result.rows.map(row => {
      const conteudo = row.dados.conteudo;
      
      // Extrair metadados do cabeçalho
      const lines = conteudo.split('\n');
      const metadados: Record<string, string> = {};
      let transcricaoStart = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('=== TRANSCRICAO_COMPLETA ===') || line.includes('=== TRANSCRIÇÃO ===')) {
          transcricaoStart = i + 1;
          break;
        }
        if (line.includes(':') && !line.startsWith('**') && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length > 0) {
            metadados[key.trim()] = valueParts.join(':').trim();
          }
        }
      }
      
      // Extrair transcrição limpa
      const transcricaoCompleta = lines.slice(transcricaoStart)
        .join('\n')
        .replace(/=== METADADOS ===[\s\S]*$/, '') // Remove metadados do final se existir
        .trim();

      return {
        id_registro: row.id_registro,
        titulo: metadados.TITULO || metadados.TITLE || 'Sem título',
        categoria: metadados.CATEGORIA || metadados.CATEGORY || 'Sem categoria',
        local: metadados.LOCAL || metadados.LOCATION || 'Local não informado',
        leitor_anterior: metadados.LEITOR_ANTERIOR || metadados.PREVIOUS_READER || 'Desconhecido',
        data_leitura: metadados.DATA_LEITURA || metadados.READING_DATE || 'Data não informada',
        transcricao_completa: transcricaoCompleta,
        metadados_extraidos: metadados,
        timestamp_registro: row.timestamp,
        autor: row.autor,
        especialista: row.especialista,
        etapa: row.etapa,
        id_caso: row.id_caso
      };
    });

    // Retorno baseado no formato
    if (format === 'markdown' && transcricoes.length > 0) {
      const transcricao = transcricoes[0];
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${transcricao.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.md"`);
      return res.status(200).send(transcricao.transcricao_completa);
    }

    if (format === 'raw' && transcricoes.length > 0) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(result.rows[0].dados.conteudo);
    }

    // Formato JSON padrão
    return res.status(200).json({
      transcricoes: transcricoes,
      total: transcricoes.length,
      formatos_disponiveis: {
        json: 'Dados estruturados (padrão)',
        markdown: 'Download como .md (adicione ?format=markdown)',
        raw: 'Conteúdo bruto (adicione ?format=raw)'
      },
      exemplo_uso: {
        buscar_por_titulo: '/api/extract-transcricoes?titulo=Fixed Stars',
        buscar_por_caso: '/api/extract-transcricoes?id_caso=mansion_mystery',
        download_markdown: '/api/extract-transcricoes?titulo=Fixed Stars&format=markdown'
      }
    });

  } catch (error) {
    console.error('Erro ao extrair transcrições:', error);
    
    return res.status(500).json({
      erro: 'Erro interno ao extrair transcrições',
      detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}