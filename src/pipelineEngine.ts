// pipelineEngine.ts - Syndicate v3.0 Pipeline Engine
// Execução estruturada das 8 etapas do pipeline investigativo

export interface ExecutionContext {
  currentStage: string;
  evidence: Record<string, any>;
  specialistAnalyses: Record<string, any>;
  validationResults: Record<string, any>;
  synthesis: Record<string, any>;
  hypotheses: Array<{
    id: string;
    description: string;
    confidence: number;
    supportingEvidence: string[];
  }>;
  teamConsensus: number;
  conclusions: Record<string, any>;
  completedTasks: string[];
  stageConfidence: Record<string, number>;
  qaRefinementActive: boolean;
  contextCompleteness: number;
  investigationType: 'rapid' | 'standard' | 'comprehensive';
}

export interface StageTransitionResult {
  nextStage: string;
  completedTasks: string[];
  errors?: string[];
  requiresQARefinement?: boolean;
  validationRequired?: boolean;
  stageStatus: 'completed' | 'failed' | 'needs_refinement';
}

interface StageDefinition {
  id: string;
  name: string;
  requiredTasks: string[];
  minimumConfidence: number;
  qualityGate: 'BASIC' | 'STANDARD' | 'RIGOROUS';
  validationCriteria: string[];
}

// Definição das 8 etapas baseadas em pipeline_engine.md
const PIPELINE_STAGES: Record<string, StageDefinition> = {
  evidence_intake: {
    id: 'evidence_intake',
    name: 'Evidence Intake & Classification',
    requiredTasks: [
      'initial_assessment',
      'context_gap_analysis',
      'specialist_selection'
    ],
    minimumConfidence: 60,
    qualityGate: 'BASIC',
    validationCriteria: [
      'objective_clarity',
      'scope_boundaries',
      'domain_identification',
      'context_completeness'
    ]
  },
  
  initial_analysis: {
    id: 'initial_analysis',
    name: 'Initial Specialist Analysis',
    requiredTasks: [
      'specialist_activation',
      'parallel_analysis',
      'confidence_assessment'
    ],
    minimumConfidence: 80,
    qualityGate: 'STANDARD',
    validationCriteria: [
      'expertise_matching',
      'task_specificity',
      'analysis_completeness',
      'specialist_confidence'
    ]
  },
  
  cross_validation: {
    id: 'cross_validation',
    name: 'Cross-Validation Round',
    requiredTasks: [
      'matrix_validation',
      'peer_review',
      'contradiction_resolution'
    ],
    minimumConfidence: 95,
    qualityGate: 'RIGOROUS',
    validationCriteria: [
      'internal_consistency',
      'cross_specialist_coherence',
      'temporal_alignment',
      'evidence_completeness'
    ]
  },
  
  synthesis: {
    id: 'synthesis',
    name: 'Synthesis & Correlation',
    requiredTasks: [
      'finding_integration',
      'correlation_identification',
      'insight_generation'
    ],
    minimumConfidence: 80,
    qualityGate: 'STANDARD',
    validationCriteria: [
      'complete_integration',
      'synergy_identification',
      'logical_flow',
      'gap_identification'
    ]
  },
  
  hypothesis_formation: {
    id: 'hypothesis_formation',
    name: 'Hypothesis Formation',
    requiredTasks: [
      'hypothesis_development',
      'probability_assessment',
      'evidence_mapping'
    ],
    minimumConfidence: 80,
    qualityGate: 'STANDARD',
    validationCriteria: [
      'hypothesis_diversity',
      'evidence_grounding',
      'logical_validity',
      'confidence_calibration'
    ]
  },
  
  team_review: {
    id: 'team_review',
    name: 'Team Review & Debate',
    requiredTasks: [
      'structured_debate',
      'conflict_resolution',
      'consensus_building'
    ],
    minimumConfidence: 95,
    qualityGate: 'RIGOROUS',
    validationCriteria: [
      'full_participation',
      'debate_quality',
      'consensus_threshold',
      'documentation_completeness'
    ]
  },
  
  final_assessment: {
    id: 'final_assessment',
    name: 'Final Assessment',
    requiredTasks: [
      'evidence_consolidation',
      'recommendation_development',
      'final_validation'
    ],
    minimumConfidence: 95,
    qualityGate: 'RIGOROUS',
    validationCriteria: [
      'evidence_foundation',
      'logic_reasoning',
      'actionability',
      'objective_alignment'
    ]
  },
  
  vault_commit: {
    id: 'vault_commit',
    name: 'Vault Commit & Documentation',
    requiredTasks: [
      'knowledge_documentation',
      'learning_extraction',
      'system_updates'
    ],
    minimumConfidence: 60,
    qualityGate: 'BASIC',
    validationCriteria: [
      'documentation_completeness',
      'knowledge_preservation',
      'metadata_accuracy',
      'future_utility'
    ]
  }
};

// Ordem sequencial das etapas
const STAGE_SEQUENCE = [
  'evidence_intake',
  'initial_analysis',
  'cross_validation',
  'synthesis',
  'hypothesis_formation',
  'team_review',
  'final_assessment',
  'vault_commit'
];

// Thresholds de confiança por tipo de qualidade
const CONFIDENCE_THRESHOLDS = {
  BASIC: 60,
  STANDARD: 80,
  RIGOROUS: 95
};

// Função para verificar completude de tarefas
function checkTaskCompletion(
  requiredTasks: string[],
  completedTasks: string[]
): { completed: boolean; missing: string[] } {
  const missing = requiredTasks.filter(task => !completedTasks.includes(task));
  return {
    completed: missing.length === 0,
    missing
  };
}

// Função para verificar critérios de validação
function validateStageCriteria(
  stage: StageDefinition,
  context: ExecutionContext
): { valid: boolean; failedCriteria: string[] } {
  const failedCriteria: string[] = [];
  
  // Verificações específicas por etapa
  switch (stage.id) {
    case 'evidence_intake':
      if (context.contextCompleteness < 80) {
        failedCriteria.push('context_completeness');
      }
      break;
      
    case 'cross_validation':
      if (!context.validationResults || Object.keys(context.validationResults).length === 0) {
        failedCriteria.push('matrix_validation');
      }
      break;
      
    case 'team_review':
      if (context.teamConsensus < 90) {
        failedCriteria.push('consensus_threshold');
      }
      break;
  }
  
  // Verificar confiança mínima
  const stageConfidence = context.stageConfidence[stage.id] || 0;
  const requiredConfidence = CONFIDENCE_THRESHOLDS[stage.qualityGate];
  
  if (stageConfidence < requiredConfidence) {
    failedCriteria.push(`confidence_below_${requiredConfidence}`);
  }
  
  return {
    valid: failedCriteria.length === 0,
    failedCriteria
  };
}

// Função para determinar se precisa de QA Refinement
function checkQARefinementNeed(
  stage: string,
  context: ExecutionContext
): boolean {
  // Stage 1: Trigger se completude < 80%
  if (stage === 'evidence_intake' && context.contextCompleteness < 80) {
    return true;
  }
  
  // Stage 2: Trigger se confiança do especialista < 70%
  if (stage === 'initial_analysis') {
    const avgConfidence = Object.values(context.stageConfidence).reduce((a, b) => a + b, 0) / 
                         Object.values(context.stageConfidence).length;
    if (avgConfidence < 70) {
      return true;
    }
  }
  
  // Stage 5: Disponível para clarificação de hipóteses
  if (stage === 'hypothesis_formation' && context.hypotheses.length === 0) {
    return true;
  }
  
  return false;
}

// Função para mapear tipo de investigação para variante do pipeline
function getPipelineVariant(investigationType: string): string[] {
  const variants: Record<string, string[]> = {
    rapid: [
      'evidence_intake',
      'initial_analysis',
      'hypothesis_formation',
      'final_assessment',
      'vault_commit'
    ],
    standard: STAGE_SEQUENCE,
    comprehensive: STAGE_SEQUENCE
  };
  
  return variants[investigationType] || variants.standard;
}

// Função principal de avanço de etapa
export function advanceStage(
  currentStage: string,
  context: ExecutionContext
): StageTransitionResult {
  // Obter definição da etapa atual
  const stage = PIPELINE_STAGES[currentStage];
  if (!stage) {
    return {
      nextStage: currentStage,
      completedTasks: context.completedTasks,
      errors: [`Stage '${currentStage}' não reconhecida`],
      stageStatus: 'failed'
    };
  }
  
  // Verificar completude de tarefas
  const taskCheck = checkTaskCompletion(stage.requiredTasks, context.completedTasks);
  if (!taskCheck.completed) {
    return {
      nextStage: currentStage,
      completedTasks: context.completedTasks,
      errors: [`Tarefas faltando: ${taskCheck.missing.join(', ')}`],
      stageStatus: 'failed'
    };
  }
  
  // Verificar critérios de validação
  const validationCheck = validateStageCriteria(stage, context);
  if (!validationCheck.valid) {
    // Verificar se precisa de QA Refinement
    const needsQA = checkQARefinementNeed(currentStage, context);
    
    return {
      nextStage: currentStage,
      completedTasks: context.completedTasks,
      errors: [`Critérios de validação falharam: ${validationCheck.failedCriteria.join(', ')}`],
      requiresQARefinement: needsQA,
      stageStatus: needsQA ? 'needs_refinement' : 'failed'
    };
  }
  
  // Determinar próxima etapa baseada no tipo de investigação
  const pipelineVariant = getPipelineVariant(context.investigationType);
  const currentIndex = pipelineVariant.indexOf(currentStage);
  
  if (currentIndex === -1) {
    return {
      nextStage: currentStage,
      completedTasks: context.completedTasks,
      errors: [`Stage '${currentStage}' não está na variante do pipeline '${context.investigationType}'`],
      stageStatus: 'failed'
    };
  }
  
  // Se é a última etapa
  if (currentIndex === pipelineVariant.length - 1) {
    return {
      nextStage: 'completed',
      completedTasks: context.completedTasks,
      stageStatus: 'completed'
    };
  }
  
  // Avançar para próxima etapa
  const nextStage = pipelineVariant[currentIndex + 1];
  
  // Verificar se a próxima etapa requer validação especial
  const requiresValidation = nextStage === 'cross_validation' || 
                            (stage.qualityGate === 'RIGOROUS' && nextStage !== 'vault_commit');
  
  return {
    nextStage,
    completedTasks: context.completedTasks,
    validationRequired: requiresValidation,
    stageStatus: 'completed'
  };
}

// Função auxiliar para obter informações sobre uma etapa
export function getStageInfo(stageId: string): StageDefinition | null {
  return PIPELINE_STAGES[stageId] || null;
}

// Função para verificar se pode pular para uma etapa específica
export function canSkipToStage(
  currentStage: string,
  targetStage: string,
  context: ExecutionContext
): { canSkip: boolean; reason?: string } {
  const currentIndex = STAGE_SEQUENCE.indexOf(currentStage);
  const targetIndex = STAGE_SEQUENCE.indexOf(targetStage);
  
  if (currentIndex === -1 || targetIndex === -1) {
    return { canSkip: false, reason: 'Etapa inválida' };
  }
  
  if (targetIndex <= currentIndex) {
    return { canSkip: false, reason: 'Não pode voltar para etapas anteriores' };
  }
  
  // Verificar se é uma investigação rápida que permite pular validação
  if (context.investigationType === 'rapid' && targetStage === 'cross_validation') {
    return { canSkip: true };
  }
  
  // Não pode pular etapas críticas em investigações standard/comprehensive
  const criticalStages = ['cross_validation', 'team_review'];
  if (context.investigationType !== 'rapid' && criticalStages.includes(targetStage)) {
    return { canSkip: false, reason: 'Etapa crítica não pode ser pulada' };
  }
  
  return { canSkip: true };
}

// Função para resetar o pipeline
export function resetPipeline(context: ExecutionContext): ExecutionContext {
  return {
    ...context,
    currentStage: 'evidence_intake',
    completedTasks: [],
    stageConfidence: {},
    validationResults: {},
    synthesis: {},
    hypotheses: [],
    teamConsensus: 0,
    conclusions: {}
  };
}

// Função para obter métricas do pipeline
export function getPipelineMetrics(context: ExecutionContext): {
  progress: number;
  averageConfidence: number;
  completedStages: string[];
  remainingStages: string[];
} {
  const variant = getPipelineVariant(context.investigationType);
  const currentIndex = variant.indexOf(context.currentStage);
  const progress = currentIndex === -1 ? 0 : ((currentIndex + 1) / variant.length) * 100;
  
  const confidenceValues = Object.values(context.stageConfidence);
  const averageConfidence = confidenceValues.length > 0
    ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
    : 0;
  
  const completedStages = variant.slice(0, currentIndex + 1);
  const remainingStages = variant.slice(currentIndex + 1);
  
  return {
    progress,
    averageConfidence,
    completedStages,
    remainingStages
  };
}