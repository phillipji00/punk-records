# SYNDICATE v2.0 - Documentação Técnica

## Visão Geral

O Syndicate v2.0 é uma API serverless para gerenciamento de memória persistente de agentes de IA, implementando um sistema modular de orquestração narrativa. O sistema utiliza uma arquitetura baseada em TypeScript/Node.js com Express, integração com banco de dados PostgreSQL (Neon.tech) e deploy via Vercel.

O projeto implementa um sistema de orquestração de agentes de IA com personas distintas (como o Capitão Obi), gerenciamento de estado de casos de investigação, e persistência de dados estruturados.

## Stack Tecnológica

### Linguagens e Runtime
- **TypeScript** - Linguagem principal
- **Node.js** - Runtime (versão 18.x)

### Frameworks e Bibliotecas Core
- **Express** - Framework web para API REST
- **Next.js API Routes** - Rotas serverless
- **PostgreSQL** - Banco de dados relacional (via Neon.tech)
- **JWT** - Autenticação via tokens
- **Joi** - Validação de schemas
- **Helmet** - Segurança HTTP
- **CORS** - Controle de acesso cross-origin
- **Morgan** - Logging de requisições HTTP
- **Express Rate Limit** - Proteção contra abuso de API

### Ferramentas de Desenvolvimento
- **TypeScript** - Tipagem estática
- **ESLint** - Linting de código
- **Jest** - Testes unitários
- **Nodemon** - Hot-reload para desenvolvimento
- **Husky** - Git hooks

### Infraestrutura
- **Vercel** - Plataforma de deploy serverless
- **Neon.tech** - PostgreSQL serverless

## Estrutura de Diretórios

```
punk-records/
├── api/                  # Endpoints REST
│   ├── index.ts          # Configuração principal Express
│   ├── ingest.ts         # Endpoint para ingestão de eventos
│   └── status.ts         # Endpoint para consulta de status
├── config/               # Configurações do projeto
│   ├── package.json      # Dependências e scripts
│   ├── tsconfig.json     # Configuração TypeScript
│   ├── nodemon.json      # Configuração de desenvolvimento
│   └── vercel.json       # Configuração de deploy
├── dist/                 # Código compilado (gerado)
├── docs/                 # Documentação
│   └── README.md         # Documentação básica
├── lib/                  # Lógica de negócio
│   ├── runtimeOrchestrator.ts  # Orquestrador principal
│   └── casoStore.ts      # Persistência de casos
├── narratives/           # Definições de narrativas e personas
│   ├── agent-prompt.md   # Sistema operacional narrativo
│   ├── lore.md           # Contexto narrativo
│   ├── personas.md       # Definições de especialistas
│   └── templates.md      # Templates de saída
├── pandora-box/          # Armazenamento de dados de investigação
├── pipeline/             # Fluxos de processamento
│   ├── checklists.md     # Protocolos de qualidade
│   ├── pipeline_engine.md # Motor de pipeline
│   ├── qa_refinement.md  # Refinamento de contexto
│   ├── quality_validators.md # Validadores de qualidade
│   ├── retry_protocols.md # Protocolos de retry
│   ├── tasks.md          # Definições de tarefas
│   └── validation_engine.md # Motor de validação
├── schemas/              # Definições de schemas
│   └── analysis_schemas.yaml # Schemas de análise
├── .env                  # Variáveis de ambiente
└── vercel.json           # Configuração Vercel (raiz)
```

## Fluxo de Execução

1. **Recebimento de Evento**
   - Requisição POST para `/api/ingest` com payload de evento
   - Validação do token JWT via middleware `verifyToken`
   - Validação do schema do evento via Joi

2. **Orquestração**
   - O evento é processado pelo `runtimeOrchestrator`
   - Contexto do caso é atualizado
   - Ações são determinadas com base no evento e contexto atual

3. **Persistência**
   - O estado atualizado do caso é salvo no banco PostgreSQL via `saveCaseStatusToDB`
   - Registros são armazenados com metadados (tipo, autor, timestamp)

4. **Resposta**
   - Retorno do contexto atualizado, ações disparadas e próxima etapa

## Endpoints da API

### POST /api/ingest
Recebe eventos para processamento pelo orquestrador.

**Autenticação:** Bearer Token JWT

**Payload:**
```json
{
  "tipo_registro": "hipotese|evidencia|perfil_personagem|entrada_timeline|registro_misc|cross_validation_result",
  "autor": "string",
  "dados": {
    // Objeto com dados específicos do registro
  }
}
```

**Resposta:**
```json
{
  "context": {},      // Contexto atualizado do caso
  "triggered": [],    // Gatilhos ativados
  "actions": [],      // Ações executadas
  "novaEtapa": ""     // Próxima etapa do fluxo
}
```

### GET /api/status?idCaso=...
Consulta o estado atual de um caso específico.

**Autenticação:** Bearer Token JWT

**Parâmetros:**
- `idCaso` (string, obrigatório): Identificador único do caso

**Resposta:**
```json
{
  "context": {}  // Estado atual do caso
}
```

### GET /api/search
Busca registros com base em tags ou termos.

**Autenticação:** Bearer Token JWT

**Parâmetros:**
- `tag` (string, obrigatório): Termo de busca
- `limit` (number, opcional): Limite de resultados (default: 10)
- `offset` (number, opcional): Offset para paginação (default: 0)

**Resposta:**
```json
{
  "total_count": 0,
  "snippets": []  // Registros encontrados
}
```

### GET /api/health
Verifica o status operacional da API e conexão com banco de dados.

**Resposta:**
```json
{
  "status": "operational",
  "db": "connected",
  "timestamp": "2025-06-13T01:59:59.999Z"
}
```

## Banco de Dados

O sistema utiliza PostgreSQL via Neon.tech com as seguintes tabelas principais:

### Tabela: registros
- `id`: UUID (chave primária)
- `tipo_registro`: Enum (hipotese, evidencia, perfil_personagem, entrada_timeline, registro_misc, cross_validation_result)
- `autor`: String (identificador do autor)
- `dados`: JSONB (dados específicos do registro)
- `timestamp`: Timestamp (momento da criação)

### Tabela: casos_status
- `id_caso`: String (chave primária)
- `context`: JSONB (estado atual do caso)
- `updated_at`: Timestamp (última atualização)

## Segurança

- **Autenticação:** JWT (JSON Web Tokens)
- **Validação:** Joi para validação de schemas de entrada
- **Headers de Segurança:** Helmet para proteção contra vulnerabilidades comuns
- **Rate Limiting:** Proteção contra abuso (100 requisições por 15 minutos)
- **CORS:** Configurável via variável de ambiente `CORS_ORIGIN`

## Configuração e Setup

### Pré-requisitos
- Node.js 18.x
- PostgreSQL (ou conta Neon.tech)
- Conta Vercel (para deploy)

### Variáveis de Ambiente
```
# Banco de Dados
DATABASE_URL=postgres://user:password@neon.tech:5432/dbname

# Segurança
JWT_SECRET=seu_segredo_jwt_aqui
CORS_ORIGIN=*

# Ambiente
NODE_ENV=development|production
```

### Instalação Local
```bash
# Instalar dependências
cd config
npm install

# Compilar TypeScript
npm run build

# Iniciar servidor de desenvolvimento
npm run dev
```

### Deploy Vercel
```bash
# Instalar Vercel CLI
npm install -g vercel

# Login e deploy
vercel login
vercel --prod
```

## Testes

```bash
# Executar testes unitários
npm test

# Verificar tipagem
npm run type-check

# Lint
npm run lint
```

## Extensão e Modificação

### Adicionar Nova Rota
1. Criar arquivo na pasta `api/`
2. Implementar handler com tipagem NextApiRequest/NextApiResponse
3. Adicionar middleware de autenticação se necessário
4. Atualizar documentação

### Modificar Orquestrador
O arquivo `lib/runtimeOrchestrator.ts` contém a lógica principal de orquestração e pode ser estendido para suportar novos tipos de eventos e comportamentos.

### Adicionar Nova Persona
Editar o arquivo `narratives/personas.md` seguindo o formato existente para adicionar novos especialistas ao sistema.

## Monitoramento e Logs

- Logs de requisições via Morgan (formato configurável por ambiente)
- Monitoramento de saúde via endpoint `/api/health`
- Integração com dashboard Vercel para métricas de serverless

## Limitações Conhecidas

- Sem suporte para WebSockets ou comunicação em tempo real
- Limite de tamanho de payload: 10MB
- Tempo máximo de execução: limitado pelo ambiente serverless da Vercel
