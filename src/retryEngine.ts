/**
 * @fileoverview Módulo de Recuperação Inteligente e Reavaliação de Pipeline
 * @module retryEngine
 * @version 4.0.0
 * 
 * Implementa a lógica de recuperação inteligente conforme protocolo retry_protocols.md
 * Monitora falhas em etapas do pipeline e aplica protocolos de retry apropriados
 */

import { 
  RuntimeExecutionContext,
  ESPECIALISTAS,
  ETAPAS_PIPELINE,
  CONFIDENCE_THRESHOLDS,
  isValidProbabilidade
} from 'lib/types/common';

/**
 * Interface de entrada para avaliação de retry
 */
export interface RetryInput {
  /** Etapa atual onde ocorreu a falha */
  etapaAtual: string;
  
  /** Tipo de erro identificado */
  tipoErro: string;
  
  /** Especialista afetado (opcional) */
  especialista?: string;
  
  /** Número da tentativa atual (1-based) */
  tentativaAtual: number;
  
  /** Confiança atual da análise (0-100) */
  confiancaAtual?: number;
  
  /** Contexto adicional do erro */
  contextoErro?: Record<string, any>;
  
  /** Contador global de tentativas */
  tentativasGlobais?: number;
}

/**
 * Interface de resposta da avaliação de retry
 */
export interface RetryResponse {
  /** Ação recomendada */
  acao: 'repetir' | 'pular' | 'ajustar' | 'reiniciar' | 'escalar' | 'concluir_gracioso';
  
  /** Próxima etapa (se diferente da atual) */
  proximaEtapa?: string;
  
  /** Justificativa da decisão */
  justificativa: string;
  
  /** Tempo de espera antes da próxima tentativa (ms) */
  cooldownMs?: number;
  
  /** Estratégia de recuperação específica */
  estrategiaRecuperacao?: string;
  
  /** Modificações sugeridas para a próxima tentativa */
  modificacoes?: {
    /** Ajustes de confiança */
    ajusteConfianca?: number;
    
    /** Especialistas alternativos */
    especialistasAlternativos?: string[];
    
    /** Simplificações do processo */
    simplificacoes?: string[];
  };
}

/**
 * Categorias de falha e suas estratégias de recuperação
 */
const CATEGORIAS_FALHA = {
  // Falhas de contexto insuficiente
  INSUFFICIENT_CONTEXT: {
    sintomas: ['confidence_low', 'missing_information', 'incomplete_analysis'],
    estrategia: 'qa_refinement_activation',
    maxTentativas: 2
  },
  
  // Inconsistências lógicas
  LOGICAL_INCONSISTENCY: {
    sintomas: ['contradiction', 'circular_reasoning', 'logic_break'],
    estrategia: 'logic_reconstruction',
    maxTentativas: 2
  },
  
  // Conflitos entre especialistas
  CROSS_SPECIALIST_CONFLICT: {
    sintomas: ['specialist_disagreement', 'conflicting_conclusions', 'no_consensus'],
    estrategia: 'structured_mediation',
    maxTentativas: 3
  },
  
  // Falta de expertise
  EXPERTISE_GAP: {
    sintomas: ['outside_expertise', 'technical_limitation', 'domain_gap'],
    estrategia: 'expertise_workaround',
    maxTentativas: 1
  },
  
  // Exaustão de recursos
  RESOURCE_EXHAUSTION: {
    sintomas: ['timeout', 'diminishing_returns', 'user_impatience'],
    estrategia: 'graceful_conclusion',
    maxTentativas: 1
  },
  
  // Falhas de integração
  SYSTEM_INTEGRATION: {
    sintomas: ['module_failure', 'pipeline_error', 'integration_issue'],
    estrategia: 'methodology_fallback',
    maxTentativas: 2
  },
  
  // Timeout de análise
  TIMEOUT_ANALISE: {
    sintomas: ['timeout_analise', 'processing_timeout', 'response_timeout'],
    estrategia: 'adjust_and_retry',
    maxTentativas: 3
  }
} as const;

/**
 * Mapeamento de tipos de erro para categorias
 */
const ERRO_PARA_CATEGORIA: Record<string, keyof typeof CATEGORIAS_FALHA> = {
  // Erros de confiança
  'low_confidence': 'INSUFFICIENT_CONTEXT',
  'missing_context': 'INSUFFICIENT_CONTEXT',
  'incomplete_data': 'INSUFFICIENT_CONTEXT',
  
  // Erros lógicos
  'contradiction_detected': 'LOGICAL_INCONSISTENCY',
  'logic_error': 'LOGICAL_INCONSISTENCY',
  'invalid_reasoning': 'LOGICAL_INCONSISTENCY',
  
  // Conflitos
  'specialist_conflict': 'CROSS_SPECIALIST_CONFLICT',
  'no_consensus': 'CROSS_SPECIALIST_CONFLICT',
  'validation_conflict': 'CROSS_SPECIALIST_CONFLICT',
  
  // Expertise
  'outside_domain': 'EXPERTISE_GAP',
  'no_specialist': 'EXPERTISE_GAP',
  'technical_gap': 'EXPERTISE_GAP',
  
  // Timeouts
  'timeout_analise': 'TIMEOUT_ANALISE',
  'processing_timeout': 'TIMEOUT_ANALISE',
  'response_timeout': 'TIMEOUT_ANALISE',
  
  // Sistema
  'module_error': 'SYSTEM_INTEGRATION',
  'pipeline_failure': 'SYSTEM_INTEGRATION',
  'integration_error': 'SYSTEM_INTEGRATION',
  
  // Exaustão
  'max_attempts': 'RESOURCE_EXHAUSTION',
  'user_cancel': 'RESOURCE_EXHAUSTION',
  'diminishing_returns': 'RESOURCE_EXHAUSTION'
};

/**
 * Cooldowns base por tipo de erro (ms)
 */
const COOLDOWN_BASE: Record<string, number> = {
  INSUFFICIENT_CONTEXT: 1000,
  LOGICAL_INCONSISTENCY: 1500,
  CROSS_SPECIALIST_CONFLICT: 2000,
  EXPERTISE_GAP: 500,
  RESOURCE_EXHAUSTION: 0,
  SYSTEM_INTEGRATION: 3000,
  TIMEOUT_ANALISE: 1500
};

/**
 * Limites globais do sistema
 */
const LIMITES_GLOBAIS = {
  MAX_TENTATIVAS_GLOBAL: 3,
  MAX_TENTATIVAS_POR_ESTRATEGIA: 2,
  COOLDOWN_MULTIPLICADOR: 1.5,
  CONFIANCA_MINIMA_ACEITAVEL: 40
};

/**
 * Função principal de avaliação de retry
 */
export function avaliarRetry(input: RetryInput): RetryResponse {
  // Validação de entrada
  if (!input.etapaAtual || !input.tipoErro || input.tentativaAtual < 1) {
    throw new Error('Input inválido para avaliação de retry');
  }
  
  // Verificar limite global primeiro
  const tentativasGlobais = input.tentativasGlobais || input.tentativaAtual;
  if (tentativasGlobais >= LIMITES_GLOBAIS.MAX_TENTATIVAS_GLOBAL) {
    return criarRespostaConclusaoGraciosa(
      'Limite global de tentativas atingido. Consolidando resultados disponíveis.'
    );
  }
  
  // Identificar categoria do erro
  const categoria = identificarCategoria(input.tipoErro);
  if (!categoria) {
    return criarRespostaEscalacao(
      `Tipo de erro '${input.tipoErro}' não reconhecido. Escalando para coordenação manual.`
    );
  }
  
  // Verificar limite por estratégia
  const config = CATEGORIAS_FALHA[categoria];
  if (input.tentativaAtual > config.maxTentativas) {
    return escalarParaProximaEstrategia(input, categoria);
  }
  
  // Aplicar estratégia de recuperação apropriada
  return aplicarEstrategiaRecuperacao(input, categoria);
}

/**
 * Identifica a categoria de falha baseada no tipo de erro
 */
function identificarCategoria(tipoErro: string): keyof typeof CATEGORIAS_FALHA | null {
  // Busca direta no mapeamento
  if (tipoErro in ERRO_PARA_CATEGORIA) {
    return ERRO_PARA_CATEGORIA[tipoErro];
  }
  
  // Busca por sintomas parciais
  for (const [categoria, config] of Object.entries(CATEGORIAS_FALHA)) {
    if (config.sintomas.some(sintoma => tipoErro.includes(sintoma))) {
      return categoria as keyof typeof CATEGORIAS_FALHA;
    }
  }
  
  return null;
}

/**
 * Aplica a estratégia de recuperação apropriada
 */
function aplicarEstrategiaRecuperacao(
  input: RetryInput,
  categoria: keyof typeof CATEGORIAS_FALHA
): RetryResponse {
  const config = CATEGORIAS_FALHA[categoria];
  const estrategia = config.estrategia;
  
  switch (estrategia) {
    case 'qa_refinement_activation':
      return estrategiaQARefinement(input);
      
    case 'logic_reconstruction':
      return estrategiaLogicReconstruction(input);
      
    case 'structured_mediation':
      return estrategiaStructuredMediation(input);
      
    case 'expertise_workaround':
      return estrategiaExpertiseWorkaround(input);
      
    case 'graceful_conclusion':
      return criarRespostaConclusaoGraciosa(
        'Recursos esgotados. Consolidando análise com informações disponíveis.'
      );
      
    case 'methodology_fallback':
      return estrategiaMethodologyFallback(input);
      
    case 'adjust_and_retry':
      return estrategiaAdjustAndRetry(input);
      
    default:
      return criarRespostaEscalacao(
        `Estratégia '${estrategia}' não implementada. Escalando para coordenação.`
      );
  }
}

/**
 * Estratégia: QA Refinement Activation
 */
function estrategiaQARefinement(input: RetryInput): RetryResponse {
  const cooldown = calcularCooldown('INSUFFICIENT_CONTEXT', input.tentativaAtual);
  
  return {
    acao: 'ajustar',
    proximaEtapa: input.etapaAtual,
    justificativa: 'Contexto insuficiente detectado. Ativando refinamento de Q&A para enriquecer informações.',
    cooldownMs: cooldown,
    estrategiaRecuperacao: 'qa_refinement_activation',
    modificacoes: {
      ajusteConfianca: 20,
      simplificacoes: ['perguntas_focadas', 'contexto_especifico']
    }
  };
}

/**
 * Estratégia: Logic Reconstruction
 */
function estrategiaLogicReconstruction(input: RetryInput): RetryResponse {
  const cooldown = calcularCooldown('LOGICAL_INCONSISTENCY', input.tentativaAtual);
  
  return {
    acao: 'ajustar',
    proximaEtapa: input.etapaAtual,
    justificativa: 'Inconsistência lógica detectada. Reconstruindo cadeia de raciocínio passo a passo.',
    cooldownMs: cooldown,
    estrategiaRecuperacao: 'logic_reconstruction',
    modificacoes: {
      simplificacoes: ['analise_sequencial', 'validacao_por_etapas']
    }
  };
}

/**
 * Estratégia: Structured Mediation
 */
function estrategiaStructuredMediation(input: RetryInput): RetryResponse {
  const cooldown = calcularCooldown('CROSS_SPECIALIST_CONFLICT', input.tentativaAtual);
  
  // Sugerir especialistas alternativos para mediação
  const especialistasAlternativos = determinarEspecialistasMediacao(input.especialista);
  
  return {
    acao: 'ajustar',
    proximaEtapa: ETAPAS_PIPELINE.VALIDATION,
    justificativa: 'Conflito entre especialistas. Ativando mediação estruturada para resolver divergências.',
    cooldownMs: cooldown,
    estrategiaRecuperacao: 'structured_mediation',
    modificacoes: {
      especialistasAlternativos,
      simplificacoes: ['foco_pontos_consenso', 'debate_estruturado']
    }
  };
}

/**
 * Estratégia: Expertise Workaround
 */
function estrategiaExpertiseWorkaround({ tipoErro, etapaAtual }: RetryInput): RetryResponse {
  // Para erro de domínio técnico, sugerir especialista forense
  const especialistasAlternativos = 
    tipoErro === 'technical_gap' 
      ? [ESPECIALISTAS.FORENSE, ESPECIALISTAS.ESTRATEGISTA]
      : [ESPECIALISTAS.ESTRATEGISTA, ESPECIALISTAS.FORENSE];
  
  return {
    acao: 'ajustar',
    proximaEtapa: etapaAtual,
    justificativa: 'Lacuna de expertise identificada. Aplicando abordagem colaborativa com analogias.',
    cooldownMs: 500,
    estrategiaRecuperacao: 'expertise_workaround',
    modificacoes: {
      especialistasAlternativos,
      simplificacoes: ['usar_analogias', 'aproximacao_colaborativa']
    }
  };
}

/**
 * Estratégia: Methodology Fallback
 */
function estrategiaMethodologyFallback(input: RetryInput): RetryResponse {
  const cooldown = calcularCooldown('SYSTEM_INTEGRATION', input.tentativaAtual);
  
  return {
    acao: 'reiniciar',
    proximaEtapa: ETAPAS_PIPELINE.INTAKE,
    justificativa: 'Falha de integração do sistema. Reiniciando com metodologia simplificada.',
    cooldownMs: cooldown,
    estrategiaRecuperacao: 'methodology_fallback',
    modificacoes: {
      simplificacoes: [
        'workflow_simplificado',
        'analise_sequencial',
        'validacao_basica'
      ]
    }
  };
}

/**
 * Estratégia: Adjust and Retry (para timeouts)
 */
function estrategiaAdjustAndRetry(input: RetryInput): RetryResponse {
  const cooldown = calcularCooldown('TIMEOUT_ANALISE', input.tentativaAtual);
  
  return {
    acao: 'ajustar',
    proximaEtapa: input.etapaAtual,
    justificativa: 'Timeout detectado. Ajustando parâmetros.',
    cooldownMs: cooldown,
    estrategiaRecuperacao: 'adjust_and_retry',
    modificacoes: {
      simplificacoes: [
        'analise_focada',
        'reducao_escopo',
        'timeout_estendido'
      ]
    }
  };
}

/**
 * Escala para próxima estratégia quando limite é atingido
 */
function escalarParaProximaEstrategia(
  _input: RetryInput,
  categoriaAtual: keyof typeof CATEGORIAS_FALHA
): RetryResponse {
  // Hierarquia de escalação
  const hierarquiaEscalacao: Record<string, string> = {
    'INSUFFICIENT_CONTEXT': 'EXPERTISE_GAP',
    'LOGICAL_INCONSISTENCY': 'CROSS_SPECIALIST_CONFLICT',
    'CROSS_SPECIALIST_CONFLICT': 'METHODOLOGY_FALLBACK',
    'EXPERTISE_GAP': 'GRACEFUL_CONCLUSION',
    'SYSTEM_INTEGRATION': 'GRACEFUL_CONCLUSION',
    'TIMEOUT_ANALISE': 'GRACEFUL_CONCLUSION'
  };
  
  const proximaCategoria = hierarquiaEscalacao[categoriaAtual];
  
  if (proximaCategoria === 'GRACEFUL_CONCLUSION') {
    return criarRespostaConclusaoGraciosa(
      `Estratégia '${categoriaAtual}' esgotada após múltiplas tentativas. Consolidando resultados disponíveis.`
    );
  }
  
  return {
    acao: 'escalar',
    justificativa: `Limite de tentativas para '${categoriaAtual}' atingido após múltiplas tentativas. Escalando para estratégia alternativa.`,
    estrategiaRecuperacao: proximaCategoria,
    cooldownMs: 2000
  };
}

/**
 * Cria resposta de conclusão graciosa
 */
function criarRespostaConclusaoGraciosa(justificativa: string): RetryResponse {
  return {
    acao: 'concluir_gracioso',
    justificativa,
    estrategiaRecuperacao: 'graceful_conclusion',
    cooldownMs: 0
  };
}

/**
 * Cria resposta de escalação
 */
function criarRespostaEscalacao(justificativa: string): RetryResponse {
  return {
    acao: 'escalar',
    justificativa,
    cooldownMs: 0
  };
}

/**
 * Calcula cooldown baseado na categoria e tentativa
 */
function calcularCooldown(categoria: string, tentativa: number): number {
  const base = COOLDOWN_BASE[categoria] || 1000;
  const multiplicador = Math.pow(LIMITES_GLOBAIS.COOLDOWN_MULTIPLICADOR, tentativa - 1);
  return Math.round(base * multiplicador);
}

/**
 * Determina especialistas para mediação
 */
function determinarEspecialistasMediacao(especialistaAtual?: string): string[] {
  // Sempre incluir o orquestrador para mediação
  const mediadores: string[] = [ESPECIALISTAS.ORQUESTRADOR];
  
  // Adicionar especialista complementar baseado no conflito
  if (especialistaAtual === ESPECIALISTAS.ESTRATEGISTA) {
    mediadores.push(ESPECIALISTAS.COMPORTAMENTAL);
  } else if (especialistaAtual === ESPECIALISTAS.FORENSE) {
    mediadores.push(ESPECIALISTAS.ESTRATEGISTA);
  } else if (especialistaAtual === ESPECIALISTAS.COMPORTAMENTAL) {
    mediadores.push(ESPECIALISTAS.FORENSE);
  }
  
  return mediadores;
}

/**
 * Avalia se deve forçar conclusão baseado em múltiplos fatores
 */
export function avaliarForcaConclusao(
  tentativasGlobais: number,
  confiancaAtual?: number,
  tempoDecorrido?: number
): boolean {
  // Força conclusão se:
  // 1. Tentativas globais >= limite
  if (tentativasGlobais >= LIMITES_GLOBAIS.MAX_TENTATIVAS_GLOBAL) {
    return true;
  }
  
  // 2. Confiança muito baixa após múltiplas tentativas
  if (confiancaAtual !== undefined && 
      isValidProbabilidade(confiancaAtual) &&
      confiancaAtual < CONFIDENCE_THRESHOLDS.CRITICAL_LOW && 
      tentativasGlobais >= 2) {
    return true;
  }
  
  // 3. Tempo excessivo (opcional - se fornecido)
  if (tempoDecorrido && tempoDecorrido > 300000) { // 5 minutos
    return true;
  }
  
  return false;
}

/**
 * Gera relatório de retry para logging
 */
export function gerarRelatorioRetry(
  input: RetryInput,
  resposta: RetryResponse
): string {
  const linhas = [
    `=== RETRY ENGINE REPORT ===`,
    `Etapa: ${input.etapaAtual}`,
    `Erro: ${input.tipoErro}`,
    `Tentativa: ${input.tentativaAtual}`,
    input.especialista ? `Especialista: ${input.especialista}` : '',
    input.confiancaAtual !== undefined ? `Confiança: ${input.confiancaAtual}%` : '',
    input.tentativasGlobais ? `Tentativas Globais: ${input.tentativasGlobais}` : '',
    input.contextoErro?.conflictingSpecialists ? `conflictingSpecialists: ${input.contextoErro.conflictingSpecialists.join(', ')}` : '',
    ``,
    `Decisão: ${resposta.acao.toUpperCase()}`,
    `Justificativa: ${resposta.justificativa}`,
    resposta.estrategiaRecuperacao ? `Estratégia: ${resposta.estrategiaRecuperacao}` : '',
    resposta.cooldownMs ? `Cooldown: ${resposta.cooldownMs}ms` : '',
    resposta.proximaEtapa ? `Próxima Etapa: ${resposta.proximaEtapa}` : '',
    resposta.modificacoes?.simplificacoes ? resposta.modificacoes.simplificacoes.join(', ') : '',
    `=========================`
  ].filter(Boolean);
  
  return linhas.join('\n');
}

/**
 * Integração com RuntimeExecutionContext
 * Aplica as modificações sugeridas pelo retry engine
 */
export async function aplicarModificacoesRetry(
  context: RuntimeExecutionContext,
  resposta: RetryResponse
): Promise<void> {
  // Log da decisão
  const inputLog: RetryInput = { 
    etapaAtual: context.etapa,
    tipoErro: 'retry_application',
    tentativaAtual: 1
  };
  
  context.log(gerarRelatorioRetry(inputLog, resposta));
  
  // Aplicar modificações se existirem
  if (resposta.modificacoes) {
    // Ajustar confiança
    if (resposta.modificacoes.ajusteConfianca) {
      context.modifyScore('confidence', resposta.modificacoes.ajusteConfianca);
    }
    
    // Ativar especialistas alternativos
    if (resposta.modificacoes.especialistasAlternativos) {
      for (const especialista of resposta.modificacoes.especialistasAlternativos) {
        await context.activateSpecialist(especialista);
      }
    }
    
    // Aplicar simplificações (via protocolo)
    if (resposta.modificacoes.simplificacoes?.length) {
      await context.activateProtocol('simplification_protocol');
    }
  }
  
  // Executar ação principal
  switch (resposta.acao) {
    case 'repetir':
      // Mantém na mesma etapa
      break;
      
    case 'pular':
      // Avança para próxima etapa
      const proximaEtapa = determinarProximaEtapa(context.etapa);
      if (proximaEtapa) {
        context.advancePipeline(proximaEtapa);
      }
      break;
      
    case 'ajustar':
      // Permanece na etapa com ajustes (já aplicados acima)
      break;
      
    case 'reiniciar':
      // Volta ao início
      context.advancePipeline(ETAPAS_PIPELINE.INTAKE);
      break;
      
    case 'escalar':
      // Ativa protocolo de escalação
      await context.activateProtocol('escalation_protocol');
      break;
      
    case 'concluir_gracioso':
      // Força conclusão
      context.advancePipeline(ETAPAS_PIPELINE.ASSESSMENT);
      break;
  }
  
  // Aplicar cooldown se necessário
  if (resposta.cooldownMs && resposta.cooldownMs > 0) {
    context.log(`Aplicando cooldown de ${resposta.cooldownMs}ms...`);
    await new Promise(resolve => setTimeout(resolve, resposta.cooldownMs));
  }
}

/**
 * Determina próxima etapa no pipeline
 */
function determinarProximaEtapa(etapaAtual: string): string | null {
  const sequencia = Object.values(ETAPAS_PIPELINE) as string[];
  const indiceAtual = sequencia.indexOf(etapaAtual);
  
  if (indiceAtual === -1 || indiceAtual === sequencia.length - 1) {
    return null;
  }
  
  return sequencia[indiceAtual + 1];
}

// Export de tipos auxiliares
export type TipoErro = keyof typeof ERRO_PARA_CATEGORIA;
export type CategoriaFalha = keyof typeof CATEGORIAS_FALHA;
export type AcaoRetry = RetryResponse['acao'];