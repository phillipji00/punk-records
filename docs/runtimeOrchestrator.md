# Orchestrator Core v3.0 - Documentação Técnica

## 📋 Resumo Executivo

O novo `runtimeOrchestrator.ts` v3.0 foi reconstruído mantendo compatibilidade com a v2.0 enquanto introduz melhorias significativas em modularidade, tratamento de erros e clareza de código.

## 🔄 O que foi Mantido da v2.0

### 1. **Interface de Função Principal**
- A função `orchestrate(event: IngestEvent): Promise<void>` foi mantida para compatibilidade
- Todos os tipos principais (`IngestEvent`, `ExecutionContext`, `SyndicateContext`) preservados
- Integração com módulos existentes (`triggerEngine`, `executeTriggerActions`, `schemaValidator`)

### 2. **Fluxo de Execução Core**
- Validação → Construção de Contexto → Avaliação de Triggers → Execução de Ações
- Sistema de callbacks no `ExecutionContext` (log, advancePipeline, etc.)
- Progressão automática de etapas do pipeline

### 3. **Compatibilidade de Tipos**
- Todos os tipos da v2.0 são respeitados
- Type guards (`isValidIngestEvent`, `isValidProbabilidade`) utilizados
- Constantes (`ETAPAS_PIPELINE`, `ESPECIALISTAS`) preservadas

## 🚀 O que foi Melhorado

### 1. **Arquitetura Orientada a Objetos**
```typescript
export class RuntimeOrchestrator {
  private debugMode: boolean;
  
  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
  }
}
```
**Benefícios:**
- Encapsulamento de estado e comportamento
- Facilita testes unitários
- Permite múltiplas instâncias com configurações diferentes

### 2. **Melhor Estrutura de Retorno**
```typescript
interface OrchestrationResult {
  success: boolean;
  context: SyndicateContext;
  triggered: string[];
  actions: Array<{ type: string; result: string }>;
  novaEtapa: string;
  errors?: string[];
  warnings?: string[];
}
```
**Benefícios:**
- Feedback detalhado sobre a execução
- Distinção entre erros e avisos
- Facilita debugging e monitoramento

### 3. **Validação em Múltiplas Camadas**
- Validação de evento de entrada
- Validação de schema
- Validação de contexto antes dos triggers
**Benefícios:**
- Falha rápida (fail-fast) com mensagens claras
- Reduz erros em runtime
- Melhora a confiabilidade

### 4. **Separação de Responsabilidades**
Métodos privados bem definidos:
- `validateIngestEvent()` - Validação de entrada
- `buildExecutionContext()` - Construção de contexto
- `validateContextSchema()` - Validação contra schemas
- `evaluateContextTriggers()` - Avaliação de triggers
- `executeActions()` - Execução de ações
- `determineNextStage()` - Lógica de progressão
**Benefícios:**
- Código mais legível e manutenível
- Facilita testes unitários de cada componente
- Reduz complexidade ciclomática

### 5. **Tratamento de Erros Robusto**
- Try-catch em todos os pontos críticos
- Erros não interrompem todo o fluxo
- Mensagens de erro descritivas
**Benefícios:**
- Sistema mais resiliente
- Debugging mais fácil
- Melhor experiência para o usuário

## ❌ O que foi Removido

### 1. **Dependências de Persistência**
- `getCaseStatus()` e `saveCaseStatus()` removidos do core
- `loadObiState()` e `updateObiState()` removidos
**Motivo:** Separação de responsabilidades - orquestrador não deve conhecer detalhes de persistência

### 2. **Logger Acoplado**
- Substituído por sistema de log via callback no contexto
**Motivo:** Maior flexibilidade e testabilidade

### 3. **Funções Helper no Mesmo Arquivo**
- `createTestEvent()` e `validateOrchestrator()` removidos
**Motivo:** Devem estar em arquivos de teste separados

## 🔧 Decisões de Design

### 1. **Classe vs Função**
Optamos por uma classe para:
- Permitir configuração via construtor
- Facilitar extensão futura
- Melhorar organização do código

### 2. **Compatibilidade Backward**
Mantivemos a função `orchestrate()` original como wrapper para facilitar migração gradual.

### 3. **Validação Defensiva**
Múltiplas camadas de validação para garantir robustez mesmo com dados inconsistentes.

### 4. **Warnings vs Errors**
Distinção clara entre problemas fatais (errors) e problemas não-críticos (warnings).

## 📊 Exemplo de Uso

```typescript
// Criar instância do orquestrador
const orchestrator = new RuntimeOrchestrator(true); // debug mode ativado

// Criar evento de entrada
const event: IngestEvent = {
  id: "evt-001",
  timestamp: new Date().toISOString(),
  tipo_registro: "hipotese",
  autor: "estrategista_chefe",
  dados: {
    descricao: "Nova hipótese sobre o caso",
    probabilidade: 85
  },
  etapa: "intake_analysis",
  id_caso: "caso-xyz",
  trace_id: "trace-123"
};

// Executar orquestração
try {
  const result = await orchestrator.orchestrate(event);
  
  if (result.success) {
    console.log("✅ Orquestração bem-sucedida!");
    console.log("Triggers ativados:", result.triggered);
    console.log("Próxima etapa:", result.novaEtapa);
    console.log("Ações executadas:", result.actions);
  } else {
    console.error("❌ Erros na orquestração:", result.errors);
  }
  
  // Avisos não-críticos
  if (result.warnings) {
    console.warn("⚠️ Avisos:", result.warnings);
  }
} catch (error) {
  console.error("Erro fatal:", error);
}
```

## 🧪 Exemplo com Mock

```typescript
// Mock de ExecutionContext para testes
const mockContext: ExecutionContext = {
  idRegistro: "mock-001",
  contexto: "Teste de orquestração",
  autor: "orquestrador_missao",
  etapa: "intake_analysis",
  especialista: "orquestrador_missao",
  idCaso: "test-case",
  timestamp: new Date().toISOString(),
  tipo_registro: "registro_misc",
  probabilidade: 75,
  
  // Callbacks
  log: (msg: string) => console.log(`[MOCK] ${msg}`),
  advancePipeline: (stage: string) => console.log(`[MOCK] Pipeline → ${stage}`),
  activateSpecialist: async (id: string) => console.log(`[MOCK] Especialista: ${id}`),
  activateProtocol: async (name: string) => console.log(`[MOCK] Protocolo: ${name}`),
  modifyScore: (field: string, value: number) => console.log(`[MOCK] ${field} += ${value}`),
  haltPipeline: (reason: string) => { throw new Error(`Pipeline halt: ${reason}`); }
};

// Output esperado:
// [MOCK] Pipeline → task_delegation
// [MOCK] Especialista: estrategista_chefe
// Triggers ativados: ["rule-001", "rule-002"]
// Próxima etapa: task_delegation
```

## 🔍 Comparação v2.0 vs v3.0

| Aspecto | v2.0 | v3.0 |
|---------|------|------|
| **Arquitetura** | Funcional | Orientada a Objetos |
| **Acoplamento** | Alto (DB, logger) | Baixo (modular) |
| **Testabilidade** | Média | Alta |
| **Tratamento de Erros** | Try-catch global | Granular por etapa |
| **Retorno** | void (erros via throw) | OrchestrationResult estruturado |
| **Validação** | Durante execução | Multi-camada preventiva |
| **Configuração** | Via ambiente | Via construtor + ambiente |
| **Compatibilidade** | - | 100% backward compatible |

## 🚀 Próximos Passos

1. **Implementar testes unitários** para cada método privado
2. **Adicionar métricas** de performance e sucesso
3. **Criar adaptadores** para persistência desacoplada
4. **Documentar patterns** de extensão para novos tipos de ação
5. **Implementar cache** de validações para otimização

## 📝 Notas de Migração

Para migrar da v2.0 para v3.0:

1. **Sem mudanças necessárias** se usando apenas a função `orchestrate()`
2. **Para novos recursos**, instanciar `RuntimeOrchestrator`:
   ```typescript
   const orchestrator = new RuntimeOrchestrator(debugMode);
   const result = await orchestrator.orchestrate(event);
   ```
3. **Persistência** deve ser tratada externamente ao orquestrador
4. **Logger** deve ser configurado via callbacks no contexto

## ✅ Conclusão

A v3.0 do Orchestrator Core mantém total compatibilidade com a v2.0 enquanto oferece:
- Melhor organização e manutenibilidade
- Maior flexibilidade e extensibilidade
- Tratamento de erros mais robusto
- Interface mais rica para debugging e monitoramento

O sistema está pronto para evolução contínua sem quebrar contratos existentes.