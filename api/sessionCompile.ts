import { NextApiRequest, NextApiResponse } from 'next';
import { getDbPool, initializeDatabase, getRegistrosPorSession, insertRegistro, generateSessionId } from '../lib/dbClient';
import { IntelligentMarkdownMerger } from './markdownMerger';


interface SessionCompileRequest {
  session_id?: string;
  criar_consolidado?: boolean;
  max_size_kb?: number;
}

interface CompilationResult {
  session_id: string;
  compilation_status: 'completed' | 'split_required' | 'failed';
  documents_created: {
    session_document: {
      id_registro: string;
      size_kb: number;
      parts?: number;
    };
    consolidated_document?: {
      id_registro: string;
      size_kb: number;
      total_sessions: number;
    };
  };
  registros_processados: number;
  metadata: {
    compilation_timestamp: string;
    processing_time_ms: number;
    cases_included: string[];
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      erro: 'Método não permitido. Use POST.' 
    });
  }

  const startTime = Date.now();
  let client;

  try {
    await initializeDatabase();
    const pool = getDbPool();
    client = await pool.connect();

    const { 
      session_id, 
      criar_consolidado = true,
      max_size_kb = 100
    }: SessionCompileRequest = req.body;

    // Gerar session_id se não fornecido (baseado no dia atual)
    const finalSessionId = session_id || generateDailySessionId();

    // Buscar todos os registros da sessão
    const registros = await getRegistrosPorSession(finalSessionId);

    if (registros.length === 0) {
      return res.status(404).json({
        erro: 'Nenhum registro encontrado para esta sessão',
        session_id: finalSessionId
      });
    }

    // Buscar documento de sessão anterior (se existir)
    const sessionDocAnterior = await buscarDocumentoSessao(finalSessionId);

    // Compilar markdown da sessão
    const markdownSessao = await compilarMarkdownSessao(registros, sessionDocAnterior);

    // Verificar tamanho e dividir se necessário
    const sessionDocuments = await processarDocumentoSessao(
      markdownSessao, 
      finalSessionId, 
      max_size_kb
    );

    // Buscar e atualizar documento consolidado
    let consolidatedDoc = null;
    if (criar_consolidado) {
      consolidatedDoc = await processarDocumentoConsolidado(
        markdownSessao, 
        finalSessionId, 
        max_size_kb
      );
    }

    // Coletar casos únicos processados
    const casosIncluidos = [...new Set(registros.map(r => r.id_caso))];

    const resultado: CompilationResult = {
      session_id: finalSessionId,
      compilation_status: sessionDocuments.length > 1 ? 'split_required' : 'completed',
      documents_created: {
        session_document: {
          id_registro: sessionDocuments[0].id_registro,
          size_kb: sessionDocuments[0].size_kb,
          parts: sessionDocuments.length > 1 ? sessionDocuments.length : undefined
        },
        consolidated_document: consolidatedDoc ? {
          id_registro: consolidatedDoc.id_registro,
          size_kb: consolidatedDoc.size_kb,
          total_sessions: consolidatedDoc.total_sessions
        } : undefined
      },
      registros_processados: registros.length,
      metadata: {
        compilation_timestamp: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
        cases_included: casosIncluidos
      }
    };

    return res.status(200).json(resultado);

  } catch (error) {
    console.error('Erro na compilação de sessão:', error);
    
    return res.status(500).json({
      erro: 'Erro interno ao compilar sessão',
      detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
      processing_time_ms: Date.now() - startTime
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Gerar session_id baseado no dia atual
function generateDailySessionId(): string {
  const hoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const dayNumber = new Date().getDate().toString().padStart(2, '0');
  return `dia${dayNumber}`;
}

// Buscar documento de sessão anterior
async function buscarDocumentoSessao(sessionId: string) {
  const pool = getDbPool();
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT dados->>'conteudo' as conteudo
      FROM registros
      WHERE tipo_registro = 'registro_misc'
      AND session_id = $1
      AND dados->>'tipo_documento' = 'session_compilation'
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    
    const result = await client.query(query, [sessionId]);
    return result.rows[0]?.conteudo || null;
  } finally {
    client.release();
  }
}

// Compilar markdown da sessão
async function compilarMarkdownSessao(registros: any[], documentoAnterior?: string): Promise<string> {
  const casosAgrupados = agruparRegistrosPorCaso(registros);
  const sessionId = registros[0]?.session_id || 'desconhecida';
  
  let markdown = `# Compilado de Investigações - ${sessionId}\n\n`;
  markdown += `**Data de Compilação:** ${new Date().toLocaleDateString('pt-BR')}\n`;
  markdown += `**Registros Processados:** ${registros.length}\n`;
  markdown += `**Casos Incluídos:** ${Object.keys(casosAgrupados).length}\n\n`;

  markdown += `---\n\n`;

  // Processar cada caso
  for (const [idCaso, registrosCaso] of Object.entries(casosAgrupados)) {
    markdown += `## ${formatarNomeCaso(idCaso)}\n\n`;
    
    const hipoteses = registrosCaso.filter(r => r.tipo_registro === 'hipotese');
    const evidencias = registrosCaso.filter(r => r.tipo_registro === 'evidencia');
    const personagens = registrosCaso.filter(r => r.tipo_registro === 'perfil_personagem');
    const timeline = registrosCaso.filter(r => r.tipo_registro === 'entrada_timeline');
    const outros = registrosCaso.filter(r => r.tipo_registro === 'registro_misc');

    if (hipoteses.length > 0) {
      markdown += `### Hipóteses Investigativas\n\n`;
      hipoteses.forEach((h, i) => {
        const dados = h.dados;
        markdown += `**${i + 1}.** ${dados.hipotese}\n`;
        if (dados.justificativa) {
          markdown += `*Justificativa:* ${dados.justificativa}\n`;
        }
        if (dados.nivel_confianca) {
          markdown += `*Confiança:* ${(dados.nivel_confianca * 100).toFixed(0)}%\n`;
        }
        if (dados.acoes_recomendadas?.length > 0) {
          markdown += `*Ações:* ${dados.acoes_recomendadas.join(', ')}\n`;
        }
        markdown += `*Especialista:* ${h.especialista} | *Data:* ${new Date(h.timestamp).toLocaleDateString('pt-BR')}\n\n`;
      });
    }

    if (evidencias.length > 0) {
      markdown += `### Evidências Coletadas\n\n`;
      evidencias.forEach((e, i) => {
        const dados = e.dados;
        markdown += `**${i + 1}.** ${dados.descricao}\n`;
        if (dados.origem) {
          markdown += `*Origem:* ${dados.origem}\n`;
        }
        if (dados.confiabilidade) {
          markdown += `*Confiabilidade:* ${(dados.confiabilidade * 100).toFixed(0)}%\n`;
        }
        markdown += `*Especialista:* ${e.especialista} | *Data:* ${new Date(e.timestamp).toLocaleDateString('pt-BR')}\n\n`;
      });
    }

    if (personagens.length > 0) {
      markdown += `### Perfis de Personagens\n\n`;
      personagens.forEach((p, i) => {
        const dados = p.dados;
        markdown += `**${dados.nome}**\n`;
        if (dados.motivacoes) {
          markdown += `*Motivações:* ${dados.motivacoes}\n`;
        }
        if (dados.riscos?.length > 0) {
          markdown += `*Riscos:* ${dados.riscos.join(', ')}\n`;
        }
        markdown += `*Análise:* ${p.especialista} | *Data:* ${new Date(p.timestamp).toLocaleDateString('pt-BR')}\n\n`;
      });
    }

    if (timeline.length > 0) {
      markdown += `### Linha do Tempo\n\n`;
      timeline
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .forEach((t, i) => {
          const dados = t.dados;
          markdown += `**${dados.horario || 'Horário indefinido'}** - ${dados.descricao}\n`;
          markdown += `*Registrado por:* ${t.especialista} em ${new Date(t.timestamp).toLocaleDateString('pt-BR')}\n\n`;
        });
    }

    if (outros.length > 0) {
      markdown += `### Registros Diversos\n\n`;
      outros.forEach((o, i) => {
        const dados = o.dados;
        if (dados.conteudo && !dados.conteudo.includes('TIPO_DOCUMENTO: session_compilation')) {
          markdown += `**Registro ${i + 1}**\n`;
          markdown += `${dados.conteudo.substring(0, 200)}${dados.conteudo.length > 200 ? '...' : ''}\n`;
          markdown += `*Por:* ${o.especialista} | *Data:* ${new Date(o.timestamp).toLocaleDateString('pt-BR')}\n\n`;
        }
      });
    }

    markdown += `---\n\n`;
  }

  // Merge com documento anterior se existir
if (documentoAnterior) {
  const mergeResult = IntelligentMarkdownMerger.mergeDocuments(
    documentoAnterior, 
    markdown
  );
  
  // Log das mudanças (opcional)
  console.log('Merge Statistics:', mergeResult.statistics);
  console.log('Changes:', mergeResult.changeLog);
  
  return mergeResult.mergedMarkdown;
}

return markdown;
}

// Processar documento de sessão (com split se necessário)
async function processarDocumentoSessao(
  markdown: string, 
  sessionId: string, 
  maxSizeKb: number
): Promise<Array<{id_registro: string; size_kb: number}>> {
  const sizeKb = Buffer.byteLength(markdown, 'utf8') / 1024;
  
  if (sizeKb <= maxSizeKb) {
    // Documento único
    const idRegistro = await salvarDocumentoSessao(markdown, sessionId);
    return [{ id_registro: idRegistro, size_kb: Math.round(sizeKb * 100) / 100 }];
  } else {
    // Split necessário
    const parts = Math.ceil(sizeKb / maxSizeKb);
    const chunks = splitMarkdownInteligente(markdown, parts);
    const documents = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const partSessionId = `${sessionId}_part${i + 1}`;
      const idRegistro = await salvarDocumentoSessao(chunks[i], partSessionId);
      const partSize = Buffer.byteLength(chunks[i], 'utf8') / 1024;
      documents.push({ id_registro: idRegistro, size_kb: Math.round(partSize * 100) / 100 });
    }
    
    return documents;
  }
}

// Processar documento consolidado
async function processarDocumentoConsolidado(
  markdownSessao: string, 
  sessionId: string, 
  maxSizeKb: number
): Promise<{id_registro: string; size_kb: number; total_sessions: number} | null> {
  // Buscar consolidado anterior
  const consolidadoAnterior = await buscarDocumentoConsolidado();
  
  // Extrair resumo da sessão atual
  const resumoSessao = extrairResumoSessao(markdownSessao, sessionId);
  
  // Construir novo consolidado
  let novoConsolidado = '';
  
  if (consolidadoAnterior) {
    novoConsolidado = mergeConsolidado(consolidadoAnterior, resumoSessao);
  } else {
    novoConsolidado = criarPrimeiroConsolidado(resumoSessao);
  }
  
  // Verificar tamanho e compactar se necessário
  const sizeKb = Buffer.byteLength(novoConsolidado, 'utf8') / 1024;
  if (sizeKb > maxSizeKb) {
    novoConsolidado = compactarConsolidado(novoConsolidado, maxSizeKb);
  }
  
  // Salvar novo consolidado
  const idRegistro = await salvarDocumentoConsolidado(novoConsolidado);
  const finalSizeKb = Buffer.byteLength(novoConsolidado, 'utf8') / 1024;
  
  // Contar sessões no consolidado
  const totalSessions = contarSessoesConsolidado(novoConsolidado);
  
  return {
    id_registro: idRegistro,
    size_kb: Math.round(finalSizeKb * 100) / 100,
    total_sessions: totalSessions
  };
}

// Salvar documento de sessão
async function salvarDocumentoSessao(markdown: string, sessionId: string): Promise<string> {
  return await insertRegistro({
    tipo_registro: 'registro_misc',
    autor: 'Sistema Syndicate',
    dados: {
      conteudo: markdown,
      tipo_documento: 'session_compilation',
      session_origem: sessionId
    },
    id_caso: `session_${sessionId}`,
    etapa: 'archival',
    especialista: 'Sistema',
    session_id: sessionId,
    probabilidade: 1.0
  });
}

// Funções auxiliares
function agruparRegistrosPorCaso(registros: any[]) {
  return registros.reduce((acc, registro) => {
    if (!acc[registro.id_caso]) {
      acc[registro.id_caso] = [];
    }
    acc[registro.id_caso].push(registro);
    return acc;
  }, {});
}

function formatarNomeCaso(idCaso: string): string {
  return idCaso
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}



function splitMarkdownInteligente(markdown: string, parts: number): string[] {
  const linhas = markdown.split('\n');
  const chunkSize = Math.ceil(linhas.length / parts);
  const chunks = [];
  
  for (let i = 0; i < parts; i++) {
    const start = i * chunkSize;
    const end = Math.min((i + 1) * chunkSize, linhas.length);
    const chunk = linhas.slice(start, end).join('\n');
    
    // Adicionar cabeçalho em cada parte
    const header = `# Compilado de Investigações - Parte ${i + 1}/${parts}\n\n`;
    chunks.push(header + chunk);
  }
  
  return chunks;
}

// Funções para documento consolidado
async function buscarDocumentoConsolidado(): Promise<string | null> {
  const pool = getDbPool();
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT dados->>'conteudo' as conteudo
      FROM registros
      WHERE tipo_registro = 'registro_misc'
      AND dados->>'tipo_documento' = 'master_consolidation'
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    
    const result = await client.query(query);
    return result.rows[0]?.conteudo || null;
  } finally {
    client.release();
  }
}

function extrairResumoSessao(markdown: string, sessionId: string): string {
  const linhas = markdown.split('\n');
  const resumo = linhas.slice(0, 20).join('\n'); // Primeiras 20 linhas como resumo
  return `## ${sessionId}\n${resumo}\n\n---\n`;
}

function mergeConsolidado(anterior: string, resumoNovo: string): string {
  return anterior + '\n' + resumoNovo;
}

function criarPrimeiroConsolidado(resumoSessao: string): string {
  const header = `# Consolidado Geral de Investigações\n\n**Início:** ${new Date().toLocaleDateString('pt-BR')}\n\n---\n\n`;
  return header + resumoSessao;
}

function compactarConsolidado(consolidado: string, maxSizeKb: number): string {
  // Implementação simples - manter apenas últimas sessões
  const sessoes = consolidado.split('## dia');
  const maxSessoes = Math.floor(maxSizeKb / 10); // Aproximadamente 10KB por sessão
  
  if (sessoes.length > maxSessoes) {
    const header = sessoes[0];
    const sessoesRecentes = sessoes.slice(-maxSessoes);
    return header + '## dia' + sessoesRecentes.join('## dia');
  }
  
  return consolidado;
}

async function salvarDocumentoConsolidado(markdown: string): Promise<string> {
  return await insertRegistro({
    tipo_registro: 'registro_misc',
    autor: 'Sistema Syndicate',
    dados: {
      conteudo: markdown,
      tipo_documento: 'master_consolidation'
    },
    id_caso: 'consolidado_geral',
    etapa: 'archival',
    especialista: 'Sistema',
    session_id: 'consolidado',
    probabilidade: 1.0
  });
}

function contarSessoesConsolidado(consolidado: string): number {
  const matches = consolidado.match(/## dia\d+/g);
  return matches ? matches.length : 1;
}