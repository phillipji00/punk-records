# 📡 API /api/retry - Documentação de Integração

## 📋 Visão Geral

O endpoint `/api/retry` expõe a lógica de recuperação inteligente do SYNDICATE v3.2, permitindo que o agente GPT "Capitão Obi" tome decisões sobre como proceder após falhas no pipeline de análise.

### Características Principais:
- **Decisões contextuais** - Baseadas no tipo de erro e etapa atual
- **Múltiplas estratégias** - 6 abordagens diferentes de recuperação
- **Limites inteligentes** - Previne loops infinitos
- **Cooldown adaptativo** - Evita sobrecarga do sistema
- **Debug opcional** - Informações detalhadas em desenvolvimento

## 🔌 Especificação da API

### Endpoint
```
POST /api/retry
Content-Type: application/json
```

### Request Body
```json
{
  "etapaAtual": "coleta_evidencias",
  "tipoErro": "timeout_analise",
  "especialista": "Senku",
  "tentativaAtual": 2,
  "confiancaAtual": 45,
  "tentativasGlobais": 2,
  "contextoErro": {
    "duracao": 30000,
    "mensagem": "Análise excedeu tempo limite"
  }
}
```

### Campos da Requisição

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `etapaAtual` | string | ✅ | Etapa do pipeline onde ocorreu a falha |
| `tipoErro` | string | ✅ | Tipo/categoria do erro identificado |
| `especialista` | string | ❌ | ID do especialista envolvido |
| `tentativaAtual` | number | ✅ | Número da tentativa atual (min: 1) |
| `confiancaAtual` | number | ❌ | Nível de confiança atual (0-100) |
| `tentativasGlobais` | number | ❌ | Total de tentativas em todo pipeline |
| `contextoErro` | object | ❌ | Dados adicionais sobre o erro |

### Response Success (200 OK)
```json
{
  "retry": {
    "acao": "ajustar",
    "proximaEtapa": "coleta_evidencias",
    "justificativa": "Timeout detectado. Recomenda-se novo prompt com abordagem simplificada.",
    "cooldownMs": 2250,
    "estrategiaRecuperacao": "adjust_and_retry",
    "modificacoes": {
      "simplificacoes": ["analise_focada", "reducao_escopo", "timeout_estendido"]
    }
  },
  "metadata": {
    "requestId": "retry-1701234567890-abc123",
    "timestamp": "2025-06-16T14:30:00.000Z",
    "version": "3.2.0"
  }
}
```

### Response Error (400 Bad Request)
```json
{
  "error": "Campo 'etapaAtual' é obrigatório e deve ser string",
  "metadata": {
    "requestId": "retry-1701234567890-def456",
    "timestamp": "2025-06-16T14:30:00.000Z",
    "version": "3.2.0"
  }
}
```

## 🎯 Ações de Retry Possíveis

### 1. **repetir**
Mantém na mesma etapa e tenta novamente com a mesma abordagem.

### 2. **ajustar**
Permanece na etapa mas com modificações (novo prompt, simplificações).

### 3. **pular**
Avança para próxima etapa aceitando resultado parcial.

### 4. **reiniciar**
Volta ao início do pipeline com metodologia simplificada.

### 5. **escalar**
Ativa protocolo de escalação para coordenação manual.

### 6. **concluir_gracioso**
Força conclusão consolidando informações disponíveis.

## 📊 Tipos de Erro Reconhecidos

### Erros de Contexto
- `low_confidence` - Confiança abaixo do limiar
- `missing_context` - Falta informações essenciais
- `incomplete_data` - Dados insuficientes

### Erros Lógicos
- `contradiction_detected` - Contradições identificadas
- `logic_error` - Falha na cadeia de raciocínio
- `invalid_reasoning` - Conclusões não seguem premissas

### Conflitos
- `specialist_conflict` - Especialistas discordam
- `no_consensus` - Impossível chegar a consenso
- `validation_conflict` - Validação contraditória

### Limitações Técnicas
- `outside_domain` - Fora da expertise disponível
- `no_specialist` - Nenhum especialista adequado
- `technical_gap` - Lacuna de conhecimento técnico

### Timeouts
- `timeout_analise` - Análise excedeu tempo
- `processing_timeout` - Processamento demorado
- `response_timeout` - Sem resposta no tempo esperado

### Sistema
- `module_error` - Erro em módulo específico
- `pipeline_failure` - Falha no pipeline
- `integration_error` - Erro de integração

### Exaustão
- `max_attempts` - Máximo de tentativas atingido
- `user_cancel` - Usuário cancelou operação
- `diminishing_returns` - Retornos decrescentes

## 🔄 Fluxo de Integração com Capitão Obi

### 1. Detecção de Falha
```typescript
// Obi detecta problema durante coordenação
if (specialistConfidence < 60 || errorDetected) {
  const retryNeeded = true;
}
```

### 2. Chamada da API
```typescript
const response = await fetch('/api/retry', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    etapaAtual: currentStage,
    tipoErro: errorType,
    especialista: affectedSpecialist,
    tentativaAtual: attemptNumber,
    confiancaAtual: confidence
  })
});

const { retry } = await response.json();
```

### 3. Execução da Decisão
```typescript
switch (retry.acao) {
  case 'ajustar':
    // Obi ajusta prompt e tenta novamente
    await adjustPromptAndRetry(retry.modificacoes);
    break;
    
  case 'escalar':
    // Obi solicita intervenção manual
    await requestUserIntervention(retry.justificativa);
    break;
    
  case 'concluir_gracioso':
    // Obi consolida e finaliza
    await consolidateAndFinish();
    break;
}
```

### 4. Aplicar Cooldown
```typescript
if (retry.cooldownMs > 0) {
  await sleep(retry.cooldownMs);
}
```

## 🛡️ Regras de Negócio Importantes

### Limites Globais
- **Máximo 3 tentativas globais** - Após isso, força conclusão
- **Máximo 2 tentativas por estratégia** - Então escala
- **Cooldown multiplicado por 1.5** a cada tentativa

### Thresholds de Confiança
- **< 25%** - Crítico, considerar conclusão forçada
- **25-40%** - Muito baixo, retry obrigatório
- **40-60%** - Preocupante, monitorar
- **60-80%** - Aceitável com cautela
- **> 80%** - Alta qualidade

### Hierarquia de Escalação
```
Contexto Insuficiente → Lacuna de Expertise → Conclusão Graciosa
Inconsistência Lógica → Conflito Especialistas → Fallback Metodológico
Conflito Especialistas → Fallback Metodológico → Conclusão Graciosa
```

## 📈 Exemplos de Uso pelo Capitão Obi

### Exemplo 1: Timeout Durante Análise
```json
// Request
{
  "etapaAtual": "analise_forense",
  "tipoErro": "timeout_analise",
  "especialista": "analista_forense",
  "tentativaAtual": 1,
  "confiancaAtual": 65
}

// Response
{
  "retry": {
    "acao": "ajustar",
    "proximaEtapa": "analise_forense",
    "justificativa": "Timeout detectado. Ajustando parâmetros.",
    "cooldownMs": 1500,
    "modificacoes": {
      "simplificacoes": ["analise_focada", "reducao_escopo"]
    }
  }
}
```

### Exemplo 2: Conflito Entre Especialistas
```json
// Request
{
  "etapaAtual": "collaborative_review",
  "tipoErro": "specialist_conflict",
  "tentativaAtual": 1,
  "contextoErro": {
    "conflictingSpecialists": ["L", "Norman"],
    "disagreementArea": "motivação do suspeito"
  }
}

// Response
{
  "retry": {
    "acao": "ajustar",
    "proximaEtapa": "collaborative_review",
    "justificativa": "Conflito entre especialistas. Ativando mediação estruturada.",
    "cooldownMs": 2000,
    "estrategiaRecuperacao": "structured_mediation",
    "modificacoes": {
      "especialistasAlternativos": ["orquestrador_missao", "analista_comportamental"]
    }
  }
}
```

### Exemplo 3: Limite Global Atingido
```json
// Request
{
  "etapaAtual": "synthesis",
  "tipoErro": "low_confidence",
  "tentativaAtual": 2,
  "tentativasGlobais": 3,
  "confiancaAtual": 35
}

// Response
{
  "retry": {
    "acao": "concluir_gracioso",
    "justificativa": "Limite de tentativas globais atingido. Consolidando análise disponível.",
    "cooldownMs": 0,
    "estrategiaRecuperacao": "graceful_conclusion"
  }
}
```

## 🐛 Debug e Troubleshooting

### Modo Debug
Em ambiente de desenvolvimento, a API retorna informações adicionais:

```json
{
  "retry": { ... },
  "metadata": {
    "debugInfo": "=== RETRY ENGINE REPORT ===\nEtapa: coleta_evidencias\n..."
  }
}
```

### Logs Internos
A API gera logs estruturados para cada requisição:
```
[retry-1701234567890-abc123] Retry request: { etapaAtual: 'coleta_evidencias', ... }
[retry-1701234567890-abc123] Retry response: { acao: 'ajustar', ... }
```

### Erros Comuns

1. **Campo obrigatório faltando**
   - Verifique se `etapaAtual`, `tipoErro` e `tentativaAtual` estão presentes

2. **Tipo de erro não reconhecido**
   - API ainda funciona mas pode escalar para coordenação manual

3. **Tentativa atual inválida**
   - Deve ser número inteiro >= 1

## 🔒 Segurança e Performance

### Rate Limiting
- Recomendado: Max 10 requisições por minuto por sessão
- Timeout de resposta: 5 segundos

### Validações
- Tamanho máximo do payload: 1MB
- Sanitização de inputs contra injection
- Validação de tipos em runtime

### CORS
- Headers configurados para permitir acesso cross-origin
- Suporta preflight OPTIONS

## 🚀 Melhores Práticas para o Capitão Obi

1. **Sempre incluir tentativasGlobais** para evitar loops infinitos
2. **Fornecer contextoErro detalhado** para decisões mais precisas
3. **Respeitar cooldowns** para não sobrecarregar o sistema
4. **Monitorar padrões de falha** para otimização contínua
5. **Comunicar claramente com usuário** sobre decisões de retry

## 📚 Referências

- **retryEngine.ts** - Implementação da lógica de retry
- **types/common.ts** - Definições de tipos
- **retry_protocols.md** - Protocolos detalhados de recuperação

---

**Versão da API**: 3.2.0  
**Compatibilidade**: SYNDICATE v3.2+  
**Última Atualização**: 16/06/2025