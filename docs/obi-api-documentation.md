# API Endpoint `/api/obi` - Documentação Completa

## 📋 Visão Geral

O endpoint `/api/obi` expõe a inteligência decisória do Capitão Akitaru Obi, permitindo que sistemas externos (incluindo GPTs) consultem o orquestrador do SYNDICATE para obter comandos de coordenação baseados em contextos de investigação.

### 🎯 Propósito

- **Função Principal**: Receber um `ExecutionContext` e retornar uma lista priorizada de `ObiCommand[]`
- **Uso Típico**: GPTs ou sistemas automatizados perguntam "O que fazer agora?" e recebem instruções narrativas do Obi
- **Integração**: Pode ser usado como Action em GPTs customizados ou chamado por qualquer sistema via HTTP

## 🔧 Especificações Técnicas

### Método HTTP
- **POST** `/api/obi`

### Headers Necessários
```http
Content-Type: application/json
```

### Headers CORS
O endpoint já inclui headers CORS permissivos:
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

## 📤 Formato da Requisição

### Estrutura Básica
```json
{
  "context": {
    "idRegistro": "string",
    "contexto": "string",
    "autor": "string", 
    "etapa": "string",
    "idCaso": "string",
    "timestamp": "string"
  }
}
```

### Campos Obrigatórios

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `idRegistro` | string | Identificador único do registro/investigação |
| `contexto` | string | Descrição detalhada da situação atual |
| `autor` | string | Quem está solicitando a análise (ex: "L", "sistema") |
| `etapa` | string | Etapa atual do pipeline (ex: "coleta_evidencias") |
| `idCaso` | string | Identificador do caso sendo investigado |
| `timestamp` | string | Data/hora no formato ISO 8601 |

### Campos Opcionais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `especialista` | string | Especialista atual (default: "orquestrador_missao") |
| `tipo_registro` | string | Tipo do registro (ex: "evidencia", "hipotese") |
| `probabilidade` | number | Confiança na análise atual (0-100) |

### Parâmetros Adicionais

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `includeDiagnostics` | boolean | Se incluir diagnóstico completo do sistema |

## 📥 Formato da Resposta

### Resposta de Sucesso (200 OK)
```json
{
  "commands": [
    {
      "action": "ativar_especialista",
      "target": "Norman",
      "mensagemNarrativa": "Norman, sua leitura comportamental será essencial aqui.",
      "prioridade": 9,
      "dados": {
        "especialista": "analista_comportamental"
      },
      "timestamp": "2025-06-16T15:30:00Z"
    }
  ],
  "diagnostics": {
    "statusGeral": "operacional",
    "especialistasRecomendados": ["Norman", "L"],
    "proximasAcoes": [...],
    "alertas": [],
    "confiancaSistema": 85
  },
  "metadata": {
    "processedAt": "2025-06-16T15:30:00Z",
    "version": "v3.2",
    "contextId": "reg001"
  }
}
```

### Estrutura do ObiCommand

| Campo | Tipo | Valores Possíveis | Descrição |
|-------|------|-------------------|-----------|
| `action` | string | `ativar_especialista`, `validar_etapa`, `escrever_contexto`, `pausar`, `avançar_pipeline`, `resolver_conflito` | Tipo de ação a executar |
| `target` | string? | ID do especialista ou etapa | Alvo da ação |
| `mensagemNarrativa` | string | - | Comando narrativo do Obi |
| `prioridade` | number | 1-10 | Prioridade (10 = máxima) |
| `dados` | object? | - | Dados adicionais da ação |
| `timestamp` | string | - | Quando o comando foi gerado |

### Resposta de Erro

```json
{
  "error": "Descrição do erro",
  "code": "ERROR_CODE",
  "details": {
    // Detalhes adicionais em desenvolvimento
  }
}
```

### Códigos de Erro

| Código HTTP | Code | Descrição |
|-------------|------|-----------|
| 400 | `MISSING_CONTEXT` | Contexto não fornecido no body |
| 400 | `INVALID_CONTEXT` | Contexto com campos faltando ou inválidos |
| 405 | `METHOD_NOT_ALLOWED` | Método HTTP diferente de POST |
| 500 | `INTERNAL_ERROR` | Erro interno ao processar |

## 🚀 Exemplos de Uso

### 1. Requisição Simples
```bash
curl -X POST https://api.exemplo.com/api/obi \
  -H "Content-Type: application/json" \
  -d '{
    "context": {
      "idRegistro": "inv-001",
      "contexto": "Documento suspeito encontrado com assinatura falsificada",
      "autor": "sistema",
      "etapa": "coleta_evidencias",
      "idCaso": "caso-001",
      "timestamp": "2025-06-16T10:00:00Z"
    }
  }'
```

### 2. Requisição com Diagnóstico
```javascript
const response = await fetch('/api/obi', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    context: {
      idRegistro: "reg-002",
      contexto: "Múltiplas contradições detectadas entre depoimentos",
      autor: "L",
      etapa: "validacao",
      especialista: "estrategista_chefe",
      idCaso: "caso-002",
      timestamp: new Date().toISOString(),
      probabilidade: 35
    },
    includeDiagnostics: true
  })
});

const data = await response.json();
```

### 3. Integração com GPT Custom Action
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Obi Intelligence API",
    "version": "3.2"
  },
  "servers": [{
    "url": "https://api.exemplo.com"
  }],
  "paths": {
    "/api/obi": {
      "post": {
        "summary": "Consultar decisão do Capitão Obi",
        "operationId": "decidirAcaoObi",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ObiRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Comandos do Obi",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ObiResponse"
                }
              }
            }
          }
        }
      }
    }
  }
}
```

## 🎭 Interpretando os Comandos

### Prioridades e Urgência

- **Prioridade 10**: Crítico - resolver conflitos detectados
- **Prioridade 9-7**: Alta - ativar especialistas necessários
- **Prioridade 8**: Alta - pausar se confiança < 40%
- **Prioridade 6**: Média - validar com múltiplos especialistas
- **Prioridade 5**: Média - avançar pipeline
- **Prioridade 3**: Baixa - registrar contexto

### Fluxo de Decisão

1. **Análise do Contexto**: Obi avalia complexidade, urgência e confiança
2. **Detecção de Triggers**: Palavras-chave ativam especialistas específicos
3. **Priorização**: Comandos são ordenados por importância
4. **Narrativa**: Cada comando inclui mensagem característica do Obi

## 🔒 Segurança e Boas Práticas

### Validação de Entrada
- Todos os campos obrigatórios são validados
- Probabilidade deve estar entre 0-100
- Timestamps devem ser strings válidas

### Rate Limiting
Em produção, considere implementar:
- Limite de requisições por IP
- Autenticação via API Key
- Throttling por usuário

### Logging e Monitoramento
O endpoint já inclui logs para:
- Comandos gerados
- Erros de validação
- Ativações de especialistas

## 🧪 Testando o Endpoint

### Teste de Saúde
```bash
curl -X POST http://localhost:3000/api/obi \
  -H "Content-Type: application/json" \
  -d '{
    "context": {
      "idRegistro": "test-001",
      "contexto": "Teste de funcionamento básico",
      "autor": "teste",
      "etapa": "intake_analysis",
      "idCaso": "test-case",
      "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    }
  }'
```

### Resposta Esperada
```json
{
  "commands": [
    {
      "action": "escrever_contexto",
      "mensagemNarrativa": "Registrando essas descobertas no nosso sistema. Cada insight pode ser crucial para investigações futuras.",
      "prioridade": 3,
      "timestamp": "2025-06-16T15:30:00Z"
    }
  ],
  "metadata": {
    "processedAt": "2025-06-16T15:30:00Z",
    "version": "v3.2",
    "contextId": "test-001"
  }
}
```

## 📚 Integração com o Sistema SYNDICATE

### Módulos Utilizados
- **obiStateManager.ts**: Lógica central de decisão
- **types/common.ts**: Tipos e interfaces
- **Personas**: Mapeamento de especialistas

### Compatibilidade
- **Versão**: SYNDICATE v3.2
- **Node.js**: 14+
- **Next.js**: 12+
- **TypeScript**: 4.5+

## 🛠️ Troubleshooting

### Erro "INVALID_CONTEXT"
Verifique se todos os campos obrigatórios estão presentes e são strings.

### Comandos vazios
Contextos muito simples podem gerar apenas comando de registro. Adicione mais detalhes.

### Timeout em produção
Configure timeout adequado no servidor (recomendado: 30s).

## 🚀 Deploy

### Vercel
```json
{
  "functions": {
    "api/obi.ts": {
      "maxDuration": 30
    }
  }
}
```

### Environment Variables
```env
NODE_ENV=production
API_RATE_LIMIT=100
LOG_LEVEL=info
```

---

✅ **Endpoint pronto para integração com GPTs e sistemas externos!**