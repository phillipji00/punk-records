### 📘 Documentação Técnica – Prompt 9: Persona Template Builder (v2.0)

---

#### ✅ Objetivo do Módulo

O `personaTemplateBuilder.ts` foi desenvolvido para transformar templates narrativos personalizados em **prompts prontos para uso por especialistas do Syndicate**, usando o contexto de execução atual.

**Novidades na v2.0:**
- Suporte a templates expandidos com múltiplas categorias
- Seleção automática de template baseada em contexto
- Validação de campos obrigatórios
- Limpeza inteligente de tokens não substituídos

---

### 🧠 Como os Templates Foram Estruturados

Os templates agora suportam estrutura hierárquica no `templates.json`:

```json
{
  "estrategista_chefe": {
    "analise_inicial": "Template para análise inicial...",
    "deteccao_contradicao": "Template para contradições...",
    "quantificacao_probabilistica": "Template para probabilidades...",
    "sintese_estrategica": "Template para síntese..."
  },
  // ... outros especialistas
}
```

Cada especialista pode ter múltiplas categorias de templates para diferentes situações narrativas.

---

### 🧩 Seleção do Template Correto

A seleção agora é mais inteligente:

1. **Por ID da persona**: Baseado em `personas.md`
   - `'estrategista_chefe'` → L (Lawliet)
   - `'analista_forense'` → Senku
   - `'analista_comportamental'` → Norman
   - `'analista_espacial'` → Isagi
   - `'orquestrador_missao'` → Obi

2. **Por categoria de template**: Baseado no contexto
   - `'analise_inicial'`: Template padrão
   - `'deteccao_contradicao'`: Quando há conflitos
   - `'perfil_psicologico'`: Para análises comportamentais
   - E muitas outras...

---

### 🔁 Substituição de Tokens Aprimorada

A função agora suporta:

1. **Campos diretos**: `{{hipotese}}`, `{{evidencia}}`
2. **Campos aninhados**: Acesso a `context.dados.palavrasChave`
3. **Arrays**: Converte automaticamente para string separada por vírgulas
4. **Valores default**: Tokens não substituídos recebem placeholders inteligentes

**Exemplo:**

```ts
const context = {
  hipotese: 'Manipulação de registros',
  evidencia: 'Documentos alterados',
  dados: {
    palavrasChave: ['fraude', 'conspiração', 'alteração']
  }
};

generatePromptForPersona('estrategista_chefe', context);
// Arrays são convertidos: "palavras-chave: fraude, conspiração, alteração"
```

---

### 🆕 Novas Funções Disponíveis

#### `generateMultiplePrompts`
Gera múltiplos prompts para diferentes categorias:

```ts
const prompts = generateMultiplePrompts(
  'analista_comportamental',
  context,
  ['analise_inicial', 'perfil_psicologico', 'deteccao_mentira']
);
// Retorna objeto com 3 prompts diferentes
```

#### `selectBestTemplateCategory`
Seleciona automaticamente a melhor categoria:

```ts
const categoria = selectBestTemplateCategory('Norman', {
  contextoNarrativo: 'Análise do perfil psicológico revela traumas...',
  etapa: 'análise'
});
// Retorna: 'perfil_psicologico'
```

#### `validateContextForTemplate`
Valida se o contexto tem campos necessários:

```ts
const isValid = validateContextForTemplate(
  context,
  ['hipotese', 'evidencia', 'confianca']
);
// Retorna: true/false
```

---

### ⚠️ Comportamento em Caso de Erro

- Se a `persona` não existir, lança erro claro
- Se a `categoria` não existir, tenta fallback para 'analise_inicial'
- Tokens não substituídos recebem placeholders como `[evidência em análise]`
- Validação prévia disponível para evitar erros

---

### 💡 Exemplo de Output Avançado

Input:

```ts
const context = {
  sujeito: 'Simon Jones',
  comportamento_observado: 'nervosismo extremo',
  emocao_oculta: 'medo de revelação',
  prob_mentira: 78,
  sinais_corporais: 'sudorese, desvio de olhar, mãos trêmulas'
};

const prompt = generatePromptForPersona(
  'analista_comportamental',
  context,
  { category: 'deteccao_mentira' }
);
```

Output:

```
Microexpressões detectadas durante [momento] indicam medo de revelação. Probabilidade de deception: 78%. Sinais corporais corroboram: sudorese, desvio de olhar, mãos trêmulas.
```

---

### 🔄 Integração com Outros Módulos

#### Com specialistAgent:
```ts
// Obter análise
const analise = gerarAnaliseEspecialista(context);

// Gerar prompt narrativo baseado na análise
const prompt = generatePromptForPersona(
  mapSpecialistToPersona(analise.especialista),
  {
    ...context,
    hipotese: analise.analise.hipotese,
    confianca: analise.analise.nivel_confianca * 100
  }
);
```

#### Com qaRefiner:
```ts
// Gerar perguntas usando template específico
const questionPrompt = generatePromptForPersona(
  'templates_perguntas',
  {
    percentual: 85,
    elemento: 'evidência contraditória',
    hipotese_alternativa: 'manipulação deliberada'
  },
  { category: 'L_estrategica' }
);
```

---

### 📋 Melhorias na v2.0

1. ✅ **Templates expandidos**: Múltiplas categorias por especialista
2. ✅ **Seleção inteligente**: Auto-detecção baseada em contexto
3. ✅ **Substituição robusta**: Suporte a campos aninhados e arrays
4. ✅ **Validação**: Verificação prévia de campos obrigatórios
5. ✅ **Fallbacks inteligentes**: Placeholders contextuais para tokens faltantes
6. ✅ **Novas funções utilitárias**: Para casos de uso avançados

---

### ✅ Status
Módulo expandido e otimizado para v2.0. Totalmente compatível com templates expandidos e pronto para integração avançada com o sistema Syndicate v3.1.