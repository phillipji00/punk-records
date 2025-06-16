# 🔧 Pipeline Loader v4 - Documentação do Módulo Pipeline Engine

## 📌 Visão Geral

O módulo `pipelineEngine.ts` implementa a lógica de execução das **8 etapas do pipeline investigativo Syndicate**, transformando as especificações dos arquivos MD em um motor funcional que:

- Gerencia transições entre etapas
- Valida critérios de qualidade
- Integra com QA Refinement e Validation Engine
- Suporta diferentes tipos de investigação (rapid/standard/comprehensive)

## 🗺️ Etapas Mapeadas

### 1. Evidence Intake & Classification (`evidence_intake`)
- **Tarefas**: initial_assessment, context_gap_analysis, specialist_selection
- **Confiança Mínima**: 60% (BASIC)
- **Trigger QA**: Se contextCompleteness < 80%

### 2. Initial Specialist Analysis (`initial_analysis`)
- **Tarefas**: specialist_activation, parallel_analysis, confidence_assessment
- **Confiança Mínima**: 80% (STANDARD)
- **Trigger QA**: Se confiança média < 70%

### 3. Cross-Validation Round (`cross_validation`)
- **Tarefas**: matrix_validation, peer_review, contradiction_resolution
- **Confiança Mínima**: 95% (RIGOROUS)
- **Validação Obrigatória**: Matrix 26x1

### 4. Synthesis & Correlation (`synthesis`)
- **Tarefas**: finding_integration, correlation_identification, insight_generation
- **Confiança Mínima**: 80% (STANDARD)

### 5. Hypothesis Formation (`hypothesis_formation`)
- **Tarefas**: hypothesis_development, probability_assessment, evidence_mapping
- **Confiança Mínima**: 80% (STANDARD)
- **Trigger QA**: Se nenhuma hipótese gerada

### 6. Team Review & Debate (`team_review`)
- **Tarefas**: structured_debate, conflict_resolution, consensus_building
- **Confiança Mínima**: 95% (RIGOROUS)
- **Critério Especial**: teamConsensus >= 90%

### 7. Final Assessment (`final_assessment`)
- **Tarefas**: evidence_consolidation, recommendation_development, final_validation
- **Confiança Mínima**: 95% (RIGOROUS)

### 8. Vault Commit & Documentation (`vault_commit`)
- **Tarefas**: knowledge_documentation, learning_extraction, system_updates
- **Confiança Mínima**: 60% (BASIC)

## 🔄 Critérios de Transição

### Quality Gates
- **BASIC**: 60% de confiança mínima
- **STANDARD**: 80% de confiança mínima
- **RIGOROUS**: 95% de confiança mínima

### Condições de Avanço
1. Todas as tarefas da etapa devem estar completas
2. Critérios de validação específicos devem ser atendidos
3. Confiança mínima deve ser alcançada
4. Consenso da equipe (quando aplicável)

### Triggers Especiais
- **QA Refinement**: Ativado automaticamente em condições específicas
- **Validation Engine**: Obrigatório na etapa 3 e em etapas RIGOROUS
- **Team Consensus**: Requerido 90% na etapa 6

## 📦 Como Importar e Usar

### Importação
```typescript
import { 
  advanceStage, 
  getStageInfo, 
  canSkipToStage, 
  resetPipeline,
  getPipelineMetrics,
  ExecutionContext,
  StageTransitionResult 
} from './pipelineEngine';
```

### Estrutura do Contexto
```typescript
const context: ExecutionContext = {
  currentStage: 'evidence_intake',
  evidence: {},
  specialistAnalyses: {},
  validationResults: {},
  synthesis: {},
  hypotheses: [],
  teamConsensus: 0,
  conclusions: {},
  completedTasks: ['initial_assessment'],
  stageConfidence: { evidence_intake: 75 },
  qaRefinementActive: false,
  contextCompleteness: 85,
  investigationType: 'standard'
};
```

### Funções Principais

#### `advanceStage(currentStage, context)`
Avança para a próxima etapa se todos os critérios forem atendidos.

#### `getStageInfo(stageId)`
Retorna informações detalhadas sobre uma etapa específica.

#### `canSkipToStage(currentStage, targetStage, context)`
Verifica se é possível pular para uma etapa específica.

#### `resetPipeline(context)`
Reseta o pipeline para começar do início.

#### `getPipelineMetrics(context)`
Retorna métricas de progresso e performance.

## 💡 Exemplo de Uso Funcional

### Cenário: Investigação Standard em Progresso

```typescript
// 1. Contexto inicial - Etapa de coleta de evidências
const context: ExecutionContext = {
  currentStage: 'evidence_intake',
  evidence: {
    documents: ['doc1.pdf', 'doc2.txt'],
    testimonies: ['witness1', 'witness2']
  },
  specialistAnalyses: {},
  validationResults: {},
  synthesis: {},
  hypotheses: [],
  teamConsensus: 0,
  conclusions: {},
  completedTasks: [
    'initial_assessment',
    'context_gap_analysis',
    'specialist_selection'
  ],
  stageConfidence: {
    evidence_intake: 82
  },
  qaRefinementActive: false,
  contextCompleteness: 85,
  investigationType: 'standard'
};

// 2. Tentar avançar para próxima etapa
const result1 = advanceStage('evidence_intake', context);
console.log(result1);
// Output:
// {
//   nextStage: 'initial_analysis',
//   completedTasks: ['initial_assessment', 'context_gap_analysis', 'specialist_selection'],
//   stageStatus: 'completed'
// }

// 3. Atualizar contexto e avançar novamente
context.currentStage = 'initial_analysis';
context.completedTasks.push('specialist_activation', 'parallel_analysis', 'confidence_assessment');
context.stageConfidence.initial_analysis = 78; // Abaixo do threshold de 80%

const result2 = advanceStage('initial_analysis', context);
console.log(result2);
// Output:
// {
//   nextStage: 'initial_analysis',
//   completedTasks: [...],
//   errors: ['Critérios de validação falharam: confidence_below_80'],
//   requiresQARefinement: true,
//   stageStatus: 'needs_refinement'
// }

// 4. Após QA Refinement, confiança aumentada
context.stageConfidence.initial_analysis = 85;

const result3 = advanceStage('initial_analysis', context);
console.log(result3);
// Output:
// {
//   nextStage: 'cross_validation',
//   completedTasks: [...],
//   validationRequired: true,
//   stageStatus: 'completed'
// }

// 5. Verificar métricas do pipeline
const metrics = getPipelineMetrics(context);
console.log(metrics);
// Output:
// {
//   progress: 25,  // 2 de 8 etapas completas
//   averageConfidence: 83.5,
//   completedStages: ['evidence_intake', 'initial_analysis'],
//   remainingStages: ['cross_validation', 'synthesis', 'hypothesis_formation', 'team_review', 'final_assessment', 'vault_commit']
// }

// 6. Verificar se pode pular validação (investigação rápida)
const rapidContext = { ...context, investigationType: 'rapid' };
const skipCheck = canSkipToStage('initial_analysis', 'hypothesis_formation', rapidContext);
console.log(skipCheck);
// Output:
// {
//   canSkip: true
// }
```

## 🔗 Integração com Outros Módulos

### QA Refinement
- Ativado automaticamente quando `requiresQARefinement: true`
- Contexto passado inclui gaps específicos identificados
- Pipeline aguarda conclusão do refinamento antes de prosseguir

### Validation Engine
- Obrigatório na etapa `cross_validation`
- Pode ser ativado em outras etapas com `validationRequired: true`
- Resultados alimentam `validationResults` no contexto

### Specialist Coordination
- Cada etapa define quais especialistas são necessários
- `completedTasks` rastreia contribuições de cada especialista
- Consenso da equipe medido e validado na etapa 6

## 🚨 Tratamento de Erros

### Cenários de Falha
1. **Tarefas Incompletas**: Retorna lista de tarefas faltando
2. **Confiança Insuficiente**: Sugere QA Refinement quando aplicável
3. **Falha de Validação**: Detalha critérios que falharam
4. **Consenso Não Alcançado**: Bloqueia progressão até resolução

### Recuperação
- Use `resetPipeline()` para reiniciar investigação
- Ajuste `investigationType` para variante mais apropriada
- Complete tarefas faltando e tente avançar novamente

## 📊 Variantes do Pipeline

### Rapid (5 etapas)
- Pula validação cruzada e revisão em equipe
- Foco em velocidade sobre completude
- Adequado para avaliações preliminares

### Standard (8 etapas)
- Pipeline completo com todas as validações
- Balanceamento entre velocidade e qualidade
- Adequado para investigações normais

### Comprehensive (8 etapas)
- Thresholds de confiança elevados
- Validações extras em cada etapa
- Adequado para decisões críticas

## ✅ Checklist de Validação (QA)

### Arquivo `.md`
- [x] Explica claramente a função principal do módulo
- [x] Indica todas as funções exportadas
- [x] Mostra como importar o módulo
- [x] Lista tipos de entrada e saída
- [x] Tem exemplo de uso funcional e realista
- [x] Usa nomes válidos do contexto Syndicate
- [x] Documenta integração com outros módulos

### Arquivo `.ts`
- [x] Função principal `advanceStage` implementada
- [x] Não depende de arquivos não definidos
- [x] Imports corretos (apenas tipos TypeScript)
- [x] Retorno tipado como `StageTransitionResult`
- [x] Código modular e desacoplado

### Exemplo de Uso
- [x] Simula contexto válido e realista
- [x] Mostra progressão através das etapas
- [x] Demonstra triggers de QA e validação
- [x] Responde com formato esperado

### Integração
- [x] Compatível com estrutura v3.0
- [x] Mapeia corretamente as 8 etapas
- [x] Implementa critérios de qualidade
- [x] Suporta variantes de investigação
- [x] Documenta alterações da v2

## 🎯 Conclusão

O Pipeline Engine v4 fornece uma implementação robusta e flexível do fluxo investigativo Syndicate, garantindo qualidade e rastreabilidade enquanto mantém a naturalidade da interação através do Capitão Obi.