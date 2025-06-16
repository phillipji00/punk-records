# qa-refiner-v4.md - Módulo de Refinamento Q&A

**Sistema:** SYNDICATE v3.1  
**Versão:** 4.0  
**Última Atualização:** 15/06/2025  

## Função e Objetivo

O módulo `qaRefiner.ts` implementa um sistema inteligente de refinamento investigativo através de perguntas contextuais. Seu objetivo principal é permitir que especialistas detectem lacunas de contexto e gerem perguntas específicas para preencher ambiguidades antes de emitir análises finais.

### Principais Funcionalidades:
- Detecção automática de domínio investigativo
- Geração de perguntas personalizadas por especialista
- Sistema de escape para controle do usuário
- Múltiplos modos de refinamento (rapid, deep, collaborative)
- Cálculo dinâmico de ganho de confiança

## Como Importar

```typescript
import { 
  generateRefinementQuestions,
  generateCollaborativeQuestions,
  executeRefinement,
  assessRefinementComplete,
  calculateConfidenceGain 
} from './qaRefiner';
```

## Interfaces Usadas

### RefinementInput
```typescript
interface RefinementInput {
  specialist: string;              // Nome do especialista
  context: string;                 // Contexto da investigação
  hypothesis?: string;             // Hipótese atual (opcional)
  evidence?: string;               // Evidência disponível (opcional)
  missingElement?: string;         // Elemento faltante (opcional)
  userCommand?: string;            // Comando do usuário (opcional)
  currentConfidence?: number;      // Confiança atual em % (opcional)
}
```

### RefinementQuestion
```typescript
interface RefinementQuestion {
  question: string;        // Pergunta gerada
  targetVariable: string;  // Variável que a pergunta visa esclarecer
  priority: number;        // Prioridade (1 = mais alta)
}
```

### RefinementResult
```typescript
interface RefinementResult {
  questions: RefinementQuestion[];
  mode: 'rapid' | 'deep' | 'collaborative';
  estimatedQuestions: number;
  confidenceTarget: number;
  escapeAvailable: boolean;
}
```

## Lógica Geral Derivada do qa_refinement.md

### 1. Detecção de Domínio
O sistema analisa palavras-chave no contexto para determinar o domínio:
- **Histórico**: história, período, geopolítica, documento
- **Comportamental**: comportamento, psicológico, família, motivação
- **Estratégico**: estratégia, análise, hipótese, lógica
- **Otimização**: otimizar, eficiência, recursos, sistemas
- **Coordenação**: missão, objetivo, prioridade, equipe

### 2. Seleção de Especialista
Com base no domínio detectado:
- Domínio histórico → Senku Ishigami
- Domínio comportamental → Norman
- Domínio estratégico → L Lawliet
- Domínio otimização → Isagi Yoichi
- Domínio ambíguo (<70% confiança) → Capitão Obi

### 3. Modos de Refinamento
- **Rapid Mode**: 1-2 perguntas para confiança 60-75%
- **Deep Mode**: 3-4 perguntas para confiança <60%
- **Collaborative Mode**: 5-6 perguntas multi-especialista

### 4. Padrões de Perguntas
Cada especialista tem categorias específicas:

**Norman (Comportamental)**:
- psychological_profiling: Motivações e padrões
- genealogical_analysis: Dinâmicas familiares
- deception_detection: Sinais de mentira

**L Lawliet (Estratégico)**:
- strategic_depth: Evidências e hipóteses
- probability_refinement: Quantificação de certezas
- contradiction_detection: Inconsistências

**Senku (Histórico)**:
- historical_context: Períodos e contextos
- documentary_analysis: Autenticidade de fontes
- timeline_construction: Sequências temporais

### 5. Sistema de Escape
Detecta comandos como "prossiga", "chega", "analise agora" para permitir que o usuário pule o refinamento.

## Exemplo de Uso Testado

### Exemplo Básico (Como no Prompt)
```typescript
const result = generateRefinementQuestions({
  specialist: 'Norman',
  context: 'Divergência entre o depoimento e o laudo técnico',
  hypothesis: 'O personagem mentiu sobre o paradeiro',
  evidence: 'análise de deslocamento via GPS',
  missingElement: 'intencionalidade'
});

console.log(result);
// [
//   { 
//     question: "O sujeito tinha algum motivo pessoal para alterar sua rota?", 
//     targetVariable: "motivacao", 
//     priority: 1 
//   },
//   { 
//     question: "O depoimento foi colhido em qual condição psicológica?", 
//     targetVariable: "pressao_contextual", 
//     priority: 2 
//   }
// ]
```

### Exemplo com Auto-Detecção
```typescript
const result = generateRefinementQuestions({
  specialist: '', // Sistema detecta automaticamente
  context: 'Análise de documento histórico sobre tratado diplomático',
  evidence: 'Manuscrito do século XIX encontrado em arquivo'
});

console.log(result);
// [
//   { 
//     question: "10 bilhões por cento interessante! Que período histórico específico?", 
//     targetVariable: "periodo_historico", 
//     priority: 1 
//   }
// ]
```

### Exemplo de Escape
```typescript
const result = generateRefinementQuestions({
  specialist: 'L Lawliet',
  context: 'Investigação complexa',
  userCommand: 'ok, prossiga com o que tem',
  currentConfidence: 65
});

console.log(result);
// [
//   { 
//     question: "Roger! Prosseguindo com contexto atual (confidence: 65%). Fire Force adapta!", 
//     targetVariable: "escape_acknowledged", 
//     priority: 1 
//   }
// ]
```

### Exemplo Colaborativo
```typescript
const result = generateCollaborativeQuestions({
  context: 'Caso envolvendo aspectos históricos e psicológicos',
  currentConfidence: 40
});

console.log(result);
// [
//   { 
//     question: "Esta análise envolve múltiplos aspectos. Começando com estratégia...", 
//     targetVariable: "collaborative_intro", 
//     priority: 1 
//   },
//   { 
//     question: "Hmm... interessante. Que evidências suportam especificamente elemento central?", 
//     targetVariable: "elemento_chave", 
//     priority: 2 
//   },
//   // ... mais perguntas de diferentes especialistas
// ]
```

### Exemplo com executeRefinement
```typescript
const refinementResult = executeRefinement({
  context: 'Fraude corporativa com evidências contraditórias',
  hypothesis: 'CEO estava ciente das irregularidades',
  currentConfidence: 55
});

console.log(refinementResult);
// {
//   questions: [ /* array de perguntas */ ],
//   mode: 'deep',
//   estimatedQuestions: 4,
//   confidenceTarget: 85,
//   escapeAvailable: true
// }
```

## Integração com specialist-agent.ts

```typescript
// No specialist-agent.ts
import { generateRefinementQuestions, calculateConfidenceGain } from './qaRefiner';

async function refineContext(specialist: string, initialContext: string) {
  let confidence = 50;
  let refinedContext = initialContext;
  
  while (confidence < 80) {
    const questions = generateRefinementQuestions({
      specialist,
      context: refinedContext,
      currentConfidence: confidence
    });
    
    // Apresentar perguntas ao usuário
    for (const q of questions) {
      const answer = await getUserAnswer(q.question);
      
      // Atualizar contexto com resposta
      refinedContext += ` ${q.targetVariable}: ${answer}.`;
      
      // Calcular ganho de confiança
      confidence += calculateConfidenceGain(answer, q.targetVariable);
    }
  }
  
  return refinedContext;
}
```

## Observações Importantes

1. As perguntas são geradas sem prefixo de especialista no formato final
2. O sistema adapta automaticamente o número de perguntas baseado na confiança
3. Comandos de escape permitem prosseguir com contexto parcial
4. Variáveis alvo (`targetVariable`) são específicas para cada tipo de pergunta
5. O módulo é totalmente baseado no conhecimento documentado em `qa_refinement.md`