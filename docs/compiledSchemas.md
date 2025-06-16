# Syndicate v3.1 - Módulo compiledSchemas - Documentação Técnica

## 📋 Visão Geral

O módulo **compiledSchemas** contém todos os schemas JSON compilados do sistema Syndicate, definindo a estrutura de dados esperada para cada tipo de análise dos especialistas. Este arquivo é auto-gerado a partir do `analysis_schemas.yaml` e serve como fonte única de verdade para validações.

### 🔄 Mudanças da v3.0 para v3.1

1. **Correção de erro de sintaxe**: Removido fechamento prematuro do objeto `schemas`
2. **Adição de schema**: Incluído `vault_record_schema` usado pelo runtimeOrchestrator
3. **Exports corrigidos**: Todas as interfaces TypeScript agora exportadas corretamente

## 🎯 Função Principal

Este módulo exporta um objeto `schemas` contendo todas as definições de schema JSON para validação com Ajv, além de interfaces TypeScript correspondentes para type safety.

```typescript
import { schemas, isValidSchemaId } from './compiledSchemas';
```

## 📊 Schemas Disponíveis

### Schemas por Especialista

#### 1. L Lawliet - Análise Estratégica
- **ID**: `strategic_analysis_schema`
- **Alias v3.0**: `hypothesis`
- **Campos principais**:
  - `hypothesis_id`: String (formato: H-XX.vY)
  - `confidence_score`: Integer (0-100)
  - `evidence_support`: Array de evidências
  - `logical_chain`: Cadeia de raciocínio lógico
  - `l_characteristics`: Características comportamentais do L

#### 2. Senku - Análise Forense
- **ID**: `forensic_analysis_schema`
- **Alias v3.0**: `evidence`
- **Campos principais**:
  - `evidence_id`: String (formato: DOC-XXX)
  - `scientific_method`: Metodologia científica (campo obrigatório)
  - `confidence_categories`: Categorias de confiança (alta_90_100, media_60_89, etc.)
  - `correlation_data`: Dados de correlação
  - `senku_characteristics`: Características do Senku

#### 3. Norman - Análise Psicológica
- **ID**: `psychological_analysis_schema`
- **Alias v3.0**: `psychological_profile`
- **Campos principais**:
  - `subject_name`: Nome do sujeito
  - `threat_level`: Nível de ameaça (MINIMO, BAIXO, MEDIO, ALTO, CRITICO)
  - `behavioral_baseline`: Linha de base comportamental
  - `prediction_matrix`: Matriz de predição comportamental
  - `norman_characteristics`: Características do Norman

#### 4. Isagi - Análise Tática
- **ID**: `tactical_analysis_schema`
- **Alias v3.0**: `spatial_analysis`
- **Campos principais**:
  - `field_state`: Estado do campo
  - `optimization_matrix`: Matriz de otimização
  - `strategic_recommendations`: Recomendações estratégicas
  - `resource_analysis`: Análise de recursos
  - `isagi_characteristics`: Características do Isagi

#### 5. Obi - Relatório de Coordenação
- **ID**: `coordination_report_schema`
- **Alias v3.0**: `coordination_report`
- **Campos principais**:
  - `mission_id`: String (formato: MSN-XXX)
  - `mission_status`: Status da missão
  - `team_performance`: Performance da equipe
  - `resource_allocation`: Alocação de recursos
  - `obi_characteristics`: Características do Obi

### Schemas Compartilhados

#### Cross Validation Result
- **ID**: `cross_validation_result`
- **Uso**: Validação cruzada entre especialistas
- **Campos**: validation_id, specialists_involved, validation_results

#### Timeline Entry
- **ID**: `entrada_timeline`
- **Uso**: Eventos na linha do tempo
- **Campos**: entry_id, event_type, date_time, significance_level

#### Miscellaneous Record
- **ID**: `registro_misc`
- **Uso**: Registros diversos
- **Campos**: record_id, category, content, metadata

#### Vault Record (Novo v3.1)
- **ID**: `vault_record_schema`
- **Uso**: Validação básica de registros pelo orquestrador
- **Campos**: contexto, autor, tipo_registro, timestamp, confidence

## 🔧 Estrutura dos Schemas

### Formato JSON Schema

Cada schema segue o padrão JSON Schema Draft-07 com:
- `type`: Sempre "object"
- `required`: Array de campos obrigatórios
- `properties`: Definição de cada campo
- `additionalProperties`: Permitido por padrão (para flexibilidade)

### Exemplo de Schema (L Lawliet):
```json
{
  "type": "object",
  "required": ["hypothesis_id", "confidence_score", "evidence_support", "logical_chain"],
  "properties": {
    "hypothesis_id": {
      "type": "string",
      "pattern": "^H-[0-9]+\\.v[0-9]+$",
      "description": "Format: H-01.v1, H-02.v3, etc."
    },
    "confidence_score": {
      "type": "integer",
      "minimum": 0,
      "maximum": 100
    }
    // ... outros campos
  }
}
```

## 📝 Interfaces TypeScript

O módulo exporta interfaces TypeScript para cada schema:

```typescript
export interface StrategicAnalysisSchema {
  hypothesis_id: string;
  hypothesis_statement?: string;
  confidence_score: number;
  evidence_support: Array<{
    evidence_id: string;
    support_strength?: number;
    relevance?: 'direct' | 'circumstantial' | 'correlational';
  }>;
  // ... outros campos
}
```

## 🔄 Sistema de Aliases v3.0

Para facilitar o uso, a v3.0 introduziu aliases mais intuitivos, mas eles são tratados no `schemaValidator.ts`:

```typescript
// No schemaValidator.ts
const schemaMapping = {
  'hypothesis': 'strategic_analysis_schema',
  'evidence': 'forensic_analysis_schema',
  'psychological_profile': 'psychological_analysis_schema',
  'spatial_analysis': 'tactical_analysis_schema',
  'coordination_report': 'coordination_report_schema'
};
```

## 🛠️ Funções Auxiliares

### isValidSchemaId
Verifica se um ID é válido:
```typescript
export function isValidSchemaId(id: string): id is SchemaId {
  return id in schemas;
}
```

### Type Guards
O módulo define o tipo `SchemaId`:
```typescript
export type SchemaId = keyof typeof schemas;
```

## 📊 Exemplos de Dados

O módulo inclui exemplos completos para cada especialista:

### l_output_example
```typescript
{
  "hypothesis_id": "H-03.v2",
  "hypothesis_statement": "Herbert foi assassinado por envenenamento com substância orgânica",
  "confidence_score": 78,
  // ... dados completos
}
```

### senku_output_example
```typescript
{
  "evidence_id": "DOC-007",
  "scientific_title": "Análise Química de Tinta em Documento Suspeito",
  "scientific_method": "Espectrografia de absorção",
  // ... dados completos
}
```

### norman_output_example
```typescript
{
  "subject_name": "Margaret Ashworth",
  "threat_level": "MEDIO",
  // ... dados completos
}
```

## 🔍 Padrões de ID

Cada tipo de registro tem um padrão específico:

- **Hipóteses**: `H-XX.vY` (ex: H-01.v1, H-02.v3)
- **Evidências**: `DOC-XXX` (ex: DOC-001, DOC-015)
- **Validações**: `VAL-XXX` (ex: VAL-001)
- **Timeline**: `TML-XXX` (ex: TML-001)
- **Missões**: `MSN-XXX` (ex: MSN-001)
- **Misc**: `MISC-XXX` (ex: MISC-001)

## 🔐 Validações Especiais

### Campos com Enums
- `threat_level`: MINIMO, BAIXO, MEDIO, ALTO, CRITICO
- `mission_status`: initiated, in_progress, blocked, completed, failed
- `significance_level`: low, medium, high, critical
- `relevance`: direct, circumstantial, correlational

### Campos com Ranges
- Scores de confiança: 0-100
- Ratings de performance: 0-10
- Correlações: -1.0 a 1.0

## 📈 Características dos Personagens

Cada especialista tem campos únicos para suas características:

### L Lawliet
- `sweet_consumption`: Consumo de doces
- `sitting_position`: Posição sentado
- `analytical_mood`: Humor analítico

### Senku
- `enthusiasm_level`: Nível de entusiasmo
- `glasses_adjustment`: Ajuste de óculos
- `scientific_breakthrough`: Descoberta científica

### Norman
- `smile_type`: Tipo de sorriso
- `analytical_intensity`: Intensidade analítica
- `ethical_concern_level`: Nível de preocupação ética

### Isagi
- `field_vision_active`: Visão de campo ativa
- `ego_level`: Nível de ego
- `weapon_identified`: Arma identificada

### Obi
- `leadership_style`: Estilo de liderança
- `team_morale_assessment`: Avaliação da moral da equipe
- `fire_force_philosophy_applied`: Filosofia Fire Force aplicada

## 🚀 Integração com Validator

Este módulo é usado pelo `schemaValidator.ts`:

```typescript
import { schemas } from './compiledSchemas';

// Validação
const schema = schemas[schemaId];
const validate = ajv.compile(schema);
```

## 🔄 Manutenção

**IMPORTANTE**: Este arquivo é AUTO-GENERATED. Não edite manualmente!

Para alterações nos schemas:
1. Modifique o `analysis_schemas.yaml`
2. Execute o script de compilação
3. O `compiledSchemas.ts` será regenerado

### ⚠️ Nota sobre o Erro Corrigido

Na versão anterior, havia um erro de sintaxe na linha 346 onde o objeto `schemas` era fechado prematuramente. Isso foi corrigido na v3.1, e agora todos os schemas estão corretamente incluídos dentro do objeto principal.

## 📚 Referências

- [JSON Schema Specification](https://json-schema.org/)
- [Ajv Documentation](https://ajv.js.org/)
- `analysis_schemas.yaml` - Fonte dos schemas

---

**Versão**: 3.1  
**Última atualização**: 2025-06-15  
**Status**: Corrigido e funcional