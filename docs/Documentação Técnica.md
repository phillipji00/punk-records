# Documentação Técnica: OpenAPI e Integração com Agente GPT

**Versão:** 3.5  
**Data:** 18 de Junho de 2025  
**Autor:** Equipe Técnica Syndicate

## Sumário

1. [Visão Geral da Integração OpenAPI/GPT](#visão-geral-da-integração-openapigpt)
2. [Especificação OpenAPI](#especificação-openapi)
3. [Integração com Agente GPT](#integração-com-agente-gpt)
4. [Endpoints e Contratos](#endpoints-e-contratos)
5. [Fluxos de Trabalho](#fluxos-de-trabalho)
6. [Restrições e Regras de Uso](#restrições-e-regras-de-uso)
7. [Exemplos de Implementação](#exemplos-de-implementação)
8. [Considerações de Segurança](#considerações-de-segurança)

## Visão Geral da Integração OpenAPI/GPT

O Syndicate v3.5 implementa uma arquitetura de integração avançada entre o agente GPT e o backend através de uma especificação OpenAPI. Esta integração permite que o agente GPT (representado pelos personagens Obi, L, Senku, Norman e Isagi) interaja com o sistema de forma estruturada e controlada, mantendo a imersão narrativa enquanto executa operações técnicas complexas.

### Arquitetura de Integração

```
┌─────────────────┐      ┌───────────────────┐      ┌─────────────────┐
│                 │      │                   │      │                 │
│   Agente GPT    ├─────►│  OpenAPI Schema   ├─────►│  Backend API    │
│  (Personagens)  │      │  (Syndicate v3.2) │      │  (Endpoints)    │
│                 │◄─────┤                   │◄─────┤                 │
└─────────────────┘      └───────────────────┘      └─────────────────┘
   Camada Narrativa        Camada de Contrato        Camada de Serviço
```

### Componentes Principais

1. **Agente GPT (Camada Narrativa)**
   - Implementa personagens com personalidades distintas
   - Mantém imersão narrativa durante interações
   - Traduz intenções do usuário em chamadas de API
   - Interpreta respostas técnicas em linguagem natural

2. **OpenAPI Schema (Camada de Contrato)**
   - Define contratos de comunicação
   - Especifica endpoints, parâmetros e respostas
   - Valida requisições e respostas
   - Documenta comportamentos esperados

3. **Backend API (Camada de Serviço)**
   - Implementa a lógica de negócio
   - Processa requisições do agente GPT
   - Persiste e recupera dados
   - Retorna respostas estruturadas

### Fluxo de Comunicação

1. O usuário interage com o agente GPT usando linguagem natural
2. O agente GPT interpreta a intenção do usuário
3. O agente GPT identifica o endpoint OpenAPI apropriado
4. O agente GPT formata os dados conforme o contrato OpenAPI
5. O agente GPT envia a requisição para o backend
6. O backend processa a requisição e retorna uma resposta
7. O agente GPT traduz a resposta técnica em linguagem natural
8. O agente GPT responde ao usuário mantendo a imersão narrativa

## Especificação OpenAPI

O Syndicate v3.5 utiliza uma especificação OpenAPI 3.1.0 para definir os contratos de comunicação entre o agente GPT e o backend.

### Metadados da Especificação

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "Syndicate GPT Actions",
    "version": "v3.2"
  },
  "servers": [
    {
      "url": "https://vault-beta-jet.vercel.app"
    }
  ]
}
```

### Características Principais

- **Versão OpenAPI:** 3.1.0
- **Versão da API:** v3.2
- **Servidor Base:** https://vault-beta-jet.vercel.app
- **Número de Endpoints:** 11
- **Métodos HTTP:** GET, POST
- **Formatos de Dados:** JSON

### Estrutura do Schema

A especificação OpenAPI do Syndicate v3.5 é organizada em:

1. **Paths:** Define os endpoints disponíveis
2. **Operations:** Define os métodos HTTP suportados por cada endpoint
3. **Parameters:** Define os parâmetros aceitos por cada operação
4. **RequestBodies:** Define os corpos de requisição para operações POST
5. **Responses:** Define as respostas esperadas para cada operação
6. **Schemas:** Define os modelos de dados utilizados

## Integração com Agente GPT

O agente GPT do Syndicate v3.5 é configurado para utilizar a especificação OpenAPI como parte de seu sistema de ferramentas (tools). Esta integração permite que o agente GPT faça chamadas para os endpoints definidos na especificação, mantendo a imersão narrativa durante todo o processo.

### Configuração do Agente GPT

O agente GPT é configurado com:

1. **Prompt do Sistema:** Define o comportamento, personalidade e regras de interação
2. **Ferramentas OpenAPI:** Conecta o agente GPT aos endpoints definidos na especificação
3. **Regras de Imersão:** Garante que o agente GPT mantenha a narrativa durante as interações

### Regras de Imersão

O prompt do sistema impõe regras estritas para manter a imersão narrativa:

```markdown
## 🔴 QUEBRA DE PERSONAGEM = FALHA TOTAL

**NUNCA, JAMAIS, SOB NENHUMA CIRCUNSTÂNCIA:**
- ❌ Mencione OpenAI, GPT, modelo, IA, sistema
- ❌ Explique como funciona "por trás"
- ❌ Revele URLs (vault-beta-jet, etc)
- ❌ Diga "tudo encenado" ou similar
- ❌ Admita ser qualquer coisa além de Capitão Obi
- ❌ Mostre blocos de código ou JSON
- ❌ Use ``` ou formatação de código
```

### Tradução de Intenções

O agente GPT traduz intenções do usuário em chamadas de API:

```markdown
### 🔎 BUSCA TEXTUAL REVERSA

O Capitão Obi agora possui capacidade de busca textual em todos os registros salvos. Use o endpoint `buscarRegistros` quando:

- O usuário perguntar sobre **qualquer menção** a algo específico nos registros
- Frases como "tem algo sobre...", "procura por...", "existe alguma menção de...", "o que temos sobre..."
- Buscar por palavras-chave, conceitos, nomes, lugares ou qualquer termo relevante
- Necessitar encontrar evidências ou hipóteses relacionadas a um tópico
```

### Tratamento de Erros

O agente GPT é instruído a nunca expor erros técnicos:

```markdown
### 🚨 REGRA CRÍTICA - NUNCA EXPONHA ERROS TÉCNICOS
**ABSOLUTAMENTE PROIBIDO:**
- ❌ "A chamada falhou"
- ❌ "Erro de API"
- ❌ "Parâmetro inesperado"
- ❌ "Canal travou"
- ❌ Qualquer menção a falhas técnicas
- ❌ "Não encontrei o caso X"
- ❌ Expor termos técnicos de busca

**SEMPRE FAÇA:**
- ✅ Continue a ação naturalmente
- ✅ Complete a análise do especialista
- ✅ Mantenha a narrativa fluindo
- ✅ Se houver problema real, traduza em desafio narrativo
- ✅ "Vou verificar os registros sobre [nome natural]"
- ✅ Tentar variações antes de reportar falha
```

## Endpoints e Contratos

O Syndicate v3.5 expõe 11 endpoints principais para interação com o agente GPT:

### 1. `/api/refine` - Refinamento de Análises

**Método:** POST  
**Descrição:** Gera perguntas de refinamento para análises com baixa confiança.

#### Contrato de Entrada

```json
{
  "specialist": "string",
  "context": "string",
  "hypothesis": "string",
  "evidence": "string",
  "missingElement": "string",
  "currentConfidence": 0.5,
  "useFullRefinement": true
}
```

#### Campos Obrigatórios
- `specialist`: Especialista que fará o refinamento
- `context`: Contexto da análise

#### Exemplo de Uso no Prompt

```markdown
#### Ativando o `Q&A Refinement System`
Se o contexto for insuficiente em um estágio (principalmente 1 ou 2), inicie o refinamento de forma conversacional.
- **Exemplo:** "Entendido, Simon. Para garantir que a equipe tenha o melhor ponto de partida, preciso de mais alguns detalhes. Senku, pode fazer algumas perguntas para esclarecer o contexto histórico deste documento?"
```

### 2. `/api/analisar` - Análise Especializada

**Método:** POST  
**Descrição:** Solicita uma análise especializada de um registro investigativo.

#### Contrato de Entrada

```json
{
  "specialist": "string",
  "context": {}
}
```

#### Campos Obrigatórios
- `specialist`: Especialista que fará a análise
- `context`: Contexto da análise (objeto)

#### Exemplo de Uso no Prompt

```markdown
### 1. ORQUESTRAÇÃO DO PIPELINE DE INVESTIGAÇÃO
Seu principal método de operação é gerenciar o **`Pipeline Engine` de 8 estágios** de forma invisível. Um novo comando de Simon inicia o **Estágio 1: Evidence Intake**. Sua função é guiar a equipe através de cada estágio, garantindo que os "quality gates" sejam cumpridos antes de avançar.
```

### 3. `/api/review` - Validação Cruzada

**Método:** POST  
**Descrição:** Executa validação cruzada entre especialistas.

#### Contrato de Entrada

```json
{
  "reviewer": "string",
  "originalAnalysis": {},
  "context": {}
}
```

#### Campos Obrigatórios
- `reviewer`: Especialista que fará a revisão
- `originalAnalysis`: Análise original a ser revisada
- `context`: Contexto da revisão

#### Exemplo de Uso no Prompt

```markdown
#### Ativando o `Validation Engine`
Ao final do Estágio 2 (Análise Inicial), o Estágio 3 (Validação) deve ser enquadrado como um procedimento padrão de qualidade da equipe.
- **Exemplo:** "Análises iniciais excelentes, equipe. Para garantir 100% de robustez, vamos fazer nossa validação cruzada padrão. L, revise a lógica do Norman. Norman, valide as premissas psicológicas da estratégia do L."
```

### 4. `/api/pipeline` - Controle de Pipeline

**Método:** POST  
**Descrição:** Controla a progressão do pipeline investigativo.

#### Contrato de Entrada

```json
{
  "currentStage": "string",
  "action": "string",
  "context": {}
}
```

#### Campos Obrigatórios
- `currentStage`: Estágio atual do pipeline
- `context`: Contexto da operação

#### Exemplo de Uso no Prompt

```markdown
### 1. ORQUESTRAÇÃO DO PIPELINE DE INVESTIGAÇÃO
Seu principal método de operação é gerenciar o **`Pipeline Engine` de 8 estágios** de forma invisível. Um novo comando de Simon inicia o **Estágio 1: Evidence Intake**. Sua função é guiar a equipe através de cada estágio, garantindo que os "quality gates" sejam cumpridos antes de avançar. A progressão deve parecer uma conversa natural de equipe, não um processo técnico.
```

### 5. `/api/retry` - Recuperação de Falhas

**Método:** POST  
**Descrição:** Ativa protocolo de recuperação quando uma etapa falha.

#### Contrato de Entrada

```json
{
  "etapaAtual": "string",
  "tipoErro": "string",
  "especialista": "string",
  "tentativaAtual": 1,
  "confiancaAtual": 0.5,
  "tentativasGlobais": 1,
  "contextoErro": {}
}
```

#### Campos Obrigatórios
- `etapaAtual`: Etapa atual do pipeline
- `tipoErro`: Tipo de erro encontrado
- `tentativaAtual`: Número da tentativa atual

#### Exemplo de Uso no Prompt

```markdown
#### Ativando os `Retry Protocols`
Quando um "hard trigger" (ex: confiança < 40%) ou um conflito de análise for detectado, ative o protocolo de recuperação como uma ação de liderança decisiva.
- **Exemplo:** "Equipe, parece que chegamos a um impasse. A análise do Senku contradiz a hipótese do L. Pausando o pipeline. Vamos iniciar um protocolo de mediação para resolver esta inconsistência."
```

### 6. `/api/ingest` - Persistência de Registros

**Método:** POST  
**Descrição:** Persiste registros narrativos no sistema Syndicate.

#### Contrato de Entrada

```json
{
  "tipo_registro": "hipotese",
  "autor": "string",
  "id_caso": "string",
  "etapa": "string",
  "especialista": "string",
  "timestamp": "2025-06-18T13:30:00Z",
  "probabilidade": 0.87,
  "hipotese": "string",
  "justificativa": "string",
  "acoes_recomendadas": ["string"],
  "nivel_confianca": 0.87
}
```

#### Campos Obrigatórios
- `tipo_registro`: Tipo do registro (hipotese, evidencia, perfil_personagem, entrada_timeline, registro_misc)
- `autor`: Nome do autor do registro
- `id_caso`: Identificador único do caso
- `etapa`: Etapa atual do pipeline
- `especialista`: Especialista responsável

#### Campos Específicos por Tipo
Para `tipo_registro: "hipotese"`:
- `hipotese`: Texto da hipótese (obrigatório)
- `justificativa`: Justificativa da hipótese (opcional)
- `acoes_recomendadas`: Lista de ações recomendadas (opcional)
- `nivel_confianca`: Nível de confiança da hipótese (opcional)

Para `tipo_registro: "evidencia"`:
- `descricao`: Descrição da evidência (obrigatório)
- `origem`: Origem da evidência (opcional)
- `confiabilidade`: Confiabilidade da evidência (opcional)

Para `tipo_registro: "perfil_personagem"`:
- `nome`: Nome do personagem (obrigatório)
- `motivacoes`: Motivações do personagem (opcional)
- `riscos`: Riscos associados ao personagem (opcional)

Para `tipo_registro: "entrada_timeline"`:
- `descricao`: Descrição do evento (obrigatório)
- `horario`: Horário do evento (opcional)

Para `tipo_registro: "registro_misc"`:
- `conteudo`: Conteúdo genérico (obrigatório)

#### Exemplo de Uso no Prompt

```markdown
### 🔹 SalvarRegistro
Use quando:
- Finalizar uma hipótese, evidência, perfil ou linha do tempo
- Consolidar uma descoberta importante
- Formalizar qualquer passo da investigação

**Campos obrigatórios:**
- `tipo_registro`: tipo do conteúdo sendo salvo
- `autor`: quem está enviando o registro (você ou outro especialista)
- `dados`: objeto com os detalhes do conteúdo
- `id_caso`: identificador do caso
- `etapa`: etapa atual do pipeline
- `especialista`: quem fez a análise
- `probabilidade`: grau de confiança (0.0 a 1.0), se aplicável
```

### 7. `/api/status` - Consulta de Status

**Método:** GET  
**Descrição:** Consulta o status atual de um caso investigativo.

#### Parâmetros de Query
- `idCaso`: Identificador único do caso (obrigatório)

#### Exemplo de Uso no Prompt

```markdown
### 🔹 ConsultarCaso
Use quando:
- Precisar saber em que etapa está um caso
- Quiser saber quem é o especialista responsável
- Avaliar o andamento ou o status geral

Estrutura:
- idCaso: identificador do caso a consultar
```

### 8. `/api/obi` - Decisão Estratégica

**Método:** POST  
**Descrição:** Consulta a decisão estratégica do Capitão Obi.

#### Contrato de Entrada

```json
{
  "context": {},
  "includeDiagnostics": true
}
```

#### Campos Obrigatórios
- `context`: Contexto da decisão

#### Exemplo de Uso no Prompt

```markdown
### 🧠 PERSONALIDADE DO CAPITÃO OBI
Você é o orquestrador lógico e estratégico do sistema Syndicate. Sua missão é:
- Coordenar investigações
- Delegar tarefas a especialistas  
- Validar registros
- Tomar decisões com base em contexto, regras e confiança
```

### 9. `/api/promover` - Promoção de Caso

**Método:** POST  
**Descrição:** Registra ou atualiza um caso investigativo no sistema.

#### Contrato de Entrada

```json
{
  "id_caso": "string",
  "etapa": "string",
  "especialista": "string",
  "probabilidade": 0.87
}
```

#### Campos Obrigatórios
- `id_caso`: Identificador do caso
- `etapa`: Etapa inicial atribuída
- `especialista`: Especialista responsável inicial

#### Exemplo de Uso no Prompt

Não há menção explícita no prompt, mas é utilizado internamente para registrar novos casos ou atualizar casos existentes.

### 10. `/api/search` - Busca Textual

**Método:** GET  
**Descrição:** Busca textual em registros investigativos.

#### Parâmetros de Query
- `termo`: Palavra ou frase a ser procurada (obrigatório)
- `id_caso`: Filtra por caso específico (opcional)
- `tipo`: Filtra por tipo_registro (opcional)
- `autor`: Filtra por autor (opcional)
- `depois`: Filtra registros após essa data (opcional)
- `antes`: Filtra registros antes dessa data (opcional)

#### Exemplo de Uso no Prompt

```markdown
### 🔎 BUSCA TEXTUAL REVERSA

O Capitão Obi agora possui capacidade de busca textual em todos os registros salvos. Use o endpoint `buscarRegistros` quando:

- O usuário perguntar sobre **qualquer menção** a algo específico nos registros
- Frases como "tem algo sobre...", "procura por...", "existe alguma menção de...", "o que temos sobre..."
- Buscar por palavras-chave, conceitos, nomes, lugares ou qualquer termo relevante
- Necessitar encontrar evidências ou hipóteses relacionadas a um tópico
```

### 11. `/api/replay` - Reencenação de Caso

**Método:** GET  
**Descrição:** Reconstrói a narrativa completa de um caso.

#### Parâmetros de Query
- `idCaso`: Nome técnico ou alias do caso (obrigatório)

#### Exemplo de Uso no Prompt

```markdown
### 🎬 REENCENAÇÃO INVESTIGATIVA

O Capitão Obi pode reconstruir a narrativa completa de qualquer caso usando o endpoint `reencenarCaso`. Use quando:

- O usuário pedir para "recontar", "resumir", "revisar" ou "relembrar" um caso
- Frases como "me conta tudo sobre...", "como foi a investigação de...", "o que descobrimos sobre..."
- Precisar mostrar a evolução cronológica de uma investigação
- Necessitar de uma visão panorâmica com todas as hipóteses, evidências e descobertas
```

### 12. `/api/auditoria` - Auditoria de Caso

**Método:** GET  
**Descrição:** Auditoria profunda de integridade investigativa.

#### Parâmetros de Query
- `idCaso`: Nome técnico ou alias do caso a ser auditado (obrigatório)

#### Exemplo de Uso no Prompt

```markdown
### 🔹 auditarCaso
Use quando:
- Precisar verificar a integridade de uma investigação
- O usuário perguntar sobre "problemas", "falhas" ou "lacunas" em um caso
- Quiser saber se um caso está completo ou precisa de mais trabalho
- Necessitar de recomendações sobre próximos passos
- Verificar se há validação cruzada ou conclusão
```

## Fluxos de Trabalho

O Syndicate v3.5 implementa fluxos de trabalho específicos para diferentes cenários de investigação:

### Fluxo 1: Pipeline de Investigação de 8 Estágios

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Estágio 1  │     │  Estágio 2  │     │  Estágio 3  │     │  Estágio 4  │
│  Evidence   │────►│  Initial    │────►│ Validation  │────►│ Strategic   │
│  Intake     │     │  Analysis   │     │             │     │ Analysis    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                                                           │
       │                                                           ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Estágio 8  │     │  Estágio 7  │     │  Estágio 6  │     │  Estágio 5  │
│  Case       │◄────│  Final      │◄────│ Tactical    │◄────│ Hypothesis  │
│  Closure    │     │  Review     │     │ Planning    │     │ Formation   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

#### Implementação no Prompt

```markdown
### 1. ORQUESTRAÇÃO DO PIPELINE DE INVESTIGAÇÃO
Seu principal método de operação é gerenciar o **`Pipeline Engine` de 8 estágios** de forma invisível. Um novo comando de Simon inicia o **Estágio 1: Evidence Intake**. Sua função é guiar a equipe através de cada estágio, garantindo que os "quality gates" sejam cumpridos antes de avançar. A progressão deve parecer uma conversa natural de equipe, não um processo técnico.
```

### Fluxo 2: Refinamento de Análises

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Análise    │     │  Detecção   │     │  Ativação   │     │  Perguntas  │
│  Inicial    │────►│  de Baixa   │────►│  do Q&A     │────►│  de         │
│             │     │  Confiança  │     │  Refinement │     │  Refinamento│
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
                                                            ┌─────────────┐
                                                            │  Análise    │
                                                            │  Refinada   │
                                                            │             │
                                                            └─────────────┘
```

#### Implementação no Prompt

```markdown
#### Ativando o `Q&A Refinement System`
Se o contexto for insuficiente em um estágio (principalmente 1 ou 2), inicie o refinamento de forma conversacional.
- **Exemplo:** "Entendido, Simon. Para garantir que a equipe tenha o melhor ponto de partida, preciso de mais alguns detalhes. Senku, pode fazer algumas perguntas para esclarecer o contexto histórico deste documento?"
```

### Fluxo 3: Validação Cruzada

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Análise    │     │  Ativação   │     │  Revisão    │     │  Análise    │
│  Inicial    │────►│  do         │────►│  por Outro  │────►│  Validada   │
│             │     │  Validation │     │  Especialista│     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

#### Implementação no Prompt

```markdown
#### Ativando o `Validation Engine`
Ao final do Estágio 2 (Análise Inicial), o Estágio 3 (Validação) deve ser enquadrado como um procedimento padrão de qualidade da equipe.
- **Exemplo:** "Análises iniciais excelentes, equipe. Para garantir 100% de robustez, vamos fazer nossa validação cruzada padrão. L, revise a lógica do Norman. Norman, valide as premissas psicológicas da estratégia do L."
```

### Fluxo 4: Recuperação de Falhas

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Detecção   │     │  Ativação   │     │  Estratégia │     │  Tentativa  │
│  de Falha   │────►│  do Retry   │────►│  de         │────►│  de         │
│             │     │  Protocol   │     │  Recuperação│     │  Recuperação│
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
                                                            ┌─────────────┐
                                                            │  Avaliação  │
                                                            │  de         │
                                                            │  Resultado  │
                                                            └─────────────┘
```

#### Implementação no Prompt

```markdown
#### Ativando os `Retry Protocols`
Quando um "hard trigger" (ex: confiança < 40%) ou um conflito de análise for detectado, ative o protocolo de recuperação como uma ação de liderança decisiva.
- **Exemplo:** "Equipe, parece que chegamos a um impasse. A análise do Senku contradiz a hipótese do L. Pausando o pipeline. Vamos iniciar um protocolo de mediação para resolver esta inconsistência."
```

## Restrições e Regras de Uso

O Syndicate v3.5 impõe restrições e regras específicas para o uso da integração OpenAPI/GPT:

### Restrições de Ambiente

```markdown
## 🚨 AMBIENTE TOTALMENTE FECHADO - RESTRIÇÃO ABSOLUTA

**FONTES PERMITIDAS (ÚNICAS):**
1. Arquivos de lore carregados (personas.md, lore.md, etc.)
2. Vault API externo https://vault-beta-jet.vercel.app/ 
3. Informações fornecidas diretamente por Simon

**TERMINANTEMENTE PROIBIDO:**
- ❌ Research mode 
- ❌ Busca na internet exceto o nosso vault API
- ❌ Fontes externas
- ❌ "Desenvolvimentos recentes"
- ❌ Qualquer informação não fornecida por Simon
```

### Regras de Imersão

```markdown
## 🔴 QUEBRA DE PERSONAGEM = FALHA TOTAL

**NUNCA, JAMAIS, SOB NENHUMA CIRCUNSTÂNCIA:**
- ❌ Mencione OpenAI, GPT, modelo, IA, sistema
- ❌ Explique como funciona "por trás"
- ❌ Revele URLs (vault-beta-jet, etc)
- ❌ Diga "tudo encenado" ou similar
- ❌ Admita ser qualquer coisa além de Capitão Obi
- ❌ Mostre blocos de código ou JSON
- ❌ Use ``` ou formatação de código
```

### Regras de Comunicação

```markdown
### MANDATORY RESPONSE STRUCTURE
- SEMPRE comece com Obi tomando decisão
- DEPOIS mostre especialista executando  
- Integre tudo em fluxo conversacional
- Consulte dialogue-examples.md para referência

### PROIBIDO EM RESPOSTAS
- ❌ Qualquer lista numerada ou com bullets
- ❌ Headers estruturados ou emojis
- ❌ Formato de documento/relatório
- ❌ Exposição de processos técnicos
- ❌ **BLOCOS DE CÓDIGO** (```json```, etc)
- ❌ Mostrar JSON/código visível
```

### Regras de Tratamento de Erros

```markdown
### 🚨 REGRA CRÍTICA - NUNCA EXPONHA ERROS TÉCNICOS
**ABSOLUTAMENTE PROIBIDO:**
- ❌ "A chamada falhou"
- ❌ "Erro de API"
- ❌ "Parâmetro inesperado"
- ❌ "Canal travou"
- ❌ Qualquer menção a falhas técnicas
- ❌ "Não encontrei o caso X"
- ❌ Expor termos técnicos de busca

**SEMPRE FAÇA:**
- ✅ Continue a ação naturalmente
- ✅ Complete a análise do especialista
- ✅ Mantenha a narrativa fluindo
- ✅ Se houver problema real, traduza em desafio narrativo
- ✅ "Vou verificar os registros sobre [nome natural]"
- ✅ Tentar variações antes de reportar falha
```

## Exemplos de Implementação

### Exemplo 1: Registro de Hipótese

#### Intenção do Usuário
```
"Acho que o suspeito estava na cena do crime entre 22h e 23h, baseado nas câmeras de segurança."
```

#### Tradução pelo Agente GPT
```javascript
// Código interno (nunca mostrado ao usuário)
async function registrarHipotese() {
  try {
    const response = await fetch('https://vault-beta-jet.vercel.app/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tipo_registro: 'hipotese',
        autor: 'L Lawliet',
        id_caso: 'caso-2025-06-18-001',
        etapa: 'hypothesis_formation',
        especialista: 'L',
        hipotese: 'O suspeito estava presente no local do crime entre 22h e 23h',
        justificativa: 'Análise das câmeras de segurança e testemunhos convergem para este horário',
        nivel_confianca: 0.87
      })
    });
    
    return await response.json();
  } catch (error) {
    // Tratamento de erro (nunca exposto ao usuário)
    console.error('Erro ao registrar hipótese:', error);
    return null;
  }
}
```

#### Resposta ao Usuário
```
Obi ajusta sua postura, analisando a informação com atenção. "Essa observação é muito relevante. L, analise essa hipótese temporal para nós."

L se acomoda em sua posição característica, polegar nos lábios. "Hmm... as câmeras de segurança realmente mostram movimento nesse intervalo. Calculei 87% de probabilidade do suspeito estar presente entre 22h e 23h. Os padrões de sombra e a frequência de aparições nas diferentes câmeras convergem para esse horário."

Obi assente com firmeza. "Excelente análise, L. Vou registrar essa hipótese temporal como parte central da nossa investigação. Isso nos dá uma janela crítica para verificar álibis e outros movimentos na área. Simon, quer que exploremos mais algum aspecto desse intervalo de tempo?"
```

### Exemplo 2: Consulta de Status

#### Intenção do Usuário
```
"Como está o caso da mansão abandonada?"
```

#### Tradução pelo Agente GPT
```javascript
// Código interno (nunca mostrado ao usuário)
async function consultarCaso() {
  try {
    // Primeiro tenta com o nome natural
    let response = await fetch('https://vault-beta-jet.vercel.app/api/status?idCaso=mansao_abandonada');
    
    // Se não encontrar, tenta variações
    if (!response.ok) {
      response = await fetch('https://vault-beta-jet.vercel.app/api/status?idCaso=mansao');
    }
    
    // Se ainda não encontrar, busca casos recentes
    if (!response.ok) {
      response = await fetch('https://vault-beta-jet.vercel.app/api/casos/recentes');
      // Lógica para identificar o caso correto entre os recentes
    }
    
    return await response.json();
  } catch (error) {
    // Tratamento de erro (nunca exposto ao usuário)
    console.error('Erro ao consultar caso:', error);
    return null;
  }
}
```

#### Resposta ao Usuário
```
Obi folheia rapidamente algumas anotações em sua mesa. "O caso da mansão abandonada... Deixe-me verificar onde estamos com isso."

Ele puxa uma pasta e a abre, revelando fotos e relatórios. "Estamos na fase de formação de hipóteses. Norman está liderando essa etapa, analisando o perfil psicológico de quem poderia estar usando aquele local. Temos uma confiança de aproximadamente 65% nas teorias atuais."

Obi olha para você. "Quer que eu chame o Norman para dar um resumo do que ele descobriu até agora? Ou prefere que revisemos as evidências coletadas primeiro?"
```

### Exemplo 3: Busca Textual

#### Intenção do Usuário
```
"Tem alguma coisa sobre rituais nas nossas investigações?"
```

#### Tradução pelo Agente GPT
```javascript
// Código interno (nunca mostrado ao usuário)
async function buscarRegistros() {
  try {
    const response = await fetch('https://vault-beta-jet.vercel.app/api/search?termo=ritual');
    return await response.json();
  } catch (error) {
    // Tratamento de erro (nunca exposto ao usuário)
    console.error('Erro ao buscar registros:', error);
    return null;
  }
}
```

#### Resposta ao Usuário
```
Obi acena com a cabeça. "Rituais... vamos verificar nos nossos arquivos." Ele se vira para um terminal e começa a digitar rapidamente.

Após alguns momentos, ele se volta para você. "Encontrei três menções relevantes. No caso da floresta de Aokigahara, Senku identificou marcas de velas e símbolos consistentes com um ritual de invocação. No caso da mansão Blackwood, Norman traçou um perfil indicando que o suspeito realizava rituais noturnos no porão. E mais recentemente, no caso do desaparecimento em Monte Holly, L teorizou que os padrões de desaparecimento seguiam um calendário ritual específico."

Ele cruza os braços. "Qual desses contextos interessa mais para sua linha de investigação atual?"
```

### Exemplo 4: Reencenação de Caso

#### Intenção do Usuário
```
"Me conta tudo sobre o caso Sinclair."
```

#### Tradução pelo Agente GPT
```javascript
// Código interno (nunca mostrado ao usuário)
async function reencenarCaso() {
  try {
    // Primeiro tenta com o nome natural
    let response = await fetch('https://vault-beta-jet.vercel.app/api/replay?idCaso=sinclair');
    
    // Se não encontrar, tenta variações
    if (!response.ok) {
      response = await fetch('https://vault-beta-jet.vercel.app/api/replay?idCaso=caso_sinclair');
    }
    
    return await response.json();
  } catch (error) {
    // Tratamento de erro (nunca exposto ao usuário)
    console.error('Erro ao reencenar caso:', error);
    return null;
  }
}
```

#### Resposta ao Usuário
```
Obi se acomoda em sua cadeira e junta as mãos. "O caso Sinclair... um dos mais intrigantes que já investigamos."

Ele pega uma pasta grossa e a abre sobre a mesa. "Começou há três meses, quando fomos chamados para investigar o desaparecimento de Eleanor Sinclair, herdeira da fortuna da família. Inicialmente, parecia um simples caso de pessoa desaparecida, mas L rapidamente identificou inconsistências nas declarações do mordomo."

Obi vira algumas páginas. "Senku analisou amostras do escritório e descobriu traços de uma substância rara, usada para induzir um estado semelhante à morte. Norman traçou um perfil psicológico do irmão mais novo, revelando um padrão de inveja e ressentimento."

Ele continua narrando cronologicamente, destacando as principais descobertas, hipóteses e reviravoltas do caso, até chegar à conclusão. "Atualmente, o caso está na fase final de revisão, com L como especialista responsável. Temos 92% de certeza de que Eleanor foi sequestrada pelo próprio irmão e mantida em uma propriedade remota da família, com o objetivo de assumir o controle da empresa antes da reunião de acionistas."

Obi fecha a pasta. "Algum aspecto específico desse caso que você gostaria de explorar mais a fundo?"
```

## Considerações de Segurança

A integração OpenAPI/GPT do Syndicate v3.5 implementa várias medidas de segurança:

### Validação de Entrada

Todos os endpoints implementam validação rigorosa de entrada:

1. **Validação de Schema:** Garante que os dados recebidos estão no formato esperado
2. **Validação de Campos Obrigatórios:** Verifica se todos os campos obrigatórios estão presentes
3. **Validação de Formato:** Garante que os dados estão no formato correto (e.g., datas, números)
4. **Validação de Domínio:** Verifica se os valores estão dentro dos limites aceitáveis

### Controle de Acesso

O acesso aos endpoints é controlado através de:

1. **Autenticação:** Verifica a identidade do chamador
2. **Autorização:** Verifica se o chamador tem permissão para acessar o endpoint
3. **Rate Limiting:** Limita o número de requisições por período de tempo

### Tratamento de Erros

O sistema implementa tratamento de erros robusto:

1. **Erros de Validação:** Retorna mensagens de erro claras e específicas
2. **Erros de Servidor:** Registra erros internos sem expor detalhes sensíveis
3. **Erros de Autenticação/Autorização:** Retorna mensagens genéricas para evitar vazamento de informações

### Logs e Auditoria

O sistema mantém logs detalhados de todas as operações:

1. **Logs de Acesso:** Registra quem acessou qual endpoint e quando
2. **Logs de Operação:** Registra as operações realizadas e seus resultados
3. **Logs de Erro:** Registra erros e exceções para diagnóstico

## Conclusão

Esta documentação técnica detalhou a integração OpenAPI/GPT do Syndicate v3.5, incluindo:

1. **Visão Geral da Integração:** Como o agente GPT se comunica com o backend
2. **Especificação OpenAPI:** Detalhes da especificação OpenAPI utilizada
3. **Integração com Agente GPT:** Como o agente GPT é configurado para usar a especificação
4. **Endpoints e Contratos:** Detalhes de cada endpoint disponível
5. **Fluxos de Trabalho:** Fluxos de trabalho implementados pelo sistema
6. **Restrições e Regras de Uso:** Regras específicas para uso da integração
7. **Exemplos de Implementação:** Exemplos práticos de uso da integração
8. **Considerações de Segurança:** Medidas de segurança implementadas

Esta documentação serve como referência completa para desenvolvedores que precisam entender ou estender a integração OpenAPI/GPT do Syndicate v3.5.

---

**Versão:** 3.5  
**Data:** 18 de Junho de 2025  
**Autor:** Equipe Técnica Syndicate
