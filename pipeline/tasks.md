# SYNDICATE v2.0 - TASK WORKFLOWS
> **Pipeline-Driven Workflows** + **Meta-Workflows** para investigação estruturada

---

## PIPELINE-DRIVEN WORKFLOWS (Processo Principal)

### STAGE 1: INTAKE & ANALYSIS
**Responsável**: `orquestrador_missao` (Capitão Obi)  
**Propósito**: Análise profunda da entrada do usuário e contextualização inicial

#### Workflow Steps:
1. **Initial Assessment**
   - Analisar entrada do usuário para complexity e scope
   - Identificar domain(s) de expertise necessários
   - Avaliar completude contextual (target: 80%)

2. **Context Gap Analysis**
   - Se completude < 80%: Acionar `Q&A Refinement Meta-Workflow`
   - Identificar informações críticas faltantes
   - Priorizar lacunas por impact na investigação

3. **Preliminary Specialist Selection**
   - Mapear expertise necessária para personas disponíveis
   - Identificar specialist primário e supporting specialists
   - Preparar briefing inicial para Stage 2

#### Completion Criteria:
- [ ] Completude contextual ≥ 80%
- [ ] Domain expertise identificado
- [ ] Specialists preliminares selecionados
- [ ] Briefing preparado para delegação

#### Quality Gate: **BÁSICO** (60% confidence)

---

### STAGE 2: TASK DELEGATION
**Responsável**: `orquestrador_missao` (Capitão Obi)  
**Propósito**: Distribuição inteligente de tarefas entre especialistas apropriados

#### Workflow Steps:
1. **Specialist Activation**
   - Ativar specialists baseado em domain analysis do Stage 1
   - Assignar specialist primário para cada major component
   - Estabelecer supporting specialists para cross-validation

2. **Task Distribution**
   - Decompor investigação em tasks específicas e paralelas
   - Assignar tasks baseado em confidence levels de cada specialist
   - Estabelecer dependencies e sequencing entre tasks

3. **Coordination Setup**
   - Estabelecer communication protocols entre specialists
   - Definir checkpoints intermediários
   - Preparar handoff procedures para Stage 3

#### Completion Criteria:
- [ ] Todos specialists necessários ativados
- [ ] Tasks específicas assignadas e aceitas
- [ ] Dependencies mapeadas
- [ ] Coordination protocols estabelecidos

#### Quality Gate: **PADRÃO** (80% confidence)

---

### STAGE 3: VALIDATION (Mandatory Quality Gateway)
**Responsável**: `Validation Engine`  
**Propósito**: Controle rigoroso de qualidade e verificação de consistência

#### Workflow Steps:
1. **Matrix Validation Execution**
   - Aplicar matriz 26x1 para análises recebidas
   - Cross-reference entre specialist findings
   - Identificar contradições ou inconsistências

2. **Confidence Assessment**
   - Avaliar confidence scores de cada specialist
   - Verificar se thresholds são atendidos
   - Calibrar confidence global da investigação

3. **Quality Decision Tree**
   - **SE** validação passa: Prosseguir para Stage 4
   - **SE** falha detectada: Acionar `Retry Protocols Meta-Workflow`
   - **SE** contradição crítica: Escalonar para `orquestrador_missao`

#### Completion Criteria:
- [ ] Matriz 26x1 executada successfully
- [ ] Todas contradições resolvidas ou documentadas
- [ ] Confidence thresholds atingidos
- [ ] Approval formal para progressão

#### Quality Gate: **RIGOROSO** (95% confidence)
#### Fallback Action: `Retry Protocols` se falha detectada

---

### STAGE 4: SYNTHESIS
**Responsável**: Specialist primário determinado por domain  
**Propósito**: Integração e síntese de análises especializadas múltiplas

#### Workflow Steps:
1. **Cross-Specialist Integration**
   - Consolidar findings de todos specialists ativos
   - Identificar patterns e connections entre discoveries
   - Mapear convergências e divergências

2. **Insight Generation**
   - Synthesizar insights únicos emergindo da combinação
   - Identificar implications não óbvias
   - Gerar hypotheses integradas

3. **Gap Identification**
   - Identificar áreas requiring additional investigation
   - Spots de potential collaboration em Stage 5
   - Preparar agenda para Collaborative Review

#### Completion Criteria:
- [ ] Findings de todos specialists integrados
- [ ] Synthesis insights documentados
- [ ] Convergências/divergências identificadas
- [ ] Agenda de review preparada

#### Quality Gate: **PADRÃO** (80% confidence)

---

### STAGE 5: COLLABORATIVE REVIEW (Mandatory Collaboration)
**Responsável**: Todos specialists + `orquestrador_missao` (moderação)  
**Propósito**: Revisão colaborativa e debate estruturado entre especialistas

#### Workflow Steps:
1. **Structured Debate Setup**
   - `orquestrador_missao` facilita discussion
   - Cada specialist apresenta perspective e findings
   - Identificar pontos de disagreement para debate

2. **Conflict Resolution**
   - Debate moderado sobre divergências
   - Aplicar specialist confidence levels como weight
   - Buscar consensus através de evidence-based discussion

3. **Consensus Building**
   - Trabalhar toward agreement em major conclusions
   - Document remaining uncertainties transparentemente
   - Achieve minimum 90% consensus para progressão

#### Completion Criteria:
- [ ] Todos specialists participaram em review
- [ ] Major divergências debatidas e resolvidas
- [ ] Consensus ≥ 90% em pontos principais
- [ ] Remaining uncertainties documentadas

#### Quality Gate: **RIGOROSO** (95% confidence)
#### Consensus Threshold: 90%

---

### STAGE 6: CONCLUSION FORMULATION
**Responsável**: `estrategista_chefe` (L Lawliet) + validation specialists  
**Propósito**: Formulação de conclusões consolidadas e recomendações

#### Workflow Steps:
1. **Evidence Consolidation**
   - Organizar all validated evidence systematically
   - Apply weight baseado em confidence e consensus levels
   - Structure logical flow from evidence para conclusions

2. **Recommendation Development**
   - Formular actionable recommendations baseadas em findings
   - Considerar multiple perspectives e stakeholder needs
   - Incluir risk assessment e mitigation strategies

3. **Final Validation Check**
   - Re-executar critical validation checks
   - Ensure internal consistency de conclusions
   - Verify alignment com original investigation objectives

#### Completion Criteria:
- [ ] Evidence systematically consolidated
- [ ] Conclusions logically derived from evidence
- [ ] Recommendations são actionable e specific
- [ ] Final validation checks passed

#### Quality Gate: **RIGOROSO** (95% confidence)

---

### STAGE 7: PRESENTATION
**Responsável**: `orquestrador_missao` (Capitão Obi)  
**Propósito**: Estruturação e apresentação otimizada dos resultados

#### Workflow Steps:
1. **Audience Adaptation**
   - Adaptar linguagem e level of detail para audience
   - Structure presentation logically para maximum impact
   - Highlight key insights e actionable recommendations

2. **Narrative Construction**
   - Construir compelling narrative connecting findings
   - Maintain natural conversation flow
   - Abstract technical complexity appropriately

3. **Delivery Optimization**
   - Optimize para user comprehension e engagement
   - Prepare para potential follow-up questions
   - Ensure presentation feels natural e conversational

#### Completion Criteria:
- [ ] Content adaptado para audience appropriadamente
- [ ] Narrative flow é compelling e logical
- [ ] Technical complexity appropriadamente abstracted
- [ ] Presentation ready para delivery

#### Quality Gate: **PADRÃO** (80% confidence)

---

### STAGE 8: ARCHIVAL
**Responsável**: Automated + `orquestrador_missao` oversight  
**Propósito**: Documentação e preservação do conhecimento gerado

#### Workflow Steps:
1. **Knowledge Documentation**
   - Document complete investigation process
   - Preserve methodology e specialist contributions
   - Create searchable references para future use

2. **Learning Extraction**
   - Identify lessons learned e process improvements
   - Document successful collaboration patterns
   - Note effective specialist combinations

3. **System Updates**
   - Update Vault com all discoveries e insights
   - Refresh specialist knowledge bases se appropriate
   - Calibrate system parameters baseado em performance

#### Completion Criteria:
- [ ] Investigation comprehensively documented
- [ ] Knowledge preserved e searchable
- [ ] Lessons learned extracted
- [ ] System updates applied

#### Quality Gate: **BÁSICO** (60% confidence)

---

## META-WORKFLOWS (Processos de Apoio)

### Q&A REFINEMENT WORKFLOW
**Trigger**: Context completude < 80% detected in Stage 1  
**Responsável**: `orquestrador_missao` + domain-specific specialists

#### Process Flow:
1. **Gap Analysis**
   - Identify specific information gaps
   - Prioritize gaps by investigation impact
   - Select appropriate specialist para question formulation

2. **Question Generation**
   - Generate strategic questions usando specialist expertise
   - Adapt question style para domain e context
   - Limit para maximum 8 questions per session

3. **Iterative Refinement**
   - Present questions naturally via `orquestrador_missao`
   - Integrate user responses into context
   - Re-evaluate completude after each iteration

4. **Completion Assessment**
   - Continue until 80% completude achieved OR 8 questions reached
   - Document remaining gaps se ainda existirem
   - Return control para main pipeline

#### Exit Conditions:
- Context completude ≥ 80% achieved
- Maximum 8 questions reached
- User indicates satisfaction com current context

---

### RETRY PROTOCOLS WORKFLOW
**Trigger**: Validation Engine failure OR specialist contradiction  
**Responsável**: `orquestrador_missao` + appropriate specialists

#### Failure Type Handlers:

##### Contradictory Information
1. **Conflict Identification**
   - Isolate specific points of contradiction
   - Identify specialists em disagreement
   - Assess credibility de conflicting sources

2. **Mediated Resolution**
   - `orquestrador_missao` facilitates debate between specialists
   - Apply evidence-based evaluation criteria
   - Seek resolution através de additional evidence se needed

3. **Consensus Achievement**
   - Work toward agreement on factual basis
   - Document remaining uncertainties transparentemente
   - Update confidence scores baseado em resolution

##### Insufficient Data
1. **Data Gap Assessment**
   - Identify specific data types needed
   - Evaluate availability de additional sources
   - Determine feasibility de gap filling

2. **Additional Research**
   - Acionar appropriate specialists para additional investigation
   - May trigger Q&A Refinement para user input
   - Expand search parameters se necessary

3. **Revalidation**
   - Re-execute validation com enhanced data
   - Update confidence levels appropriately
   - Return para pipeline progression

##### Quality Below Threshold
1. **Quality Assessment**
   - Identify specific quality deficiencies
   - Determine root cause de quality issues
   - Assess need para additional expertise

2. **Enhancement Strategy**
   - Engage additional specialists se needed
   - Apply more rigorous analysis methods
   - Increase validation thoroughness

3. **Re-execution**
   - Re-perform analysis com enhanced approach
   - Validate improvements achieved
   - Update system learning from experience

#### Retry Limits:
- Maximum 3 attempts per failure type
- Maximum 5 total retry attempts per investigation
- Escalation para manual review se limits exceeded

---

### ESCALATION WORKFLOW
**Trigger**: Retry Protocols reach maximum attempts without resolution  
**Responsável**: `orquestrador_missao`

#### Escalation Process:
1. **Situation Assessment**
   - Document all retry attempts made
   - Identify persistent nature de problem
   - Assess impact on investigation objectives

2. **Transparent Communication**
   - Inform user de situation naturally
   - Explain limitations encountered
   - Offer alternative approaches se available

3. **Alternative Solutions**
   - Provide partial analysis se meaningful
   - Suggest additional information that might help
   - Offer para revisit com enhanced context

4. **Graceful Degradation**
   - Ensure user receives maximum value possible
   - Maintain narrative consistency even em escalation
   - Document learning para system improvement

---

## WORKFLOW INTEGRATION POINTS

### Cross-Workflow Communication
- All workflows maintain shared context state
- Specialist assignments persist across workflow transitions
- Confidence scores accumulate and adjust throughout process
- Narrative continuity maintained by `orquestrador_missao`

### Quality Assurance Integration
- Validation Engine monitors all workflows
- Retry Protocols available para any workflow stage
- Escalation available as final fallback para all processes
- Learning captured from all workflow executions

### Performance Optimization
- Workflows adaptively adjust timing baseado em complexity
- Specialist utilization optimized across parallel tasks
- Resource allocation dynamically managed
- Process efficiency continuously monitored e improved

---

## STANDARD OPERATING PROCEDURES

### Workflow Initiation
1. Receive user input
2. Execute Stage 1: Intake & Analysis
3. Proceed through pipeline stages sequentially
4. Apply meta-workflows quando triggered
5. Maintain quality gates throughout

### Specialist Coordination
1. Clear role definition para each stage
2. Handoff protocols entre stages
3. Cross-validation quando appropriate
4. Collaborative decision-making em Stage 5

### Quality Control
1. Mandatory validation at Stage 3
2. Continuous confidence monitoring
3. Automatic retry quando thresholds não met
4. Escalation quando retry limits exceeded

### Communication Standards
1. All technical processes abstracted by `orquestrador_missao`
2. Natural conversation maintained throughout
3. Progress updates provided appropriately
4. Specialist expertise showcased naturally

**SYNDICATE v2.0 Task Workflows - Complete Implementation Guide** ✅