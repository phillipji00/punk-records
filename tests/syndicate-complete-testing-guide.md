# 🧪 Guia Completo de Testes - Syndicate v3

## 📚 Índice

1. [Introdução](#introdução)
2. [Preparação do Ambiente](#preparação-do-ambiente)
3. [Visão Geral dos Módulos](#visão-geral-dos-módulos)
4. [Guias de Teste por Módulo](#guias-de-teste-por-módulo)
   - [Pipeline Engine](#1-pipeline-engine)
   - [OBI State Manager](#2-obi-state-manager)
   - [Retry Engine](#3-retry-engine)
   - [Specialists Engine](#4-specialists-engine)
   - [Review Engine](#5-review-engine)
   - [Core Runtime](#6-core-runtime)
5. [Suite de Testes Completa](#suite-de-testes-completa)
6. [Troubleshooting](#troubleshooting)
7. [Referência Rápida](#referência-rápida)

---

## 🎯 Introdução

### O que é o Syndicate v3?

O Syndicate v3 é um sistema de investigação inteligente que coordena cinco especialistas virtuais para analisar e resolver casos complexos. Este guia ensina como testar cada módulo do sistema.

### Por que testar?

Testes garantem que:
- ✅ O código funciona corretamente
- ✅ Mudanças não quebram funcionalidades existentes
- ✅ O sistema é confiável para produção
- ✅ Você entende como cada parte funciona

### Para quem é este guia?

Este guia foi escrito para **iniciantes completos**. Não é necessário conhecimento prévio de programação ou testes.

---

## 🛠️ Preparação do Ambiente

### Passo 1: Instalar Node.js

1. **Acesse**: https://nodejs.org/
2. **Baixe**: Versão "LTS" (mais estável)
3. **Instale**: Siga o instalador
4. **Verifique**: Abra o terminal e digite:
   ```bash
   node --version
   ```
   Deve aparecer algo como: `v18.17.0`

### Passo 2: Instalar VS Code (Editor)

1. **Acesse**: https://code.visualstudio.com/
2. **Baixe** e instale
3. **Abra** o VS Code

### Passo 3: Criar Estrutura do Projeto

```bash
# Criar pasta principal
mkdir syndicate-v3
cd syndicate-v3

# Criar estrutura de pastas
mkdir -p src/modules
mkdir -p src/types
mkdir -p src/tests
mkdir -p lib/types
```

### Passo 4: Configurar o Projeto

1. **Criar package.json**:
   ```bash
   npm init -y
   ```

2. **Instalar dependências de teste**:
   ```bash
   npm install --save-dev jest @types/jest ts-jest typescript @types/node ts-node
   ```

3. **Criar tsconfig.json**:
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "commonjs",
       "lib": ["ES2020"],
       "outDir": "./dist",
       "rootDir": "./src",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true,
       "resolveJsonModule": true,
       "moduleResolution": "node",
       "baseUrl": ".",
       "paths": {
         "@/*": ["src/*"]
       }
     },
     "include": ["src/**/*", "lib/**/*"],
     "exclude": ["node_modules", "dist"]
   }
   ```

4. **Configurar Jest no package.json**:
   ```json
   {
     "scripts": {
       "test": "jest",
       "test:watch": "jest --watch",
       "test:coverage": "jest --coverage"
     },
     "jest": {
       "preset": "ts-jest",
       "testEnvironment": "node",
       "roots": ["<rootDir>/src"],
       "testMatch": ["**/*.test.ts"],
       "moduleNameMapper": {
         "^@/(.*)$": "<rootDir>/src/$1"
       }
     }
   }
   ```

---

## 📋 Visão Geral dos Módulos

### Arquitetura do Sistema

```
SYNDICATE v3
├── Pipeline Engine        → Gerencia as 8 etapas da investigação
├── OBI State Manager     → Inteligência do Capitão Obi
├── Retry Engine          → Sistema de recuperação de erros
├── Specialists Engine    → Interface dos 5 especialistas
├── Review Engine         → Validação cruzada entre especialistas
└── Core Runtime          → Orquestrador central do sistema
```

### Os 5 Especialistas

1. **L Lawliet** - Estrategista chefe e detetive
2. **Senku Ishigami** - Analista forense e historiador
3. **Norman** - Analista comportamental
4. **Isagi Yoichi** - Analista espacial e otimizador
5. **Capitão Obi** - Líder e coordenador

---

## 🧪 Guias de Teste por Módulo

## 1. Pipeline Engine

### O que faz?
Gerencia as 8 etapas do processo investigativo, garantindo que cada fase seja completada com qualidade antes de avançar.

### Arquivo de Teste: `src/tests/pipelineEngine.test.ts`

```typescript
import {
  advanceStage,
  getStageInfo,
  canSkipToStage,
  resetPipeline,
  getPipelineMetrics,
  ExecutionContext,
  StageTransitionResult
} from '../modules/pipelineEngine';

// Função auxiliar para criar contextos de teste
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

describe('Pipeline Engine', () => {
  
  describe('Progressão Básica', () => {
    test('deve avançar quando todos os critérios são atendidos', () => {
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

      const result = advanceStage('evidence_intake', context);

      expect(result.nextStage).toBe('initial_analysis');
      expect(result.stageStatus).toBe('completed');
      expect(result.errors).toBeUndefined();
    });

    test('não deve avançar quando faltam tarefas', () => {
      const context = createTestContext({
        currentStage: 'evidence_intake',
        completedTasks: ['initial_assessment'], // Faltam 2 tarefas!
        stageConfidence: { evidence_intake: 65 },
        contextCompleteness: 85
      });

      const result = advanceStage('evidence_intake', context);

      expect(result.nextStage).toBe('evidence_intake');
      expect(result.stageStatus).toBe('failed');
      expect(result.errors).toContain('Tarefas faltando: context_gap_analysis, specialist_selection');
    });
  });

  describe('QA Refinement', () => {
    test('deve ativar QA quando contexto < 80%', () => {
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

      const result = advanceStage('evidence_intake', context);

      expect(result.requiresQARefinement).toBe(true);
      expect(result.stageStatus).toBe('needs_refinement');
    });
  });

  describe('Métricas e Informações', () => {
    test('deve retornar informações corretas da etapa', () => {
      const stageInfo = getStageInfo('cross_validation');

      expect(stageInfo).not.toBeNull();
      expect(stageInfo?.name).toBe('Cross-Validation Round');
      expect(stageInfo?.minimumConfidence).toBe(95);
      expect(stageInfo?.qualityGate).toBe('RIGOROUS');
    });

    test('deve calcular métricas corretamente', () => {
      const context = createTestContext({
        currentStage: 'synthesis',
        stageConfidence: {
          evidence_intake: 85,
          initial_analysis: 90,
          cross_validation: 95,
          synthesis: 88
        }
      });

      const metrics = getPipelineMetrics(context);

      expect(metrics.progress).toBe(50); // 4 de 8 = 50%
      expect(metrics.averageConfidence).toBe(89.5);
      expect(metrics.completedStages).toHaveLength(4);
      expect(metrics.remainingStages).toHaveLength(4);
    });
  });
});
```

### Como executar:
```bash
npm test pipelineEngine.test.ts
```

---

## 2. OBI State Manager

### O que faz?
Implementa a inteligência do Capitão Obi, tomando decisões sobre quando ativar especialistas, pausar investigações ou resolver conflitos.

### Arquivo de Teste: `src/tests/obiStateManager.test.ts`

```typescript
import {
  decidirAcaoObi,
  interpretarEstadoEmocional,
  diagnosticarSistema,
  ExecutionContext,
  ObiCommand
} from '../modules/obiStateManager';

// Criar contexto de teste
function createObiContext(overrides?: Partial<ExecutionContext>): ExecutionContext {
  return {
    idRegistro: "test-001",
    contexto: "Contexto de teste padrão",
    autor: "orquestrador_missao",
    etapa: "intake_analysis",
    especialista: "orquestrador_missao",
    idCaso: "caso-001",
    timestamp: new Date().toISOString(),
    probabilidade: 75,
    log: jest.fn(),
    advancePipeline: jest.fn(),
    activateSpecialist: jest.fn(),
    activateProtocol: jest.fn(),
    modifyScore: jest.fn(),
    haltPipeline: jest.fn(),
    ...overrides
  };
}

describe('OBI State Manager', () => {
  
  test('deve detectar e resolver conflitos', () => {
    const context = createObiContext({
      contexto: "Análise contraditória entre L e Norman sobre motivações do suspeito",
      probabilidade: 35
    });

    const comandos = decidirAcaoObi(context);

    // Deve gerar comando de resolução de conflito com alta prioridade
    const conflictCommand = comandos.find(cmd => cmd.action === 'resolver_conflito');
    expect(conflictCommand).toBeDefined();
    expect(conflictCommand!.prioridade).toBeGreaterThanOrEqual(9);
  });

  test('deve ativar especialistas baseado em triggers', () => {
    const context = createObiContext({
      contexto: "Documento histórico do século XIX encontrado com evidências científicas"
    });

    const comandos = decidirAcaoObi(context);

    // Deve ativar Senku (palavras-chave: histórico, evidências, científicas)
    const activateCommand = comandos.find(cmd => 
      cmd.action === 'ativar_especialista' && cmd.target === 'Senku'
    );
    expect(activateCommand).toBeDefined();
  });

  test('deve pausar investigação com confiança baixa', () => {
    const context = createObiContext({
      contexto: "Informações muito vagas e inconclusivas",
      probabilidade: 25 // Muito baixa!
    });

    const comandos = decidirAcaoObi(context);

    const pauseCommand = comandos.find(cmd => cmd.action === 'pausar');
    expect(pauseCommand).toBeDefined();
    expect(pauseCommand!.prioridade).toBe(8);
  });

  test('diagnóstico do sistema deve avaliar saúde corretamente', () => {
    const context = createObiContext({
      contexto: "Investigação complexa com múltiplas contradições urgentes",
      probabilidade: 45
    });

    const diagnostico = diagnosticarSistema(context);

    expect(diagnostico.statusGeral).toBe('atencao');
    expect(diagnostico.confiancaSistema).toBeLessThan(60);
    expect(diagnostico.alertas.length).toBeGreaterThan(0);
  });
});
```

### Teste Online Simplificado (TypeScript Playground)

Se preferir testar online sem instalar nada:

1. Acesse: https://www.typescriptlang.org/play
2. Cole este código:

```typescript
// Versão simplificada para teste online
interface ExecutionContext {
  contexto: string;
  probabilidade: number;
  [key: string]: any;
}

interface ObiCommand {
  action: string;
  prioridade: number;
  target?: string;
}

function decidirAcaoObi(context: ExecutionContext): ObiCommand[] {
  const comandos: ObiCommand[] = [];
  
  // Detectar conflitos
  if (context.contexto.toLowerCase().includes('contradit') || 
      context.contexto.toLowerCase().includes('conflito')) {
    comandos.push({
      action: 'resolver_conflito',
      prioridade: 10
    });
  }
  
  // Verificar confiança baixa
  if (context.probabilidade < 40) {
    comandos.push({
      action: 'pausar',
      prioridade: 8
    });
  }
  
  // Detectar menção a Senku
  if (context.contexto.includes('histórico') || 
      context.contexto.includes('científic')) {
    comandos.push({
      action: 'ativar_especialista',
      target: 'Senku',
      prioridade: 9
    });
  }
  
  return comandos.sort((a, b) => b.prioridade - a.prioridade);
}

// TESTES
console.log("🧪 TESTANDO OBI INTELLIGENCE\n");

// Teste 1: Conflito
const teste1 = decidirAcaoObi({
  contexto: "Detectei contradição entre análises",
  probabilidade: 60
});
console.log("Teste 1 - Conflito:");
console.log(teste1);

// Teste 2: Baixa confiança
const teste2 = decidirAcaoObi({
  contexto: "Informações vagas",
  probabilidade: 30
});
console.log("\nTeste 2 - Baixa confiança:");
console.log(teste2);

// Teste 3: Ativar especialista
const teste3 = decidirAcaoObi({
  contexto: "Análise de documento histórico",
  probabilidade: 80
});
console.log("\nTeste 3 - Ativar Senku:");
console.log(teste3);
```

---

## 3. Retry Engine

### O que faz?
Gerencia tentativas de recuperação quando algo dá errado, decidindo se deve tentar novamente, ajustar parâmetros ou escalar o problema.

### Arquivo de Teste: `src/tests/retryEngine.test.ts`

```typescript
import { 
  avaliarRetry, 
  avaliarForcaConclusao,
  gerarRelatorioRetry,
  RetryInput,
  RetryResponse 
} from '../modules/retryEngine';

describe('Retry Engine', () => {
  
  describe('Estratégias de Retry', () => {
    test('deve sugerir ajuste para timeout na primeira tentativa', () => {
      const input: RetryInput = {
        etapaAtual: 'coleta_evidencias',
        tipoErro: 'timeout_analise',
        especialista: 'Senku',
        tentativaAtual: 1
      };
      
      const resultado = avaliarRetry(input);
      
      expect(resultado.acao).toBe('ajustar');
      expect(resultado.proximaEtapa).toBe('coleta_evidencias');
      expect(resultado.cooldownMs).toBeGreaterThan(0);
    });

    test('deve aumentar cooldown progressivamente', () => {
      const input1: RetryInput = {
        etapaAtual: 'coleta_evidencias',
        tipoErro: 'timeout_analise',
        tentativaAtual: 1
      };
      
      const input2: RetryInput = {
        ...input1,
        tentativaAtual: 2
      };
      
      const resultado1 = avaliarRetry(input1);
      const resultado2 = avaliarRetry(input2);
      
      expect(resultado2.cooldownMs!).toBeGreaterThan(resultado1.cooldownMs!);
    });
  });

  describe('Mediação de Conflitos', () => {
    test('deve ativar mediação para conflito entre especialistas', () => {
      const input: RetryInput = {
        etapaAtual: 'validation',
        tipoErro: 'specialist_conflict',
        especialista: 'estrategista_chefe',
        tentativaAtual: 1
      };
      
      const resultado = avaliarRetry(input);
      
      expect(resultado.acao).toBe('ajustar');
      expect(resultado.estrategiaRecuperacao).toBe('structured_mediation');
      expect(resultado.modificacoes?.especialistasAlternativos).toContain('orquestrador_missao');
    });
  });

  describe('Limites e Conclusão Forçada', () => {
    test('deve forçar conclusão quando atinge limite global', () => {
      const input: RetryInput = {
        etapaAtual: 'synthesis',
        tipoErro: 'low_confidence',
        tentativaAtual: 2,
        tentativasGlobais: 3, // Limite!
        confiancaAtual: 45
      };
      
      const resultado = avaliarRetry(input);
      
      expect(resultado.acao).toBe('concluir_gracioso');
      expect(resultado.cooldownMs).toBe(0);
    });

    test('deve detectar múltiplas condições de conclusão forçada', () => {
      // Por tentativas
      expect(avaliarForcaConclusao(3, 80)).toBe(true);
      
      // Por confiança baixa
      expect(avaliarForcaConclusao(2, 20)).toBe(true);
      
      // Por tempo
      expect(avaliarForcaConclusao(1, 80, 300001)).toBe(true);
    });
  });

  describe('Relatórios', () => {
    test('deve gerar relatório formatado', () => {
      const input: RetryInput = {
        etapaAtual: 'validation',
        tipoErro: 'timeout_analise',
        especialista: 'Norman',
        tentativaAtual: 2,
        confiancaAtual: 65
      };
      
      const resposta: RetryResponse = {
        acao: 'ajustar',
        justificativa: 'Teste de relatório',
        cooldownMs: 1500,
        estrategiaRecuperacao: 'adjust_and_retry'
      };
      
      const relatorio = gerarRelatorioRetry(input, resposta);
      
      expect(relatorio).toContain('RETRY ENGINE REPORT');
      expect(relatorio).toContain('Norman');
      expect(relatorio).toContain('65%');
    });
  });
});
```

### Como executar:
```bash
npm test retryEngine.test.ts
```

---

## 4. Specialists Engine

### O que faz?
Implementa a interface dos 5 especialistas, gerando análises narrativas e perguntas de refinamento mantendo suas personalidades únicas.

### Arquivo de Teste: `src/tests/specialistsEngine.test.ts`

```typescript
import { gerarAnaliseEspecialista } from '../modules/specialistAgent';
import { generateRefinementQuestions } from '../modules/qaRefiner';
import { generatePromptForPersona } from '../modules/personaTemplateBuilder';

describe('Specialists Engine', () => {
  
  describe('Análises dos Especialistas', () => {
    const contextoBase = {
      idCaso: "teste_001",
      etapa: "análise inicial",
      contextoNarrativo: "Documentos suspeitos em mansão abandonada.",
      probabilidade: 0.85,
      dados: {
        evidencias: ["cartas antigas", "mapas secretos"],
        palavrasChave: ["mistério", "herança"]
      }
    };

    test('L deve gerar análise estratégica', () => {
      const resultado = gerarAnaliseEspecialista({
        ...contextoBase,
        autor: "L"
      });
      
      expect(resultado.especialista).toBe('L');
      expect(resultado.analise.hipotese).toBeTruthy();
      expect(resultado.analise.nivel_confianca).toBeGreaterThan(0.7);
    });

    test('todos os especialistas devem funcionar', () => {
      const especialistas = ["L", "Senku", "Norman", "Isagi", "Obi"];
      
      especialistas.forEach(especialista => {
        const resultado = gerarAnaliseEspecialista({
          ...contextoBase,
          autor: especialista
        });
        
        expect(resultado.especialista).toBe(especialista);
        expect(resultado.analise.acoes_recomendadas.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Sistema de Refinamento', () => {
    test('deve gerar perguntas para contexto vago', () => {
      const perguntas = generateRefinementQuestions({
        specialist: 'Norman',
        context: 'Pessoa agindo de forma estranha',
        currentConfidence: 40
      });
      
      expect(perguntas.length).toBeGreaterThan(0);
      expect(perguntas[0].question).toBeTruthy();
    });

    test('deve detectar comandos de escape', () => {
      const perguntas = generateRefinementQuestions({
        specialist: 'L',
        context: 'Investigação complexa',
        userCommand: 'ok, prossiga com o que tem',
        currentConfidence: 65
      });
      
      expect(perguntas[0].question).toContain('Entendido');
    });
  });

  describe('Templates Personalizados', () => {
    test('deve gerar prompts com personalidade correta', () => {
      const promptL = generatePromptForPersona('estrategista_chefe', {
        hipotese: 'O mordomo é o culpado',
        evidencia: 'Impressões digitais',
        probabilidade: 87
      });
      
      expect(promptL).toBeTruthy();
      expect(promptL.length).toBeGreaterThan(50);
    });
  });
});
```

### Teste Básico sem Framework:

Crie `test-specialists-basic.js`:

```javascript
// Teste básico dos especialistas - rode com: node test-specialists-basic.js

const { gerarAnaliseEspecialista } = require('./specialistAgent');

console.log("🧪 TESTE DOS ESPECIALISTAS\n");

// Contexto de teste
const contexto = {
  idCaso: "teste_001",
  etapa: "análise inicial",
  autor: "L",
  contextoNarrativo: "Documentos financeiros mostram transações suspeitas durante a madrugada.",
  probabilidade: 0.85,
  dados: {
    evidencias: ["transferências noturnas", "contas offshore"],
    palavrasChave: ["fraude", "lavagem"]
  }
};

// Testar cada especialista
const especialistas = ["L", "Senku", "Norman", "Isagi", "Obi"];
let sucessos = 0;

especialistas.forEach(esp => {
  try {
    console.log(`\n📋 Testando ${esp}:`);
    const resultado = gerarAnaliseEspecialista({
      ...contexto,
      autor: esp
    });
    
    console.log(`✅ Hipótese: ${resultado.analise.hipotese}`);
    console.log(`✅ Confiança: ${(resultado.analise.nivel_confianca * 100).toFixed(0)}%`);
    sucessos++;
  } catch (erro) {
    console.log(`❌ ERRO: ${erro.message}`);
  }
});

console.log(`\n📊 RESULTADO: ${sucessos}/${especialistas.length} especialistas funcionando!`);
```

---

## 5. Review Engine

### O que faz?
Permite que especialistas revisem e validem as análises uns dos outros, garantindo qualidade e consistência.

### Arquivo de Teste: `src/tests/reviewEngine.test.ts`

```typescript
import { 
  reviewAnalysis, 
  ReviewInput, 
  ReviewResult 
} from '../modules/reviewEngine';

describe('Review Engine', () => {
  let baseContext: any;
  let baseAnalysis: any;

  beforeEach(() => {
    baseContext = {
      executionId: 'test-123',
      startTime: new Date(),
      input: {
        content: 'Investigar padrões comportamentais suspeitos'
      },
      state: {
        phase: 'analysis',
        activatedSpecialists: ['L', 'Norman'],
        partialResults: new Map(),
        flags: {}
      }
    };

    baseAnalysis = {
      specialist: 'Norman',
      analysisId: 'analysis-456',
      timestamp: new Date(),
      analysis: {
        summary: 'Padrões de manipulação identificados',
        keyPoints: ['Comportamento manipulativo', 'Padrões genealógicos'],
        insights: [{
          category: 'Comportamental',
          description: 'Traços narcisistas detectados',
          evidence: ['Histórico de relações'],
          confidence: 0.85
        }]
      },
      metadata: {
        processingTime: 1500,
        overallConfidence: 0.82,
        isComplete: true
      }
    };
  });

  test('deve aprovar análise de alta qualidade', () => {
    const result = reviewAnalysis({
      reviewer: 'L',
      originalAnalysis: baseAnalysis,
      context: baseContext
    });

    expect(result.status).toBe('approved');
    expect(result.qualityScore).toBeGreaterThan(0.7);
  });

  test('deve solicitar refinamento para análise incompleta', () => {
    const incompleteAnalysis = {
      ...baseAnalysis,
      analysis: {
        ...baseAnalysis.analysis,
        insights: [{
          category: 'Comportamental',
          description: 'Possível comportamento suspeito',
          evidence: [], // Sem evidências!
          confidence: 0.6
        }]
      }
    };

    const result = reviewAnalysis({
      reviewer: 'L',
      originalAnalysis: incompleteAnalysis,
      context: baseContext
    });

    expect(result.status).toBe('refine');
    expect(result.suggestions).toBeDefined();
    expect(result.suggestions!.length).toBeGreaterThan(0);
  });

  test('deve detectar e reportar redundâncias', () => {
    const redundantAnalysis = {
      ...baseAnalysis,
      analysis: {
        ...baseAnalysis.analysis,
        insights: [
          {
            category: 'Comportamental',
            description: 'Comportamento manipulativo',
            evidence: ['A'],
            confidence: 0.8
          },
          {
            category: 'Comportamental',
            description: 'Comportamento manipulativo', // Redundante!
            evidence: ['B'],
            confidence: 0.8
          }
        ]
      }
    };

    const result = reviewAnalysis({
      reviewer: 'L',
      originalAnalysis: redundantAnalysis,
      context: baseContext
    });

    expect(result.suggestions).toContain('Consolidar insights redundantes em análises mais profundas');
  });
});
```

---

## 6. Core Runtime

### O que faz?
Orquestra todo o sistema, processando eventos, ativando triggers e coordenando módulos.

### Arquivo de Teste: `src/tests/coreRuntime.test.ts`

```typescript
import { RuntimeOrchestrator } from '../lib/runtimeOrchestrator';
import { IngestEvent } from '../lib/types/common';

describe('Core Runtime', () => {
  let orchestrator: RuntimeOrchestrator;

  beforeEach(() => {
    orchestrator = new RuntimeOrchestrator(true); // debug mode
  });

  test('deve processar evento básico', async () => {
    const evento: IngestEvent = {
      id: "teste-001",
      timestamp: new Date().toISOString(),
      tipo_registro: "hipotese",
      autor: "estrategista_chefe",
      dados: {
        descricao: "O suspeito estava no local",
        probabilidade: 85
      },
      etapa: "intake_analysis",
      id_caso: "caso-001",
      trace_id: "trace-001"
    };

    const resultado = await orchestrator.orchestrate(evento);

    expect(resultado.success).toBe(true);
    expect(resultado.novaEtapa).toBeDefined();
  });

  test('deve ativar triggers baseado em regras', async () => {
    // Assumindo que temos uma regra para alta confiança
    const eventoAltaConfianca: IngestEvent = {
      id: "teste-002",
      timestamp: new Date().toISOString(),
      tipo_registro: "hipotese",
      autor: "estrategista_chefe",
      dados: {
        descricao: "Evidências conclusivas",
        probabilidade: 95 // Alta confiança
      },
      etapa: "hypothesis_formation",
      id_caso: "caso-002",
      trace_id: "trace-002"
    };

    const resultado = await orchestrator.orchestrate(eventoAltaConfianca);

    expect(resultado.triggered.length).toBeGreaterThan(0);
  });
});
```

### Teste de Integração Completo:

```typescript
// test-integration.ts
import { RuntimeOrchestrator } from '../lib/runtimeOrchestrator';
import { validateAgainstSchema } from '../lib/schemaValidator';

async function testeIntegracao() {
  console.log('🔄 Teste de Integração Completa\n');
  
  const orchestrator = new RuntimeOrchestrator(true);
  
  // Simular investigação completa
  console.log('📋 Iniciando investigação de fraude...\n');
  
  // 1. Denúncia inicial
  const denuncia = {
    id: "fraude-001",
    timestamp: new Date().toISOString(),
    tipo_registro: "registro_misc",
    autor: "orquestrador_missao",
    dados: {
      descricao: "Movimentações suspeitas detectadas",
      categoria: "denuncia",
      gravidade: "alta"
    },
    etapa: "intake_analysis",
    id_caso: "FRAUDE-2025",
    trace_id: "trace-001"
  };
  
  const result1 = await orchestrator.orchestrate(denuncia);
  console.log(`✅ Denúncia processada`);
  console.log(`   Próxima etapa: ${result1.novaEtapa}\n`);
  
  // 2. Hipótese
  const hipotese = {
    id: "fraude-002",
    timestamp: new Date().toISOString(),
    tipo_registro: "hipotese",
    autor: "estrategista_chefe",
    dados: {
      descricao: "Funcionário interno desviando fundos",
      probabilidade: 82,
      hypothesis_id: "H-01.v1",
      confidence_score: 82
    },
    etapa: "hypothesis_formation",
    id_caso: "FRAUDE-2025",
    trace_id: "trace-002"
  };
  
  const result2 = await orchestrator.orchestrate(hipotese);
  console.log(`✅ Hipótese formulada`);
  console.log(`   Confiança: 82%`);
  console.log(`   Triggers: ${result2.triggered.join(', ') || 'Nenhum'}\n`);
  
  console.log('🎯 Investigação em andamento!');
}

// Executar
testeIntegracao();
```

---

## 🧪 Suite de Testes Completa

### Criar Script de Testes Unificado

Crie `run-all-tests.js`:

```javascript
#!/usr/bin/env node

console.log('🚀 EXECUTANDO SUITE COMPLETA DE TESTES - SYNDICATE v3\n');
console.log('=' .repeat(60));

const tests = [
  { name: 'Pipeline Engine', file: 'pipelineEngine.test.ts' },
  { name: 'OBI State Manager', file: 'obiStateManager.test.ts' },
  { name: 'Retry Engine', file: 'retryEngine.test.ts' },
  { name: 'Specialists Engine', file: 'specialistsEngine.test.ts' },
  { name: 'Review Engine', file: 'reviewEngine.test.ts' },
  { name: 'Core Runtime', file: 'coreRuntime.test.ts' }
];

async function runAllTests() {
  for (const test of tests) {
    console.log(`\n\n📁 Testando: ${test.name}`);
    console.log('-'.repeat(40));
    
    try {
      // Executar teste
      const { execSync } = require('child_process');
      execSync(`npm test ${test.file}`, { stdio: 'inherit' });
      console.log(`✅ ${test.name} - PASSOU`);
    } catch (error) {
      console.log(`❌ ${test.name} - FALHOU`);
    }
  }
  
  console.log('\n\n📊 RESUMO DOS TESTES');
  console.log('=' .repeat(60));
  console.log('✅ Testes concluídos!');
}

runAllTests();
```

### Executar todos os testes:
```bash
chmod +x run-all-tests.js
./run-all-tests.js
```

Ou simplesmente:
```bash
npm test
```

---

## 🔧 Troubleshooting

### Problemas Comuns e Soluções

#### "Cannot find module"
**Problema**: Arquivo não encontrado  
**Solução**: 
- Verifique se o caminho está correto
- Use `../` para subir um nível
- Confirme se o arquivo existe

#### "npm: command not found"
**Problema**: Node.js não instalado  
**Solução**: Instale Node.js do site oficial

#### "TypeError: xxx is not a function"
**Problema**: Função não existe ou nome errado  
**Solução**: 
- Verifique o nome exato da função
- Confirme se está exportada
- Veja se a importação está correta

#### Testes passam mas código não funciona
**Problema**: Testes incompletos  
**Solução**: 
- Adicione mais casos de teste
- Teste edge cases
- Verifique integração

#### "SyntaxError: Unexpected token"
**Problema**: Erro de sintaxe  
**Solução**: 
- Procure vírgulas faltando
- Verifique parênteses/chaves
- Use um linter

---

## 📚 Referência Rápida

### Comandos Essenciais

```bash
# Instalar dependências
npm install

# Rodar todos os testes
npm test

# Rodar teste específico
npm test nomeDoArquivo.test.ts

# Rodar testes em modo watch
npm run test:watch

# Ver cobertura de testes
npm run test:coverage

# Compilar TypeScript
npx tsc --noEmit

# Rodar arquivo TypeScript
npx ts-node arquivo.ts
```

### Estrutura de um Teste

```typescript
describe('Nome do Módulo', () => {
  
  describe('Funcionalidade Específica', () => {
    
    test('deve fazer algo específico', () => {
      // Arrange (Preparar)
      const input = { /* dados de entrada */ };
      
      // Act (Executar)
      const resultado = funcaoTestada(input);
      
      // Assert (Verificar)
      expect(resultado).toBe(valorEsperado);
    });
    
  });
  
});
```

### Matchers Comuns do Jest

```typescript
expect(valor).toBe(5);                  // Igualdade exata
expect(valor).toEqual({a: 1});          // Igualdade profunda
expect(valor).toBeTruthy();             // Verdadeiro
expect(valor).toBeFalsy();              // Falso
expect(valor).toBeNull();               // Null
expect(valor).toBeDefined();            // Definido
expect(valor).toBeUndefined();          // Indefinido
expect(valor).toBeGreaterThan(3);       // Maior que
expect(valor).toBeLessThan(10);         // Menor que
expect(array).toContain('item');        // Contém
expect(string).toMatch(/regex/);        // Match regex
expect(funcao).toThrow();               // Lança erro
```

---

## 🎉 Conclusão

Parabéns! Você agora tem um guia completo para testar todos os módulos do Syndicate v3. 

### Próximos Passos:
1. **Execute os testes básicos** primeiro
2. **Adicione seus próprios casos** de teste
3. **Experimente modificar** o código e ver os testes falharem
4. **Integre com CI/CD** para testes automáticos

### Lembre-se:
- ✅ Testes verdes = código funcionando
- ❌ Testes vermelhos = algo para corrigir
- 🔄 Sempre teste após mudanças
- 📚 Documentação é sua amiga

**Happy Testing!** 🚀

---

*Última atualização: 15/06/2025*  
*Versão: Syndicate v3.1*  
*Status: Pronto para uso*