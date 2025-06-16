/**
 * @fileoverview Módulo de Inteligência Central do Capitão Obi - Syndicate v3.1
 * @module obiStateManager
 * 
 * Encapsula a inteligência central do orquestrador do sistema investigativo.
 * Responsável por interpretar contextos, decidir especialistas, e gerar comandos narrativos.
 */

import { 
  RuntimeExecutionContext as ExecutionContext,
  ESPECIALISTAS,
  ETAPAS_PIPELINE,
  SPECIALIST_TO_PERSONA
} from '../lib/types/common';

/**
 * Comando gerado pelo Obi para coordenar o sistema
 */
export interface ObiCommand {
  /** Tipo de ação a ser executada */
  action: 'ativar_especialista' | 'validar_etapa' | 'escrever_contexto' | 'pausar' | 'avançar_pipeline' | 'resolver_conflito';
  
  /** Alvo da ação (especialista, etapa, etc.) */
  target?: string;
  
  /** Mensagem narrativa do Obi sobre a decisão */
  mensagemNarrativa: string;
  
  /** Prioridade do comando (1-10, sendo 10 máxima) */
  prioridade: number;
  
  /** Dados adicionais específicos do comando */
  dados?: {
    /** Especialista específico para ativar */
    especialista?: string;
    
    /** Nova etapa do pipeline */
    novaEtapa?: string;
    
    /** Contexto para validação */
    contextoValidacao?: string;
    
    /** Razão para pausar o pipeline */
    razaoPausa?: string;
    
    /** Estratégia de resolução de conflito */
    estrategiaResolucao?: string;
  };
  
  /** Timestamp de criação do comando */
  timestamp: Date;
}

/**
 * Estado interno da análise do Obi
 */
interface ObiAnalysisState {
  /** Complexidade estimada da investigação (1-10) */
  complexidadeInvestigacao: number;
  
  /** Especialistas já ativados */
  especialistasAtivos: string[];
  
  /** Confiança geral na análise atual (0-100) */
  confiancaGeral: number;
  
  /** Conflitos detectados entre análises */
  conflitosDetectados: string[];
  
  /** Gaps de informação identificados */
  gapsInformacao: string[];
  
  /** Próxima etapa recomendada */
  proximaEtapaRecomendada: string;
  
  /** Nível de urgência atual (1-5) */
  nivelUrgencia: number;
}

/**
 * Palavras-chave que triggeram especialistas específicos
 */
const TRIGGERS_ESPECIALISTAS = {
  [ESPECIALISTAS.ESTRATEGISTA]: [
    'estratégia', 'hipótese', 'análise', 'teoria', 'lógica', 'probabilidade',
    'dedução', 'padrão', 'conexão', 'investigação', 'mistério', 'caso'
  ],
  
  [ESPECIALISTAS.FORENSE]: [
    'evidência', 'documento', 'científico', 'forense', 'histórico', 'examinar',
    'material', 'prova', 'análise técnica', 'dados', 'fatos', 'verificar'
  ],
  
  [ESPECIALISTAS.COMPORTAMENTAL]: [
    'comportamento', 'psicológico', 'pessoa', 'motivação', 'perfil',
    'relacionamento', 'família', 'trauma', 'personalidade', 'emoção'
  ],
  
  [ESPECIALISTAS.ESPACIAL]: [
    'otimizar', 'estratégia', 'eficiência', 'sistema', 'campo', 'recursos',
    'posição', 'movimento', 'tático', 'configuração', 'layout'
  ]
};

/**
 * Avalia a necessidade de ativação de especialistas baseado no contexto
 */
function avaliarNecessidadeEspecialistas(contexto: string): string[] {
  const especialistasNecessarios: string[] = [];
  const contextoLower = contexto.toLowerCase();
  
  // Verifica cada especialista
  for (const [especialista, keywords] of Object.entries(TRIGGERS_ESPECIALISTAS)) {
    const matches = keywords.filter(keyword => 
      contextoLower.includes(keyword.toLowerCase())
    );
    
    if (matches.length > 0) {
      especialistasNecessarios.push(especialista);
    }
  }
  
  // L é sempre consultado para casos complexos
  if (especialistasNecessarios.length > 1 || contextoLower.includes('complexo')) {
    if (!especialistasNecessarios.includes(ESPECIALISTAS.ESTRATEGISTA)) {
      especialistasNecessarios.unshift(ESPECIALISTAS.ESTRATEGISTA);
    }
  }
  
  return especialistasNecessarios;
}

/**
 * Determina a complexidade da investigação baseada no contexto
 */
function avaliarComplexidade(context: ExecutionContext): number {
  let complexidade = 1;
  
  // Fatores que aumentam complexidade
  const fatoresComplexidade = [
    { condicao: context.contexto.length > 500, peso: 2 },
    { condicao: context.contexto.toLowerCase().includes('múltiplo'), peso: 2 },
    { condicao: context.contexto.toLowerCase().includes('contradição'), peso: 3 },
    { condicao: context.contexto.toLowerCase().includes('urgente'), peso: 2 },
    { condicao: context.probabilidade && context.probabilidade < 60, peso: 2 }
  ];
  
  fatoresComplexidade.forEach(fator => {
    if (fator.condicao) {
      complexidade += fator.peso;
    }
  });
  
  return Math.min(complexidade, 10);
}

/**
 * Detecta conflitos ou inconsistências no contexto
 */
function detectarConflitos(context: ExecutionContext): string[] {
  const conflitos: string[] = [];
  const contexto = context.contexto.toLowerCase();
  
  // Palavras que indicam conflitos
  const indicadoresConflito = [
    'contraditório', 'inconsistente', 'conflito', 'divergência',
    'discordância', 'incompatível', 'paradoxo'
  ];
  
  indicadoresConflito.forEach(indicador => {
    if (contexto.includes(indicador)) {
      conflitos.push(`Conflito detectado: ${indicador} identificado no contexto`);
    }
  });
  
  // Verifica probabilidade baixa como possível conflito
  if (context.probabilidade && context.probabilidade < 40) {
    conflitos.push('Baixa confiança pode indicar informações conflitantes');
  }
  
  return conflitos;
}

/**
 * Identifica gaps de informação que precisam ser preenchidos
 */
function identificarGapsInformacao(context: ExecutionContext): string[] {
  const gaps: string[] = [];
  const contexto = context.contexto.toLowerCase();
  
  // Indicadores de informação incompleta
  const indicadoresGaps = [
    { padrão: 'não sei', gap: 'Informação específica faltando' },
    { padrão: 'talvez', gap: 'Incerteza sobre fatos importantes' },
    { padrão: 'possivelmente', gap: 'Confirmação necessária' },
    { padrão: 'parcial', gap: 'Dados incompletos' },
    { padrão: 'fragmento', gap: 'Evidência fragmentada' }
  ];
  
  indicadoresGaps.forEach(({ padrão, gap }) => {
    if (contexto.includes(padrão)) {
      gaps.push(gap);
    }
  });
  
  // Contexto muito curto pode indicar falta de informação
  if (context.contexto.length < 100) {
    gaps.push('Contexto insuficiente para análise completa');
  }
  
  return gaps;
}

/**
 * Gera mensagem narrativa do Obi baseada na ação e contexto
 */
function gerarMensagemNarrativa(
  action: string, 
  target?: string, 
  analise?: ObiAnalysisState
): string {
  const personas: Record<string, string> = {
    [ESPECIALISTAS.ESTRATEGISTA]: 'L',
    [ESPECIALISTAS.FORENSE]: 'Senku', 
    [ESPECIALISTAS.COMPORTAMENTAL]: 'Norman',
    [ESPECIALISTAS.ESPACIAL]: 'Isagi'
  };
  
  switch (action) {
    case 'ativar_especialista':
      const persona = personas[target || ''] || target || 'especialista';
      const especialidadeMsg: Record<string, string> = {
        [ESPECIALISTAS.ESTRATEGISTA]: 'Preciso da sua análise estratégica para conectar os pontos',
        [ESPECIALISTAS.FORENSE]: 'Sua expertise científica é essencial aqui',
        [ESPECIALISTAS.COMPORTAMENTAL]: 'Preciso que você analise os aspectos psicológicos',
        [ESPECIALISTAS.ESPACIAL]: 'Sua visão tática pode otimizar nossa abordagem'
      };
      
      return `${persona}, ${especialidadeMsg[target || ''] || 'preciso da sua expertise'}. Fire Force cuida de Fire Force - vamos trabalhar juntos nessa.`;
    
    case 'validar_etapa':
      return `Equipe, chegamos a um ponto crítico. Vamos fazer nossa validação cruzada padrão para garantir que estamos no caminho certo.`;
    
    case 'escrever_contexto':
      return `Registrando essas descobertas no nosso sistema. Cada insight pode ser crucial para investigações futuras.`;
    
    case 'pausar':
      const urgencia = analise?.nivelUrgencia || 1;
      if (urgencia > 3) {
        return `Equipe, precisamos pausar e reavaliar. Algo não está batendo e não podemos arriscar seguir com incertezas.`;
      }
      return `Vamos fazer uma pausa estratégica para organizar nossas descobertas antes de prosseguir.`;
    
    case 'avançar_pipeline':
      return `Excelente trabalho, equipe! Temos informações suficientes para avançar para a próxima fase da investigação.`;
    
    case 'resolver_conflito':
      return `Detectei divergências entre as análises. Como líder da equipe, vou mediar essa discussão para encontrarmos consenso.`;
    
    default:
      return `Coordenando próximas ações baseado na situação atual. Fire Force está sempre pronto para adaptar.`;
  }
}

/**
 * Determina a próxima etapa recomendada baseada no estado atual
 */
function determinarProximaEtapa(context: ExecutionContext, analise: ObiAnalysisState): string {
  const etapaAtual = context.etapa;
  
  // Mapeamento de progressão natural
  const progressaoNatural: Record<string, string> = {
    [ETAPAS_PIPELINE.INTAKE]: ETAPAS_PIPELINE.DELEGATION,
    [ETAPAS_PIPELINE.DELEGATION]: ETAPAS_PIPELINE.VALIDATION,
    [ETAPAS_PIPELINE.VALIDATION]: ETAPAS_PIPELINE.SYNTHESIS,
    [ETAPAS_PIPELINE.SYNTHESIS]: ETAPAS_PIPELINE.HYPOTHESIS,
    [ETAPAS_PIPELINE.HYPOTHESIS]: ETAPAS_PIPELINE.REVIEW,
    [ETAPAS_PIPELINE.REVIEW]: ETAPAS_PIPELINE.ASSESSMENT,
    [ETAPAS_PIPELINE.ASSESSMENT]: ETAPAS_PIPELINE.ARCHIVAL
  };
  
  // Se há conflitos, pode precisar voltar para validação
  if (analise.conflitosDetectados.length > 0 && etapaAtual !== ETAPAS_PIPELINE.VALIDATION) {
    return ETAPAS_PIPELINE.VALIDATION;
  }
  
  // Se confiança muito baixa, pode precisar de mais análise
  if (analise.confiancaGeral < 60 && etapaAtual === ETAPAS_PIPELINE.SYNTHESIS) {
    return ETAPAS_PIPELINE.DELEGATION; // Voltar para mais análises
  }
  
  // Progressão normal
  return progressaoNatural[etapaAtual] || etapaAtual;
}

/**
 * Função principal que analisa o contexto e decide as ações do Obi
 */
export function decidirAcaoObi(context: ExecutionContext): ObiCommand[] {
  const comandos: ObiCommand[] = [];
  
  // Especialistas já ativados (extraído do contexto se disponível)
  const especialistasAtivos: string[] = [];
  
  // Análise do estado atual
  const analise: ObiAnalysisState = {
    complexidadeInvestigacao: avaliarComplexidade(context),
    especialistasAtivos: especialistasAtivos,
    confiancaGeral: context.probabilidade || 70,
    conflitosDetectados: detectarConflitos(context),
    gapsInformacao: identificarGapsInformacao(context),
    proximaEtapaRecomendada: determinarProximaEtapa(context, {
      complexidadeInvestigacao: avaliarComplexidade(context),
      especialistasAtivos: especialistasAtivos,
      confiancaGeral: context.probabilidade || 70,
      conflitosDetectados: detectarConflitos(context),
      gapsInformacao: identificarGapsInformacao(context),
      proximaEtapaRecomendada: '',
      nivelUrgencia: context.contexto.toLowerCase().includes('urgente') ? 4 : 2
    }),
    nivelUrgencia: context.contexto.toLowerCase().includes('urgente') ? 4 : 2
  };
  
  // 1. PRIORIDADE MÁXIMA: Resolver conflitos detectados
  if (analise.conflitosDetectados.length > 0) {
    comandos.push({
      action: 'resolver_conflito',
      mensagemNarrativa: gerarMensagemNarrativa('resolver_conflito', undefined, analise),
      prioridade: 10,
      dados: {
        estrategiaResolucao: 'mediacao_colaborativa'
      },
      timestamp: new Date()
    });
  }
  
  // 2. ALTA PRIORIDADE: Ativar especialistas necessários
  const especialistasNecessarios = avaliarNecessidadeEspecialistas(context.contexto);
  especialistasNecessarios.forEach((especialista, index) => {
    if (!analise.especialistasAtivos.includes(especialista)) {
      comandos.push({
        action: 'ativar_especialista',
        target: especialista,
        mensagemNarrativa: gerarMensagemNarrativa('ativar_especialista', especialista, analise),
        prioridade: 9 - index, // Primeiro especialista tem prioridade máxima
        dados: {
          especialista: especialista
        },
        timestamp: new Date()
      });
    }
  });
  
  // 3. PRIORIDADE ALTA: Pausar se confiança muito baixa
  if (analise.confiancaGeral < 40) {
    comandos.push({
      action: 'pausar',
      mensagemNarrativa: gerarMensagemNarrativa('pausar', undefined, analise),
      prioridade: 8,
      dados: {
        razaoPausa: 'confianca_baixa'
      },
      timestamp: new Date()
    });
  }
  
  // 4. PRIORIDADE MÉDIA: Validar etapa se múltiplos especialistas ativos
  if (analise.especialistasAtivos.length >= 2 && context.etapa !== ETAPAS_PIPELINE.VALIDATION) {
    comandos.push({
      action: 'validar_etapa',
      mensagemNarrativa: gerarMensagemNarrativa('validar_etapa', undefined, analise),
      prioridade: 6,
      dados: {
        contextoValidacao: 'validacao_cruzada_multiplos_especialistas'
      },
      timestamp: new Date()
    });
  }
  
  // 5. PRIORIDADE MÉDIA: Avançar pipeline se condições atendidas
  if (analise.confiancaGeral >= 70 && 
      analise.conflitosDetectados.length === 0 && 
      analise.gapsInformacao.length <= 1) {
    
    comandos.push({
      action: 'avançar_pipeline',
      target: analise.proximaEtapaRecomendada,
      mensagemNarrativa: gerarMensagemNarrativa('avançar_pipeline', analise.proximaEtapaRecomendada, analise),
      prioridade: 5,
      dados: {
        novaEtapa: analise.proximaEtapaRecomendada
      },
      timestamp: new Date()
    });
  }
  
  // 6. PRIORIDADE BAIXA: Registrar contexto sempre
  comandos.push({
    action: 'escrever_contexto',
    mensagemNarrativa: gerarMensagemNarrativa('escrever_contexto', undefined, analise),
    prioridade: 3,
    timestamp: new Date()
  });
  
  // Ordenar comandos por prioridade (maior primeiro)
  return comandos.sort((a, b) => b.prioridade - a.prioridade);
}

/**
 * Função auxiliar para interpretar o estado emocional do contexto
 */
export function interpretarEstadoEmocional(context: ExecutionContext): {
  urgencia: number;
  confianca: number;
  complexidade: number;
  recomendacao: string;
} {
  const contexto = context.contexto.toLowerCase();
  
  // Avaliar urgência
  let urgencia = 1;
  if (contexto.includes('urgente') || contexto.includes('emergência')) urgencia = 5;
  else if (contexto.includes('rápido') || contexto.includes('pressa')) urgencia = 4;
  else if (contexto.includes('importante')) urgencia = 3;
  else if (contexto.includes('quando possível')) urgencia = 2;
  
  // Avaliar confiança
  const confianca = context.probabilidade || 70;
  
  // Avaliar complexidade
  const complexidade = avaliarComplexidade(context);
  
  // Gerar recomendação
  let recomendacao = 'Prosseguir com análise padrão';
  if (urgencia >= 4 && confianca < 60) {
    recomendacao = 'Ativar protocolos de emergência com validação acelerada';
  } else if (complexidade >= 7) {
    recomendacao = 'Coordenação intensiva entre múltiplos especialistas necessária';
  } else if (confianca < 50) {
    recomendacao = 'Refinamento de contexto prioritário antes de prosseguir';
  }
  
  return { urgencia, confianca, complexidade, recomendacao };
}

/**
 * Função para simular o processamento narrativo característico do Obi
 */
export function processarComandoNarrativo(comando: ObiCommand): string {
  let narrativa = `**Capitão Obi:** ${comando.mensagemNarrativa}`;
  
  // Adicionar contexto adicional baseado na prioridade
  if (comando.prioridade >= 9) {
    narrativa += "\n*[Comando de alta prioridade - execução imediata recomendada]*";
  } else if (comando.prioridade >= 6) {
    narrativa += "\n*[Coordenação de equipe ativa]*";
  } else if (comando.prioridade >= 3) {
    narrativa += "\n*[Procedimento padrão de documentação]*";
  }
  
  return narrativa;
}

/**
 * Interface para diagnóstico do estado do sistema
 */
export interface ObiSystemDiagnosis {
  statusGeral: 'operacional' | 'atencao' | 'critico';
  especialistasRecomendados: string[];
  proximasAcoes: string[];
  alertas: string[];
  confiancaSistema: number;
}

/**
 * Função de diagnóstico completo do sistema
 */
export function diagnosticarSistema(context: ExecutionContext): ObiSystemDiagnosis {
  const comandos = decidirAcaoObi(context);
  const estado = interpretarEstadoEmocional(context);
  
  let statusGeral: 'operacional' | 'atencao' | 'critico' = 'operacional';
  if (estado.confianca < 40 || estado.urgencia >= 5) {
    statusGeral = 'critico';
  } else if (estado.confianca < 60 || estado.complexidade >= 7) {
    statusGeral = 'atencao';
  }
  
  const especialistasRecomendados = comandos
    .filter(cmd => cmd.action === 'ativar_especialista')
    .map(cmd => SPECIALIST_TO_PERSONA[cmd.target || ''] || cmd.target || '')
    .filter(Boolean);
  
  const proximasAcoes = comandos
    .slice(0, 3)
    .map(cmd => cmd.mensagemNarrativa);
  
  const alertas: string[] = [];
  if (estado.confianca < 50) {
    alertas.push('Confiança baixa detectada - validação adicional recomendada');
  }
  if (estado.urgencia >= 4) {
    alertas.push('Alta urgência - protocolos acelerados podem ser necessários');
  }
  if (estado.complexidade >= 8) {
    alertas.push('Complexidade extrema - coordenação intensiva requerida');
  }
  
  return {
    statusGeral,
    especialistasRecomendados,
    proximasAcoes,
    alertas,
    confiancaSistema: estado.confianca
  };
}