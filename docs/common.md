# Types Common - Documentação Técnica v3.1

## 📋 Visão Geral

O arquivo `types/common.ts` é o módulo central de tipos do sistema Syndicate v3.1. Ele unifica todos os tipos necessários tanto para o sistema principal quanto para o runtime, garantindo consistência e type safety em todo o projeto.

### 🔄 Evolução do Arquivo

Este arquivo é uma evolução do `types.ts` original, expandido com:
- Tipos específicos do runtime (IngestEvent, SyndicateContext, etc.)
- Constantes do sistema (ESPECIALISTAS, ETAPAS_PIPELINE, etc.)
- Type guards para validação em runtime
- Aliases para compatibilidade entre sistemas

## 🎯 Tipos Principais e suas Funções

### 1. **ExecutionContext** (Original)
**Função**: Representa o estado completo de uma execução do sistema com dados ricos e estruturados.

**Estrutura**:
```typescript
interface ExecutionContext {
  executionId: string;
  startTime: Date;
  input: {
    content: string;
    metadata?: Record<string, any>;
    analysisType?: string;
  };
  state: {
    phase: 'initialization' | 'validation' | 'analysis' | 'synthesis' | 'completed' | 'error';
    activatedSpecialists: Specialist[];
    partialResults: Map<Specialist, SpecialistResponse>;
    flags: {...};
  };
  config: {...};
  actionHistory: Action[];
  effectLogs: EffectLog[];
}
```

### 2. **RuntimeExecutionContext** (Novo)
**Função**: Versão simplificada do ExecutionContext para uso no runtime, com callbacks de controle.

**Estrutura**:
```typescript
interface RuntimeExecutionContext extends SyndicateContext {
  // Callbacks de controle do pipeline
  log: (msg: string) => void;
  advancePipeline: (toStage: string) => void;
  activateSpecialist: (id: string) => Promise<void>;
  activateProtocol: (name: string) => Promise<void>;
  modifyScore: (field: string, adjustment: number) => void;
  haltPipeline: (reason: string) => void;
}
```

**Usado por**:
- `runtimeOrchestrator.ts` - gerencia o pipeline
- `triggerEngine.ts` - avalia condições
- `executeTriggerActions.ts` - executa ações

### 3. **IngestEvent** (Novo)
**Função**: Evento de entrada do sistema runtime.

**Estrutura**:
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
  especialista?: string;
}
```

### 4. **SyndicateContext** (Novo)
**Função**: Contexto base sem callbacks, usado para transferência de dados.

**Estrutura**:
```typescript
interface SyndicateContext {
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
```

## 📦 Constantes do Sistema

### ESPECIALISTAS
```typescript
export const ESPECIALISTAS = {
  ORQUESTRADOR: 'orquestrador_missao',
  ESTRATEGISTA: 'estrategista_chefe',
  FORENSE: 'analista_forense',
  COMPORTAMENTAL: 'analista_comportamental',
  ESPACIAL: 'analista_espacial'
} as const;
```

### ETAPAS_PIPELINE
```typescript
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
```

### TIPOS_REGISTRO
```typescript
export const TIPOS_REGISTRO = [
  'hipotese',
  'evidencia',
  'perfil_personagem',
  'entrada_timeline',
  'registro_misc',
  'cross_validation_result',
  'ingest'
] as const;
```

## 🛡️ Type Guards

### isValidTipoRegistro
```typescript
export function isValidTipoRegistro(tipo: any): tipo is TipoRegistro {
  return typeof tipo === 'string' && TIPOS_REGISTRO.includes(tipo as TipoRegistro);
}
```

### isValidIngestEvent
```typescript
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
```

### isValidProbabilidade
```typescript
export function isValidProbabilidade(value: any): value is number {
  return typeof value === 'number' && value >= 0 && value <= 100;
}
```

## 🔄 Sistema de Aliases

Para manter compatibilidade entre o sistema principal e o runtime:

```typescript
// Aliases para compatibilidade
export { RuntimeExecutionContext as ExecutionContext };
export { RuntimeTriggerEvaluationResult as TriggerEvaluationResult };
```

Isso permite que os módulos do runtime usem `ExecutionContext` mas recebam a versão com callbacks.

## 📊 Mapeamentos

### SPECIALIST_TO_PERSONA
```typescript
export const SPECIALIST_TO_PERSONA: Record<string, string> = {
  'orquestrador_missao': 'Captain Obi',
  'estrategista_chefe': 'L Lawliet',
  'analista_forense': 'Senku',
  'analista_comportamental': 'Norman',
  'analista_espacial': 'Isagi'
};
```

## 🔧 Como Importar

### Para módulos do sistema principal:
```typescript
import { 
  ExecutionContext,     // Versão rica original
  TriggerEvaluationResult,
  Action,
  SpecialistResponse 
} from './types/common';
```

### Para módulos do runtime:
```typescript
import { 
  RuntimeExecutionContext as ExecutionContext,  // Versão com callbacks
  IngestEvent,
  SyndicateContext,
  ESPECIALISTAS,
  ETAPAS_PIPELINE 
} from './types/common';
```

## 📝 Exemplos de Uso

### Criar um IngestEvent:
```typescript
const evento: IngestEvent = {
  id: "evt-001",
  timestamp: new Date().toISOString(),
  tipo_registro: "hipotese",
  autor: "estrategista_chefe",
  dados: {
    descricao: "Nova hipótese sobre o caso",
    probabilidade: 85
  },
  etapa: "intake_analysis",
  id_caso: "caso-001",
  trace_id: "trace-123"
};
```

### Criar um RuntimeExecutionContext:
```typescript
const context: RuntimeExecutionContext = {
  // Dados base
  idRegistro: "reg-001",
  contexto: "Análise de fraude",
  autor: "orquestrador_missao",
  etapa: ETAPAS_PIPELINE.INTAKE,
  especialista: ESPECIALISTAS.ORQUESTRADOR,
  idCaso: "caso-001",
  timestamp: new Date().toISOString(),
  
  // Callbacks
  log: (msg) => console.log(`[LOG] ${msg}`),
  advancePipeline: (stage) => console.log(`Pipeline → ${stage}`),
  activateSpecialist: async (id) => console.log(`Ativando ${id}`),
  activateProtocol: async (name) => console.log(`Protocolo: ${name}`),
  modifyScore: (field, value) => console.log(`${field} += ${value}`),
  haltPipeline: (reason) => { throw new Error(`Halt: ${reason}`); }
};
```

### Usar Type Guards:
```typescript
// Validar evento
if (!isValidIngestEvent(data)) {
  throw new Error('Evento inválido');
}

// Validar probabilidade
if (isValidProbabilidade(valor)) {
  context.probabilidade = valor;
}

// Validar tipo de registro
if (!isValidTipoRegistro(tipo)) {
  console.warn(`Tipo "${tipo}" não reconhecido`);
}
```

## 🚀 Benefícios da Unificação

1. **Fonte única de verdade**: Todos os tipos em um lugar
2. **Type safety**: Validação em compile-time e runtime
3. **Compatibilidade**: Sistema principal e runtime funcionam juntos
4. **Manutenibilidade**: Mudanças em um lugar afetam todo o sistema
5. **Documentação viva**: Tipos são auto-documentados

## ⚠️ Considerações Importantes

1. **Não modifique os aliases**: Eles garantem compatibilidade
2. **Use type guards**: Sempre valide dados externos
3. **Prefira constantes**: Use ESPECIALISTAS em vez de strings
4. **Cuidado com callbacks**: RuntimeExecutionContext tem side effects

## 🔮 Evolução Futura

Possíveis melhorias planejadas:
- Tipos genéricos para eventos customizados
- Validação de schemas inline
- Suporte para plugins de tipos
- Geração automática de type guards

---

**Versão**: 3.1  
**Última atualização**: 2025-06-15  
**Compatibilidade**: Syndicate v3.0+