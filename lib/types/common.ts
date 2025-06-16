/**
 * @fileoverview Tipos centrais do sistema Syndicate v3.0
 * @module types/common
 * 
 * Versão unificada que combina os tipos originais com os necessários para o runtime
 */

/**
 * Representa um especialista do sistema
 */
export type Specialist = 'L' | 'Senku' | 'Norman' | 'Isagi' | 'Obi';

/**
 * Níveis de severidade para logs e avaliações
 */
export type Severity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Status de execução de ações
 */
export type ActionStatus = 'pending' | 'executing' | 'completed' | 'failed' | 'skipped';

/**
 * Contexto de execução principal do sistema
 * Contém todos os dados necessários para uma análise completa
 */
export interface ExecutionContext {
  /** ID único da execução */
  executionId: string;
  
  /** Timestamp de início da execução */
  startTime: Date;
  
  /** Dados de entrada para análise */
  input: {
    /** Texto ou conteúdo principal a ser analisado */
    content: string;
    
    /** Metadados adicionais da entrada */
    metadata?: Record<string, any>;
    
    /** Tipo de análise requisitada */
    analysisType?: string;
  };
  
  /** Estado atual da execução */
  state: {
    /** Fase atual do processamento */
    phase: 'initialization' | 'validation' | 'analysis' | 'synthesis' | 'completed' | 'error';
    
    /** Especialistas que já foram acionados */
    activatedSpecialists: Specialist[];
    
    /** Resultados parciais acumulados */
    partialResults: Map<Specialist, SpecialistResponse>;
    
    /** Flags de controle de fluxo */
    flags: {
      skipValidation?: boolean;
      forceSequential?: boolean;
      debugMode?: boolean;
    };
  };
  
  /** Configurações da execução */
  config: {
    /** Timeout máximo em ms */
    maxExecutionTime?: number;
    
    /** Especialistas habilitados para esta execução */
    enabledSpecialists?: Specialist[];
    
    /** Nível mínimo de confiança para triggers */
    confidenceThreshold?: number;
  };
  
  /** Histórico de ações executadas */
  actionHistory: Action[];
  
  /** Logs de efeitos e eventos */
  effectLogs: EffectLog[];
}

/**
 * Resultado da avaliação de um trigger
 * Determina se uma condição foi satisfeita e qual ação tomar
 */
export interface TriggerEvaluationResult {
  triggered: boolean;
  matchedRules: string[];
  actions: SyndicateAction[];
}

/**
 * Representa uma ação a ser executada pelo sistema
 */
export interface Action {
  /** ID único da ação */
  actionId: string;
  
  /** Tipo da ação */
  type: 'analyze' | 'validate' | 'route' | 'synthesize' | 'report' | 'custom';
  
  /** Nome descritivo da ação */
  name: string;
  
  /** Descrição detalhada do que a ação faz */
  description?: string;
  
  /** Status atual da ação */
  status: ActionStatus;
  
  /** Parâmetros de entrada da ação */
  params: {
    /** Especialista alvo (se aplicável) */
    targetSpecialist?: Specialist;
    
    /** Dados específicos da ação */
    data?: any;
    
    /** Opções de configuração */
    options?: Record<string, any>;
  };
  
  /** Resultado da execução (quando completada) */
  result?: {
    /** Se a ação foi bem-sucedida */
    success: boolean;
    
    /** Dados retornados pela ação */
    data?: any;
    
    /** Mensagem de erro (se falhou) */
    error?: string;
    
    /** Duração da execução em ms */
    duration?: number;
  };
  
  /** Metadados da ação */
  metadata: {
    /** Trigger que originou a ação */
    triggeredBy?: string;
    
    /** Timestamp de criação */
    createdAt: Date;
    
    /** Timestamp de início da execução */
    startedAt?: Date;
    
    /** Timestamp de conclusão */
    completedAt?: Date;
    
    /** Prioridade da ação */
    priority?: number;
    
    /** Tags para categorização */
    tags?: string[];
  };
}

/**
 * Log de efeitos e eventos do sistema
 * Usado para auditoria e debugging
 */
export interface EffectLog {
  /** ID único do log */
  logId: string;
  
  /** Tipo de evento */
  eventType: 'trigger_evaluation' | 'action_execution' | 'specialist_analysis' | 
             'validation' | 'error' | 'warning' | 'info' | 'state_change';
  
  /** Nível de severidade do log */
  severity: Severity;
  
  /** Mensagem principal do log */
  message: string;
  
  /** Dados contextuais do evento */
  context: {
    /** ID da execução relacionada */
    executionId: string;
    
    /** Especialista relacionado (se aplicável) */
    specialist?: Specialist;
    
    /** Ação relacionada (se aplicável) */
    actionId?: string;
    
    /** Trigger relacionado (se aplicável) */
    triggerId?: string;
    
    /** Fase da execução quando o log foi gerado */
    executionPhase?: string;
  };
  
  /** Dados adicionais do evento */
  data?: any;
  
  /** Stack trace (para erros) */
  stackTrace?: string;
  
  /** Timestamp do evento */
  timestamp: Date;
  
  /** Tags para filtragem e busca */
  tags?: string[];
}

/**
 * Resposta de um especialista após análise
 */
export interface SpecialistResponse {
  /** Especialista que gerou a resposta */
  specialist: Specialist;
  
  /** ID único da análise */
  analysisId: string;
  
  /** Timestamp da análise */
  timestamp: Date;
  
  /** Análise estruturada do especialista */
  analysis: {
    /** Resumo executivo da análise */
    summary: string;
    
    /** Pontos-chave identificados */
    keyPoints: string[];
    
    /** Insights detalhados */
    insights: {
      /** Categoria do insight */
      category: string;
      
      /** Descrição do insight */
      description: string;
      
      /** Evidências que suportam o insight */
      evidence?: string[];
      
      /** Nível de confiança (0-1) */
      confidence: number;
    }[];
    
    /** Padrões identificados */
    patterns?: {
      /** Tipo de padrão */
      type: string;
      
      /** Descrição do padrão */
      description: string;
      
      /** Ocorrências do padrão */
      occurrences?: number;
    }[];
    
    /** Anomalias detectadas */
    anomalies?: {
      /** Tipo de anomalia */
      type: string;
      
      /** Descrição da anomalia */
      description: string;
      
      /** Severidade da anomalia */
      severity: Severity;
    }[];
  };
  
  /** Recomendações do especialista */
  recommendations?: {
    /** Ação recomendada */
    action: string;
    
    /** Justificativa para a recomendação */
    rationale: string;
    
    /** Prioridade da recomendação */
    priority: 'low' | 'medium' | 'high';
    
    /** Especialistas sugeridos para follow-up */
    suggestedSpecialists?: Specialist[];
  }[];
  
  /** Metadados da resposta */
  metadata: {
    /** Duração da análise em ms */
    processingTime: number;
    
    /** Versão do modelo/lógica usada */
    modelVersion?: string;
    
    /** Nível de confiança geral da análise (0-1) */
    overallConfidence: number;
    
    /** Se a análise está completa ou parcial */
    isComplete: boolean;
    
    /** Dados brutos ou intermediários (para debug) */
    rawData?: any;
  };
  
  /** Triggers identificados durante a análise */
  identifiedTriggers?: {
    /** ID do trigger */
    triggerId: string;
    
    /** Probabilidade de ativação (0-1) */
    probability: number;
    
    /** Contexto que levou à identificação */
    context: string;
  }[];
}

/**
 * Tipo auxiliar para representar o resultado de uma execução completa
 */
export interface ExecutionResult {
  /** Contexto final da execução */
  context: ExecutionContext;
  
  /** Se a execução foi bem-sucedida */
  success: boolean;
  
  /** Síntese final de todos os especialistas */
  synthesis?: {
    /** Narrativa consolidada */
    narrative: string;
    
    /** Conclusões principais */
    conclusions: string[];
    
    /** Próximos passos sugeridos */
    nextSteps?: string[];
  };
  
  /** Erros encontrados durante a execução */
  errors?: Error[];
  
  /** Métricas de performance */
  metrics?: {
    /** Tempo total de execução em ms */
    totalExecutionTime: number;
    
    /** Número de especialistas acionados */
    specialistsActivated: number;
    
    /** Número de ações executadas */
    actionsExecuted: number;
    
    /** Número de triggers ativados */
    triggersActivated: number;
  };
}

/**
 * Tipo para configuração de triggers
 */
export interface TriggerConfig {
  /** ID único do trigger */
  id: string;
  
  /** Nome do trigger */
  name: string;
  
  /** Descrição do que o trigger detecta */
  description: string;
  
  /** Condições para ativação */
  conditions: {
    /** Tipo de condição */
    type: 'keyword' | 'pattern' | 'threshold' | 'composite';
    
    /** Parâmetros específicos da condição */
    params: any;
  }[];
  
  /** Ações a executar quando ativado */
  actions: string[];
  
  /** Se o trigger está ativo */
  enabled: boolean;
  
  /** Prioridade do trigger */
  priority?: number;
}

/**
 * Tipo para validação de schemas
 */
export interface SchemaValidation {
  /** Se a validação passou */
  isValid: boolean;
  
  /** Erros encontrados */
  errors?: {
    /** Campo com erro */
    field: string;
    
    /** Mensagem de erro */
    message: string;
    
    /** Valor que causou o erro */
    value?: any;
  }[];
  
  /** Avisos não críticos */
  warnings?: {
    /** Campo com aviso */
    field: string;
    
    /** Mensagem de aviso */
    message: string;
  }[];
}

// ===========================
// TIPOS ADICIONAIS PARA RUNTIME
// ===========================

/**
 * Constantes do sistema - IDs dos especialistas
 */
export const ESPECIALISTAS = {
  ORQUESTRADOR: 'orquestrador_missao',
  ESTRATEGISTA: 'estrategista_chefe',
  FORENSE: 'analista_forense',
  COMPORTAMENTAL: 'analista_comportamental',
  ESPACIAL: 'analista_espacial'
} as const;

/**
 * Etapas do pipeline de processamento
 */
export const ETAPAS_PIPELINE = {
  INTAKE: 'intake_analysis',
  DELEGATION: 'task_delegation',
  VALIDATION: 'collaborative_review',
  SYNTHESIS: 'synthesis',
  HYPOTHESIS: 'hypothesis_formation',
  REVIEW: 'review',
  ASSESSMENT: 'final_assessment',
  ARCHIVAL: 'archival'
} as const;

/**
 * Thresholds de confiança
 */
export const CONFIDENCE_THRESHOLDS = {
  VERY_HIGH: 90,
  HIGH: 75,
  ACCEPTABLE: 60,
  CONCERNING_LOW: 40,
  CRITICAL_LOW: 25
} as const;

/**
 * Tipos de registro válidos no sistema
 */
export const TIPOS_REGISTRO = [
  // Tipos originais do sistema
  'hipotese',
  'evidencia',
  'perfil_personagem',
  'entrada_timeline',
  'registro_misc',
  'cross_validation_result',
  'ingest',
  
  // Tipos usados nas regras (rules.yaml)
  'hypothesis_created',
  'analysis_validated',
  'task_assigned',
  'contradiction_detected',
  'analysis_completed'
] as const;

export type TipoRegistro = typeof TIPOS_REGISTRO[number];

/**
 * Evento de entrada do sistema (para compatibilidade com runtime)
 */
export interface IngestEvent {
  id: string;
  timestamp: string;
  tipo_registro: TipoRegistro;
  autor: string;
  dados: Record<string, any>;
  etapa?: string;
  id_caso: string;
  trace_id?: string;
  especialista?: string;
}

/**
 * Contexto base do Syndicate (sem callbacks) - usado pelo runtime
 */
export interface SyndicateContext {
  idRegistro: string;
  contexto: string;
  autor: string;
  etapa: string;
  especialista: string;
  idCaso: string;
  timestamp: string;
  tipo_registro?: TipoRegistro;
  probabilidade?: number;
}

/**
 * Contexto de execução do runtime com callbacks
 * Estende o SyndicateContext com funções de controle
 */
export interface RuntimeExecutionContext extends SyndicateContext {
  // Callbacks de controle do pipeline
  log: (msg: string) => void;
  advancePipeline: (toStage: string) => void;
  activateSpecialist: (id: string) => Promise<void>;
  activateProtocol: (name: string) => Promise<void>;
  modifyScore: (field: string, adjustment: number) => void;
  haltPipeline: (reason: string) => void;
}

/**
 * Ação do Syndicate simplificada para runtime
 */
export interface SyndicateAction {
  id?: string;
  type: string;
  params?: Record<string, any>;
  target?: string;
  to_stage?: string;
  message?: string;
  timestamp?: string;
}

/**
 * Resultado de avaliação de triggers simplificado para runtime
 */
export interface RuntimeTriggerEvaluationResult {
  triggered: boolean;
  matchedRules: string[];
  actions: SyndicateAction[];
}

/**
 * Status de caso
 */
export interface CasoStatus {
  id: string;
  status: 'active' | 'pending' | 'resolved' | 'archived';
  lastUpdate: string;
  currentStage: string;
  assignedSpecialists: string[];
}

// ===========================
// TIPOS DOS MÓDULOS ESPECIALISTAS
// ===========================

/**
 * Comando gerado pelo Obi para coordenar o sistema
 */
export interface ObiCommand {
  action: 'ativar_especialista' | 'validar_etapa' | 'escrever_contexto' | 'pausar' | 'avançar_pipeline' | 'resolver_conflito';
  target?: string;
  mensagemNarrativa: string;
  prioridade: number;
  dados?: Record<string, any>;
  timestamp: Date;
}

export interface ObiSystemDiagnosis {
  statusGeral: 'operacional' | 'atencao' | 'critico';
  especialistasRecomendados: string[];
  proximasAcoes: string[];
  alertas: string[];
  confiancaSistema: number;
}

export interface StageTransitionResult {
  nextStage: string;
  completedTasks: string[];
  stageStatus: 'completed' | 'failed' | 'needs_refinement';
  errors?: string[];
  requiresQARefinement?: boolean;
  validationRequired?: boolean;
}
/**
 * Análise gerada por um especialista
 */
export interface AnaliseEspecialista {
  especialista: string;
  analise: {
    hipotese: string;
    justificativa: string;
    nivel_confianca: number;
    acoes_recomendadas: string[];
  };
}

/**
 * Input para o sistema de retry
 */
export interface RetryInput {
  etapaAtual: string;
  tipoErro: string;
  especialista?: string;
  tentativaAtual: number;
  confiancaAtual?: number;
  contextoErro?: Record<string, any>;
  tentativasGlobais?: number;
}

/**
 * Resposta do sistema de retry
 */
export interface RetryResponse {
  acao: 'repetir' | 'pular' | 'ajustar' | 'reiniciar' | 'escalar' | 'concluir_gracioso';
  proximaEtapa?: string;
  justificativa: string;
  cooldownMs?: number;
  estrategiaRecuperacao?: string;
  modificacoes?: Record<string, any>;
}

/**
 * Input para revisão cruzada
 */
export interface ReviewInput {
  reviewer: string;
  originalAnalysis: SpecialistResponse;
  context: ExecutionContext;
}

/**
 * Resultado da revisão cruzada
 */
export interface ReviewResult {
  status: 'approved' | 'rejected' | 'refine';
  justification: string;
  suggestions?: string[];
  qualityScore: number;
}

/**
 * Input para refinamento Q&A
 */
export interface RefinementInput {
  specialist: string;
  context: string;
  hypothesis?: string;
  evidence?: string;
  missingElement?: string;
  userCommand?: string;
  currentConfidence?: number;
}

/**
 * Pergunta de refinamento
 */
export interface RefinementQuestion {
  question: string;
  targetVariable: string;
  priority: number;
}

/**
 * Resultado do refinamento
 */
export interface RefinementResult {
  questions: RefinementQuestion[];
  mode: 'rapid' | 'deep' | 'collaborative';
  estimatedQuestions: number;
  confidenceTarget: number;
  escapeAvailable: boolean;
}

// ===========================
// TYPE GUARDS
// ===========================

/**
 * Verifica se é um tipo de registro válido
 */
export function isValidTipoRegistro(tipo: any): tipo is TipoRegistro {
  return typeof tipo === 'string' && TIPOS_REGISTRO.includes(tipo as TipoRegistro);
}

/**
 * Verifica se é um evento de ingest válido
 */
export function isValidIngestEvent(event: any): event is IngestEvent {
  return (
    event &&
    typeof event === 'object' &&
    typeof event.id === 'string' &&
    typeof event.timestamp === 'string' &&
    isValidTipoRegistro(event.tipo_registro) &&
    typeof event.autor === 'string' &&
    typeof event.dados === 'object' &&
    typeof event.id_caso === 'string'
  );
}

/**
 * Verifica se é uma probabilidade válida
 */
export function isValidProbabilidade(value: any): value is number {
  return typeof value === 'number' && value >= 0 && value <= 100;
}

/**
 * Verifica se é um contexto de execução válido
 */
export function isValidExecutionContext(context: any): context is RuntimeExecutionContext {
  return (
    context &&
    typeof context === 'object' &&
    typeof context.idRegistro === 'string' &&
    typeof context.contexto === 'string' &&
    typeof context.autor === 'string' &&
    typeof context.etapa === 'string' &&
    typeof context.especialista === 'string' &&
    typeof context.idCaso === 'string' &&
    typeof context.timestamp === 'string' &&
    typeof context.log === 'function' &&
    typeof context.advancePipeline === 'function'
  );
}

// ===========================
// TIPOS AUXILIARES
// ===========================

export type EtapaPipeline = typeof ETAPAS_PIPELINE[keyof typeof ETAPAS_PIPELINE];
export type EspecialistaId = typeof ESPECIALISTAS[keyof typeof ESPECIALISTAS];

/**
 * Interface para validação de contexto
 */
export interface ContextValidation {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * Mapeamento de especialistas para personas
 */
export const SPECIALIST_TO_PERSONA: Record<string, string> = {
  [ESPECIALISTAS.ESTRATEGISTA]: 'L Lawliet',
  [ESPECIALISTAS.FORENSE]: 'Senku',
  [ESPECIALISTAS.COMPORTAMENTAL]: 'Norman',
  [ESPECIALISTAS.ESPACIAL]: 'Isagi',
  [ESPECIALISTAS.ORQUESTRADOR]: 'Captain Obi'
};

/**
 * Mapeamento reverso de personas para especialistas
 */
export const PERSONA_TO_SPECIALIST: Record<string, string> = Object.entries(SPECIALIST_TO_PERSONA)
  .reduce((acc, [key, value]) => ({ ...acc, [value]: key }), {});

// ===========================
// EXPORTS PARA COMPATIBILIDADE
// ===========================


// Export da interface BaseSpecialist se for necessário
export interface BaseSpecialist {
  id: string;
  name: string;
  type: string;
  status: string;
  confidence: number;
  capabilities: Array<{
    name: string;
    description: string;
    requiredContext: string[];
    outputFormat: string;
  }>;
  responsePatterns: {
    greeting: string;
    analyzing: string;
    conclusion: string;
  };
}