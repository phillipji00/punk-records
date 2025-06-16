# 📋 Review API Endpoint - Documentação Técnica

## 🎯 Visão Geral

O endpoint `/api/review` implementa o **Validation Engine** do SYNDICATE v3.2, permitindo que especialistas revisem e validem análises feitas por outros membros da equipe através de validação cruzada inteligente.

## 🔧 Especificações Técnicas

### **Endpoint**
```
POST /api/review
```

### **Headers Obrigatórios**
```http
Content-Type: application/json
```

---

## 📝 Schema de Entrada

### **Corpo da Requisição**
```typescript
{
  "reviewer": string,           // Especialista revisor
  "originalAnalysis": {         // Análise a ser revisada
    specialist: string,
    analysisId: string,
    timestamp: Date,
    analysis: {
      summary: string,
      keyPoints: string[],
      insights: Array<{
        category: string,
        description: string,
        evidence?: string[],
        confidence: number
      }>,
      patterns?: Array<{
        type: string,
        description: string,
        occurrences?: number
      }>
    },
    metadata: {
      processingTime: number,
      overallConfidence: number,
      isComplete: boolean
    }
  },
  "context": ExecutionContext   // Contexto completo da investigação
}
```

### **Valores Válidos para `reviewer`**
- `"L"` - L Lawliet (Estrategista)
- `"Norman"` - Norman (Psicólogo)
- `"Senku"` - Senku Ishigami (Historiador/Forense)
- `"Isagi"` - Isagi Yoichi (Analista Espacial)
- `"Obi"` - Captain Obi (Coordenador)

---

## 📤 Schema de Resposta

### **Resposta de Sucesso (200)**
```json
{
  "review": {
    "approved": boolean,        // Se a análise foi aprovada
    "reasons": string[],        // Lista de razões para a decisão
    "suggestions": string[]     // Sugestões de melhoria (se aplicável)
  },
  "metadata": {
    "reviewer": string,         // Nome do especialista revisor
    "originalSpecialist": string, // Nome do especialista original
    "timestamp": string,        // ISO timestamp da revisão
    "qualityScore": number      // Score de qualidade (0-1)
  }
}
```

### **Status de Aprovação**
- `approved: true` - Análise aprovada (qualityScore ≥ 0.8)
- `approved: false` - Análise rejeitada ou requer refinamento (qualityScore < 0.8)

---

## 🔍 Lógica de Validação

### **Critérios por Especialista**

#### **L Lawliet (Estrategista)**
- ✅ Consistência lógica das inferências
- ✅ Formação adequada de hipóteses
- ✅ Suporte de evidências para conclusões
- ✅ Calibração de confiança vs. evidências

#### **Norman (Psicólogo)**
- ✅ Estabelecimento de baseline comportamental
- ✅ Análise de padrões psicológicos
- ✅ Considerações éticas
- ✅ Interpretação de microexpressões

#### **Senku (Historiador/Forense)**
- ✅ Rigor metodológico científico
- ✅ Correlações evidências-tempo
- ✅ Precedentes históricos
- ✅ Calibração de confiança científica

#### **Isagi (Analista Espacial)**
- ✅ Análise espacial/tática
- ✅ Otimização matemática
- ✅ Viabilidade estratégica
- ✅ Aplicação de teoria dos jogos

#### **Obi (Coordenador)**
- ✅ Qualidade da síntese
- ✅ Coordenação de equipe
- ✅ Alinhamento com missão
- ✅ Gestão de crises

---

## 💡 Exemplos de Uso

### **Exemplo 1: Revisão Aprovada**

**Requisição:**
```bash
curl -X POST /api/review \
  -H "Content-Type: application/json" \
  -d '{
    "reviewer": "L",
    "originalAnalysis": {
      "specialist": "Norman",
      "analysisId": "analysis-456",
      "timestamp": "2025-06-16T10:30:00Z",
      "analysis": {
        "summary": "Análise comportamental revela padrões de manipulação sistemática",
        "keyPoints": [
          "Comportamento manipulativo identificado",
          "Padrões genealógicos relevantes encontrados"
        ],
        "insights": [{
          "category": "Comportamental",
          "description": "Sujeito demonstra traços narcisistas claros",
          "evidence": ["Histórico de relações exploratórias", "Padrão de idealização-desvalorização"],
          "confidence": 0.85
        }]
      },
      "metadata": {
        "processingTime": 1500,
        "overallConfidence": 0.82,
        "isComplete": true
      }
    },
    "context": {
      "executionId": "exec-123",
      "startTime": "2025-06-16T10:00:00Z",
      "input": {
        "content": "Investigar padrões comportamentais suspeitos em relações familiares"
      },
      "state": {
        "phase": "analysis",
        "activatedSpecialists": ["Norman", "L"],
        "partialResults": new Map(),
        "flags": {}
      }
    }
  }'
```

**Resposta:**
```json
{
  "review": {
    "approved": true,
    "reasons": [
      "Análise de Norman revisada por L Lawliet. Análise sólida com score de qualidade 89%.",
      "Análise atende aos critérios de qualidade",
      "Score de qualidade: 89%"
    ],
    "suggestions": []
  },
  "metadata": {
    "reviewer": "L Lawliet",
    "originalSpecialist": "Norman",
    "timestamp": "2025-06-16T10:35:00.000Z",
    "qualityScore": 0.89
  }
}
```

### **Exemplo 2: Análise Requer Refinamento**

**Resposta:**
```json
{
  "review": {
    "approved": false,
    "reasons": [
      "Análise de Senku revisada por Norman. Análise requer refinamento (score: 74%).",
      "Análise requer refinamentos específicos",
      "Score de qualidade: 74%"
    ],
    "suggestions": [
      "Fortalecer a cadeia lógica entre evidências e conclusões",
      "Expandir análise para cobrir todos os aspectos essenciais",
      "Investigar impacto emocional e padrões comportamentais do alvo"
    ]
  },
  "metadata": {
    "reviewer": "Norman",
    "originalSpecialist": "Senku",
    "timestamp": "2025-06-16T10:35:00.000Z",
    "qualityScore": 0.74
  }
}
```

---

## ⚠️ Tratamento de Erros

### **400 - Bad Request**
```json
{
  "error": "Dados de entrada inválidos",
  "details": [
    "Campo \"reviewer\" deve ser um dos: L, Norman, Senku, Isagi, Obi",
    "originalAnalysis.analysis.summary é obrigatório e deve ser string"
  ]
}
```

### **405 - Method Not Allowed**
```json
{
  "error": "Método não suportado",
  "details": "Este endpoint aceita apenas requisições POST"
}
```

### **500 - Internal Server Error**
```json
{
  "error": "Erro interno durante a revisão",
  "details": "Falha na execução da lógica de validação cruzada"
}
```

---

## 🎯 Integração com Sistema

### **Uso da Função `reviewAnalysis`**

O endpoint utiliza a função central do `reviewEngine.ts`:

```typescript
import { reviewAnalysis, ReviewInput, ReviewResult } from '../../../lib/reviewEngine';

const reviewInput: ReviewInput = {
  reviewer,
  originalAnalysis,
  context
};

const result: ReviewResult = reviewAnalysis(reviewInput);
```

### **Fluxo de Processamento**

1. **Validação de Input** - Verificação rigorosa de todos os campos obrigatórios
2. **Execução da Revisão** - Chamada para `reviewAnalysis()` com dados validados
3. **Formatação da Resposta** - Conversão do resultado para formato de API consistente
4. **Logging de Auditoria** - Registro da operação para rastreabilidade

### **Performance e Otimização**

- **Tempo médio de resposta:** ~50-100ms por revisão
- **Validação síncrona:** Todas as verificações em memória
- **Cache headers:** `no-cache` para garantir análises sempre atualizadas
- **Error handling:** Captura e tratamento de todos os tipos de erro

---

## 🔗 Casos de Uso no Sistema

### **Comando Natural: "Obi, peça para o L revisar a análise do Senku"**
```typescript
// Implementação no orquestrador
const reviewRequest = {
  reviewer: "L",
  originalAnalysis: senkuAnalysis,
  context: currentExecutionContext
};

const reviewResponse = await fetch('/api/review', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(reviewRequest)
});
```

### **Validação Automática por Confiança**
```typescript
// Trigger automático quando confidence > 80%
if (analysis.metadata.overallConfidence > 0.8) {
  const validator = selectValidator(analysis.specialist);
  const reviewResult = await callReviewAPI(validator, analysis, context);
  
  if (!reviewResult.review.approved) {
    // Solicitar refinamento ou segunda opinião
    await requestRefinement(analysis.specialist, reviewResult.review.suggestions);
  }
}
```

---

## ✅ Checklist de Implementação

- [x] ✅ Handler POST completo e funcional
- [x] ✅ Validação rigorosa de input com mensagens de erro detalhadas
- [x] ✅ Integração com função `reviewAnalysis()` do reviewEngine
- [x] ✅ Formatação consistente de resposta com metadados
- [x] ✅ Tratamento de erros abrangente (400, 405, 500)
- [x] ✅ Logging de auditoria para rastreabilidade
- [x] ✅ Headers de cache apropriados
- [x] ✅ Suporte a todos os especialistas do sistema
- [x] ✅ Mapeamento de personas (L Lawliet, Norman, etc.)
- [x] ✅ Documentação técnica completa com exemplos

---

**Status:** ✅ **IMPLEMENTAÇÃO COMPLETA**  
**Compatibilidade:** SYNDICATE v3.2  
**Pronto para:** Integração com orquestrador e testes de validação cruzada