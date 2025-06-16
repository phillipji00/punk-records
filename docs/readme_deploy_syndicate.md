# 🚀 SYNDICATE v3.2 – GUIA COMPLETO DE DEPLOY E ATIVAÇÃO FINAL

Este guia cobre **100% dos passos necessários** para:
- Substituir a base antiga do projeto no GitHub
- Subir o projeto no Vercel
- Ativar a API
- Configurar o agente GPT “Capitão Obi”
- Testar todas as rotas

---

## ✅ PRÉ-REQUISITOS

- Conta no GitHub (já existente: `punk-records`)
- Conta no Vercel (projeto: `vault-beta-jet.vercel.app`)
- Projeto local na pasta nova (ex: `punk-records-v3`)
- Vercel CLI instalado (via `npm install -g vercel`)
- Postman instalado (para testes)

---

## 📁 1. ESTRUTURA DE PASTA ESPERADA

```
punk-records-v3/
├── src/
│   └── api/
│       ├── refine.ts
│       ├── analisar.ts
│       ├── review.ts
│       ├── pipeline.ts
│       ├── retry.ts
│       └── obi.ts
├── lib/, types/, schemas/ ...
├── .env.example
├── .gitignore
├── vercel.json
└── package.json
```

---

## 🔁 2. SUBSTITUIR PROJETO ANTIGO NO GITHUB

```bash
cd /caminho/para/punk-records-v3

git init

git checkout -b main

git remote set-url origin https://github.com/phillipji00/punk-records

git add .
git commit -m "🔥 Substituição total por Syndicate v3.2"
git push origin main --force
```

---

## ☁️ 3. FAZER DEPLOY NO VERCEL

```bash
vercel --prod
```

Acesse seu backend em:
```
https://vault-beta-jet.vercel.app/api/[rota]
```

---

## 🧪 4. TESTAR AS ROTAS VIA POSTMAN

### 1. Importe a coleção:
- [`syndicate_v3.2_postman_collection.json`](manual ou gerado)

### 2. Teste as 6 rotas:
- `/api/refine`
- `/api/analisar`
- `/api/review`
- `/api/pipeline`
- `/api/retry`
- `/api/obi`

---

## 🤖 5. CONFIGURAR O AGENTE GPT (CAPITÃO OBI)

### A) Acesse:
[https://chat.openai.com/gpts/editor](https://chat.openai.com/gpts/editor)

### B) Campos principais:
- Nome: `Capitão Obi`
- Instruções: conteúdo do `agent-prompt.md`

### C) Actions (APIs):
- Importe o arquivo `gpt-actions-SYNDICATE-v3.2_final.json`

### D) Knowledge:
Suba os arquivos `.md`:
- `agent-prompt.md`
- `personas.md`
- `lore.md`
- `templates.md`
- `tasks.md`
- `pipeline_engine.md`
- `checklists.md`
- `retry_protocols.md`
- `validation_engine.md`
- `quality_validators.md`
- `syndicate_prompt_plan.md`
- `prompt_qa_validador.md`

---

## 📂 6. CONFIGURAR .ENV

Crie um arquivo `.env` local baseado no `.env.example`:

```env
DATABASE_URL=postgresql://neondb_owner:npg_i40weoPaxzMI@ep-raspy-bonus-ac4cz220-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=}J7.eeN~qdza.tZr!?TgUAhvp~XCh)yX6vfCE>aUKk-WWHr^
```

---

## ✅ 7. TESTES FINAIS NO GPT

Exemplos de comandos:
- "Obi, refine essa hipótese com base nisso: ..."
- "Obi, quem deve agir agora com esse registro?"
- "Obi, avance a etapa do pipeline."

Se ele:
- Responde narrando
- Chama a action correta
- Retorna o que foi feito com estilo

🎉 Parabéns, o sistema está 100% operacional!

---

## 🧩 OPCIONAL
- Criar automação de deploy com GitHub Actions
- Adicionar `README.md` de uso para contribuições futuras
- Adicionar testes automatizados com Vitest/Jest

---

Feito com 💡 por Pipo e Capitão Obi.
