# 📚 Documentação da API Route `/api/refine`

**Sistema:** SYNDICATE v3.2  
**Endpoint:** `/api/refine`  
**Método:** `POST`  
**Versão:** 3.2.0  
**Status:** ✅ **PRONTO PARA PRODUÇÃO**

---

## 🎯 Visão Geral

O endpoint `/api/refine` expõe publicamente a funcionalidade de geração de perguntas de refinamento de análise do sistema SYNDICATE. É projetado para ser usado pelo agente GPT "Capitão Obi" e outros sistemas externos que precisam enriquecer o contexto investigativo através de perguntas direcionadas.

### Principais Características:
- 🤔 **Perguntas Inteligentes**: Gera perguntas específicas baseadas no contexto
- 🎭 **Multi-Especialista**: Suporta todos os 5 especialistas do sistema
- 🚀 **Detecção Automática**: Pode auto-detectar o especialista ideal
- 🛑 **Sistema de Escape**: Reconhece comandos para pular refinamento
- 📊 **Modos Adaptativos**: Ajusta quantidade de perguntas pela confiança

---

## 📋 Especificação da API

### Request

**URL:** `https://seu-dominio.com/api/refine`  
**Método:** `POST`  
**Content-Type:** `application/json`

#### Body Schema

```typescript
{
  // OBRIGATÓRIOS
  "specialist": string,        // Nome do especialista ou alias
  "context": string,          // Contexto da investigação
  
  // OPCIONAIS
  "hypothesis": string,       // Hipótese atual sendo investigada
  "evidence": string,         // Evidências disponíveis
  "missingElement": string,   // Elemento que falta esclarecer
  "userCommand": string,      // Comando do usuário (detecta escape)
  "currentConfidence": number,// Confiança atual (0-100)
  "useFullRefinement": boolean// Se true, retorna dados completos
}
```

#### Especialistas Válidos

| Nome Completo | Alias | Domínio |
|--------------|-------|----------|
| L Lawliet | L | Estratégico |
| Senku Ishigami | Senku | Histórico |
| Norman | Norman | Comportamental |
| Isagi Yoichi | Isagi | Otimização |
| Capitão Obi | Obi | Coordenação |

### Response

#### Sucesso (200 OK)

**Resposta Básica** (useFullRefinement = false):
```json
{
  "questions": [
    {
      "question": "O sujeito tinha algum motivo pessoal para alterar sua rota?",
      "targetVariable": "motivacao",
      "priority": 1
    },
    {
      "question": "O depoimento foi colhido em qual condição psicológica?",
      "targetVariable": "pressao_contextual",
      "priority": 2
    }
  ]
}
```

**Resposta Completa** (useFullRefinement = true):
```json
{
  "questions": [...],
  "mode": "deep",
  "estimatedQuestions": 4,
  "confidenceTarget": 85,
  "escapeAvailable": true
}
```

#### Erros

**400 Bad Request** - Dados inválidos:
```json
{
  "error": "Requisição inválida",
  "details": "Campo 'context' é obrigatório e deve ser uma string não vazia"
}
```

**405 Method Not Allowed** - Método incorreto:
```json
{
  "error": "Método não permitido",
  "details": "Esta rota aceita apenas requisições POST"
}
```

**500 Internal Server Error** - Erro do servidor:
```json
{
  "error": "Erro interno do servidor",
  "details": "Ocorreu um erro ao processar a requisição"
}
```

---

## 💡 Exemplos de Uso

### Exemplo 1: Refinamento Básico com Norman

```bash
curl -X POST https://seu-dominio.com/api/refine \
  -H "Content-Type: application/json" \
  -d '{
    "specialist": "Norman",
    "context": "Divergência entre depoimento e laudo técnico",
    "hypothesis": "O personagem mentiu sobre o paradeiro",
    "evidence": "logs de GPS",
    "missingElement": "intencionalidade"
  }'
```

**Resposta:**
```json
{
  "questions": [
    {
      "question": "O sujeito tinha algum motivo pessoal para alterar sua rota?",
      "targetVariable": "motivacao",
      "priority": 1
    },
    {
      "question": "O depoimento foi colhido em qual condição psicológica?",
      "targetVariable": "pressao_contextual",
      "priority": 2
    }
  ]
}
```

### Exemplo 2: Auto-Detecção de Especialista

```javascript
// JavaScript/Node.js
const response = await fetch('https://seu-dominio.com/api/refine', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    specialist: '',  // Sistema detecta automaticamente
    context: 'Análise de documento histórico sobre tratado diplomático do século XIX',
    currentConfidence: 40
  })
});

const data = await response.json();
console.log(data);
// Perguntas de Senku Ishigami serão geradas
```

### Exemplo 3: Comando de Escape

```python
# Python
import requests

response = requests.post(
    'https://seu-dominio.com/api/refine',
    json={
        'specialist': 'L',
        'context': 'Investigação de fraude corporativa',
        'userCommand': 'ok prossiga com o que tem',
        'currentConfidence': 65
    }
)

print(response.json())
# {
#   "questions": [{
#     "question": "Roger! Prosseguindo com contexto atual (confidence: 65%). Fire Force adapta!",
#     "targetVariable": "escape_acknowledged",
#     "priority": 1
#   }]
# }
```

### Exemplo 4: Refinamento Completo

```typescript
// TypeScript
interface RefineResponse {
  questions: Array<{
    question: string;
    targetVariable: string;
    priority: number;
  }>;
  mode?: 'rapid' | 'deep' | 'collaborative';
  estimatedQuestions?: number;
  confidenceTarget?: number;
  escapeAvailable?: boolean;
}

async function getRefinementQuestions(): Promise<RefineResponse> {
  const response = await fetch('/api/refine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      specialist: 'Capitão Obi',
      context: 'Múltiplas ameaças convergindo, recursos limitados',
      currentConfidence: 30,
      useFullRefinement: true  // Obter dados completos
    })
  });
  
  return response.json();
}

// Uso
const result = await getRefinementQuestions();
console.log(`Modo: ${result.mode}`); // "collaborative"
console.log(`Perguntas esperadas: ${result.estimatedQuestions}`); // 6
```

---

## 🔧 Integração com GPT/Assistentes

### Configuração no GPT Builder

```yaml
Action:
  name: generateRefinementQuestions
  description: Gera perguntas para refinar contexto investigativo
  endpoint: POST https://seu-dominio.com/api/refine
  parameters:
    specialist:
      type: string
      description: Nome do especialista (L, Senku, Norman, Isagi, Obi)
      required: true
    context:
      type: string
      description: Contexto atual da investigação
      required: true
    hypothesis:
      type: string
      description: Hipótese sendo investigada
      required: false
    evidence:
      type: string
      description: Evidências disponíveis
      required: false
    currentConfidence:
      type: number
      description: Confiança atual (0-100)
      required: false
```

### Exemplo de Prompt para GPT

```
Quando precisar refinar uma investigação:

1. Identifique o contexto e especialista apropriado
2. Chame a API /api/refine com os dados
3. Apresente as perguntas ao usuário
4. Se o usuário responder "prossiga" ou similar, continue sem mais perguntas
5. Use as respostas para enriquecer o contexto antes da análise final
```

---

## 📊 Lógica de Refinamento

### Modos de Operação

| Confiança | Modo | Perguntas | Descrição |
|-----------|------|-----------|-----------|
| 75-100% | rapid | 1-2 | Refinamento rápido |
| 50-74% | deep | 3-4 | Refinamento profundo |
| 0-49% | collaborative | 5-6 | Multi-especialista |

### Comandos de Escape

Os seguintes comandos permitem pular o refinamento:
- "prossiga"
- "chega de perguntas"
- "analise agora"
- "suficiente"
- "continue"
- "skip questions"
- "go ahead"
- "chega"
- "ok"

### Target Variables Comuns

| Variable | Tipo de Informação |
|----------|-------------------|
| motivacao | Razões psicológicas |
| pressao_contextual | Condições ambientais |
| periodo_historico | Contexto temporal |
| evidencia_fisica | Provas materiais |
| pattern_analysis | Padrões identificados |
| strategic_element | Componentes estratégicos |

---

## 🛡️ Segurança e Limites

### Rate Limiting
- Recomendado: 60 requisições/minuto por IP
- Tamanho máximo do body: 1MB

### Validações
- Context não pode estar vazio
- Specialist deve ser válido ou vazio
- currentConfidence deve estar entre 0-100

### CORS
- Headers configurados para aceitar requisições de qualquer origem
- Ajuste conforme necessário para produção

---

## 🔍 Troubleshooting

### "Especialista inválido"
**Solução:** Use os nomes exatos ou aliases da tabela

### Poucas perguntas retornadas
**Causa:** Alta confiança ou comando de escape detectado
**Solução:** Reduza currentConfidence ou remova comandos de escape

### Perguntas genéricas
**Causa:** Contexto muito vago
**Solução:** Forneça mais detalhes em context, hypothesis ou evidence

### Timeout em requisições
**Causa:** Processamento complexo
**Solução:** Implemente timeout no cliente (recomendado: 30s)

---

## 📝 Notas de Implementação

1. **Logs**: Em desenvolvimento, a API loga informações úteis no console
2. **Errors**: Em produção, detalhes de erro são ocultados por segurança
3. **Performance**: Respostas típicas em <100ms
4. **Escalabilidade**: Stateless, pode ser escalado horizontalmente

---

## 🚀 Próximos Passos

1. **Teste a API** com diferentes contextos e especialistas
2. **Monitore** logs para identificar padrões de uso
3. **Ajuste** rate limits conforme necessário
4. **Considere cache** para perguntas frequentes
5. **Implemente autenticação** se necessário

---

**SYNDICATE v3.2** - *Fire Force cuida das perguntas certas!* 🔥