# SYNDICATE v2.0 – Estrutura Modular

Este projeto utiliza rotas modulares para orquestração narrativa baseada em IA. Veja `api/ingest.ts` e `api/status.ts` como pontos de entrada principais para interações com o agente Capitão Obi.

## Rotas

### POST /api/ingest
Recebe um evento (`IngestEvent`) e executa o runtimeOrchestrator, atualizando o contexto do caso e retornando ações e próxima etapa.

### GET /api/status?idCaso=...
Consulta o estado atual de um caso específico com base no `idCaso`.

## Pastas recomendadas
- `api/`: endpoints REST
- `lib/`: lógica de negócio (`runtimeOrchestrator`, `casoStore`, etc)
- `pipeline/`: validação, refinement, quality
- `narratives/`: persona, prompt e templates
- `docs/`: documentação técnica

---

**Para produção, configure o banco Neon.tech e defina `DATABASE_URL` no `.env`**.