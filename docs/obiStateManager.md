# Obi Intelligence v4.0 - Documentação Técnica

## 📋 Visão Geral

O módulo `obiStateManager.ts` encapsula a inteligência central do **Capitão Akitaru Obi**, funcionando como o cérebro orquestrador do sistema investigativo Syndicate. Este módulo é responsável por interpretar contextos, coordenar especialistas, e gerar comandos narrativos que mantêm a coesão da equipe durante investigações complexas.

### 🔄 Evolução da v3.1

Esta versão representa uma evolução significativa do sistema de orquestração:
- **Inteligência Contextual**: Análise sofisticada de contextos para decisão automática
- **Ativação Inteligente**: Seleção automática de especialistas baseada em triggers semânticos
- **Narrativa Integrada**: Comandos gerados mantêm a personalidade característica do Obi
- **Diagnóstico Sistêmico**: Monitoramento contínuo da saúde do sistema investigativo

## 🎯 Funções Principais

### 1. **decidirAcaoObi(context: ExecutionContext): ObiCommand[]**

**Função**: Núcleo da inteligência do Obi. Analisa o contexto atual e gera uma lista priorizada de comandos para coordenar a investigação.

**Parâmetros**:
- `context`: Contexto de execução com dados da investigação atual

**Retorna**: Array de `ObiCommand` ordenado por prioridade (maior para menor)

**Exemplo de Uso**:
```typescript
const context: ExecutionContext = {
  idRegistro: "inv-001",
  contexto: "Análise de fraude financeira com múltiplas contradições nos documentos",
  autor: "orquestrador_missao", 
  etapa: "intake_analysis",
  especialista: "orquestrador_missao",
  idCaso: "caso-001",
  timestamp: new Date().toISOString(),
  probabilidade: 45,
  // ... outros campos e callbacks
};

const comandos = decidirAcaoObi(context);
comandos.forEach(cmd => console.log(processarComandoNarrativo(cmd)));
```

**Saída Esperada**:
```
**Capitão Obi:** Equipe, precisamos pausar e reavaliar. Algo não está batendo e não podemos arriscar seguir com incertezas.
*[Comando de alta prioridade - execução imediata recomendada]*

**Capitão Obi:** Detectei divergências entre as análises. Como líder da equipe, vou mediar essa discussão para encontrarmos consenso.
*[Comando de alta prioridade - execução imediata recomendada]*

**Capitão Obi:** L, Preciso da sua análise estratégica para conectar os pontos. Fire Force cuida de Fire Force - vamos trabalhar juntos nessa.
*[Comando de alta prioridade - execução imediata recomendada]*
```

### 2. **interpretarEstadoEmocional(context: ExecutionContext)**

**Função**: Avalia o estado emocional e operacional do contexto para gerar recomendações táticas.

**Retorna**:
```typescript
{
  urgencia: number;      // 1-5, sendo 5 emergência máxima
  confianca: number;     // 0-100, confiança na análise
  complexidade: number;  // 1-10, complexidade da investigação
  recomendacao: string;  // Orientação tática específica
}
```

### 3. **diagnosticarSistema(context: ExecutionContext): ObiSystemDiagnosis**

**Função**: Diagnóstico completo da saúde do sistema investigativo.

**Retorna**:
```typescript
{
  statusGeral: 'operacional' | 'atencao' | 'critico';
  especialistasRecomendados: string[];
  proximasAcoes: string[];
  alertas: string[];
  confiancaSistema: number;
}
```

## 🧠 Lógica de Tomada de Decisão

### Sistema de Prioridades

O Obi avalia situações e gera comandos seguindo uma hierarquia rígida:

1. **PRIORIDADE 10 (Crítica)**: Resolver conflitos detectados
2. **PRIORIDADE 9-7 (Alta)**: Ativar especialistas necessários  
3. **PRIORIDADE 8 (Alta)**: Pausar investigação se confiança < 40%
4. **PRIORIDADE 6 (Média)**: Validar etapa com múltiplos especialistas
5. **PRIORIDADE 5 (Média)**: Avançar pipeline se condições atendidas
6. **PRIORIDADE 3 (Baixa)**: Registrar contexto (sempre executado)

### Triggers para Ativação de Especialistas

#### L Lawliet (Estrategista Chefe)
**Palavras-chave**: estratégia, hipótese, análise, teoria, lógica, probabilidade, dedução, padrão, conexão, investigação, mistério, caso
**Ativação**: Automaticamente para casos com múltiplos especialistas ou alta complexidade

#### Senku Ishigami (Analista Forense) 
**Palavras-chave**: evidência, documento, científico, forense, histórico, examinar, material, prova, análise técnica, dados, fatos, verificar

#### Norman (Analista Comportamental)
**Palavras-chave**: comportamento, psicológico, pessoa, motivação, perfil, relacionamento, família, trauma, personalidade, emoção

#### Isagi Yoichi (Analista Espacial)
**Palavras-chave**: otimizar, estratégia, eficiência, sistema, campo, recursos, posição, movimento, tático, configuração, layout

### Avaliação de Complexidade

A complexidade é calculada através de fatores ponderados:
- **+2**: Contexto > 500 caracteres
- **+1**: Mais de 2 especialistas já ativados
- **+2**: Múltiplos elementos mencionados
- **+3**: Contradições explícitas
- **+2**: Urgência declarada
- **+1**: Mais de 5 ações no histórico
- **+2**: Probabilidade < 60%

### Detecção de Conflitos

O sistema identifica conflitos através de:
- **Indicadores linguísticos**: contraditório, inconsistente, conflito, divergência, discordância, incompatível, paradoxo
- **Baixa confiança**: Probabilidade < 40% indica possíveis conflitos
- **Análise semântica**: Padrões que sugerem informações conflitantes

## 🎭 Relação com Especialistas/Personas

### Filosofia de Liderança do Obi

**Princípio Central**: "Fire Force cuida de Fire Force"
- Liderança servidora que prioriza bem-estar da equipe
- Comunicação direta mas calorosa
- Mediação proativa de conflitos
- Empoderamento dos especialistas

### Dinâmica com Cada Especialista

#### Com L Lawliet
- **Relação**: Respeito mútuo entre líderes experientes
- **Comunicação**: Direta e estratégica
- **Exemplo**: *"L, preciso da sua análise estratégica para conectar os pontos. Fire Force cuida de Fire Force - vamos trabalhar juntos nessa."*

#### Com Senku Ishigami  
- **Relação**: Admiração pela expertise científica
- **Comunicação**: Valoriza precisão e metodologia
- **Exemplo**: *"Senku, sua expertise científica é essencial aqui. Fire Force cuida de Fire Force - vamos trabalhar juntos nessa."*

#### Com Norman
- **Relação**: Proteção especial por ser jovem, respeito pela inteligência
- **Comunicação**: Encorajador mas respeitoso
- **Exemplo**: *"Norman, preciso que você analise os aspectos psicológicos. Fire Force cuida de Fire Force - vamos trabalhar juntos nessa."*

#### Com Isagi Yoichi
- **Relação**: Mentoria tática, valoriza crescimento
- **Comunicação**: Focada em desenvolvimento e otimização
- **Exemplo**: *"Isagi, sua visão tática pode otimizar nossa abordagem. Fire Force cuida de Fire Force - vamos trabalhar juntos nessa."*

## 📦 Como Importar e Usar

### Importação Básica
```typescript
import { 
  decidirAcaoObi, 
  interpretarEstadoEmocional,
  diagnosticarSistema,
  processarComandoNarrativo,
  ObiCommand 
} from './obiStateManager';

import { ExecutionContext } from './types/common';
```

### Uso em Sistema de Orquestração
```typescript
// Criar contexto de investigação
const context: ExecutionContext = {
  idRegistro: "investigacao-001",
  contexto: "Documento histórico com discrepâncias temporais suspeitas",
  autor: "sistema",
  etapa: "intake_analysis", 
  especialista: "orquestrador_missao",
  idCaso: "caso-heritage-001",
  timestamp: new Date().toISOString(),
  probabilidade: 75,
  
  // Callbacks necessários
  log: (msg) => console.log(`[LOG] ${msg}`),
  advancePipeline: (stage) => console.log(`Pipeline → ${stage}`),
  activateSpecialist: async (id) => console.log(`Ativando ${id}`),
  activateProtocol: async (name) => console.log(`Protocolo: ${name}`),
  modifyScore: (field, value) => console.log(`${field} += ${value}`),
  haltPipeline: (reason) => { throw new Error(`Halt: ${reason}`); }
};

// Obter comandos do Obi
const comandos = decidirAcaoObi(context);

// Executar comandos em ordem de prioridade
for (const comando of comandos) {
  const narrativa = processarComandoNarrativo(comando);
  console.log(narrativa);
  
  // Executar ação baseada no comando
  switch (comando.action) {
    case 'ativar_especialista':
      await context.activateSpecialist(comando.target!);
      break;
    case 'avançar_pipeline':
      context.advancePipeline(comando.dados?.novaEtapa!);
      break;
    case 'pausar':
      context.haltPipeline(comando.dados?.razaoPausa!);
      break;
    // ... outras ações
  }
}
```

### Diagnóstico Contínuo
```typescript
// Monitoramento de saúde do sistema
const diagnostico = diagnosticarSistema(context);

console.log(`Status: ${diagnostico.statusGeral}`);
console.log(`Confiança: ${diagnostico.confiancaSistema}%`);

if (diagnostico.alertas.length > 0) {
  console.log('⚠️ Alertas:', diagnostico.alertas);
}

console.log('👥 Especialistas recomendados:', diagnostico.especialistasRecomendados);
console.log('📋 Próximas ações:', diagnostico.proximasAcoes);
```

## 🎬 Exemplo de Uso Realista e Narrativo

### Cenário: Investigação de Mt. Holly

```typescript
const investigacaoMtHolly: ExecutionContext = {
  idRegistro: "mth-001",
  contexto: `Simon Jones herdou Mt. Holly Estate de Herbert Sinclair. 
  O testamento menciona um 46º quarto secreto em uma mansão de 45 quartos. 
  Carros pretos com homens suspeitos se aproximam da propriedade. 
  Múltiplas evidências históricas parecem ter sido deliberadamente ocultadas.
  Norman detectou padrões psicológicos de manipulação. 
  L identificou conexões impossíveis nos registros oficiais.
  Senku encontrou discrepâncias científicas nos documentos históricos.
  Isagi mapeou padrões espaciais anômalos na arquitetura.`,
  autor: "sistema_narrativo",
  etapa: "synthesis",
  especialista: "orquestrador_missao", 
  idCaso: "mt-holly-heritage",
  timestamp: new Date().toISOString(),
  probabilidade: 85,
  
  log: (msg) => console.log(`🔥 [Obi] ${msg}`),
  advancePipeline: (stage) => console.log(`⏭️ Pipeline avançando para: ${stage}`),
  activateSpecialist: async (id) => console.log(`👤 Ativando especialista: ${id}`),
  activateProtocol: async (name) => console.log(`🚨 Protocolo ativo: ${name}`),
  modifyScore: (field, value) => console.log(`📊 ${field} modificado em ${value}`),
  haltPipeline: (reason) => console.log(`⏸️ Pipeline pausado: ${reason}`)
};

// Executar inteligência do Obi
const comandosObi = decidirAcaoObi(investigacaoMtHolly);

console.log("🎯 COMANDOS DO CAPITÃO OBI:\n");

comandosObi.forEach((comando, index) => {
  console.log(`${index + 1}. ${processarComandoNarrativo(comando)}`);
  console.log(`   ⚡ Prioridade: ${comando.prioridade}/10`);
  console.log(`   ⏰ ${comando.timestamp.toLocaleTimeString()}\n`);
});

// Diagnóstico do sistema
const diagnostico = diagnosticarSistema(investigacaoMtHolly);
console.log("🏥 DIAGNÓSTICO DO SISTEMA:");
console.log(`Status Geral: ${diagnostico.statusGeral.toUpperCase()}`);
console.log(`Confiança do Sistema: ${diagnostico.confiancaSistema}%`);
console.log(`Especialistas Recomendados: ${diagnostico.especialistasRecomendados.join(', ')}`);
```

**Saída Esperada**:
```
🎯 COMANDOS DO CAPITÃO OBI:

1. **Capitão Obi:** Equipe, chegamos a um ponto crítico. Vamos fazer nossa validação cruzada padrão para garantir que estamos no caminho certo.
   *[Coordenação de equipe ativa]*
   ⚡ Prioridade: 6/10
   ⏰ 14:23:45

2. **Capitão Obi:** Excelente trabalho, equipe! Temos informações suficientes para avançar para a próxima fase da investigação.
   *[Coordenação de equipe ativa]*
   ⚡ Prioridade: 5/10
   ⏰ 14:23:45

3. **Capitão Obi:** Registrando essas descobertas no nosso sistema. Cada insight pode ser crucial para investigações futuras.
   *[Procedimento padrão de documentação]*
   ⚡ Prioridade: 3/10
   ⏰ 14:23:45

🏥 DIAGNÓSTICO DO SISTEMA:
Status Geral: OPERACIONAL
Confiança do Sistema: 85%
Especialistas Recomendados: 
```

## ⚠️ Considerações Importantes

### Limitações do Sistema
1. **Dependência de Context Quality**: A qualidade das decisões depende diretamente da riqueza do contexto fornecido
2. **Triggers Linguísticos**: Sistema funciona melhor com português, pode ter limitações com outros idiomas
3. **Complexity Ceiling**: Muito eficaz até complexidade 8, após isso pode precisar de intervenção manual

### Boas Práticas
1. **Contexto Rico**: Sempre forneça contexto detalhado com pelo menos 100 caracteres
2. **Probabilidade Informada**: Inclua campo probabilidade para melhor avaliação de confiança
3. **Callback Functions**: Implemente todos os callbacks necessários no ExecutionContext
4. **Monitoramento Contínuo**: Use diagnosticarSistema() regularmente para health checks

### Troubleshooting Comum

**Problema**: Obi não ativa especialistas esperados
**Solução**: Verifique se o contexto contém palavras-chave relevantes dos TRIGGERS_ESPECIALISTAS

**Problema**: Comandos com prioridade baixa demais
**Solução**: Contextos com urgência ou conflitos geram comandos de alta prioridade

**Problema**: Sistema sempre recomenda pausar
**Solução**: Verifique se probabilidade no contexto não está muito baixa (<40%)

## 🚀 Benefícios da Implementação

1. **Orquestração Inteligente**: Decisões automáticas baseadas em análise contextual sofisticada
2. **Narrativa Preservada**: Comandos mantêm personalidade e estilo do Capitão Obi
3. **Escalabilidade**: Sistema se adapta a diferentes níveis de complexidade investigativa
4. **Monitoramento Proativo**: Detecção precoce de problemas e conflitos
5. **Coordenação Eficiente**: Ativação automática de especialistas baseada em necessidade real

## 🔮 Evolução Futura

Melhorias planejadas para próximas versões:
- **Machine Learning Integration**: Aprendizado baseado em resultados de investigações anteriores
- **Advanced NLP**: Processamento mais sofisticado de linguagem natural para triggers
- **Predictive Analytics**: Antecipação de problemas antes que se manifestem
- **Multi-language Support**: Suporte para investigações em múltiplos idiomas
- **Custom Trigger Training**: Capacidade de treinar novos triggers baseados em domínios específicos

---

**Versão**: 4.0  
**Última atualização**: 2025-06-15  
**Compatibilidade**: Syndicate v3.1+  
**Autor**: Sistema BMAD + Narrativa Syndicate  
**Status**: ✅ PRONTO PARA PRODUÇÃO