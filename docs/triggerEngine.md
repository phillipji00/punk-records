# Trigger Engine v3.0 - Documentação Técnica

## 📋 Visão Geral

O **Trigger Engine** é o módulo responsável por avaliar condições e disparar ações com base em regras definidas no arquivo `rules.yaml`. Ele é o coração do sistema de automação do Syndicate, permitindo que o orquestrador responda dinamicamente a diferentes eventos e contextos.

## 🏗️ Arquitetura

### Melhorias da v2.0 para v3.0

#### ✅ O que foi mantido:
- **Lógica core de avaliação**: A estrutura fundamental de carregar regras YAML e avaliar condições
- **Operadores de comparação**: Todos os operadores (`==`, `!=`, `>`, `>=`, `<`, `<=`, `includes_both`)
- **Sistema de fallback**: Regra padrão quando `rules.yaml` não é encontrado
- **Validação de campos**: Verificação de campos ausentes ou null

#### 🔄 O que foi melhorado:
1. **Tipagem completa**: Integração total com `types/common.ts`
2. **Cache de regras**: Sistema de cache com TTL de 5 minutos
3. **Mapeamento de especialistas**: Conversão automática entre nomes no YAML e IDs do sistema
4. **Campos aninhados**: Suporte para acessar propriedades aninhadas (ex: `dados.probabilidade`)
5. **Processamento de ações**: Enriquecimento automático com timestamps e contexto
6. **Logging estruturado**: Logs mais informativos e controlados por ambiente
7. **Validação robusta**: Função `validateContext` com verificação completa de tipos

#### ❌ O que foi removido:
- **Duplicação de interfaces**: Tipos agora importados de `types/common.ts`
- **Função com typo**: `evaluateTriggerssSafe` corrigido para `evaluateTriggersSafe`
- **Logs excessivos**: Reduzidos em produção para melhor performance

## 📦 Dependências

```typescript
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { 
  ExecutionContext, 
  TriggerEvaluationResult, 
  SyndicateAction,
  isValidTipoRegistro,
  ESPECIALISTAS
} from './types/common';
```

## 🔧 Funções Principais

### `evaluateTriggers(context: ExecutionContext): TriggerEvaluationResult`

Função principal que avalia todas as regras contra o contexto fornecido.

**Parâmetros:**
- `context`: Objeto contendo todas as informações do evento atual

**Retorno:**
```typescript
{
  triggered: boolean,      // Se alguma regra foi ativada
  matchedRules: string[], // IDs das regras ativadas
  actions: SyndicateAction[] // Ações a serem executadas
}
```

### `validateContext(context: any): context is ExecutionContext`

Type guard que valida se o objeto fornecido é um contexto válido.

**Validações:**
- Presença de campos obrigatórios
- Tipo válido para `tipo_registro`
- Probabilidade entre 0 e 100 (se presente)

### `evaluateTriggersSafe(context: any): TriggerEvaluationResult`

Wrapper seguro que valida o contexto antes de processar.

### `suggestSpecialist(tipoRegistro: string): string`

Retorna o especialista mais adequado para um tipo de registro.

### `clearRulesCache(): void`

Limpa o cache de regras (útil para desenvolvimento e testes).

## 📐 Estrutura de Regras

As regras são definidas no arquivo `rules.yaml` com a seguinte estrutura:

```yaml
version: 1.0
rules:
  - id: string              # Identificador único
    name: string            # Nome descritivo
    description: string     # Descrição detalhada
    trigger:
      event: string         # Tipo de evento (tipo_registro)
      conditions:           # Lista de condições (AND)
        - field: string     # Campo a verificar
          operator: string  # Operador de comparação
          value: any        # Valor esperado
    actions:                # Ações a executar
      - type: string        # Tipo da ação
        [params]: any       # Parâmetros específicos
```

## 🎯 Tipos de Ações Suportadas

### 1. `log`
Registra uma mensagem no sistema.
```typescript
{
  type: 'log',
  params: {
    message: string,
    context: object
  }
}
```

### 2. `activate_specialist`
Ativa um especialista específico.
```typescript
{
  type: 'activate_specialist',
  params: {
    specialist: string,    // ID mapeado
    originalTarget: string // Nome original
  }
}
```

### 3. `advance_pipeline`
Avança o pipeline para uma nova etapa.
```typescript
{
  type: 'advance_pipeline',
  params: {
    to_stage: string
  }
}
```

### 4. `modify_score`
Modifica um score/probabilidade.
```typescript
{
  type: 'modify_score',
  params: {
    field: string,
    adjustment: number
  }
}
```

### 5. `halt_pipeline`
Para o pipeline com uma razão.
```typescript
{
  type: 'halt_pipeline',
  params: {
    reason: string
  }
}
```

### 6. `activate_protocol`
Ativa um protocolo específico.
```typescript
{
  type: 'activate_protocol',
  params: {
    protocol: string
  }
}
```

## 🗺️ Mapeamento de Especialistas

O sistema mapeia automaticamente entre nomes usados nas regras e IDs do sistema:

```typescript
const SPECIALIST_MAPPING = {
  'L Lawliet': 'estrategista_chefe',
  'Norman': 'analista_comportamental',
  'Senku': 'analista_forense',
  'Isagi': 'analista_espacial',
  'devil_advocate': 'estrategista_chefe',
  // ... etc
};
```

## 💾 Sistema de Cache

- **TTL**: 5 minutos
- **Invalidação**: Manual via `clearRulesCache()`
- **Benefício**: Evita leitura repetida do arquivo em requisições próximas

## 🔍 Exemplo de Uso

### Contexto de Entrada:

```typescript
const context: ExecutionContext = {
  idRegistro: "reg_001",
  contexto: "Análise de hipótese inicial",
  autor: "L Lawliet",
  etapa: "hypothesis_formation",
  especialista: "estrategista_chefe",
  idCaso: "caso_xyz",
  timestamp: "2025-06-14T10:00:00Z",
  tipo_registro: "hipotese",
  probabilidade: 92,
  log: (msg) => console.log(msg),
  advancePipeline: (stage) => console.log(`Avançando para: ${stage}`)
};
```

### Resultado Esperado:

```typescript
{
  triggered: true,
  matchedRules: ["hypothesis_confidence_above_90"],
  actions: [
    {
      type: "activate_specialist",
      params: {
        specialist: "estrategista_chefe",
        originalTarget: "devil_advocate"
      },
      timestamp: "2025-06-14T10:00:01Z"
    },
    {
      type: "advance_pipeline",
      params: {
        to_stage: "debate"
      },
      timestamp: "2025-06-14T10:00:01Z"
    },
    {
      type: "log",
      params: {
        message: "Hmm... o L está confiante demais. Melhor trazermos alguém para questionar essa hipótese antes de seguirmos.",
        context: {
          tipo_registro: "hipotese",
          autor: "L Lawliet",
          etapa: "hypothesis_formation"
        }
      },
      timestamp: "2025-06-14T10:00:01Z"
    }
  ]
}
```

## 🚨 Tratamento de Erros

1. **Arquivo não encontrado**: Retorna regra de fallback
2. **YAML inválido**: Retorna array vazio e loga erro
3. **Contexto inválido**: Retorna resultado vazio (não ativado)
4. **Erro na avaliação**: Capturado e retorna resultado vazio

## 🔐 Considerações de Segurança

- Validação completa de tipos antes do processamento
- Sanitização de logs em produção
- Proteção contra campos null/undefined
- Type guards para garantir integridade dos dados

## 🚀 Performance

- Cache de regras reduz I/O em ~95%
- Avaliação lazy (para na primeira condição falsa)
- Logs condicionais baseados em NODE_ENV
- Processamento de ações é feito apenas para regras ativadas

## 🧪 Testes Recomendados

1. **Teste de regras básicas**: Cada operador com casos positivos e negativos
2. **Teste de campos aninhados**: Acessar propriedades em objetos complexos
3. **Teste de cache**: Verificar que mudanças no arquivo são detectadas após TTL
4. **Teste de mapeamento**: Especialistas são corretamente mapeados
5. **Teste de validação**: Contextos inválidos são rejeitados adequadamente

## 📝 Notas de Implementação

- O sistema assume que `rules.yaml` está no mesmo diretório ou em caminhos padrão
- Todas as ações recebem timestamp automaticamente
- Logs em desenvolvimento são mais verbosos que em produção
- O mapeamento de especialistas é case-sensitive