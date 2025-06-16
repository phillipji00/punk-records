# 🔥 Syndicate v3.1 - Sistema de Investigação Narrativa

**Versão**: 3.1.0  
**Data**: 15 de Junho de 2025  
**Status**: Produção  

---

## 📋 Sumário

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Pipeline de Investigação](#pipeline-de-investigação)
4. [Especialistas e Personas](#especialistas-e-personas)
5. [Módulos Core](#módulos-core)
6. [Sistema de Validação](#sistema-de-validação)
7. [Triggers e Automação](#triggers-e-automação)
8. [Fluxo de Execução](#fluxo-de-execução)
9. [Guia de Uso](#guia-de-uso)
10. [API Reference](#api-reference)

---

## 🎯 Visão Geral

O **Syndicate v3.1** é um sistema avançado de investigação narrativa que simula uma equipe de especialistas trabalhando em conjunto para resolver casos complexos. O sistema combina:

- **Narrativa Rica**: Cada especialista mantém sua personalidade única
- **Pipeline Estruturado**: 8 etapas bem definidas de investigação
- **Automação Inteligente**: Triggers que respondem a condições específicas
- **Validação Rigorosa**: Sistema multi-camada de validação de dados
- **Recuperação Inteligente**: Mecanismos de retry e refinamento

### Filosofia Central

> "Fire Force cuida de Fire Force" - Capitão Obi

O sistema é baseado na colaboração entre especialistas, cada um trazendo sua expertise única para resolver investigações complexas.

---

## 🏗️ Arquitetura do Sistema

### Componentes Principais

```
┌─────────────────────────────────────────────────────────┐
│                   Runtime Orchestrator                   │
│  (Coordena todo o fluxo e gerencia o pipeline)         │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┬─────────────────────┐
        │                         │                     │
┌───────▼────────┐      ┌────────▼────────┐   ┌───────▼────────┐
│ Pipeline       │      │ Trigger         │   │ Specialist     │
│ Engine         │      │ Engine          │   │ Engine         │
│                │      │                 │   │                │
│ • 8 Etapas     │      │ • Rules.yaml    │   │ • 5 Personas   │
│ • QA Gates     │      │ • Auto Actions  │   │ • Q&A Refiner  │
│ • Retry Logic  │      │ • Conditions    │   │ • Templates    │
└────────────────┘      └─────────────────┘   └────────────────┘
        │                         │                     │
        └─────────────────────────┴─────────────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │   Validation System        │
                    │                            │
                    │ • Schema Validator         │
                    │ • Review Engine            │
                    │ • Cross Validation         │
                    └────────────────────────────┘
```

### Fluxo de Dados

```
IngestEvent → RuntimeOrchestrator → ExecutionContext
                    ↓
            TriggerEngine (avalia regras)
                    ↓
            ExecuteTriggerActions
                    ↓
            PipelineEngine (avança etapas)
                    ↓
            SpecialistEngine (análises)
                    ↓
            ValidationSystem (validações)
                    ↓
            RetryEngine (se necessário)
                    ↓
            Resultado Final
```

---

## 📊 Pipeline de Investigação

O sistema possui **8 etapas sequenciais**, cada uma com critérios específicos de qualidade:

### 1. **Evidence Intake & Classification** (`intake_analysis`)
- **Objetivo**: Coletar e classificar evidências iniciais
- **Confiança Mínima**: 60% (BASIC)
- **Tarefas**: 
  - initial_assessment
  - context_gap_analysis
  - specialist_selection
- **Trigger QA**: Se contextCompleteness < 80%

### 2. **Initial Specialist Analysis** (`task_delegation`)
- **Objetivo**: Análise inicial por especialistas
- **Confiança Mínima**: 80% (STANDARD)
- **Tarefas**:
  - specialist_activation
  - parallel_analysis
  - confidence_assessment
- **Especialistas**: Ativados conforme domínio

### 3. **Cross-Validation Round** (`collaborative_review`)
- **Objetivo**: Validação cruzada entre especialistas
- **Confiança Mínima**: 95% (RIGOROUS)
- **Validação**: Matrix 26x1 obrigatória
- **Review Engine**: Ativo para todas análises

### 4. **Synthesis & Correlation** (`synthesis`)
- **Objetivo**: Integrar descobertas
- **Confiança Mínima**: 80% (STANDARD)
- **Tarefas**:
  - finding_integration
  - correlation_identification
  - insight_generation

### 5. **Hypothesis Formation** (`hypothesis_formation`)
- **Objetivo**: Formar hipóteses baseadas em evidências
- **Confiança Mínima**: 80% (STANDARD)
- **Tarefas**:
  - hypothesis_development
  - probability_assessment
  - evidence_mapping

### 6. **Team Review & Debate** (`review`)
- **Objetivo**: Debate estruturado entre especialistas
- **Confiança Mínima**: 95% (RIGOROUS)
- **Critério Especial**: teamConsensus >= 90%

### 7. **Final Assessment** (`final_assessment`)
- **Objetivo**: Consolidação final
- **Confiança Mínima**: 95% (RIGOROUS)
- **Validação Final**: Completa

### 8. **Vault Commit & Documentation** (`archival`)
- **Objetivo**: Arquivar aprendizados
- **Confiança Mínima**: 60% (BASIC)
- **Persistência**: Memória de longo prazo

### Variantes do Pipeline

- **Rapid**: 5 etapas (pula validação e debate)
- **Standard**: 8 etapas completas
- **Comprehensive**: 8 etapas com thresholds elevados

---

## 👥 Especialistas e Personas

### 1. **Capitão Akitaru Obi** - Orquestrador de Missão
- **ID**: `orquestrador_missao`
- **Papel**: Líder da equipe, coordenador
- **Características**:
  - Liderança servidora
  - Comunicação direta mas calorosa
  - Filosofia "Fire Force cuida de Fire Force"
- **Ativação**: Sempre presente como coordenador

### 2. **L Lawliet** - Estrategista Chefe
- **ID**: `estrategista_chefe`
- **Papel**: Análise estratégica e lógica
- **Características**:
  - Raciocínio dedutivo excepcional
  - Consumo de doces durante análise
  - Postura característica
- **Triggers**: estratégia, hipótese, probabilidade, dedução

### 3. **Senku Ishigami** - Analista Forense
- **ID**: `analista_forense`
- **Papel**: Análise científica e histórica
- **Características**:
  - "10 bilhões por cento" de entusiasmo
  - Método científico rigoroso
  - Expertise em história e ciência
- **Triggers**: evidência, documento, científico, histórico

### 4. **Norman** - Analista Comportamental
- **ID**: `analista_comportamental`
- **Papel**: Psicologia e comportamento
- **Características**:
  - Análise psicológica profunda
  - Detecção de padrões comportamentais
  - Considerações éticas
- **Triggers**: comportamento, psicológico, motivação, perfil

### 5. **Isagi Yoichi** - Analista Espacial
- **ID**: `analista_espacial`
- **Papel**: Otimização e estratégia tática
- **Características**:
  - Visão de campo ativa
  - Otimização de recursos
  - Análise espacial/tática
- **Triggers**: otimizar, eficiência, recursos, tático

---

## 🔧 Módulos Core

### 1. **Runtime Orchestrator**
```typescript
class RuntimeOrchestrator {
  orchestrate(event: IngestEvent): Promise<OrchestrationResult>
}
```
- Ponto de entrada principal
- Coordena todo o fluxo
- Gerencia callbacks e estado

### 2. **Pipeline Engine**
```typescript
advanceStage(currentStage: string, context: ExecutionContext): StageTransitionResult
getStageInfo(stageId: string): StageInfo
canSkipToStage(currentStage: string, targetStage: string, context: ExecutionContext): boolean
```
- Gerencia progressão entre etapas
- Valida critérios de qualidade
- Suporta diferentes variantes

### 3. **Obi State Manager**
```typescript
decidirAcaoObi(context: ExecutionContext): ObiCommand[]
interpretarEstadoEmocional(context: ExecutionContext): EmotionalState
diagnosticarSistema(context: ExecutionContext): ObiSystemDiagnosis
```
- Inteligência do Capitão Obi
- Decisões de coordenação
- Diagnóstico sistêmico

### 4. **Specialist Engine**
```typescript
gerarAnaliseEspecialista(context: ExecutionContext): AnaliseEspecialista
generateRefinementQuestions(input: RefinementInput): RefinementQuestion[]
generatePromptForPersona(persona: string, context: ExecutionContext): string
```
- Interface com especialistas
- Sistema Q&A para refinamento
- Templates narrativos personalizados

### 5. **Retry Engine**
```typescript
avaliarRetry(input: RetryInput): RetryResponse
avaliarForcaConclusao(tentativasGlobais: number, confiancaAtual?: number): boolean
aplicarModificacoesRetry(context: RuntimeExecutionContext, resposta: RetryResponse): Promise<void>
```
- 7 categorias de falha
- Estratégias específicas de recuperação
- Limites adaptativos

---

## 🛡️ Sistema de Validação

### Schema Validator
```typescript
validateAgainstSchema(schemaId: string, data: any): ValidationResult
```
- Validação contra schemas JSON compilados
- Cache de validators para performance
- Mensagens de erro contextualizadas

### Review Engine
```typescript
reviewAnalysis(input: ReviewInput): ReviewResult
```
- Validação cruzada entre especialistas
- Matriz de complementaridade
- Critérios específicos por revisor

### Schemas Suportados
- `strategic_analysis_schema` (L)
- `forensic_analysis_schema` (Senku)
- `psychological_analysis_schema` (Norman)
- `tactical_analysis_schema` (Isagi)
- `coordination_report_schema` (Obi)
- `cross_validation_result`
- `vault_record_schema`

---

## ⚡ Triggers e Automação

### Trigger Engine
```typescript
evaluateTriggers(context: ExecutionContext): TriggerEvaluationResult
```

### Estrutura de Regras (rules.yaml)
```yaml
rules:
  - id: rule_id
    trigger:
      event: tipo_registro
      conditions:
        - field: campo
          operator: "=="
          value: valor
    actions:
      - type: action_type
        params: {...}
```

### Tipos de Ação
1. **log** - Registra mensagem
2. **activate_specialist** - Ativa especialista
3. **advance_pipeline** - Avança etapa
4. **modify_score** - Modifica probabilidade
5. **halt_pipeline** - Para pipeline
6. **activate_protocol** - Ativa protocolo
7. **cross_validation** - Validação cruzada
8. **task_creation** - Cria tarefa
9. **memory_update** - Atualiza memória
10. **state_transition** - Transição de estado

---

## 🔄 Fluxo de Execução

### 1. Evento de Entrada
```typescript
const event: IngestEvent = {
  id: "evt-001",
  timestamp: "2025-06-15T10:00:00Z",
  tipo_registro: "hipotese",
  autor: "estrategista_chefe",
  dados: { probabilidade: 85 },
  etapa: "intake_analysis",
  id_caso: "caso-001"
};
```

### 2. Processamento
1. **Validação** do evento
2. **Construção** do ExecutionContext
3. **Avaliação** de triggers
4. **Execução** de ações
5. **Validação** de schemas
6. **Análise** por especialistas
7. **Revisão** cruzada
8. **Avanço** do pipeline

### 3. Resultado
```typescript
{
  success: true,
  context: {...},
  triggered: ["rule1", "rule2"],
  actions: [...],
  novaEtapa: "task_delegation",
  warnings: []
}
```

---

## 📖 Guia de Uso

### Instalação
```bash
npm install @syndicate/core
```

### Uso Básico
```typescript
import { RuntimeOrchestrator } from '@syndicate/core';

// Criar orquestrador
const orchestrator = new RuntimeOrchestrator(true); // debug mode

// Criar evento
const event: IngestEvent = {
  // ... dados do evento
};

// Executar
const result = await orchestrator.orchestrate(event);
```

### Análise com Especialista
```typescript
import { gerarAnaliseEspecialista } from '@syndicate/core';

const context = {
  autor: "L",
  contextoNarrativo: "Evidências apontam para fraude...",
  probabilidade: 0.75,
  // ... outros campos
};

const analise = gerarAnaliseEspecialista(context);
console.log(analise.analise.hipotese);
```

### Refinamento com Q&A
```typescript
import { generateRefinementQuestions } from '@syndicate/core';

if (context.probabilidade < 0.8) {
  const questions = generateRefinementQuestions({
    specialist: context.autor,
    context: context.contextoNarrativo,
    currentConfidence: context.probabilidade * 100
  });
  
  // Apresentar perguntas ao usuário
  questions.forEach(q => console.log(q.question));
}
```

---

## 📚 API Reference

### Tipos Principais

#### IngestEvent
```typescript
interface IngestEvent {
  id: string;
  timestamp: string;
  tipo_registro: TipoRegistro;
  autor: string;
  dados: Record<string, any>;
  etapa?: string;
  id_caso: string;
  trace_id?: string;
}
```

#### ExecutionContext
```typescript
interface ExecutionContext {
  idRegistro: string;
  contexto: string;
  autor: string;
  etapa: string;
  especialista: string;
  idCaso: string;
  timestamp: string;
  probabilidade?: number;
  // callbacks
  log: (msg: string) => void;
  advancePipeline: (toStage: string) => void;
  activateSpecialist: (id: string) => Promise<void>;
  activateProtocol: (name: string) => Promise<void>;
  modifyScore: (field: string, adjustment: number) => void;
  haltPipeline: (reason: string) => void;
}
```

#### AnaliseEspecialista
```typescript
interface AnaliseEspecialista {
  especialista: string;
  analise: {
    hipotese: string;
    justificativa: string;
    nivel_confianca: number;
    acoes_recomendadas: string[];
  };
}
```

### Constantes

```typescript
// Especialistas
ESPECIALISTAS.ORQUESTRADOR = 'orquestrador_missao'
ESPECIALISTAS.ESTRATEGISTA = 'estrategista_chefe'
ESPECIALISTAS.FORENSE = 'analista_forense'
ESPECIALISTAS.COMPORTAMENTAL = 'analista_comportamental'
ESPECIALISTAS.ESPACIAL = 'analista_espacial'

// Etapas do Pipeline
ETAPAS_PIPELINE.INTAKE = 'intake_analysis'
ETAPAS_PIPELINE.DELEGATION = 'task_delegation'
ETAPAS_PIPELINE.VALIDATION = 'collaborative_review'
ETAPAS_PIPELINE.SYNTHESIS = 'synthesis'
ETAPAS_PIPELINE.HYPOTHESIS = 'hypothesis_formation'
ETAPAS_PIPELINE.REVIEW = 'review'
ETAPAS_PIPELINE.ASSESSMENT = 'final_assessment'
ETAPAS_PIPELINE.ARCHIVAL = 'archival'

// Tipos de Registro
TIPOS_REGISTRO = [
  'hipotese',
  'evidencia',
  'perfil_personagem',
  'entrada_timeline',
  'registro_misc',
  'cross_validation_result',
  'ingest'
]
```

---

## 🚀 Características Avançadas

### 1. **Modo Debug**
```typescript
const orchestrator = new RuntimeOrchestrator(true);
// Logs detalhados para desenvolvimento
```

### 2. **Variantes de Pipeline**
```typescript
context.investigationType = 'rapid'; // ou 'standard', 'comprehensive'
```

### 3. **Comandos de Escape**
```typescript
// Em Q&A Refinement
userCommand: "prossiga com o que tem"
```

### 4. **Cache de Performance**
- Validators compilados
- Rules com TTL 5 min
- Templates pré-carregados

### 5. **Recuperação Inteligente**
- 7 categorias de falha
- Estratégias específicas
- Cooldown progressivo

---

## 📈 Métricas e Monitoramento

### Pipeline Metrics
```typescript
const metrics = getPipelineMetrics(context);
// {
//   progress: 25,
//   averageConfidence: 83.5,
//   completedStages: [...],
//   remainingStages: [...]
// }
```

### System Diagnosis
```typescript
const diagnostico = diagnosticarSistema(context);
// {
//   statusGeral: 'operacional',
//   confiancaSistema: 85,
//   especialistasRecomendados: [...],
//   alertas: []
// }
```

---

## 🔒 Segurança e Validação

1. **Validação Multi-camada**
   - Event validation
   - Schema validation
   - Context validation
   - Cross-validation

2. **Type Guards**
   - `isValidIngestEvent()`
   - `isValidTipoRegistro()`
   - `isValidProbabilidade()`

3. **Sanitização**
   - Input sanitization
   - Depth limits
   - Type confusion prevention

---

## 🎯 Melhores Práticas

1. **Sempre valide eventos** antes de processar
2. **Use modo debug** em desenvolvimento
3. **Monitore métricas** de pipeline
4. **Implemente todos callbacks** no ExecutionContext
5. **Use comandos de escape** quando apropriado
6. **Cache validators** para performance
7. **Documente triggers customizados**
8. **Teste edge cases** com retry engine

---

## 🔮 Roadmap Futuro

1. **Machine Learning Integration**
   - Predição de falhas
   - Otimização de triggers
   - Aprendizado de padrões

2. **Análise Preditiva**
   - Antecipação de problemas
   - Sugestões proativas
   - Otimização automática

3. **Multi-language Support**
   - Triggers em múltiplos idiomas
   - Templates localizados
   - NLP avançado

4. **Dashboard Visual**
   - Monitoramento em tempo real
   - Visualização do pipeline
   - Analytics detalhado

---

## 📞 Suporte

- **Documentação**: `/docs/modules/`
- **Exemplos**: `/examples/`
- **Issues**: GitHub Issues
- **Comunidade**: Discord Syndicate

---

**Syndicate v3.1** - *"Fire Force cuida de Fire Force!"* 🔥

© 2025 Syndicate Investigation System. MIT License.