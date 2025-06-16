// tests/pipelineEngine.test.ts
import {
  advanceStage,
  getStageInfo,
  canSkipToStage,
  resetPipeline,
  getPipelineMetrics,
  ExecutionContext
  // StageTransitionResult removido - não usado
} from '../src/pipelineEngine';

// Função auxiliar para criar um contexto de teste
function createTestContext(overrides?: Partial<ExecutionContext>): ExecutionContext {
  return {
    currentStage: 'evidence_intake',
    evidence: {},
    specialistAnalyses: {},
    validationResults: {},
    synthesis: {},
    hypotheses: [],
    teamConsensus: 0,
    conclusions: {},
    completedTasks: [],
    stageConfidence: {},
    qaRefinementActive: false,
    contextCompleteness: 50,
    investigationType: 'standard',
    ...overrides
  };
}

describe('Pipeline Engine - Testes Básicos', () => {
  
  // TESTE 1: Verificar se consegue avançar quando tudo está certo
  test('Deve avançar da etapa 1 para etapa 2 quando critérios são atendidos', () => {
    // Arrange (Preparar)
    const context = createTestContext({
      currentStage: 'evidence_intake',
      completedTasks: [
        'initial_assessment',
        'context_gap_analysis', 
        'specialist_selection'
      ],
      stageConfidence: { evidence_intake: 65 },
      contextCompleteness: 85
    });

    // Act (Executar)
    const result = advanceStage('evidence_intake', context);

    // Assert (Verificar)
    expect(result.nextStage).toBe('initial_analysis');
    expect(result.stageStatus).toBe('completed');
    expect(result.errors).toBeUndefined();
  });

  // TESTE 2: Verificar se bloqueia quando faltam tarefas
  test('Não deve avançar quando faltam tarefas', () => {
    // Arrange
    const context = createTestContext({
      currentStage: 'evidence_intake',
      completedTasks: ['initial_assessment'], // Faltam 2 tarefas!
      stageConfidence: { evidence_intake: 65 },
      contextCompleteness: 85
    });

    // Act
    const result = advanceStage('evidence_intake', context);

    // Assert
    expect(result.nextStage).toBe('evidence_intake'); // Continua na mesma
    expect(result.stageStatus).toBe('failed');
    expect(result.errors).toContain('Tarefas faltando: context_gap_analysis, specialist_selection');
  });

  // TESTE 3: Verificar se ativa QA Refinement quando contexto incompleto
  test('Deve solicitar QA Refinement quando contexto < 80%', () => {
    // Arrange
    const context = createTestContext({
      currentStage: 'evidence_intake',
      completedTasks: [
        'initial_assessment',
        'context_gap_analysis',
        'specialist_selection'
      ],
      stageConfidence: { evidence_intake: 65 },
      contextCompleteness: 75 // Menor que 80%!
    });

    // Act
    const result = advanceStage('evidence_intake', context);

    // Assert
    expect(result.requiresQARefinement).toBe(true);
    expect(result.stageStatus).toBe('needs_refinement');
  });

  // TESTE 4: Verificar informações de uma etapa
  test('Deve retornar informações corretas da etapa', () => {
    // Act
    const stageInfo = getStageInfo('cross_validation');

    // Assert
    expect(stageInfo).not.toBeNull();
    expect(stageInfo?.name).toBe('Cross-Validation Round');
    expect(stageInfo?.minimumConfidence).toBe(95);
    expect(stageInfo?.qualityGate).toBe('RIGOROUS');
  });

  // TESTE 5: Verificar se investigação rápida pode pular validação
  test('Investigação rápida deve poder pular validação cruzada', () => {
    // Arrange
    const context = createTestContext({
      investigationType: 'rapid',
      currentStage: 'initial_analysis'
    });

    // Act
    const result = canSkipToStage('initial_analysis', 'hypothesis_formation', context);

    // Assert
    expect(result.canSkip).toBe(true);
  });

  // TESTE 6: Verificar métricas de progresso
  test('Deve calcular métricas corretamente', () => {
    // Arrange
    const context = createTestContext({
      currentStage: 'synthesis', // 4ª etapa
      stageConfidence: {
        evidence_intake: 85,
        initial_analysis: 90,
        cross_validation: 95,
        synthesis: 88
      },
      investigationType: 'standard'
    });

    // Act
    const metrics = getPipelineMetrics(context);

    // Assert
    expect(metrics.progress).toBe(50); // 4 de 8 = 50%
    expect(metrics.averageConfidence).toBe(89.5); // Média das confianças
    expect(metrics.completedStages).toHaveLength(4);
    expect(metrics.remainingStages).toHaveLength(4);
  });

  // TESTE 7: Verificar reset do pipeline
  test('Deve resetar o pipeline corretamente', () => {
    // Arrange
    const context = createTestContext({
      currentStage: 'team_review',
      completedTasks: ['task1', 'task2', 'task3'],
      stageConfidence: { team_review: 90 },
      hypotheses: [{ id: '1', description: 'Test', confidence: 80, supportingEvidence: [] }]
    });

    // Act
    const resetContext = resetPipeline(context);

    // Assert
    expect(resetContext.currentStage).toBe('evidence_intake');
    expect(resetContext.completedTasks).toHaveLength(0);
    expect(resetContext.hypotheses).toHaveLength(0);
    expect(resetContext.stageConfidence).toEqual({});
  });

  // TESTE 8: Verificar consenso da equipe
  test('Não deve avançar de team_review sem consenso de 90%', () => {
    // Arrange
    const context = createTestContext({
      currentStage: 'team_review',
      completedTasks: [
        'structured_debate',
        'conflict_resolution',
        'consensus_building'
      ],
      stageConfidence: { team_review: 95 },
      teamConsensus: 85 // Menor que 90%!
    });

    // Act
    const result = advanceStage('team_review', context);

    // Assert
    expect(result.stageStatus).toBe('failed');
    expect(result.errors).toContain('Critérios de validação falharam: consensus_threshold');
  });

  // TESTE 9: Verificar conclusão da investigação
  test('Deve marcar como completo após última etapa', () => {
    // Arrange
    const context = createTestContext({
      currentStage: 'vault_commit',
      completedTasks: [
        'knowledge_documentation',
        'learning_extraction',
        'system_updates'
      ],
      stageConfidence: { vault_commit: 65 }
    });

    // Act
    const result = advanceStage('vault_commit', context);

    // Assert
    expect(result.nextStage).toBe('completed');
    expect(result.stageStatus).toBe('completed');
  });
});

describe('Pipeline Engine - Cenários Complexos', () => {
  
  // TESTE 10: Fluxo completo de investigação rápida
  test('Deve completar investigação rápida pulando etapas', () => {
    let context = createTestContext({
      investigationType: 'rapid',
      contextCompleteness: 85
    });

    // Etapa 1: Evidence Intake
    context.completedTasks = ['initial_assessment', 'context_gap_analysis', 'specialist_selection'];
    context.stageConfidence.evidence_intake = 70;
    let result = advanceStage('evidence_intake', context);
    expect(result.nextStage).toBe('initial_analysis');

    // Etapa 2: Initial Analysis
    context.currentStage = 'initial_analysis';
    context.completedTasks.push('specialist_activation', 'parallel_analysis', 'confidence_assessment');
    context.stageConfidence.initial_analysis = 85;
    result = advanceStage('initial_analysis', context);
    expect(result.nextStage).toBe('hypothesis_formation'); // Pulou validação!

    // Etapa 3: Hypothesis Formation
    context.currentStage = 'hypothesis_formation';
    context.completedTasks.push('hypothesis_development', 'probability_assessment', 'evidence_mapping');
    context.stageConfidence.hypothesis_formation = 82;
    context.hypotheses = [
      { id: '1', description: 'Hipótese principal', confidence: 85, supportingEvidence: ['ev1'] }
    ];
    result = advanceStage('hypothesis_formation', context);
    expect(result.nextStage).toBe('final_assessment');

    // Verificar que realmente pulou etapas
    const metrics = getPipelineMetrics(context);
    expect(metrics.remainingStages).toEqual(['final_assessment', 'vault_commit']);
  });
});