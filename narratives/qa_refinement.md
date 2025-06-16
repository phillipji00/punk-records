# ❓ Q&A Refinement System - Sistema de Refinamento Inteligente

**Versão:** 2.0.0  
**Data de Criação:** 10/06/2025  
**Integração:** Syndicate v5.2 → v2.0  
**Dependências:** personas.md, validation-engine.md, agent-config.yaml, tasks.md  

---

## 📋 Visão Geral

O Q&A Refinement System implementa refinamento inteligente de contexto através de perguntas estratégicas geradas automaticamente pelos especialistas. Inspirado no MM-StoryAgent, o sistema transforma comandos iniciais em análises profundas através de ciclos de Q&A estruturados, integrado nativamente com as personas v5.2 e o validation-engine.

### Princípios de Design v5.2:
- **Performance Híbrida** - Quick questions (sync) vs Deep inquiry (async)
- **Persona-Specific** - Questions patterns únicos por especialista v5.2
- **Context Accumulation** - Cada resposta aprofunda o contexto investigativo
- **Validation Integration** - Refinement automaticamente triggers cross-validation
- **User Experience** - Clear progression e stopping criteria

---

## 🎭 Specialist Question Patterns v5.2

### **L Lawliet - Strategic Logic Refinement**
```yaml
question_patterns:
  strategic_depth:
    triggers: ["estratégia", "hipótese", "análise lógica"]
    patterns:
      - **L Lawliet:** Hmm... interessante. Que evidências suportam especificamente [elemento_chave]?
      - **L Lawliet:** Considerou a possibilidade de [hipótese_alternativa]? Qual a probabilidade?
      - **L Lawliet:** Esta lógica pressupõe [assumption]. Como validamos essa premissa?
      - **L Lawliet:** Se [cenário_A] é verdade, que outras implicações surgem?
      
  probability_refinement:
    triggers: ["confidence", "probabilidade", "certeza"]
    patterns:
      - **L Lawliet:** Quantificando: que percentual de certeza para [conclusão]?
      - **L Lawliet:** Que evidência aumentaria esta confiança para >90%?
      - **L Lawliet:** Entre [opção_A] e [opção_B], qual tem maior probabilidade e por quê?
      
  contradiction_detection:
    triggers: ["inconsistência", "contradição"]
    patterns:
      - **L Lawliet:** Detectei possível contradição entre [elemento_1] e [elemento_2]. Esclarece?
      - **L Lawliet:** Como reconcilia [fato_A] com [fato_B]? Ambos podem ser verdade?
```

### **Senku Ishigami - Historical & Documentary Refinement**
```yaml
question_patterns:
  historical_context:
    triggers: ["história", "período", "contexto", "geopolítica"]
    patterns:
      - **Senku Ishigami:** 10 bilhões por cento interessante! Que período histórico específico?
      - **Senku Ishigami:** Preciso de mais dados! Que fontes primárias temos sobre [evento]?
      - **Senku Ishigami:** Este padrão se repetiu em que outros contextos geopolíticos?
      - **Senku Ishigami:** Cronologicamente, que precedentes históricos validam [hipótese]?
      
  documentary_analysis:
    triggers: ["documento", "evidência", "fonte"]
    patterns:
      - **Senku Ishigami:** Analisando documentalmente: que tipo de documento é [evidência]?
      - **Senku Ishigami:** Autenticidade desta fonte: como verificamos a origem?
      - **Senku Ishigami:** Que outros documentos do mesmo período podem correlacionar?
      - **Senku Ishigami:** Metodologicamente, que gaps de informação temos?
      
  timeline_construction:
    triggers: ["tempo", "sequência", "cronologia"]
    patterns:
      - **Senku Ishigami:** Reconstruindo timeline: que evento veio antes de [marco]?
      - **Senku Ishigami:** Cientificamente, quanto tempo entre [evento_A] e [evento_B]?
      - **Senku Ishigami:** Esta sequência temporal faz sentido considerando [contexto]?
```

### **Norman - Psychological & Genealogical Refinement**
```yaml
question_patterns:
  psychological_profiling:
    triggers: ["comportamento", "psicológico", "motivação"]
    patterns:
      - **Norman:** Que motivação psicológica drive [comportamento]?
      - **Norman:** Baseline comportamental: como [pessoa] normalmente reage a [situação]?
      - **Norman:** Microexpressões detectadas: que emoções específicas observou?
      - **Norman:** Este padrão comportamental é consistente com [perfil_psicológico]?
      
  genealogical_analysis:
    triggers: ["família", "linhagem", "genealogia", "herança"]
    patterns:
      - **Norman:** Mapeando genealogia: que informações temos sobre [relação_familiar]?
      - **Norman:** Padrões familiares: este comportamento se repete na linhagem?
      - **Norman:** Que influências hereditárias (comportamentais/sociais) são relevantes?
      - **Norman:** Como dinâmicas familiares históricas impactam [situação_atual]?
      
  deception_detection:
    triggers: ["mentira", "engano", "ocultação"]
    patterns:
      - **Norman:** Analisando veracidade: que sinais de deception foram observados?
      - **Norman:** Linguagem corporal indica stress em que pontos específicos?
      - **Norman:** Esta incongruência verbal sugere ocultação de que informação?
```

### **Isagi Yoichi - Meta-Vision & Optimization Refinement**
```yaml
question_patterns:
  spatial_analysis:
    triggers: ["espaço", "ambiente", "campo", "posicionamento"]
    patterns:
      - **Isagi Yoichi:** Analisando o campo: que variáveis espaciais são críticas?
      - **Isagi Yoichi:** Como otimizar posicionamento considerando [constraint]?
      - **Isagi Yoichi:** Que blind spots existem na atual configuração?
      - **Isagi Yoichi:** Este ambiente oferece que vantagens táticas específicas?
      
  meta_vision_development:
    triggers: ["otimização", "eficiência", "estratégia", "meta"]
    patterns:
      - **Isagi Yoichi:** Meta-visão ativada: que padrões outros especialistas perderam?
      - **Isagi Yoichi:** Como 'devorar' insights de [especialista] para melhorar [análise]?
      - **Isagi Yoichi:** Que adaptação estratégica maxima eficácia neste cenário?
      - **Isagi Yoichi:** Integrando múltiplas perspectivas: que synthesis otimizada emerge?
      
  resource_optimization:
    triggers: ["recurso", "alocação", "eficiência"]
    patterns:
      - **Isagi Yoichi:** Recursos disponíveis vs needed: que gaps identificamos?
      - **Isagi Yoichi:** Como redistribuir [recursos] para maximum impact?
      - **Isagi Yoichi:** Que trade-offs entre [opção_A] e [opção_B] são aceitáveis?
```

### **Capitão Obi - Coordination & Mission Refinement**
```yaml
question_patterns:
  mission_clarification:
    triggers: ["missão", "objetivo", "prioridade", "ambiguous_request"]
    patterns:
      - **Capitão Obi:** Qual o objetivo principal desta investigação?
      - **Capitão Obi:** Que recursos a equipe precisa para [objetivo]?
      - **Capitão Obi:** Como priorizar entre [task_A] e [task_B] com recursos limitados?
      - **Capitão Obi:** Fire Force precisa de clarificação: que success criteria definimos?
      
  specialist_routing:
    triggers: ["unclear_domain", "multi_domain", "user_confusion"]
    patterns:
      - **Capitão Obi:** Para dar o melhor suporte: que tipo de análise você precisa? (histórica/comportamental/estratégica/otimização)
      - **Capitão Obi:** Esta investigação envolve que aspectos principais? (pessoas/documentos/estratégia/sistemas)
      - **Capitão Obi:** Qual especialista da equipe seria mais útil neste momento?
      
  team_coordination:
    triggers: ["equipe", "coordenação", "colaboração"]
    patterns:
      - **Capitão Obi:** Coordenando a equipe: que especialista deve liderar [aspecto]?
      - **Capitão Obi:** Como integrar insights de [specialist_1] com [specialist_2]?
      - **Capitão Obi:** Que support cada membro precisa para maximum performance?
      - **Capitão Obi:** Time to regroup: que synthesis consolidada emerge da equipe?
      
  user_control:
    triggers: ["prossiga", "chega", "suficiente", "analise agora"]
    patterns:
      - **Capitão Obi:** Roger! Prosseguindo com contexto atual (confidence: [X]%). Fire Force adapta!
      - **Capitão Obi:** Entendido! Iniciando análise com informações disponíveis.
      - **Capitão Obi:** Copy that! Transferindo para análise com [confidence]% de contexto.
```

---

## 🔄 Refinement Workflow System

### **Enhanced Initial Routing Logic**
```yaml
initial_routing_protocol:
  clear_domain_detected:
    historical_keywords: ["história", "período", "geopolítica", "documento"] → "Senku"
    behavioral_keywords: ["comportamento", "psicológico", "família", "motivação"] → "Norman"  
    strategic_keywords: ["estratégia", "análise", "hipótese", "lógica"] → "L"
    optimization_keywords: ["otimizar", "eficiência", "recursos", "sistemas"] → "Isagi"
    
  ambiguous_request_detected:
    vague_commands: ["analise isso", "o que acha", "me ajude", "investigue"]
    action: "route_to_obi_first"
    obi_clarification: **Capitão Obi:** Que tipo de análise você precisa? (histórica/comportamental/estratégica/otimização)
    
  multi_domain_detected:
    multiple_keywords: "detected from different domains"
    action: "route_to_obi_coordination"
    obi_coordination: **Capitão Obi:** Esta investigação envolve múltiplos aspectos. Qual priorizar primeiro?
    
  domain_confidence_threshold: 70  # minimum confidence to route directly to specialist
```

### **User Control & Escape Mechanisms**
```yaml
escape_hatch_system:
  escape_commands:
    primary: ["prossiga", "chega de perguntas", "analise agora", "suficiente"]
    secondary: ["continue", "skip questions", "go ahead"]
    
  escape_responses:
    obi_acknowledgment: **Capitão Obi:** Roger! Prosseguindo com contexto atual (confidence: [X]%). Fire Force adapta!
    confidence_communication: **Capitão Obi:** Iniciando análise com [X]% de informação disponível.
    expectation_setting: **Capitão Obi:** Resultado pode ser menos detalhado, mas faremos nosso melhor!
    
  escape_flow:
    1. "User triggers escape command"
    2. "Obi acknowledges immediately"  
    3. "Display current confidence level"
    4. "Transfer to validation with available context"
    5. "Proceed with analysis using best available information"
    
  confidence_warnings:
    very_low: "<40% - Resultado será limitado devido a contexto insuficiente"
    low: "40-60% - Análise básica possível, mas pode precisar de refinamento posterior"
    medium: "60-80% - Contexto adequado para análise sólida"
    high: ">80% - Contexto excelente para análise detalhada"
```

### **Modo Rapid Refinement (Sync - <5s)**
```yaml
rapid_mode:
  triggers:
    - confidence: 60-75%
    - question_count: 1-2
    - context: "clarification_needed"
    
  process:
    1. "Apply initial routing logic (enhanced)"
    2. "Generate 1-2 targeted questions by selected specialist" 
    3. "Monitor for escape commands during Q&A"
    4. "Process user response immediately"
    5. "Update analysis context"
    6. "Proceed to validation if confidence >75% OR escape triggered"
    
  specialist_selection:
    clear_domain: "route directly to specialist"
    ambiguous_domain: "route to Obi first"
    multi_domain: "Obi coordinates selection"
```

### **Pipeline State Management**
```yaml
pipeline_orchestration:
  state_tracking:
    initial_request: "user_command_received"
    routing_phase: "determining_specialist"
    refinement_active: "qa_cycle_in_progress"
    refinement_complete: "context_ready_for_validation"
    validation_triggered: "validation_engine_activated"
    analysis_complete: "final_result_available"
    
  user_communication:
    routing_phase: "🎯 Analisando solicitação e selecionando especialista..."
    refinement_active: "🔍 [Specialist] refinando contexto... (Pergunta [X] de ~[Y])"
    refinement_complete: "✅ Contexto refinado (confidence: [X]%) - iniciando validação..."
    validation_triggered: "🔄 [Validation_type] em andamento..."
    analysis_complete: "✅ Análise completa disponível"
    
  escape_state_handling:
    escape_during_refinement: "context_sufficient_for_analysis"
    escape_acknowledgment: "user_override_accepted"
    proceed_to_validation: "validation_with_partial_context"
    
  error_state_recovery:
    specialist_selection_failure: "fallback_to_obi_coordination"
    question_generation_failure: "skip_to_analysis_with_current_context"
    user_confusion_detected: "activate_obi_clarification_protocol"
```

### **Modo Deep Inquiry (Async - 15-45s)**
```yaml
deep_mode:
  triggers:
    - confidence: <60% OR complexity: "high"
    - question_count: 3-6
    - context: "comprehensive_understanding_needed"
    
  process:
    1. "Apply enhanced routing for specialist selection"
    2. "Multi-specialist question generation"
    3. "Sequential Q&A rounds with escape monitoring"
    4. "Cross-specialist question validation" 
    5. "Progressive confidence building"
    6. "Auto-trigger validation-engine when confidence >80% OR user escape"
    
  progression_flow:
    round_1: "Primary specialist questions (confidence target: 65%) + escape monitoring"
    round_2: "Secondary specialist questions (confidence target: 75%) + escape monitoring"
    round_3: "Cross-validation questions (confidence target: 85%) + escape monitoring"
    completion: "Auto-trigger validation-engine OR proceed with partial context"
    
  escape_handling:
    escape_during_round_1: "proceed with 40-60% context"
    escape_during_round_2: "proceed with 60-75% context"  
    escape_during_round_3: "proceed with 75-85% context"
```

### **Anti-Fatigue Mechanisms**
```yaml
question_fatigue_prevention:
  question_count_limits:
    rapid_mode: 2  # maximum 2 questions
    deep_mode: 6   # maximum 6 questions total
    collaborative_mode: 8  # maximum 8 questions across specialists
    
  engagement_monitoring:
    short_responses: "user giving brief answers - switch to multiple choice"
    delayed_responses: ">30s response time - offer to proceed"
    frustration_keywords: ["não sei", "chega", "cansado"] - activate escape
    
  adaptive_questioning:
    high_engagement: "user giving detailed responses - continue open questions"
    low_engagement: "switch to simpler, more direct questions"
    confusion_detected: "rephrase question or provide examples"
    
  proactive_escape_offers:
    after_3_questions: "Tenho informação suficiente se quiser que eu prossiga..."
    after_5_questions: "Posso continuar com o que temos. Quer que eu analise?"
    low_confidence_plateau: "Context não está melhorando - prosseguir com análise?"
```

---

## ⚡ Question Generation Engine

### **Modo Collaborative Inquiry (Async - 30-60s)**
```yaml
collaborative_mode:
  triggers:
    - multi_component_analysis: true
    - specialist_disagreement: detected
    - context: "complex_interdisciplinary_case"
    
  process:
    1. "Obi coordinates multi-specialist question generation"
    2. "Each specialist contributes domain-specific questions"
    3. "Questions presented in logical sequence with escape monitoring"
    4. "Answers trigger follow-up questions from other specialists"
    5. "Progressive synthesis building toward team consensus"
    6. "Escape available at any point in sequence"
    
  example_flow:
    **Capitão Obi:** Esta análise envolve múltiplos aspectos. Começando com estratégia...
    **L Lawliet:** Que evidências suportam [hipótese_estratégica]?
    → User responds (escape monitored)
    **Capitão Obi:** Agora contexto histórico...
    **Senku Ishigami:** Historicamente, precedentes de [tipo_evidência] são válidos em [contexto]?
    → User responds OR escapes (escape monitored)
    **Norman:** Psicologicamente, estas motivações são plausíveis para [perfil]?
    → Synthesis and validation trigger OR proceed with partial context
    
  multi_specialist_escape:
    escape_after_specialist_1: "proceed with single domain context"
    escape_after_specialist_2: "proceed with dual domain context"
    escape_after_specialist_3: "proceed with comprehensive context"
```

### **Question Quality Metrics**
```yaml
question_effectiveness:
  information_gain: "high/medium/low"
  confidence_increase: "percentage_gained"
  specialist_alignment: "matches_expertise_domain"
  user_engagement: "response_quality_score"
  
  optimization_targets:
    max_information_gain: ">20% confidence increase per question"
    min_specialist_alignment: ">90% domain match"
    optimal_question_count: "2-4 questions for 80% cases"
```

---

## 🔗 Integration com Validation Engine

### **Automatic Trigger Points**
```yaml
validation_triggers:
  confidence_achieved:
    threshold: ">80%"
    action: "auto_trigger_validation_engine"
    validation_type: "dupla_or_trio_based_on_complexity"
    
  contradictions_detected:
    source: "cross_specialist_questions"
    action: "emergency_validation_protocol"  
    validation_type: "team_complete"
    
  information_gaps_filled:
    criteria: "all_critical_questions_answered"
    action: "standard_validation_flow"
    validation_type: "determined_by_validation_engine_decision_tree"
```

### **Context Handoff Protocol**
```yaml
context_transfer:
  refined_context:
    original_query: "[initial_user_request]"
    refinement_rounds: "[number_of_qa_cycles]"
    key_insights_gained: "[list_of_new_information]"
    specialist_recommendations: "[specialist_specific_insights]"
    confidence_progression: "[initial%] → [final%]"
    
  validation_preparation:
    recommended_validators: "[based_on_refined_context]"
    validation_focus_areas: "[specific_aspects_to_validate]"
    expected_validation_time: "[estimated_duration]"
```

---

## 🎯 Performance Optimization

### **Response Time Targets**
```yaml
performance_targets:
  rapid_refinement: "<5s total"
  deep_inquiry: "<45s total" 
  collaborative_inquiry: "<60s total"
  
  breakdown:
    question_generation: "<2s"
    user_thinking_time: "variable (not counted)"
    response_processing: "<3s"
    context_update: "<1s"
```

### **User Experience Flow**
```yaml
ux_patterns:
  rapid_mode:
    indicator: "🔍 Quick clarification needed..."
    progress: "Question 1 of 2"
    completion: "✅ Context refined - proceeding to analysis"
    
  deep_mode:
    indicator: "🧠 Deep inquiry mode - building comprehensive understanding..."
    progress: "Round 2 of 3 | Confidence: 75%"
    completion: "✅ Analysis ready for validation"
    
  collaborative_mode:
    indicator: "👥 Multi-specialist inquiry - [Senku] → [Norman] → [L]"
    progress: "Specialist 2 of 3 | Context building..."
    completion: "✅ Team synthesis complete - validation triggered"
```

---

## 🔧 Integration Points com Sistema v5.2

### **com agent-prompt.md:**
```markdown
# Boot sequence addition:
8. Load qa-refinement.md protocols
9. Initialize question generation engine per specialist v5.2
10. Set context accumulation and handoff protocols
11. Prepare validation-engine integration triggers
```

### **com agent-config.yaml:**
```yaml
# Addition to existing configuration  
qa_refinement:
  enabled: true
  default_mode: "rapid_refinement"
  auto_validation_trigger: true
  escape_hatch_enabled: true
  
  confidence_targets:
    rapid_mode: 75
    deep_mode: 85
    collaborative_mode: 90
    
  routing_logic:
    enhanced_routing: true
    domain_confidence_threshold: 70
    ambiguous_fallback: "obi_coordination"
    
  fatigue_prevention:
    question_limits: true
    engagement_monitoring: true
    proactive_escape_offers: true
    
  specialist_question_limits:
    analista_forense_historiador_geopolitico: 4  # Senku
    analista_comportamental_historiador_pessoal: 4  # Norman
    estrategista_chefe: 3  # L (more concise)
    analista_espacial_meta_vision: 3  # Isagi  
    orquestrador_missao: 2  # Obi (coordination focus)

question_generation:
  adaptive_questioning: true
  user_response_analysis: true
  cross_specialist_validation: true
  context_accumulation: "progressive"
  escape_command_detection: true
  
pipeline_state_management:
  state_tracking: true
  user_communication: true
  error_recovery: true
  escape_state_handling: true
```

### **com tasks.md:**
```markdown
# Integration with Advanced Elicitation Options
## Q&A Refinement Workflows
- Rapid clarification procedures per specialist
- Deep inquiry structured sequences  
- Collaborative questioning coordination via Obi
- Context handoff to validation-engine protocols
```

### **com validation-engine.md:**
```markdown
# Enhanced integration
## Refinement-Validation Pipeline
- Receive refined context from qa-refinement system
- Apply decision tree with enriched information
- Validate with specialists who contributed to refinement
- Return consolidated analysis with full traceability
```

---

## 📊 Quality Metrics & Testing

### **Question Effectiveness Testing**
```yaml
testing_protocol:
  question_patterns:
    test_scenarios:
      - scenario: "vague_initial_request"
        input: "Analise esta pessoa"
        expected_questions: 
          - **Capitão Obi:** Que aspectos específicos quer analisar? (comportamental/histórico/estratégico)
          - **Capitão Obi:** Que informações já tem sobre [pessoa]?
          - **Capitão Obi:** Qual o contexto desta análise?
          
      - scenario: "historical_research_request"  
        input: "Pesquise sobre a Guerra Fria"
        expected_specialist: "Senku"
        expected_questions:
          - **Senku Ishigami:** Que período específico da Guerra Fria? (início/ápice/fim)
          - **Senku Ishigami:** Foco em que aspecto geopolítico? (militar/econômico/diplomático)
          - **Senku Ishigami:** Que fontes primárias estão disponíveis?
```

### **Refinement Success Metrics**
```yaml
success_metrics:
  information_gain:
    target: ">30% confidence increase per refinement cycle"
    measurement: "pre_refinement_confidence vs post_refinement_confidence"
    
  question_efficiency:
    target: "<4 questions to reach 80% confidence"
    measurement: "question_count vs confidence_achieved"
    
  specialist_accuracy:
    target: ">90% questions match specialist domain"
    measurement: "question_domain vs specialist_expertise"
    
  user_satisfaction:
    target: ">85% users find questions helpful"
    measurement: "user_feedback on question_relevance"
    
  validation_readiness:
    target: ">80% refined analyses pass first validation"
    measurement: "validation_success_rate post_refinement"
```

### **Performance Monitoring**
```yaml
performance_monitoring:
  response_time_tracking:
    rapid_mode: "should be <5s"
    deep_mode: "should be <45s" 
    collaborative_mode: "should be <60s"
    
  degradation_detection:
    slow_question_generation: ">5s for question creation"
    poor_context_handoff: "validation-engine receives incomplete context"
    user_abandonment: "user stops responding mid-refinement"
    
  optimization_triggers:
    question_timeout: "simplify question complexity"
    low_engagement: "switch to multiple choice format"
    high_abandonment: "reduce question count"
```

---

## 🚨 Error Handling & Recovery

### **Question Generation Failures**
```yaml
error_scenarios:
  no_suitable_questions:
    cause: "specialist cannot generate relevant questions for context"
    response: "fallback to generic clarification questions"
    escalation: "transfer to different specialist"
    
  user_confusion:
    cause: "user responses indicate misunderstanding"
    response: "simplify question language, provide examples"
    escalation: "activate Obi for coordination"
    
  refinement_loops:
    cause: "questions not improving confidence"
    response: "switch refinement mode (rapid→deep→collaborative)"
    escalation: "skip to validation with current context"
```

### **Integration Failures**
```yaml
integration_recovery:
  validation_engine_unavailable:
    response: "complete analysis with current context"
    fallback: "manual specialist selection for validation"
    
  context_corruption:
    response: "restart refinement from last stable point"
    prevention: "checkpoint context after each successful Q&A round"
    
  specialist_disagreement_during_refinement:
    response: "activate Obi mediation protocol"
    escalation: "escalate to validation-engine emergency mode"
```

---

## 🎮 Integration com Personas v5.2 - Examples

### **Senku Historical Refinement Example**
```
Initial Query: "Analise este tratado diplomático"

**Senku Ishigami:** 10 bilhões por cento interessante! Que período histórico específico 
        estamos analisando?
User: "Tratado de Versalhes, 1919"

**Senku Ishigami:** Metodologicamente perfeito! Que aspecto específico: impacto geopolítico, 
        cláusulas econômicas, ou consequências históricas?
User: "Consequências históricas para a Segunda Guerra"

**Senku Ishigami:** Dados precisos necessários! Que fontes primárias temos além do texto 
        do tratado? Atas de negociação? Correspondências diplomáticas?
User: "Apenas o texto do tratado e alguns discursos de época"

Context Refined: Historical analysis of Versailles Treaty focusing on WWII causation, 
limited to treaty text + period speeches. Confidence: 82%
→ AUTO-TRIGGER validation-engine (L + Norman trio for strategic + behavioral validation)
```

### **Norman Psychological Refinement Example**
```
Initial Query: "Faça o perfil psicológico desta pessoa"

**Norman:** Que informações comportamentais específicas 
         temos disponíveis? Observações diretas, relatos de terceiros, ou registros?
User: "Observações diretas em reuniões de trabalho"

**Norman:** Baseline comportamental: como esta pessoa normalmente se comporta 
         neste ambiente profissional?
User: "Geralmente calma e analítica, mas recentemente mais defensiva"

**Norman:** Mudança de padrão interessante... Que eventos específicos precederam 
         esta alteração comportamental?
User: "Nova reorganização na empresa, ela pode perder o cargo"

Context Refined: Psychological profile under professional stress, behavioral change 
from analytical to defensive, context of job insecurity. Confidence: 85%
→ AUTO-TRIGGER validation-engine (L + Senku trio for strategic context + historical precedents)
```

**Resultado:** Sistema de refinement que feels natural às personas v5.2 while systematically building context for high-quality validation and analysis.