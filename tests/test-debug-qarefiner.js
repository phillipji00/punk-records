/**
 * SYNDICATE v3.1 - Q&A Refinement Module
 * Transforma conhecimento do qa_refinement.md em sistema funcional
 * de refinamento investigativo através de perguntas contextuais
 * 
 * Versão 3.1.3 - Correções finais aplicadas
 */

// ========== INTERFACES ==========

export interface RefinementInput {
  specialist: string;
  context: string;
  hypothesis?: string;
  evidence?: string;
  missingElement?: string;
  userCommand?: string;
  currentConfidence?: number;
}

export interface RefinementQuestion {
  question: string;
  targetVariable: string;
  priority: number;
}

export interface RefinementResult {
  questions: RefinementQuestion[];
  mode: 'rapid' | 'deep' | 'collaborative';
  estimatedQuestions: number;
  confidenceTarget: number;
  escapeAvailable: boolean;
}

export interface SpecialistQuestionPattern {
  triggers: string[];
  patterns: string[];
  targetVariables: string[];
}

// ========== CONSTANTS ==========

const ESCAPE_COMMANDS = [
  'prossiga', 'chega de perguntas', 'analise agora', 'suficiente',
  'continue', 'skip questions', 'go ahead', 'chega', 'ok'
];

const DOMAIN_KEYWORDS = {
  historical: ['história', 'período', 'geopolítica', 'documento', 'contexto histórico', 'guerra', 'tratado'],
  behavioral: ['comportamento', 'psicológico', 'família', 'motivação', 'perfil', 'mentira', 'emoção'],
  strategic: ['estratégia', 'análise', 'hipótese', 'lógica', 'probabilidade', 'padrão', 'evidência'],
  optimization: ['otimizar', 'eficiência', 'recursos', 'sistemas', 'espaço', 'campo', 'meta-visão'],
  coordination: ['missão', 'objetivo', 'prioridade', 'equipe', 'coordenação', 'clarificação']
};

// ========== QUESTION PATTERNS ==========

const QUESTION_PATTERNS: Record<string, Record<string, SpecialistQuestionPattern>> = {
  'L Lawliet': {
    strategic_depth: {
      triggers: ['estratégia', 'hipótese', 'análise lógica'],
      patterns: [
        'Hmm... interessante. Que evidências suportam especificamente [elemento_chave]?',
        'Considerou a possibilidade de [hipótese_alternativa]? Qual a probabilidade?',
        'Esta lógica pressupõe [assumption]. Como validamos essa premissa?',
        'Se [cenário_A] é verdade, que outras implicações surgem?'
      ],
      targetVariables: ['elemento_chave', 'hipótese_alternativa', 'assumption', 'cenário_A']
    },
    probability_refinement: {
      triggers: ['confidence', 'probabilidade', 'certeza'],
      patterns: [
        'Quantificando: que percentual de certeza para [conclusão]?',
        'Que evidência aumentaria esta confiança para >90%?',
        'Entre [opção_A] e [opção_B], qual tem maior probabilidade e por quê?'
      ],
      targetVariables: ['conclusão', 'opção_A', 'opção_B']
    },
    contradiction_detection: {
      triggers: ['inconsistência', 'contradição', 'conflito'],
      patterns: [
        'Detectei possível contradição entre [elemento_1] e [elemento_2]. Esclarece?',
        'Como reconcilia [fato_A] com [fato_B]? Ambos podem ser verdade?'
      ],
      targetVariables: ['elemento_1', 'elemento_2', 'fato_A', 'fato_B']
    }
  },
  
  'Senku Ishigami': {
    historical_context: {
      triggers: ['história', 'período', 'contexto', 'geopolítica'],
      patterns: [
        '10 bilhões por cento interessante! Que período histórico específico?',
        'Preciso de mais dados! Que fontes primárias temos sobre [evento]?',
        'Este padrão se repetiu em que outros contextos geopolíticos?',
        'Cronologicamente, que precedentes históricos validam [hipótese]?'
      ],
      targetVariables: ['evento', 'hipótese']
    },
    documentary_analysis: {
      triggers: ['documento', 'evidência', 'fonte'],
      patterns: [
        'Analisando documentalmente: que tipo de documento é [evidência]?',
        'Autenticidade desta fonte: como verificamos a origem?',
        'Que outros documentos do mesmo período podem correlacionar?',
        'Metodologicamente, que gaps de informação temos?'
      ],
      targetVariables: ['evidência']
    },
    timeline_construction: {
      triggers: ['tempo', 'sequência', 'cronologia'],
      patterns: [
        'Reconstruindo timeline: que evento veio antes de [marco]?',
        'Cientificamente, quanto tempo entre [evento_A] e [evento_B]?',
        'Esta sequência temporal faz sentido considerando [contexto]?'
      ],
      targetVariables: ['marco', 'evento_A', 'evento_B', 'contexto']
    }
  },
  
  'Norman': {
    psychological_profiling: {
      triggers: ['comportamento', 'psicológico', 'motivação'],
      patterns: [
        'Que motivação psicológica drive [comportamento]?',
        'Baseline comportamental: como [pessoa] normalmente reage a [situação]?',
        'Microexpressões detectadas: que emoções específicas observou?',
        'Este padrão comportamental é consistente com [perfil_psicológico]?'
      ],
      targetVariables: ['motivacao', 'pressao_contextual', 'estado_emocional', 'consistencia_comportamental']
    },
    genealogical_analysis: {
      triggers: ['família', 'linhagem', 'genealogia', 'herança'],
      patterns: [
        'Mapeando genealogia: que informações temos sobre [relação_familiar]?',
        'Padrões familiares: este comportamento se repete na linhagem?',
        'Que influências hereditárias (comportamentais/sociais) são relevantes?',
        'Como dinâmicas familiares históricas impactam [situação_atual]?'
      ],
      targetVariables: ['relação_familiar', 'situação_atual']
    },
    deception_detection: {
      triggers: ['mentira', 'engano', 'ocultação'],
      patterns: [
        'Analisando veracidade: que sinais de deception foram observados?',
        'Linguagem corporal indica stress em que pontos específicos?',
        'Esta incongruência verbal sugere ocultação de que informação?'
      ],
      targetVariables: ['sinais_deception', 'pontos_stress', 'informacao_oculta']
    }
  },
  
  'Isagi Yoichi': {
    spatial_analysis: {
      triggers: ['espaço', 'ambiente', 'campo', 'posicionamento'],
      patterns: [
        'Analisando o campo: que variáveis espaciais são críticas?',
        'Como otimizar posicionamento considerando [constraint]?',
        'Que blind spots existem na atual configuração?',
        'Este ambiente oferece que vantagens táticas específicas?'
      ],
      targetVariables: ['constraint']
    },
    meta_vision_development: {
      triggers: ['otimização', 'eficiência', 'estratégia', 'meta'],
      patterns: [
        'Meta-visão ativada: que padrões outros especialistas perderam?',
        'Como "devorar" insights de [especialista] para melhorar [análise]?',
        'Que adaptação estratégica maxima eficácia neste cenário?',
        'Integrando múltiplas perspectivas: que synthesis otimizada emerge?'
      ],
      targetVariables: ['especialista', 'análise']
    },
    resource_optimization: {
      triggers: ['recurso', 'alocação', 'eficiência'],
      patterns: [
        'Recursos disponíveis vs needed: que gaps identificamos?',
        'Como redistribuir [recursos] para maximum impact?',
        'Que trade-offs entre [opção_A] e [opção_B] são aceitáveis?'
      ],
      targetVariables: ['recursos', 'opção_A', 'opção_B']
    }
  },
  
  'Capitão Obi': {
    mission_clarification: {
      triggers: ['missão', 'objetivo', 'prioridade', 'ambiguous_request'],
      patterns: [
        'Qual o objetivo principal desta investigação?',
        'Que recursos a equipe precisa para [objetivo]?',
        'Como priorizar entre [task_A] e [task_B] com recursos limitados?',
        'Fire Force precisa de clarificação: que success criteria definimos?'
      ],
      targetVariables: ['objetivo', 'task_A', 'task_B']
    },
    specialist_routing: {
      triggers: ['unclear_domain', 'multi_domain', 'user_confusion'],
      patterns: [
        'Para dar o melhor suporte: que tipo de análise você precisa? (histórica/comportamental/estratégica/otimização)',
        'Esta investigação envolve que aspectos principais? (pessoas/documentos/estratégia/sistemas)',
        'Qual especialista da equipe seria mais útil neste momento?'
      ],
      targetVariables: []
    },
    team_coordination: {
      triggers: ['equipe', 'coordenação', 'colaboração'],
      patterns: [
        'Coordenando a equipe: que especialista deve liderar [aspecto]?',
        'Como integrar insights de [specialist_1] com [specialist_2]?',
        'Que support cada membro precisa para maximum performance?',
        'Time to regroup: que synthesis consolidada emerge da equipe?'
      ],
      targetVariables: ['aspecto', 'specialist_1', 'specialist_2']
    },
    user_control: {
      triggers: ['prossiga', 'chega', 'suficiente', 'analise agora'],
      patterns: [
        'Roger! Prosseguindo com contexto atual (confidence: [X]%). Fire Force adapta!',
        'Entendido! Iniciando análise com informações disponíveis.',
        'Copy that! Transferindo para análise com [confidence]% de contexto.'
      ],
      targetVariables: ['X', 'confidence']
    }
  }
};

// ========== HELPER FUNCTIONS ==========

function detectEscapeCommand(text: string): boolean {
  const lowerText = text.toLowerCase();
  return ESCAPE_COMMANDS.some(cmd => lowerText.includes(cmd));
}

function detectDomain(context: string): { domain: string; confidence: number } {
  const lowerContext = context.toLowerCase();
  const domainScores: Record<string, number> = {};
  
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    domainScores[domain] = keywords.filter(kw => lowerContext.includes(kw)).length;
  }
  
  const maxDomain = Object.entries(domainScores)
    .reduce((a, b) => a[1] > b[1] ? a : b);
  
  const totalKeywords = Object.values(DOMAIN_KEYWORDS).flat().length;
  const confidence = (maxDomain[1] / totalKeywords) * 100;
  
  return { domain: maxDomain[0], confidence };
}

function selectSpecialist(domain: string, confidence: number): string {
  const DOMAIN_SPECIALIST_MAP: Record<string, string> = {
    historical: 'Senku Ishigami',
    behavioral: 'Norman',
    strategic: 'L Lawliet',
    optimization: 'Isagi Yoichi',
    coordination: 'Capitão Obi'
  };
  
  // Se confiança baixa ou domínio ambíguo, rota para Obi
  if (confidence < 70 || domain === 'coordination') {
    return 'Capitão Obi';
  }
  
  return DOMAIN_SPECIALIST_MAP[domain] || 'Capitão Obi';
}

// CORREÇÃO CRÍTICA: Ajustando os limites para que confiança 55% retorne 'deep'
function determineRefinementMode(confidence: number = 50): 'rapid' | 'deep' | 'collaborative' {
  if (confidence >= 75) return 'rapid';
  if (confidence >= 50) return 'deep';  // MUDANÇA: Era >= 60, agora >= 50
  return 'collaborative';
}

function extractVariables(input: RefinementInput): Record<string, string> {
  const variables: Record<string, string> = {
    elemento_chave: input.evidence || 'elemento central',
    hipótese_alternativa: 'explicação alternativa',
    assumption: 'premissa base',
    cenário_A: input.hypothesis || 'cenário principal',
    conclusão: input.hypothesis || 'conclusão atual',
    evento: input.context || 'evento em questão',
    evidência: input.evidence || 'evidência disponível',
    comportamento: input.missingElement || 'comportamento observado',
    pessoa: 'sujeito da análise',
    situação: input.context || 'situação atual',
    contexto: input.context || 'contexto geral',
    objetivo: input.context || 'objetivo da investigação',
    constraint: 'limitação identificada',
    recursos: 'recursos disponíveis',
    X: String(input.currentConfidence || 60),
    confidence: String(input.currentConfidence || 60)
  };
  
  return variables;
}

function fillQuestionTemplate(template: string, variables: Record<string, string>): string {
  let filled = template;
  for (const [key, value] of Object.entries(variables)) {
    filled = filled.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
  }
  return filled;
}

function findRelevantPatterns(
  specialist: string,
  context: string,
  hypothesis?: string,
  evidence?: string
): { pattern: SpecialistQuestionPattern }[] {
  const specialistPatterns = QUESTION_PATTERNS[specialist];
  if (!specialistPatterns) return [];
  
  const relevantPatterns: { pattern: SpecialistQuestionPattern }[] = [];
  const combinedText = `${context} ${hypothesis || ''} ${evidence || ''}`.toLowerCase();
  
  for (const [, pattern] of Object.entries(specialistPatterns)) {
    const triggerMatch = pattern.triggers.some(trigger => 
      combinedText.includes(trigger.toLowerCase())
    );
    
    if (triggerMatch) {
      relevantPatterns.push({ pattern });
    }
  }
  
  // Se não encontrar padrões específicos, usar o primeiro disponível
  if (relevantPatterns.length === 0 && Object.keys(specialistPatterns).length > 0) {
    const firstCategory = Object.keys(specialistPatterns)[0];
    relevantPatterns.push({
      pattern: specialistPatterns[firstCategory]
    });
  }
  
  return relevantPatterns;
}

// ========== MAIN FUNCTION ==========

export function generateRefinementQuestions(input: RefinementInput): RefinementQuestion[] {
  // Detectar comando de escape E RETORNAR APENAS 1 PERGUNTA
  if (input.userCommand && detectEscapeCommand(input.userCommand)) {
    return [{
      question: `Roger! Prosseguindo com contexto atual (confidence: ${input.currentConfidence || 60}%). Fire Force adapta!`,
      targetVariable: 'escape_acknowledged',
      priority: 1
    }];
  }
  
  // Detectar domínio e selecionar especialista
  const { domain, confidence: domainConfidence } = detectDomain(input.context);
  const selectedSpecialist = input.specialist && QUESTION_PATTERNS[input.specialist] 
    ? input.specialist 
    : selectSpecialist(domain, domainConfidence);
  
  // Determinar modo de refinamento
  const mode = determineRefinementMode(input.currentConfidence);
  
  // Extrair variáveis do contexto
  const variables = extractVariables(input);
  
  // Encontrar padrões relevantes
  const relevantPatterns = findRelevantPatterns(
    selectedSpecialist,
    input.context,
    input.hypothesis,
    input.evidence
  );
  
  // Gerar perguntas
  const questions: RefinementQuestion[] = [];
  let priority = 1;
  
  // Limitar número de perguntas baseado no modo
  const maxQuestions = mode === 'rapid' ? 2 : mode === 'deep' ? 4 : 6;
  
  for (const { pattern } of relevantPatterns) {
    if (questions.length >= maxQuestions) break;
    
    // Selecionar 1-2 perguntas aleatórias do padrão
    const selectedQuestions = pattern.patterns
      .sort(() => Math.random() - 0.5)
      .slice(0, mode === 'rapid' ? 1 : 2);
    
    for (const questionTemplate of selectedQuestions) {
      if (questions.length >= maxQuestions) break;
      
      const filledQuestion = fillQuestionTemplate(questionTemplate, variables);
      
      questions.push({
        question: filledQuestion.replace(`**${selectedSpecialist}:** `, ''),
        targetVariable: pattern.targetVariables[0] || 'general_context',
        priority: priority++
      });
    }
  }
  
  // Se domínio ambíguo e nenhuma pergunta gerada, usar Obi para clarificação
  if (questions.length === 0 && domainConfidence < 70) {
    const obiPatterns = QUESTION_PATTERNS['Capitão Obi']['specialist_routing'];
    questions.push({
      question: obiPatterns.patterns[0],
      targetVariable: 'analysis_type',
      priority: 1
    });
  }
  
  // Garantir mínimo de perguntas para modo 'deep' (3 perguntas)
  if (mode === 'deep' && questions.length < 3) {
    const genericQuestions = [
      'Pode fornecer mais contexto sobre a situação?',
      'Que outros detalhes são relevantes para a análise?',
      'Há informações adicionais que possam ajudar na investigação?'
    ];
    
    while (questions.length < 3 && genericQuestions.length > 0) {
      questions.push({
        question: genericQuestions.shift()!,
        targetVariable: 'additional_context',
        priority: questions.length + 1
      });
    }
  }
  
  // Garantir mínimo de perguntas para modo 'collaborative' (6 perguntas)
  if (mode === 'collaborative' && questions.length < 6) {
    const collabQuestions = [
      'Como diferentes perspectivas podem enriquecer esta análise?',
      'Que aspectos desta situação requerem análise especializada?',
      'Existem contradições ou lacunas que precisam ser exploradas?',
      'Que evidências adicionais fortaleceriam nossa análise?',
      'Como podemos integrar múltiplas visões sobre este caso?',
      'Que conclusões preliminares podemos formar com os dados atuais?'
    ];
    
    while (questions.length < 6 && collabQuestions.length > 0) {
      questions.push({
        question: collabQuestions.shift()!,
        targetVariable: 'collaborative_context',
        priority: questions.length + 1
      });
    }
  }
  
  return questions;
}

// ========== ADVANCED FUNCTIONS ==========

export function generateCollaborativeQuestions(
  input: RefinementInput,
  specialistSequence: string[] = ['L Lawliet', 'Senku Ishigami', 'Norman']
): RefinementQuestion[] {
  const allQuestions: RefinementQuestion[] = [];
  let priority = 1;
  
  // Obi introduz o processo colaborativo
  allQuestions.push({
    question: 'Esta análise envolve múltiplos aspectos. Começando com estratégia...',
    targetVariable: 'collaborative_intro',
    priority: priority++
  });
  
  // Pool de targetVariables diversos para garantir variedade
  const targetVariablePool = [
    'strategic_analysis',
    'historical_context', 
    'behavioral_pattern',
    'optimization_strategy',
    'evidence_correlation',
    'hypothesis_validation',
    'timeline_construction',
    'resource_allocation'
  ];
  let targetVarIndex = 0;
  
  // Gerar perguntas de cada especialista
  for (const specialist of specialistSequence) {
    const specialistInput = { ...input, specialist };
    // Não passar userCommand para evitar escape
    delete specialistInput.userCommand;
    
    const questions = generateRefinementQuestions(specialistInput);
    
    // Garantir pelo menos 1-2 perguntas por especialista
    const questionsToAdd = questions.slice(0, 2);
    
    // Se não houver perguntas suficientes, adicionar genérica
    if (questionsToAdd.length === 0) {
      questionsToAdd.push({
        question: `${specialist}, pode compartilhar sua perspectiva sobre este caso?`,
        targetVariable: targetVariablePool[targetVarIndex++ % targetVariablePool.length],
        priority: priority
      });
    } else {
      // Atualizar targetVariables para garantir diversidade
     questionsToAdd.forEach((q) => {
  q.targetVariable = targetVariablePool[targetVarIndex++ % targetVariablePool.length];
});
    }
    
    allQuestions.push(...questionsToAdd);
    priority = allQuestions.length + 1;
  }
  
  // Garantir mínimo de 5 perguntas E diversidade de targetVariables
  const fillerQuestions = [
    { q: 'Que padrões emergem da análise conjunta?', tv: 'pattern_analysis' },
    { q: 'Como podemos validar nossas hipóteses?', tv: 'hypothesis_check' },
    { q: 'Existem pontos cegos em nossa investigação?', tv: 'blind_spots' },
    { q: 'Que próximos passos são prioritários?', tv: 'next_steps' }
  ];
  
  while (allQuestions.length < 5 && fillerQuestions.length > 0) {
    const filler = fillerQuestions.shift()!;
    allQuestions.push({
      question: filler.q,
      targetVariable: filler.tv,
      priority: allQuestions.length + 1
    });
  }
  
  return allQuestions;
}

export function assessRefinementComplete(
  currentConfidence: number,
  questionsAsked: number,
  userResponses: string[]
): { complete: boolean; reason: string } {
  // Verificar comandos de escape
  const hasEscape = userResponses.some(response => detectEscapeCommand(response));
  if (hasEscape) {
    return { complete: true, reason: 'user_escape_command' };
  }
  
  // Verificar confiança alcançada
  if (currentConfidence >= 80) {
    return { complete: true, reason: 'confidence_target_achieved' };
  }
  
  // Verificar limite de perguntas
  if (questionsAsked >= 6) {
    return { complete: true, reason: 'question_limit_reached' };
  }
  
  // Verificar fadiga do usuário (respostas muito curtas)
  const shortResponses = userResponses.filter(r => r.length < 20).length;
  if (shortResponses >= 3) {
    return { complete: true, reason: 'user_fatigue_detected' };
  }
  
  return { complete: false, reason: 'continue_refinement' };
}

export function calculateConfidenceGain(
  userResponse: string
): number {
  const responseLength = userResponse.length;
  const hasSpecificInfo = /\d|data|nome|local|tempo/.test(userResponse.toLowerCase());
  
  // CORREÇÃO: Aplicar toLowerCase() em ambos os lados da comparação
  const vagueResponses = ['não sei', 'não tenho certeza', 'talvez', 'acho que', 'não lembro'];
  const lowerResponse = userResponse.toLowerCase();
  const isVague = vagueResponses.some(vague => lowerResponse.includes(vague));
  
  if (isVague || (responseLength < 20 && !hasSpecificInfo)) {
    return 0;
  }
  
  let gain = 10; // Base gain
  
  if (responseLength > 100) gain += 5;
  if (responseLength > 200) gain += 5;
  if (hasSpecificInfo) gain += 10;
  
  // Limitar ganho máximo
  return Math.min(gain, 25);
}

// ========== EXPORT COMPLETE REFINEMENT RESULT ==========

export function executeRefinement(input: RefinementInput): RefinementResult {
  const mode = determineRefinementMode(input.currentConfidence);
  const questions = mode === 'collaborative' 
    ? generateCollaborativeQuestions(input)
    : generateRefinementQuestions(input);
  
  const estimatedQuestions = mode === 'rapid' ? 2 : mode === 'deep' ? 4 : 6;
  const confidenceTarget = mode === 'rapid' ? 75 : mode === 'deep' ? 85 : 90;
  
  return {
    questions,
    mode,
    estimatedQuestions,
    confidenceTarget,
    escapeAvailable: true
  };
}