# 📘 specialistAgent.md — Módulo de Especialista Narrativo (v2.0)

## 🎯 Finalidade
Este módulo implementa a função `gerarAnaliseEspecialista(context)` que simula o comportamento analítico dos **cinco** especialistas do universo Syndicate:

- **L** (Lógica & Estratégia)
- **Senku** (História & Ciência)
- **Norman** (Psicologia & Comportamento)
- **Isagi** (Otimização Espacial & Estratégica)
- **Obi** (Coordenação & Liderança) ← **NOVO**

A função retorna uma análise estruturada com base no `ExecutionContext`, no estilo narrativo e conteúdo técnico condizente com cada personagem.

---

## 🔁 Assinatura da Função Principal
```ts
function gerarAnaliseEspecialista(context: ExecutionContext): AnaliseEspecialista
```

### 📥 Parâmetro
| Nome | Tipo | Descrição |
|------|------|-----------|
| `context` | `ExecutionContext` | Objeto contendo autor (nome do especialista), narrativa, dados e probabilidade |

### 📤 Retorno
Retorna um objeto do tipo `AnaliseEspecialista`, com os seguintes campos:

```ts
{
  especialista: "L" | "Senku" | "Norman" | "Isagi" | "Obi",
  analise: {
    hipotese: string,
    justificativa: string,
    nivel_confianca: number,
    acoes_recomendadas: string[]
  }
}
```

---

## 🆕 Funções Adicionais (v2.0)

### `getFullSpecialistName(shortName: string): string`
Converte nome curto para nome completo do especialista.

```ts
getFullSpecialistName("L") // retorna "L Lawliet"
getFullSpecialistName("Obi") // retorna "Capitão Obi"
```

### `refineAndAnalyze(context: ExecutionContext): Promise<AnaliseEspecialista>`
Função wrapper que verifica se o contexto precisa de refinamento antes da análise.

```ts
const resultado = await refineAndAnalyze(context);
// Se confiança < 80%, sugere uso do qaRefiner primeiro
```

---

### 📦 Como importar
```ts
import { 
  gerarAnaliseEspecialista,
  getFullSpecialistName,
  refineAndAnalyze 
} from './modules/specialistAgent'
```

---

## 🧪 Exemplo de Uso Completo

### Input para Obi (NOVO)
```ts
const contextObi: ExecutionContext = {
  idCaso: "mt_holly_convergence",
  etapa: "coordenação inicial",
  autor: "Obi",
  contextoNarrativo: "Múltiplos especialistas chegaram independentemente ao mesmo local. Carros suspeitos se aproximam. Simon precisa de proteção.",
  probabilidade: 0.95,
  dados: {
    especialistasPresentes: ["L", "Senku", "Norman", "Isagi"],
    ameacasDetectadas: ["carros pretos", "tempo limitado"],
    palavrasChave: ["proteção", "coordenação", "urgência"]
  }
};
```

### Output para Obi
```json
{
  "especialista": "Obi",
  "analise": {
    "hipotese": "A convergência de múltiplas trilhas investigativas indica coordenação deliberada para proteger Simon e revelar verdades ocultas.",
    "justificativa": "Fire Force sempre encontra o caminho! A análise integrada mostra que cada especialista foi direcionado aqui com propósito específico. Nossa missão é clara: proteger e descobrir.",
    "nivel_confianca": 0.95,
    "acoes_recomendadas": [
      "Coordenar entrada segura de todos os especialistas na propriedade",
      "Estabelecer perímetro de segurança contra ameaças externas",
      "Facilitar compartilhamento de informações entre especialistas",
      "Manter Simon protegido durante toda a investigação"
    ]
  }
}
```

### Exemplo com Refinamento Sugerido
```ts
const contextBaixaConfianca: ExecutionContext = {
  idCaso: "caso_001",
  etapa: "análise inicial",
  autor: "Norman",
  contextoNarrativo: "Comportamento suspeito detectado, mas faltam detalhes.",
  probabilidade: 0.65, // Confiança baixa
  dados: {}
};

// Usando refineAndAnalyze
const resultado = await refineAndAnalyze(contextBaixaConfianca);
// Console: "Confiança baixa (65%). Considere usar qaRefiner antes da análise."
```

---

## ⚠️ Validações
- `autor` deve ser um dos cinco especialistas reconhecidos: "L", "Senku", "Norman", "Isagi", "Obi"
- Em caso de erro, lança `throw new Error("Especialista não reconhecido: [nome]")`

---

## 🔄 Integração com Outros Módulos

### Com qaRefiner
```ts
import { generateRefinementQuestions } from './qaRefiner';
import { gerarAnaliseEspecialista } from './specialistAgent';

// 1. Gerar perguntas se confiança baixa
if (context.probabilidade < 0.8) {
  const questions = generateRefinementQuestions({
    specialist: context.autor,
    context: context.contextoNarrativo,
    currentConfidence: context.probabilidade * 100
  });
  // ... coletar respostas e enriquecer contexto
}

// 2. Gerar análise com contexto refinado
const analise = gerarAnaliseEspecialista(enrichedContext);
```

### Com personaTemplateBuilder
```ts
import { generatePromptForPersona } from './personaTemplateBuilder';

// Mapear especialista para ID de persona
const personaMap = {
  "L": "estrategista_chefe",
  "Senku": "analista_forense",
  "Norman": "analista_comportamental",
  "Isagi": "analista_espacial",
  "Obi": "orquestrador_missao"
};

const prompt = generatePromptForPersona(
  personaMap[context.autor],
  context,
  { category: 'analise_inicial' }
);
```

---

## 🧩 Dependências
- Tipagens `ExecutionContext` e `AnaliseEspecialista` devem estar disponíveis no escopo (`types/context.ts`)
- O sistema espera compatibilidade com os outputs esperados definidos em `analysis_schemas.yaml`
- Integração opcional com `qaRefiner` para contextos de baixa confiança

---

## 📈 Melhorias na v2.0
1. ✅ Adicionado suporte para Capitão Obi
2. ✅ Mapeamento de nomes para consistência
3. ✅ Função de refinamento integrada
4. ✅ Melhor documentação de integração

---

## ✅ Status
Módulo validado e expandido para integração completa com o orquestrador narrativo (`runtimeOrchestrator.ts`). 
Totalmente compatível com todos os cinco membros do Syndicate.

> Compatível com arquitetura modular do Syndicate v3.1