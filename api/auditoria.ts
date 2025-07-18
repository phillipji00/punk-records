import { NextApiRequest, NextApiResponse } from 'next';
import { getDbPool, initializeDatabase, getCasoStatus } from '../lib/dbClient';

interface ProblemaDetectado {
  tipo: 'critico' | 'aviso' | 'info';
  descricao: string;
  recomendacao?: string;
}

interface ResumoAuditoria {
  registros_total: number;
  hipoteses: number;
  evidencias: number;
  timeline: number;
  perfis: number;
  outros: number;
  conclusao: boolean;
  validacao_cruzada: boolean;
  autores_unicos: number;
  especialistas_unicos: number;
  cobertura_probabilidade: number;
}

interface Registro {
  id_registro: string;
  tipo_registro: string;
  autor: string;
  dados: any;
  timestamp: string;
  probabilidade?: number;
  especialista?: string;
  etapa?: string;
}

interface Alias {
  alias: string;
}

// Analisa se há validação cruzada nos registros
function detectarValidacaoCruzada(registros: Registro[]): boolean {
  return registros.some(registro => {
    const dados = registro.dados || {};
    const textoCompleto = JSON.stringify(dados).toLowerCase();
    
    return textoCompleto.includes('revis') || 
           textoCompleto.includes('valid') || 
           textoCompleto.includes('cruz') ||
           textoCompleto.includes('verific') ||
           textoCompleto.includes('confirm');
  });
}

// Analisa se existe conclusão ou encerramento
function detectarConclusao(registros: Registro[]): boolean {
  return registros.some(registro => {
    const dados = registro.dados || {};
    const textoCompleto = JSON.stringify(dados).toLowerCase();
    
    return textoCompleto.includes('conclus') || 
           textoCompleto.includes('encerr') || 
           textoCompleto.includes('final') ||
           textoCompleto.includes('resolvid') ||
           registro.etapa?.toLowerCase().includes('final') ||
           registro.etapa?.toLowerCase().includes('conclus');
  });
}

// Verifica se hipóteses têm evidências correspondentes
function verificarHipotesesEvidencias(hipoteses: Registro[], evidencias: Registro[]): boolean {
  if (hipoteses.length === 0 || evidencias.length === 0) return false;
  
  return hipoteses.some(hipotese => {
    return evidencias.some(evidencia => 
      new Date(evidencia.timestamp) >= new Date(hipotese.timestamp)
    );
  });
}

// Analisa integridade dos dados
function analisarIntegridadeDados(registros: Registro[]): string[] {
  const problemas: string[] = [];
  
  registros.forEach((registro, index) => {
    const dados = registro.dados || {};
    
    switch (registro.tipo_registro) {
      case 'hipotese':
        if (!dados.hipotese || dados.hipotese.trim() === '') {
          problemas.push(`Hipótese #${index + 1} sem texto descritivo`);
        }
        break;
      case 'evidencia':
        if (!dados.descricao && !dados.evidencia) {
          problemas.push(`Evidência #${index + 1} sem descrição`);
        }
        break;
      case 'perfil_personagem':
        if (!dados.nome) {
          problemas.push(`Perfil #${index + 1} sem nome do personagem`);
        }
        break;
      case 'entrada_timeline':
        if (!dados.descricao) {
          problemas.push(`Timeline #${index + 1} sem descrição do evento`);
        }
        break;
    }
  });
  
  return problemas;
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

  let client;
  
  try {
    await initializeDatabase();
    const pool = getDbPool();
    client = await pool.connect();

    const idCaso = req.query.idCaso;

    if (!idCaso || typeof idCaso !== 'string') {
      return res.status(400).json({ 
        erro: 'Parâmetro "idCaso" é obrigatório' 
      });
    }

    const casoInfo = await getCasoStatus(idCaso);
    
    if (!casoInfo) {
      return res.status(404).json({ 
        erro: 'Caso não encontrado',
        idCaso: idCaso
      });
    }

    const queryRegistros = `
      SELECT 
        id,
        tipo_registro,
        autor,
        dados,
        timestamp,
        probabilidade,
        especialista,
        etapa
      FROM registros
      WHERE id_caso = $1
      ORDER BY timestamp ASC
    `;

    const resultRegistros = await client.query(queryRegistros, [casoInfo.id_caso]);
    const registros: Registro[] = resultRegistros.rows;

    const queryAliases = `
      SELECT alias 
      FROM caso_aliases 
      WHERE id_caso = $1
    `;
    const resultAliases = await client.query(queryAliases, [casoInfo.id_caso]);
    const aliases = resultAliases.rows.map((row: Alias) => row.alias);

    // Separar registros por tipo
    const hipoteses = registros.filter((r: Registro) => r.tipo_registro === 'hipotese');
    const evidencias = registros.filter((r: Registro) => r.tipo_registro === 'evidencia');
    const timeline = registros.filter((r: Registro) => r.tipo_registro === 'entrada_timeline');
    const perfis = registros.filter((r: Registro) => r.tipo_registro === 'perfil_personagem');
    const outros = registros.filter((r: Registro) => r.tipo_registro === 'registro_misc');

    // Análises
    const autoresUnicos = new Set(registros.map((r: Registro) => r.autor));
    const especialistasUnicos = new Set(registros.filter((r: Registro) => r.especialista).map((r: Registro) => r.especialista));
    const registrosComProbabilidade = registros.filter((r: Registro) => r.probabilidade !== null && r.probabilidade !== undefined);
    
    const temValidacaoCruzada = detectarValidacaoCruzada(registros);
    const temConclusao = detectarConclusao(registros);
    const hipotesesComEvidencias = verificarHipotesesEvidencias(hipoteses, evidencias);
    const problemasIntegridade = analisarIntegridadeDados(registros);

    const problemas: ProblemaDetectado[] = [];

    // Análise crítica
    if (hipoteses.length === 0) {
      problemas.push({
        tipo: 'critico',
        descricao: 'Caso sem nenhuma hipótese registrada',
        recomendacao: 'Ative o protocolo de análise inicial com L Lawliet'
      });
    }

    if (evidencias.length === 0) {
      problemas.push({
        tipo: 'critico',
        descricao: 'Caso sem nenhuma evidência documentada',
        recomendacao: 'Solicite análise forense com Senku Ishigami'
      });
    }

    if (hipoteses.length > 0 && evidencias.length > 0 && !hipotesesComEvidencias) {
      problemas.push({
        tipo: 'critico',
        descricao: 'Hipóteses não possuem evidências correspondentes',
        recomendacao: 'Revise a correlação entre hipóteses e evidências'
      });
    }

    // Análise de avisos
    if (timeline.length < 3) {
      problemas.push({
        tipo: 'aviso',
        descricao: `Timeline incompleta (apenas ${timeline.length} entradas)`,
        recomendacao: 'Adicione mais eventos à linha temporal para melhor contexto'
      });
    }

    if (autoresUnicos.size === 1) {
      problemas.push({
        tipo: 'aviso',
        descricao: 'Apenas um autor em todo o caso - falta diversidade de perspectivas',
        recomendacao: 'Solicite análise de outros especialistas'
      });
    }

    if (!temValidacaoCruzada) {
      problemas.push({
        tipo: 'aviso',
        descricao: 'Nenhum registro indica validação cruzada entre especialistas',
        recomendacao: 'Ative o protocolo de validação com validation-engine'
      });
    }

    if (!temConclusao) {
      problemas.push({
        tipo: 'aviso',
        descricao: 'Caso sem registro de conclusão ou encerramento',
        recomendacao: 'Considere finalizar formalmente a investigação'
      });
    }

    // Análise informativa
    const coberturaProbabilidade = registros.length > 0 
      ? (registrosComProbabilidade.length / registros.length) * 100 
      : 0;
      
    if (coberturaProbabilidade < 50) {
      problemas.push({
        tipo: 'info',
        descricao: `Apenas ${coberturaProbabilidade.toFixed(0)}% dos registros têm probabilidade definida`,
        recomendacao: 'Considere atribuir níveis de confiança aos registros'
      });
    }

    if (perfis.length === 0) {
      problemas.push({
        tipo: 'info',
        descricao: 'Nenhum perfil de personagem documentado',
        recomendacao: 'Norman pode ajudar com análise comportamental'
      });
    }

    problemasIntegridade.forEach(problema => {
      problemas.push({
        tipo: 'aviso',
        descricao: problema
      });
    });

    const problemaCritico = problemas.some(p => p.tipo === 'critico');
    const status = problemaCritico ? 'critico' : 
                   problemas.length > 3 ? 'incompleto' : 
                   problemas.length > 0 ? 'parcial' : 'completo';

    const resumo: ResumoAuditoria = {
      registros_total: registros.length,
      hipoteses: hipoteses.length,
      evidencias: evidencias.length,
      timeline: timeline.length,
      perfis: perfis.length,
      outros: outros.length,
      conclusao: temConclusao,
      validacao_cruzada: temValidacaoCruzada,
      autores_unicos: autoresUnicos.size,
      especialistas_unicos: especialistasUnicos.size,
      cobertura_probabilidade: parseFloat(coberturaProbabilidade.toFixed(2))
    };

    return res.status(200).json({
      id_caso: casoInfo.id_caso,
      status: status,
      caso_promovido: true,
      aliases: aliases,
      problemas_detectados: problemas.map(p => p.descricao),
      problemas_detalhados: problemas,
      resumo: resumo,
      caso_info: {
        etapa_atual: casoInfo.etapa,
        especialista_responsavel: casoInfo.especialista,
        probabilidade_geral: casoInfo.probabilidade
      }
    });

  } catch (error) {
    console.error('Erro na auditoria:', error);
    
    if (error instanceof Error && error.message.includes('timeout')) {
      return res.status(503).json({ 
        erro: 'Serviço temporariamente indisponível',
        detalhes: 'Timeout ao conectar com o banco de dados. Tente novamente em alguns instantes.'
      });
    }
    
    return res.status(500).json({ 
      erro: 'Erro interno ao processar auditoria',
      detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}