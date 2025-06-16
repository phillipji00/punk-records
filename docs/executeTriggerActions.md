# Execute Trigger Actions - Documentação Técnica

## Visão Geral

O módulo `executeTriggerActions.ts` é responsável por processar e simular a execução de ações disparadas pelo sistema de triggers do Syndicate v3.0. Este módulo implementa um sistema de logging detalhado que registra todos os efeitos das ações sem realizar persistência real, permitindo rastreabilidade completa e debug do fluxo de execução.

### Evolução da v2.0 para v3.0

**Mantido da v2.0:**
- Assinatura básica da função principal
- Processamento sequencial de ações
- Tratamento robusto de erros (continua executando outras ações se uma falhar)
- Tipos de ação fundamentais (log, advance_pipeline, activate_specialist, etc.)

**Melhorado na v3.0:**
- **Sistema de Logging Estruturado**: Substituído logger simples por array de `EffectLog` com níveis de severidade
- **Simulação de Efeitos**: Ao invés de executar ações diretamente, gera logs detalhados do que seria executado
- **Tipos Expandidos**: De 6 tipos na v2.0 para 10 tipos com parâmetros mais ricos
- **Rastreabilidade Completa**: IDs únicos, timestamps precisos e metadados extensivos
- **Retorno Informativo**: Retorna `EffectLog[]` ao invés de `void` para melhor observabilidade

**Removido da v3.0:**
- Dependência do módulo `utils/logger` externo
- Execução direta de efeitos colaterais (agora apenas simula)

## Arquitetura

### Função Principal

```typescript
executeTriggerActions(actions: SyndicateAction[], context: ExecutionContext): Promise<EffectLog[]>
```

- **Entrada**: Array de ações a serem executadas e o contexto de execução atual
- **Saída**: Array de logs de efeito que documentam todas as operações simuladas
- **Processamento**: Assíncrono com tratamento de erros individual por ação

### Tipos de Ação Suportados

1. **UPDATE_FIELD** - Atualização de campos no contexto
2. **CROSS_VALIDATION** - Validação cruzada entre especialistas
3. **NOTIFICATION** - Envio de notificações
4. **TASK_CREATION** - Criação de tarefas
5. **MEMORY_UPDATE** - Operações na memória do sistema
6. **STATE_TRANSITION** - Transições de estado do pipeline
7. **SPECIALIST_ACTIVATION** - Ativação de especialistas
8. **PROTOCOL_ACTIVATION** - Ativação de protocolos específicos
9. **SCORE_MODIFICATION** - Modificação de scores/probabilidades
10. **PIPELINE_HALT** - Interrupção do pipeline

### Sistema de Logging

Cada ação gera logs com diferentes níveis de severidade:

- **DEBUG**: Informações detalhadas para desenvolvimento
- **INFO**: Operações normais do sistema
- **WARNING**: Situações que requerem atenção
- **ERROR**: Erros recuperáveis
- **CRITICAL**: Erros que podem comprometer o sistema

## Exemplos de Uso

### Exemplo 1: Cross Validation entre Especialistas

```typescript
import { executeTriggerActions } from './executeTriggerActions';
import { ExecutionContext, SyndicateAction, ActionType } from './types';

// Contexto de execução
const context: ExecutionContext = {
  idRegistro: 'REG-001',
  contexto: 'Análise de evidências suspeitas',
  autor: 'L',
  etapa: 'validation',
  especialista: 'estrategista_chefe',
  idCaso: 'CASO-2025-001',
  probabilidade: 75,
  timestamp: new Date().toISOString(),
  log: (msg) => console.log(`[LOG] ${msg}`),
  advancePipeline: (stage) => console.log(`[PIPELINE] Avançando para ${stage}`),
  activateSpecialist: async (id) => console.log(`[SPECIALIST] Ativando ${id}`),
  modifyScore: (field, value) => console.log(`[SCORE] ${field} = ${value}`)
};

// Ações a serem executadas
const actions: SyndicateAction[] = [
  {
    id: 'ACTION-001',
    type: ActionType.CROSS_VALIDATION,
    params: {
      sourceSpecialist: 'estrategista_chefe',
      targetSpecialists: ['analista_forense', 'analista_comportamental'],
      dataToValidate: 'Hipótese sobre movimentações financeiras suspeitas',
      priority: 'high'
    }
  },
  {
    id: 'ACTION-002',
    type: ActionType.NOTIFICATION,
    params: {
      channel: 'INTERNAL',
      recipient: 'orquestrador_missao',
      message: 'Validação cruzada iniciada para hipótese crítica',
      severity: 'warning',
      metadata: {
        hipotese_id: 'HIP-001',
        confianca_inicial: 75
      }
    }
  }
];

// Executar ações
const effectLogs = await executeTriggerActions(actions, context);

// Resultado esperado
console.log(effectLogs);
/*
[
  {
    id: 'EFFECT-1234567890-abc123',
    actionId: 'batch-execution',
    timestamp: '2025-06-14T10:00:00.000Z',
    level: 'INFO',
    message: 'Iniciando execução de 2 ações para o caso CASO-2025-001',
    metadata: {
      totalActions: 2,
      etapaAtual: 'validation',
      especialistaAtivo: 'estrategista_chefe'
    }
  },
  {
    id: 'EFFECT-1234567891-def456',
    actionId: 'ACTION-001',
    timestamp: '2025-06-14T10:00:00.001Z',
    level: 'INFO',
    message: 'Validação cruzada iniciada: estrategista_chefe → [analista_forense, analista_comportamental]',
    metadata: {
      sourceSpecialist: 'estrategista_chefe',
      targetSpecialists: ['analista_forense', 'analista_comportamental'],
      dataToValidate: 'Hipótese sobre movimentações financeiras suspeitas',
      priority: 'high',
      caso: 'CASO-2025-001'
    }
  },
  // ... mais logs de efeito
]
*/
```

### Exemplo 2: Modificação de Score e Transição de Estado

```typescript
// Contexto com probabilidade baixa
const lowConfidenceContext: ExecutionContext = {
  ...context,
  probabilidade: 35, // Abaixo do threshold crítico
  etapa: 'hypothesis_formation'
};

// Ações para lidar com baixa confiança
const confidenceActions: SyndicateAction[] = [
  {
    id: 'ACTION-003',
    type: ActionType.SCORE_MODIFICATION,
    params: {
      field: 'probabilidade',
      value: -10,
      operation: 'increment'
    }
  },
  {
    id: 'ACTION-004',
    type: ActionType.PIPELINE_HALT,
    params: {
      reason: 'Confiança crítica detectada (25%). Revisão manual necessária.',
      severity: 'critical'
    }
  },
  {
    id: 'ACTION-005',
    type: ActionType.TASK_CREATION,
    params: {
      taskType: 'revisao_urgente',
      assignee: 'orquestrador_missao',
      description: 'Revisar hipótese com confiança crítica e determinar próximos passos',
      priority: 10,
      dueDate: new Date(Date.now() + 3600000).toISOString() // 1 hora
    }
  },
  {
    id: 'ACTION-006',
    type: ActionType.MEMORY_UPDATE,
    params: {
      memoryType: 'long_term',
      operation: 'store',
      key: `caso_${context.idCaso}_critical_confidence`,
      value: {
        timestamp: new Date().toISOString(),
        probabilidade: 25,
        etapa: 'hypothesis_formation',
        acoes_tomadas: ['halt_pipeline', 'create_review_task']
      },
      ttl: 2592000 // 30 dias em segundos
    }
  }
];

const criticalLogs = await executeTriggerActions(confidenceActions, lowConfidenceContext);

// Os logs resultantes mostrarão:
// 1. Redução do score de confiança
// 2. Interrupção do pipeline com severidade crítica
// 3. Criação de tarefa urgente de revisão
// 4. Armazenamento do incidente na memória de longo prazo
```

### Exemplo 3: Ativação de Protocolo Especializado

```typescript
// Ações para ativar protocolo de investigação aprofundada
const protocolActions: SyndicateAction[] = [
  {
    id: 'ACTION-007',
    type: ActionType.PROTOCOL_ACTIVATION,
    params: {
      protocolId: 'deep_investigation_protocol',
      parameters: {
        focus_areas: ['financial_analysis', 'behavioral_patterns'],
        time_window: '30_days',
        cross_reference_databases: true
      }
    }
  },
  {
    id: 'ACTION-008',
    type: ActionType.SPECIALIST_ACTIVATION,
    params: {
      specialistId: 'analista_forense'
    }
  },
  {
    id: 'ACTION-009',
    type: ActionType.STATE_TRANSITION,
    params: {
      fromState: 'hypothesis_formation',
      toState: 'collaborative_review',
      reason: 'Protocolo de investigação aprofundada requer revisão colaborativa',
      metadata: {
        protocol: 'deep_investigation_protocol',
        initiated_by: 'sistema_automatico'
      }
    }
  }
];

const protocolLogs = await executeTriggerActions(protocolActions, context);
```

## Integração com o Sistema

### Fluxo de Integração

1. **Trigger Engine** identifica condições e gera ações
2. **Runtime Orchestrator** passa as ações para `executeTriggerActions`
3. **Execute Actions** processa cada ação e gera logs de efeito
4. **Effect Logs** são retornados para auditoria e debug

### Pontos de Extensão

O módulo foi projetado para ser facilmente extensível:

1. **Novos Tipos de Ação**: Adicionar novo case no switch de `executeAction`
2. **Validações Customizadas**: Implementar validações específicas por tipo
3. **Efeitos Colaterais**: Adicionar hooks para efeitos reais quando necessário

## Considerações de Performance

- **Processamento Assíncrono**: Cada ação é processada de forma assíncrona
- **Tratamento de Erros**: Erros individuais não interrompem o batch
- **Logging Eficiente**: Logs são gerados em memória e retornados em batch

## Limitações e Avisos

1. **Sem Persistência Real**: Este módulo apenas simula efeitos
2. **Validação de Parâmetros**: Assume que os parâmetros foram validados anteriormente
3. **Idempotência**: Múltiplas execuções da mesma ação geram logs duplicados

## Melhorias Futuras

1. **Sistema de Retry**: Implementar retry automático para ações que falham
2. **Priorização de Ações**: Executar ações críticas primeiro
3. **Batching Inteligente**: Agrupar ações similares para otimização
4. **Métricas de Performance**: Coletar métricas de tempo de execução por tipo de ação