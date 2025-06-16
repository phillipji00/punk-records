# 🧠 SPECIALISTS ENGINE - Documentação Final v3.1

**Sistema:** SYNDICATE v3.1  
**Módulo:** SPECIALISTS ENGINE  
**Versão:** 3.1.0  
**Data:** 15/06/2025  
**Status:** ✅ **PRONTO PARA PRODUÇÃO**

---

## 📋 Sumário

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Módulo](#arquitetura-do-módulo)
3. [Componentes Principais](#componentes-principais)
4. [Como Usar](#como-usar)
5. [Integração com Outros Módulos](#integração-com-outros-módulos)
6. [Referência de API](#referência-de-api)
7. [Exemplos Práticos](#exemplos-práticos)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O **SPECIALISTS ENGINE** é o módulo responsável pela **interface narrativa especializada** do sistema Syndicate. Ele simula cinco especialistas únicos que analisam informações e retornam respostas estruturadas mantendo suas personalidades distintas.

### Especialistas Disponíveis:
- **L Lawliet** - Estrategista e detetive mestre
- **Senku Ishigami** - Cientista e historiador  
- **Norman** - Psicólogo e analista comportamental
- **Isagi Yoichi** - Especialista em otimização e estratégia espacial
- **Capitão Obi** - Líder e coordenador da equipe

### Capacidades Principais:
- 🎭 **Análises Narrativas**: Cada especialista mantém sua voz única
- 🤔 **Refinamento Inteligente**: Sistema de perguntas para melhorar contexto
- 📝 **Templates Dinâmicos**: Respostas adaptadas ao tipo de situação
- 🔄 **Integração Completa**: Funciona perfeitamente com outros módulos

---

## 🏗️ Arquitetura do Módulo

```
SPECIALISTS ENGINE/
├── Core Components/
│   ├── specialistAgent.ts       # Motor de análise dos especialistas
│   ├── qaRefiner.ts            # Sistema de refinamento por perguntas
│   └── personaTemplateBuilder.ts # Gerador de prompts personalizados
│
├── Data/
│   └── templates.json          # Templates narrativos expandidos
│
├── Documentation/
│   ├── specialistAgent.md      # Docs do motor de análise
│   ├── qaRefiner.md           # Docs do refinamento
│   └── personaTemplateBuilder.md # Docs dos templates
│
└── References/
    ├── personas.md            # Definições de personalidade
    ├── agent-prompt.md        # Comportamento do Obi
    └── lore.md               # Contexto narrativo
```

---

## 🔧 Componentes Principais

### 1. **Specialist Agent** (`specialistAgent.ts`)

Gera análises estruturadas baseadas no contexto, mantendo a personalidade de cada especialista.

**Função Principal:**
```typescript
gerarAnaliseEspecialista(context: ExecutionContext): AnaliseEspecialista
```

**Retorno:**
```typescript
{
  especialista: string,
  analise: {
    hipotese: string,
    justificativa: string,
    nivel_confianca: number,
    acoes_recomendadas: string[]
  }
}
```

### 2. **Q&A Refiner** (`qaRefiner.ts`)

Sistema inteligente que detecta quando falta contexto e gera perguntas específicas.

**Funções Principais:**
- `generateRefinementQuestions()` - Gera perguntas baseadas no contexto
- `executeRefinement()` - Executa processo completo de refinamento
- `assessRefinementComplete()` - Verifica se refinamento está completo

**Modos de Operação:**
- **Rapid**: 1-2 perguntas rápidas
- **Deep**: 3-4 perguntas detalhadas
- **Collaborative**: 5-6 perguntas multi-especialista

### 3. **Persona Template Builder** (`personaTemplateBuilder.ts`)

Transforma templates em respostas narrativas personalizadas.

**Função Principal:**
```typescript
generatePromptForPersona(
  persona: string, 
  context: ExecutionContext,
  options?: TemplateOptions
): string
```

**Categorias de Templates:**
- `analise_inicial` - Template padrão
- `deteccao_contradicao` - Para conflitos
- `perfil_psicologico` - Análises comportamentais
- `sintese_final` - Conclusões
- E muitas outras...

---

## 🚀 Como Usar

### Exemplo Básico - Análise Simples

```typescript
import { gerarAnaliseEspecialista } from './specialistAgent';

// 1. Criar contexto
const context = {
  idCaso: "caso_001",
  etapa: "análise inicial",
  autor: "L",  // Escolher especialista
  contextoNarrativo: "Documentos financeiros mostram transações suspeitas...",
  probabilidade: 0.85,
  dados: {
    evidencias: ["transferências noturnas", "contas offshore"],
    palavrasChave: ["fraude", "lavagem", "conspiração"]
  }
};

// 2. Gerar análise
const analise = gerarAnaliseEspecialista(context);

// 3. Usar resultado
console.log(`${analise.especialista}: ${analise.analise.hipotese}`);
console.log(`Confiança: ${analise.analise.nivel_confianca * 100}%`);
```

### Exemplo Avançado - Com Refinamento

```typescript
import { executeRefinement } from './qaRefiner';
import { gerarAnaliseEspecialista } from './specialistAgent';

// 1. Contexto inicial com baixa confiança
const context = {
  autor: "Norman",
  contextoNarrativo: "Comportamento suspeito observado...",
  probabilidade: 0.55  // Baixa confiança
};

// 2. Executar refinamento se necessário
if (context.probabilidade < 0.8) {
  const refinement = executeRefinement({
    specialist: context.autor,
    context: context.contextoNarrativo,
    currentConfidence: context.probabilidade * 100
  });
  
  // 3. Mostrar perguntas ao usuário
  console.log("Preciso de mais informações:");
  refinement.questions.forEach(q => {
    console.log(`- ${q.question}`);
  });
  
  // 4. Coletar respostas e enriquecer contexto
  // ... (coletar input do usuário)
}

// 5. Gerar análise com contexto refinado
const analise = gerarAnaliseEspecialista(enrichedContext);
```

### Exemplo Completo - Pipeline Integrado

```typescript
import { gerarAnaliseEspecialista } from './specialistAgent';
import { generatePromptForPersona } from './personaTemplateBuilder';
import { generateRefinementQuestions } from './qaRefiner';

async function analyzeWithSpecialist(
  specialist: string,
  initialContext: string
) {
  // 1. Preparar contexto inicial
  let context = {
    autor: specialist,
    contextoNarrativo: initialContext,
    probabilidade: 0.6,
    dados: {}
  };
  
  // 2. Refinar se necessário
  while (context.probabilidade < 0.8) {
    const questions = generateRefinementQuestions({
      specialist: specialist,
      context: context.contextoNarrativo,
      currentConfidence: context.probabilidade * 100
    });
    
    // Apresentar perguntas e coletar respostas
    for (const q of questions) {
      const answer = await getUserInput(q.question);
      
      // Comando de escape
      if (answer.toLowerCase().includes('prossiga')) {
        break;
      }
      
      // Enriquecer contexto
      context.contextoNarrativo += ` ${answer}.`;
      context.probabilidade += 0.1;
    }
  }
  
  // 3. Gerar análise
  const analise = gerarAnaliseEspecialista(context);
  
  // 4. Gerar resposta narrativa
  const personaMap = {
    "L": "estrategista_chefe",
    "Senku": "analista_forense",
    "Norman": "analista_comportamental",
    "Isagi": "analista_espacial",
    "Obi": "orquestrador_missao"
  };
  
  const narrativeResponse = generatePromptForPersona(
    personaMap[specialist],
    {
      ...context,
      hipotese: analise.analise.hipotese,
      confianca: analise.analise.nivel_confianca * 100
    }
  );
  
  return {
    analise,
    narrativa: narrativeResponse
  };
}
```

---

## 🔌 Integração com Outros Módulos

### Com Orchestrator Core
```typescript
// O orchestrator pode chamar especialistas específicos
const specialistAnalysis = await orchestrator.callSpecialist('L', context);
```

### Com Validation Engine
```typescript
// Validar análise de um especialista
const validation = await validateSpecialistAnalysis(analise);
```

### Com Vault/Punk Records
```typescript
// Salvar análise no sistema de memória
await vault.saveAnalysis(analise, context.idCaso);
```

---

## 📚 Referência de API

### Types

```typescript
interface ExecutionContext {
  idCaso: string;
  etapa: string;
  autor: string;
  contextoNarrativo: string;
  probabilidade: number;
  dados: Record<string, any>;
}

interface AnaliseEspecialista {
  especialista: string;
  analise: {
    hipotese: string;
    justificativa: string;
    nivel_confianca: number;
    acoes_recomendadas: string[];
  };
}

interface RefinementQuestion {
  question: string;
  targetVariable: string;
  priority: number;
}

interface TemplateOptions {
  category?: string;
  fallbackToDefault?: boolean;
}
```

### Funções Exportadas

#### specialistAgent.ts
- `gerarAnaliseEspecialista(context: ExecutionContext): AnaliseEspecialista`
- `getFullSpecialistName(shortName: string): string`
- `refineAndAnalyze(context: ExecutionContext): Promise<AnaliseEspecialista>`

#### qaRefiner.ts
- `generateRefinementQuestions(input: RefinementInput): RefinementQuestion[]`
- `executeRefinement(input: RefinementInput): RefinementResult`
- `generateCollaborativeQuestions(input: RefinementInput, specialists?: string[]): RefinementQuestion[]`
- `assessRefinementComplete(confidence: number, questionsAsked: number, responses: string[]): CompletionResult`
- `calculateConfidenceGain(response: string, targetVariable: string): number`

#### personaTemplateBuilder.ts
- `generatePromptForPersona(persona: string, context: ExecutionContext, options?: TemplateOptions): string`
- `generateMultiplePrompts(persona: string, context: ExecutionContext, categories: string[]): Record<string, string>`
- `selectBestTemplateCategory(persona: string, context: ExecutionContext): string`
- `validateContextForTemplate(context: ExecutionContext, requiredFields: string[]): boolean`

---

## 💡 Exemplos Práticos

### Caso 1: Investigação de Fraude Corporativa

```typescript
const fraudContext = {
  idCaso: "fraud_2025_001",
  etapa: "análise inicial",
  autor: "L",
  contextoNarrativo: "CEO realizou transferências suspeitas antes da falência. Documentos destruídos seletivamente.",
  probabilidade: 0.75,
  dados: {
    evidencias: ["registros bancários", "e-mails deletados"],
    suspeitos: ["CEO", "CFO", "Contador-chefe"]
  }
};

const lAnalysis = gerarAnaliseEspecialista(fraudContext);
// L: "A destruição seletiva de documentos indica premeditação..."
```

### Caso 2: Análise Psicológica de Testemunha

```typescript
const witnessContext = {
  idCaso: "witness_eval_001",
  etapa: "avaliação comportamental",
  autor: "Norman",
  contextoNarrativo: "Testemunha apresenta sinais de estresse ao mencionar o horário do crime.",
  probabilidade: 0.82,
  dados: {
    comportamentos: ["sudorese", "desvio de olhar", "pausas longas"],
    contexto: "interrogatório formal"
  }
};

const normanAnalysis = gerarAnaliseEspecialista(witnessContext);
// Norman: "Padrões de estresse indicam conhecimento suprimido..."
```

### Caso 3: Coordenação de Equipe em Crise

```typescript
const crisisContext = {
  idCaso: "emergency_response_001",
  etapa: "coordenação inicial",
  autor: "Obi",
  contextoNarrativo: "Múltiplas ameaças convergindo. Equipe dispersa. Tempo limitado.",
  probabilidade: 0.90,
  dados: {
    especialistasDisponiveis: ["L", "Isagi"],
    ameacas: ["deadline 2h", "dados sendo deletados"],
    recursos: ["acesso limitado", "2 terminais"]
  }
};

const obiAnalysis = gerarAnaliseEspecialista(crisisContext);
// Obi: "Fire Force, formação de emergência! L, rastreie a origem..."
```

---

## 🔧 Troubleshooting

### Problema: "Especialista não reconhecido"
**Solução:** Use apenas: "L", "Senku", "Norman", "Isagi", "Obi"

### Problema: Confiança sempre baixa
**Solução:** Enriqueça o contexto com mais detalhes ou use o qaRefiner

### Problema: Templates retornando placeholders
**Solução:** Verifique se o contexto tem todos os campos necessários

### Problema: Perguntas demais sendo geradas
**Solução:** Use comandos de escape: "prossiga", "chega", "analise agora"

---

## 📋 Checklist de Implementação

- [ ] Importar os módulos necessários
- [ ] Criar ExecutionContext apropriado
- [ ] Escolher especialista adequado
- [ ] Verificar se precisa refinamento (confiança < 80%)
- [ ] Gerar análise
- [ ] Opcionalmente, gerar resposta narrativa
- [ ] Integrar com outros módulos conforme necessário

---

## 🚀 Próximos Passos

1. **Testar com casos reais** do seu domínio
2. **Ajustar templates** para seu contexto específico
3. **Integrar com orchestrator** para fluxo completo
4. **Coletar feedback** sobre qualidade das análises
5. **Otimizar** baseado no uso real

---

**SPECIALISTS ENGINE v3.1** - *Fire Force cuida de Fire Force!* 🔥