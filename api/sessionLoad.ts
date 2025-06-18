import { NextApiRequest, NextApiResponse } from 'next';
import { getDbPool, initializeDatabase } from '../lib/dbClient';

interface SessionLoadResponse {
  load_type: 'consolidado' | 'session_specific' | 'latest_session';
  session_id?: string;
  document_found: boolean;
  content?: {
    markdown: string;
    metadata: {
      tipo_documento: string;
      session_origem?: string;
      timestamp: string;
      size_kb: number;
      casos_incluidos?: string[];
      registros_total?: number;
    };
  };
  available_sessions?: string[];
  metadata: {
    load_timestamp: string;
    processing_time_ms: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      erro: 'Método não permitido. Use GET.' 
    });
  }

  const startTime = Date.now();
  let client;

  try {
    await initializeDatabase();
    const pool = getDbPool();
    client = await pool.connect();

    const { 
      tipo = 'consolidado',  // 'consolidado', 'session', 'latest'
      session_id,
      incluir_metadata = 'true'
    } = req.query;

    let resultado: SessionLoadResponse;

   // SEMPRE tentar carregar consolidado primeiro
let resultado = await carregarDocumentoConsolidado(incluir_metadata === 'true');

// Se consolidado não existir, então buscar por tipo específico
if (!resultado.document_found) {
  switch (tipo) {
    case 'session':
      if (!session_id || typeof session_id !== 'string') {
        return res.status(400).json({
          erro: 'session_id é obrigatório quando consolidado não existe e tipo=session'
        });
      }
      resultado = await carregarDocumentoSessao(session_id, incluir_metadata === 'true');
      break;
      
    case 'latest':
      resultado = await carregarUltimaSessao(incluir_metadata === 'true');
      break;
      
    default:
      // Se consolidado não existe e não especificou tipo válido, tentar última sessão
      resultado = await carregarUltimaSessao(incluir_metadata === 'true');
  }
}

    resultado.metadata = {
      load_timestamp: new Date().toISOString(),
      processing_time_ms: Date.now() - startTime
    };

    return res.status(200).json(resultado);

  } catch (error) {
    console.error('Erro ao carregar sessão:', error);
    
    return res.status(500).json({
      erro: 'Erro interno ao carregar sessão',
      detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
      processing_time_ms: Date.now() - startTime
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Carregar documento consolidado
async function carregarDocumentoConsolidado(incluirMetadata: boolean): Promise<SessionLoadResponse> {
  const pool = getDbPool();
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        dados->>'conteudo' as conteudo,
        dados->>'tipo_documento' as tipo_documento,
        timestamp,
        id_caso
      FROM registros
      WHERE tipo_registro = 'registro_misc'
      AND dados->>'tipo_documento' = 'master_consolidation'
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    
    const result = await client.query(query);
    
    if (result.rows.length === 0) {
      // Listar sessões disponíveis se consolidado não existir
      const sessoesDiponiveis = await listarSessoesDisponiveis();
      
      return {
        load_type: 'consolidado',
        document_found: false,
        available_sessions: sessoesDiponiveis,
        metadata: {
          load_timestamp: '',
          processing_time_ms: 0
        }
      };
    }

    const documento = result.rows[0];
    const sizeKb = Buffer.byteLength(documento.conteudo, 'utf8') / 1024;

    let metadata: any = {
      tipo_documento: documento.tipo_documento,
      timestamp: documento.timestamp,
      size_kb: Math.round(sizeKb * 100) / 100
    };

    if (incluirMetadata) {
      // Extrair metadados adicionais do conteúdo
      const metadataAdicional = extrairMetadataConsolidado(documento.conteudo);
      metadata = { ...metadata, ...metadataAdicional };
    }

    return {
      load_type: 'consolidado',
      document_found: true,
      content: {
        markdown: documento.conteudo,
        metadata: metadata
      },
      metadata: {
        load_timestamp: '',
        processing_time_ms: 0
      }
    };
    
  } finally {
    client.release();
  }
}

// Carregar documento de sessão específica
async function carregarDocumentoSessao(sessionId: string, incluirMetadata: boolean): Promise<SessionLoadResponse> {
  const pool = getDbPool();
  const client = await pool.connect();
  
  try {
    // Buscar documento de sessão (incluindo partes se houver split)
    const query = `
      SELECT 
        dados->>'conteudo' as conteudo,
        dados->>'tipo_documento' as tipo_documento,
        dados->>'session_origem' as session_origem,
        timestamp,
        session_id,
        id_caso
      FROM registros
      WHERE tipo_registro = 'registro_misc'
      AND dados->>'tipo_documento' = 'session_compilation'
      AND (session_id = $1 OR session_id LIKE $1 || '_part%')
      ORDER BY session_id ASC, timestamp DESC
    `;
    
    const result = await client.query(query, [sessionId]);
    
    if (result.rows.length === 0) {
      const sessoesDisponiveis = await listarSessoesDisponiveis();
      
      return {
        load_type: 'session_specific',
        session_id: sessionId,
        document_found: false,
        available_sessions: sessoesDisponiveis,
        metadata: {
          load_timestamp: '',
          processing_time_ms: 0
        }
      };
    }

    // Combinar partes se houver múltiplos documentos
    let conteudoCombinado = '';
    if (result.rows.length > 1) {
      // Documentos divididos - combinar em ordem
      conteudoCombinado = result.rows
        .map(row => row.conteudo)
        .join('\n\n---\n\n');
    } else {
      conteudoCombinado = result.rows[0].conteudo;
    }

    const documento = result.rows[0];
    const sizeKb = Buffer.byteLength(conteudoCombinado, 'utf8') / 1024;

    let metadata: any = {
      tipo_documento: documento.tipo_documento,
      session_origem: documento.session_origem,
      timestamp: documento.timestamp,
      size_kb: Math.round(sizeKb * 100) / 100
    };

    if (incluirMetadata) {
      // Extrair metadados adicionais do conteúdo
      const metadataAdicional = extrairMetadataSessao(conteudoCombinado);
      metadata = { ...metadata, ...metadataAdicional };
    }

    return {
      load_type: 'session_specific',
      session_id: sessionId,
      document_found: true,
      content: {
        markdown: conteudoCombinado,
        metadata: metadata
      },
      metadata: {
        load_timestamp: '',
        processing_time_ms: 0
      }
    };
    
  } finally {
    client.release();
  }
}

// Carregar última sessão disponível
async function carregarUltimaSessao(incluirMetadata: boolean): Promise<SessionLoadResponse> {
  const pool = getDbPool();
  const client = await pool.connect();
  
  try {
    // Buscar última sessão compilada
    const query = `
      SELECT DISTINCT
        session_id,
        dados->>'session_origem' as session_origem
      FROM registros
      WHERE tipo_registro = 'registro_misc'
      AND dados->>'tipo_documento' = 'session_compilation'
      AND session_id NOT LIKE '%_part%'
      ORDER BY session_id DESC
      LIMIT 1
    `;
    
    const result = await client.query(query);
    
    if (result.rows.length === 0) {
      const sessoesDisponiveis = await listarSessoesDisponiveis();
      
      return {
        load_type: 'latest_session',
        document_found: false,
        available_sessions: sessoesDisponiveis,
        metadata: {
          load_timestamp: '',
          processing_time_ms: 0
        }
      };
    }

    const ultimaSessionId = result.rows[0].session_origem || result.rows[0].session_id;
    
    // Carregar documento da última sessão
    return await carregarDocumentoSessao(ultimaSessionId, incluirMetadata);
    
  } finally {
    client.release();
  }
}

// Listar sessões disponíveis
async function listarSessoesDisponiveis(): Promise<string[]> {
  const pool = getDbPool();
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT DISTINCT
        COALESCE(dados->>'session_origem', session_id) as session_id
      FROM registros
      WHERE tipo_registro = 'registro_misc'
      AND dados->>'tipo_documento' = 'session_compilation'
      ORDER BY session_id DESC
      LIMIT 20
    `;
    
    const result = await client.query(query);
    return result.rows.map(row => row.session_id);
    
  } finally {
    client.release();
  }
}

// Extrair metadados do documento consolidado
function extrairMetadataConsolidado(conteudo: string): any {
  const linhas = conteudo.split('\n');
  const metadata: any = {};
  
  // Extrair informações do cabeçalho
  let casosIncluidos = [];
  let totalSessoes = 0;
  
  // Contar sessões (## dia)
  const sessoesMatches = conteudo.match(/## dia\d+[a-z]?/g);
  if (sessoesMatches) {
    totalSessoes = sessoesMatches.length;
    metadata.sessoes_incluidas = sessoesMatches.map(m => m.replace('## ', ''));
  }
  
  // Extrair casos mencionados
  const casosMatches = conteudo.match(/## [A-Z][^#\n]+/g);
  if (casosMatches) {
    casosIncluidos = casosMatches
      .map(m => m.replace('## ', '').trim())
      .filter(caso => !caso.startsWith('dia') && caso !== 'Atualização Mais Recente');
  }
  
  metadata.casos_incluidos = [...new Set(casosIncluidos)];
  metadata.total_sessoes = totalSessoes;
  
  return metadata;
}

// Extrair metadados do documento de sessão
function extrairMetadataSessao(conteudo: string): any {
  const linhas = conteudo.split('\n');
  const metadata: any = {};
  
  // Extrair informações do cabeçalho
  for (const linha of linhas.slice(0, 10)) {
    if (linha.includes('Registros Processados:')) {
      const match = linha.match(/(\d+)/);
      if (match) metadata.registros_total = parseInt(match[1]);
    }
    
    if (linha.includes('Casos Incluídos:')) {
      const match = linha.match(/(\d+)/);
      if (match) metadata.casos_total = parseInt(match[1]);
    }
  }
  
  // Extrair nomes dos casos
  const casosMatches = conteudo.match(/## [A-Z][^#\n]+/g);
  if (casosMatches) {
    metadata.casos_incluidos = casosMatches
      .map(m => m.replace('## ', '').trim())
      .filter(caso => !caso.startsWith('Compilado') && !caso.startsWith('Atualização'));
  }
  
  return metadata;
}

// Função auxiliar para formatar resposta de erro
function formatarErroResponse(message: string, availableSessions?: string[]): any {
  return {
    load_type: 'error',
    document_found: false,
    erro: message,
    available_sessions: availableSessions,
    metadata: {
      load_timestamp: new Date().toISOString(),
      processing_time_ms: 0
    }
  };
}