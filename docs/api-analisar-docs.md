# 📘 Documentação da API `/api/analisar`

## 🎯 Visão Geral

A rota `/api/analisar` expõe a funcionalidade de análise narrativa dos especialistas do sistema SYNDICATE v3.2. Esta API permite que o agente GPT "Capitão Obi" solicite análises profundas de registros, acionando o especialista adequado para cada contexto.

---

## 🔧 Especificação Técnica

### Endpoint
```
POST /api/analisar
```

### Headers Obrigatórios
```json
{
  "Content-Type": "application/json"
}
```

### Limites
- **Tamanho máximo do body**: 1MB
- **Timeout**: 30 segundos (configurável)
- **Rate limiting**: Não implementado (adicionar conforme necessidade)

---

## 📥 Formato de Requisição

### Schema do Body
```typescript
{
  "specialist"?: string,  // Opcional se já estiver no context
  "context": {
    // Opção 1: ExecutionContext completo
    "executionId": string,
    "input": {...},
    "state": {...},
    // ... outros campos do ExecutionContext
    
    // Opção 2: Contexto simplificado (mais comum)
    "idRegistro": string,
    "contexto": string,
    "autor": string,      // Nome do especialista
    "etapa": string,
    "especialista": string,
    "idCaso": string,
    "timestamp": string,
    "tipo_registro"?: string,
    "probabilidade"?: number  // 0-1, default: 0.75
  }
}
```

### Especialistas Válidos
- `"L"` - L Lawliet (Estratégia e Lógica)
- `"Senku"` - Senku Ishigami (Ciência e História)
- `"Norman"` - Norman (Psicologia e Comportamento)
- `"Isagi"` - Isagi Yoichi (Otimização Espacial)
- `"Obi"` - Capitão Obi (Coordenação e Liderança)

---

## 📤 Formato de Resposta

### Resposta de Sucesso (200 OK)
```json
{
  "analysis": {
    "specialist": "Senku",
    "analysisId": "analysis-1687812345678-abc123",
    "timestamp": "2025-06-14T12:00:01Z",
    "analysis": {
      "summary": "Hipótese principal da análise",
      "keyPoints": [
        "Justificativa principal",
        "Primeira ação recomendada",
        "Segunda ação recomendada"
      ],
      "insights": [
        {
          "category": "primary_recommendation",
          "description": "Ação recomendada detalhada",
          "confidence": 0.93
        }
      ]
    },
    "recommendations": [
      {
        "action": "Investigar versões conflitantes de mapas",
        "rationale": "Baseado na análise de Senku",
        "priority": "high"
      }
    ],
    "metadata": {
      "processingTime": 52,
      "overallConfidence": 0.93,
      "isComplete": true
    }
  }
}
```

### Resposta de Erro (400 Bad Request)
```json
{
  "error": "Mensagem de erro principal",
  "details": "Detalhes adicionais sobre o erro"
}
```

### Resposta de Erro (405 Method Not Allowed)
```json
{
  "error": "Método não permitido",
  "details": "Esta rota aceita apenas requisições POST"
}
```

---

## 🚀 Exemplos de Uso

### Exemplo 1: Análise com Senku (Alta Confiança)
```bash
curl -X POST https://seu-dominio.com/api/analisar \
  -H "Content-Type: application/json" \
  -d '{
    "context": {
      "idRegistro": "reg001",
      "contexto": "Análise de documentos históricos sobre a Guerra de Ruína encontrados com páginas faltando",
      "autor": "Senku",
      "etapa": "coleta_evidencias",
      "especialista": "Senku",
      "idCaso": "caso_mt_holly",
      "timestamp": "2025-06-14T12:00:00Z",
      "tipo_registro": "evidencia",
      "probabilidade": 0.93
    }
  }'
```

### Exemplo 2: Análise com Norman (Baixa Confiança - Ativa Refinamento)
```bash
curl -X POST https://seu-dominio.com/api/analisar \
  -H "Content-Type: application/json" \
  -d '{
    "specialist": "Norman",
    "context": {
      "idRegistro": "reg002",
      "contexto": "Comportamento suspeito detectado em Simon",
      "autor": "Norman",
      "etapa": "analise_comportamental",
      "especialista": "Norman",
      "idCaso": "caso001",
      "timestamp": "2025-06-14T13:00:00Z",
      "probabilidade": 0.65
    }
  }'
```

### Exemplo 3: Coordenação com Obi
```bash
curl -X POST https://seu-dominio.com/api/analisar \
  -H "Content-Type: application/json" \
  -d '{
    "context": {
      "idRegistro": "reg003",
      "contexto": "Múltiplos especialistas convergindo para Mt. Holly. Ameaças detectadas.",
      "autor": "Obi",
      "etapa": "coordenacao",
      "especialista": "Obi",
      "idCaso": "caso_convergencia",
      "timestamp": "2025-06-14T14:00:00Z",
      "probabilidade": 0.95
    }
  }'
```

---

## ⚙️ Comportamentos Especiais

### 1. Refinamento Automático
Quando `probabilidade < 0.8`, a API automaticamente:
- Registra no console a necessidade de refinamento
- Usa a função `refineAndAnalyze` ao invés de `gerarAnaliseEspecialista`
- Pode sugerir perguntas adicionais para melhorar o contexto

### 2. Construção Flexível de Contexto
A API aceita dois formatos de contexto:
- **ExecutionContext completo**: Para integrações avançadas
- **Contexto simplificado**: Para uso mais direto (recomendado)

### 3. Conversão de Formatos
A API converte automaticamente o formato interno `AnaliseEspecialista` para o formato padrão `SpecialistResponse` do sistema.

---

## 🔍 Tratamento de Erros

### Erros Comuns

| Código | Erro | Causa | Solução |
|--------|------|-------|---------|
| 400 | "Especialista não reconhecido" | Nome de especialista inválido | Use um dos 5 nomes válidos |
| 400 | "Contexto não fornecido" | Campo `context` ausente | Inclua o campo `context` no body |
| 400 | "context está incompleto" | Faltam campos obrigatórios | Verifique campos mínimos necessários |
| 405 | "Método não permitido" | Uso de GET, PUT, etc. | Use apenas POST |

### Logs de Debug
A API registra no console:
- Análises de baixa confiança que ativam refinamento
- Tempo de processamento
- Erros detalhados para troubleshooting

---

## 🔗 Integração com Outros Módulos

### specialist-agent.ts
- Importa `gerarAnaliseEspecialista` e `refineAndAnalyze`
- Usa a lógica de análise narrativa dos especialistas

### types/common.ts
- Usa tipos `ExecutionContext` e `SpecialistResponse`
- Implementa validações de tipo

### qaRefiner (via refineAndAnalyze)
- Ativado automaticamente para contextos de baixa confiança
- Sugere perguntas para melhorar a qualidade da análise

---

## 📊 Métricas e Monitoramento

### Métricas Importantes
- **Tempo médio de resposta**: Target < 500ms
- **Taxa de erro**: Target < 5%
- **Distribuição por especialista**: Para balanceamento
- **Taxa de refinamento**: % de análises com confiança < 80%

### Logs Estruturados
```
[API] Análise concluída com sucesso. Especialista: Senku, Confiança: 93%
[API] Confiança baixa detectada (65%). Usando análise refinada.
[API] Erro ao processar análise: [detalhes]
```

---

## 🚧 Melhorias Futuras

1. **Cache de Análises**: Para requisições idênticas
2. **Rate Limiting**: Proteção contra abuso
3. **Autenticação**: JWT ou API Key
4. **Webhooks**: Notificação quando análise completa
5. **Batch Processing**: Múltiplas análises em uma requisição
6. **Streaming**: Para análises longas

---

## ✅ Checklist de QA

- [x] Aceita apenas POST
- [x] Valida presença de context
- [x] Suporta todos os 5 especialistas
- [x] Ativa refinamento para baixa confiança
- [x] Retorna formato SpecialistResponse padrão
- [x] Tratamento de erros completo
- [x] Logs apropriados para debug
- [x] Documentação com exemplos funcionais

---

## 📌 Status
**Versão**: 1.0.0  
**Status**: Pronto para produção  
**Última atualização**: 2025-06-14  
**Compatível com**: SYNDICATE v3.2