import { 
  ExecutionContext, 
  SpecialistResponse,
  SPECIALIST_TO_PERSONA
} from '../lib/types/common';

/**
 * Interface de entrada para revisão cruzada
 */
export interface ReviewInput {
  /** Especialista que está revisando */
  reviewer: string;
  /** Análise original a ser revisada */
  originalAnalysis: SpecialistResponse;
  /** Contexto completo da execução */
  context: ExecutionContext;
}

/**
 * Resultado da revisão cruzada
 */
export interface ReviewResult {
  /** Status da revisão */
  status: 'approved' | 'rejected' | 'refine';
  /** Justificativa detalhada da decisão */
  justification: string;
  /** Sugestões de melhoria (se aplicável) */
  suggestions?: string[];
  /** Score de qualidade (0-1) */
  qualityScore: number;
}

/**
 * Tipos de validação específicos por especialista
 */
interface ValidationRules {
  [key: string]: {
    requiredElements: string[];
    qualityWeights: Record<string, number>;
    specialtyChecks: (analysis: SpecialistResponse) => ValidationCheck[];
  };
}

/**
 * Resultado de uma verificação individual
 */
interface ValidationCheck {
  passed: boolean;
  aspect: string;
  score: number;
  issue?: string;
}

/**
 * Matriz de complementaridade entre especialistas
 * Define quão bem cada par trabalha junto
 */
const COMPLEMENTARITY_MATRIX: Record<string, Record<string, number>> = {
  'L': { 'Norman': 0.9, 'Senku': 0.85, 'Isagi': 0.8, 'Obi': 0.75 },
  'Norman': { 'L': 0.9, 'Senku': 0.8, 'Isagi': 0.85, 'Obi': 0.7 },
  'Senku': { 'L': 0.85, 'Norman': 0.8, 'Isagi': 0.75, 'Obi': 0.7 },
  'Isagi': { 'L': 0.8, 'Norman': 0.85, 'Senku': 0.75, 'Obi': 0.9 },
  'Obi': { 'L': 0.75, 'Norman': 0.7, 'Senku': 0.7, 'Isagi': 0.9 }
};

/**
 * Regras de validação específicas por especialista
 */
const VALIDATION_RULES: ValidationRules = {
  'L': {
    requiredElements: ['logical_consistency', 'hypothesis_formation', 'evidence_support'],
    qualityWeights: {
      logical_consistency: 0.4,
      hypothesis_specificity: 0.3,
      evidence_quality: 0.3
    },
    specialtyChecks: (analysis) => {
      const checks: ValidationCheck[] = [];
      
      // Verifica consistência lógica
      const hasLogicalFlow = analysis.analysis.insights.every((insight: any) => 
        insight.evidence && insight.evidence.length > 0
      );
      checks.push({
        passed: hasLogicalFlow,
        aspect: 'logical_consistency',
        score: hasLogicalFlow ? 1.0 : 0.4,
        issue: !hasLogicalFlow ? 'Alguns insights carecem de evidências' : undefined
      });
      
      // Verifica formação de hipóteses
      const hasHypothesis = analysis.analysis.summary.length > 50 && 
        analysis.analysis.keyPoints.length >= 2;
      checks.push({
        passed: hasHypothesis,
        aspect: 'hypothesis_formation',
        score: hasHypothesis ? 1.0 : 0.5,
        issue: !hasHypothesis ? 'Hipótese não suficientemente desenvolvida' : undefined
      });
      
      return checks;
    }
  },
  
  'Norman': {
    requiredElements: ['behavioral_baseline', 'psychological_patterns', 'ethical_consideration'],
    qualityWeights: {
      behavioral_accuracy: 0.35,
      pattern_recognition: 0.35,
      ethical_compliance: 0.3
    },
    specialtyChecks: (analysis) => {
      const checks: ValidationCheck[] = [];
      
      // Verifica análise comportamental
      const hasBehavioralPatterns = analysis.analysis.patterns && 
        analysis.analysis.patterns.length > 0;
      checks.push({
        passed: hasBehavioralPatterns || false,
        aspect: 'behavioral_patterns',
        score: hasBehavioralPatterns ? 1.0 : 0.3,
        issue: !hasBehavioralPatterns ? 'Análise comportamental ausente' : undefined
      });
      
      // Verifica considerações éticas
      const hasEthicalConsideration = analysis.analysis.insights.some((i: any) => 
        i.category.toLowerCase().includes('ético') || 
        i.description.toLowerCase().includes('dignidade')
      );
      checks.push({
        passed: hasEthicalConsideration,
        aspect: 'ethical_consideration',
        score: hasEthicalConsideration ? 1.0 : 0.7,
        issue: !hasEthicalConsideration ? 'Considerações éticas não evidentes' : undefined
      });
      
      return checks;
    }
  },
  
  'Senku': {
    requiredElements: ['scientific_methodology', 'evidence_correlation', 'confidence_calibration'],
    qualityWeights: {
      methodology_rigor: 0.4,
      evidence_quality: 0.35,
      temporal_accuracy: 0.25
    },
    specialtyChecks: (analysis) => {
      const checks: ValidationCheck[] = [];
      
      // Verifica rigor metodológico
      const hasMethodology = analysis.analysis && analysis.analysis.insights && 
        analysis.analysis.insights.some((i: any) => 
          i.confidence >= 0.7 && i.evidence && i.evidence.length >= 2
        );
      checks.push({
        passed: hasMethodology || false,
        aspect: 'scientific_methodology',
        score: hasMethodology ? 1.0 : 0.5,
        issue: !hasMethodology ? 'Metodologia científica insuficiente' : undefined
      });
      
      // Verifica correlações temporais/históricas
      const hasTemporalContext = analysis.analysis.patterns?.some((p: any) => 
        p.type.includes('temporal') || p.type.includes('históric')
      ) || false;
      checks.push({
        passed: hasTemporalContext,
        aspect: 'temporal_correlation',
        score: hasTemporalContext ? 1.0 : 0.6,
        issue: !hasTemporalContext ? 'Faltam correlações temporais/históricas' : undefined
      });
      
      return checks;
    }
  },
  
  'Isagi': {
    requiredElements: ['spatial_analysis', 'optimization_paths', 'resource_mapping'],
    qualityWeights: {
      spatial_accuracy: 0.35,
      optimization_quality: 0.35,
      tactical_viability: 0.3
    },
    specialtyChecks: (analysis) => {
      const checks: ValidationCheck[] = [];
      
      // Verifica análise espacial/tática
      const hasSpatialAnalysis = analysis.recommendations && 
        analysis.recommendations.length > 0 &&
        analysis.recommendations.some((r: any) => r.action.includes('otimiz'));
      checks.push({
        passed: hasSpatialAnalysis || false,
        aspect: 'spatial_optimization',
        score: hasSpatialAnalysis ? 1.0 : 0.4,
        issue: !hasSpatialAnalysis ? 'Análise espacial/tática ausente' : undefined
      });
      
      // Verifica viabilidade das recomendações
      const hasViableRecommendations = analysis.recommendations?.every((r: any) => 
        r.rationale && r.rationale.length > 20
      ) || false;
      checks.push({
        passed: hasViableRecommendations,
        aspect: 'tactical_viability',
        score: hasViableRecommendations ? 1.0 : 0.6,
        issue: !hasViableRecommendations ? 'Recomendações carecem de justificativa' : undefined
      });
      
      return checks;
    }
  },
  
  'Obi': {
    requiredElements: ['team_coordination', 'synthesis_quality', 'mission_alignment'],
    qualityWeights: {
      coordination_effectiveness: 0.4,
      synthesis_completeness: 0.35,
      mission_focus: 0.25
    },
    specialtyChecks: (analysis) => {
      const checks: ValidationCheck[] = [];
      
      // Verifica síntese e coordenação
      const hasSynthesis = analysis.analysis.summary.length > 100 &&
        analysis.analysis.keyPoints.length >= 3;
      checks.push({
        passed: hasSynthesis,
        aspect: 'synthesis_quality',
        score: hasSynthesis ? 1.0 : 0.5,
        issue: !hasSynthesis ? 'Síntese incompleta ou superficial' : undefined
      });
      
      // Verifica alinhamento com missão
      const hasMissionAlignment = analysis.metadata.overallConfidence >= 0.7;
      checks.push({
        passed: hasMissionAlignment,
        aspect: 'mission_alignment',
        score: hasMissionAlignment ? 1.0 : 0.6,
        issue: !hasMissionAlignment ? 'Baixa confiança no alinhamento com objetivos' : undefined
      });
      
      return checks;
    }
  }
};

/**
 * Função principal de revisão cruzada
 * Implementa a lógica de validação entre especialistas
 */
export function reviewAnalysis(input: ReviewInput): ReviewResult {
  const { reviewer, originalAnalysis, context } = input;
  
  // Verificação de análise nula/inválida
  if (!originalAnalysis || !originalAnalysis.analysis) {
    return {
      status: 'rejected',
      justification: 'Análise inválida ou nula fornecida para revisão',
      qualityScore: 0,
      suggestions: ['Fornecer análise válida para revisão']
    };
  }
  
  // Obtém as regras de validação do revisor
  const reviewerRules = VALIDATION_RULES[reviewer];
  if (!reviewerRules) {
    return {
      status: 'approved',
      justification: 'Revisor não reconhecido, análise aprovada por padrão',
      qualityScore: 0.5
    };
  }
  
  // Calcula fator de complementaridade
  const originalSpecialist = originalAnalysis.specialist as string;
  const complementarityFactor = COMPLEMENTARITY_MATRIX[reviewer]?.[originalSpecialist] || 0.7;
  
  // Executa verificações específicas do revisor
  const validationChecks = reviewerRules.specialtyChecks(originalAnalysis);
  
  // Verifica cobertura de elementos requeridos
  const coverageChecks = checkRequiredCoverage(originalAnalysis);
  
  // Detecta redundâncias e inconsistências
  const redundancyCheck = checkRedundancy(originalAnalysis, context);
  const consistencyCheck = checkConsistency(originalAnalysis, context);
  
  // Calcula score de qualidade ponderado
  const qualityScore = calculateQualityScore(
    validationChecks,
    coverageChecks,
    redundancyCheck,
    consistencyCheck,
    complementarityFactor,
    reviewerRules.qualityWeights
  );
  
  // Determina status e gera feedback
  const { status, justification, suggestions } = generateReviewDecision(
    qualityScore,
    validationChecks,
    coverageChecks,
    redundancyCheck,
    consistencyCheck,
    reviewer
  );
  
  return {
    status,
    justification,
    suggestions,
    qualityScore
  };
}

/**
 * Verifica cobertura de elementos essenciais
 */
function checkRequiredCoverage(
  analysis: SpecialistResponse
): ValidationCheck {
  const requiredAspects = ['summary', 'keyPoints', 'insights'];
  
  // Verificar se analysis e analysis.analysis existem
  if (!analysis || !analysis.analysis) {
    return {
      passed: false,
      aspect: 'coverage',
      score: 0,
      issue: 'Análise vazia ou incompleta'
    };
  }
  
  const coverage = requiredAspects.filter(aspect => {
    const value = analysis.analysis[aspect as keyof typeof analysis.analysis];
    return value && (Array.isArray(value) ? value.length > 0 : value.length > 0);
  }).length / requiredAspects.length;
  
  return {
    passed: coverage >= 0.8,
    aspect: 'coverage',
    score: coverage,
    issue: coverage < 0.8 ? 'Análise incompleta - faltam elementos essenciais' : undefined
  };
}

/**
 * Detecta redundâncias na análise
 */
function checkRedundancy(
  analysis: SpecialistResponse,
  _context: ExecutionContext
): ValidationCheck {
  // Verifica se há insights muito similares
  const insights = analysis.analysis.insights;
  let redundancyCount = 0;
  
  for (let i = 0; i < insights.length; i++) {
    for (let j = i + 1; j < insights.length; j++) {
      const similarity = calculateTextSimilarity(
        insights[i].description,
        insights[j].description
      );
      if (similarity > 0.8) redundancyCount++;
    }
  }
  
  const redundancyRatio = insights.length > 0 ? redundancyCount / insights.length : 0;
  
  return {
    passed: redundancyRatio < 0.2,
    aspect: 'redundancy',
    score: 1 - redundancyRatio,
    issue: redundancyRatio >= 0.2 ? 'Análise contém insights redundantes' : undefined
  };
}

/**
 * Verifica consistência com o contexto
 */
function checkConsistency(
  analysis: SpecialistResponse,
  context: ExecutionContext
): ValidationCheck {
  // Verifica se a análise está alinhada com o contexto da investigação
  const contextKeywords = extractKeywords(context.input.content);
  const analysisKeywords = extractKeywords(analysis.analysis.summary);
  
  const overlap = calculateKeywordOverlap(contextKeywords, analysisKeywords);
  
  return {
    passed: overlap >= 0.3,
    aspect: 'consistency',
    score: Math.min(overlap * 2, 1), // Normaliza para 0-1
    issue: overlap < 0.3 ? 'Análise diverge significativamente do contexto' : undefined
  };
}

/**
 * Calcula o score de qualidade final
 */
function calculateQualityScore(
  validationChecks: ValidationCheck[],
  coverageCheck: ValidationCheck,
  redundancyCheck: ValidationCheck,
  consistencyCheck: ValidationCheck,
  complementarityFactor: number,
  weights: Record<string, number>
): number {
  // Combina todos os checks
  const allChecks = [
    ...validationChecks,
    coverageCheck,
    redundancyCheck,
    consistencyCheck
  ];
  
  // Calcula média ponderada dos scores
  let weightedSum = 0;
  let totalWeight = 0;
  
  allChecks.forEach(check => {
    const weight = weights[check.aspect] || 0.1;
    weightedSum += check.score * weight;
    totalWeight += weight;
  });
  
  const baseScore = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
  
  // Aplica fator de complementaridade com menos impacto
  return baseScore * (0.85 + 0.15 * complementarityFactor);
}

/**
 * Gera decisão final da revisão
 */
function generateReviewDecision(
  qualityScore: number,
  validationChecks: ValidationCheck[],
  coverageCheck: ValidationCheck,
  redundancyCheck: ValidationCheck,
  consistencyCheck: ValidationCheck,
  reviewer: string
): { status: ReviewResult['status']; justification: string; suggestions?: string[] } {
  const allChecks = [
    ...validationChecks,
    coverageCheck,
    redundancyCheck,
    consistencyCheck
  ];
  
  const failedChecks = allChecks.filter(c => !c.passed);
  const issues = failedChecks.map(c => c.issue).filter(Boolean);
  
  // Determina status baseado no score e problemas encontrados
  let status: ReviewResult['status'];
  if (qualityScore >= 0.8 && failedChecks.length === 0) {
    status = 'approved';
  } else if (qualityScore < 0.5 || failedChecks.length > 3) {
    status = 'rejected';
  } else {
    status = 'refine';
  }
  
  // Gera justificativa
  const reviewerPersona = SPECIALIST_TO_PERSONA[reviewer] || reviewer;
  
  let justification = `Análise revisada por ${reviewerPersona}. `;
  
  if (status === 'approved') {
    justification += `Análise sólida com score de qualidade ${(qualityScore * 100).toFixed(0)}%. `;
    justification += `Todos os critérios essenciais foram atendidos.`;
  } else if (status === 'rejected') {
    justification += `Score de qualidade insuficiente (${(qualityScore * 100).toFixed(0)}%). `;
    if (qualityScore === 0) {
      justification += `Análise vazia ou incompleta.`;
    } else {
      justification += `Problemas críticos identificados: ${issues.join('; ')}.`;
    }
  } else {
    justification += `Análise requer refinamento (score: ${(qualityScore * 100).toFixed(0)}%). `;
    justification += `Áreas de melhoria: ${issues.join('; ')}.`;
  }
  
  // Gera sugestões específicas
  const suggestions: string[] = [];
  
  if (!coverageCheck.passed) {
    suggestions.push('Expandir análise para cobrir todos os aspectos essenciais');
  }
  
  if (!redundancyCheck.passed) {
    suggestions.push('Consolidar insights redundantes em análises mais profundas');
  }
  
  if (!consistencyCheck.passed) {
    suggestions.push('Alinhar melhor a análise com o contexto da investigação');
  }
  
  // Adicionar sugestões para análise vazia ou muito pobre
  if (qualityScore < 0.3) {
    suggestions.push('Análise vazia ou incompleta - adicionar conteúdo substancial');
    suggestions.push('Expandir sumário com insights específicos');
    suggestions.push('Adicionar pontos-chave relevantes à análise');
  }
  
  // Adiciona sugestões específicas do revisor
  const reviewerSpecificSuggestions = getReviewerSpecificSuggestions(
    reviewer,
    failedChecks
  );
  suggestions.push(...reviewerSpecificSuggestions);
  
  // Garantir que sempre há sugestões para status 'refine'
  if (status === 'refine' && suggestions.length === 0) {
    suggestions.push('Refinar análise com mais detalhes e evidências');
  }
  
  return {
    status,
    justification,
    suggestions: suggestions.length > 0 ? suggestions : undefined
  };
}

/**
 * Gera sugestões específicas baseadas na expertise do revisor
 */
function getReviewerSpecificSuggestions(
  reviewer: string,
  failedChecks: ValidationCheck[]
): string[] {
  const suggestions: string[] = [];
  
  // Sugestões específicas por revisor
  if (reviewer === 'L' && failedChecks.some(c => c.aspect === 'logical_consistency')) {
    suggestions.push('Fortalecer a cadeia lógica entre evidências e conclusões');
  }
  
  if (reviewer === 'Norman' && failedChecks.some(c => c.aspect === 'behavioral_patterns')) {
    suggestions.push('Investigar impacto emocional e padrões comportamentais do alvo');
  }
  
  if (reviewer === 'Norman' && failedChecks.some(c => c.aspect === 'ethical_consideration')) {
    suggestions.push('Adicionar considerações éticas à análise');
    suggestions.push('Remover viés e generalizações inadequadas');
  }
  
  if (reviewer === 'Senku' && failedChecks.some(c => c.aspect === 'scientific_methodology')) {
    suggestions.push('Adicionar validação metodológica e precedentes históricos');
  }
  
  if (reviewer === 'Isagi' && failedChecks.some(c => c.aspect === 'spatial_optimization')) {
    suggestions.push('Incluir análise de otimização de recursos e caminhos táticos');
  }
  
  if (reviewer === 'Obi' && failedChecks.some(c => c.aspect === 'synthesis_quality')) {
    suggestions.push('Melhorar síntese integrando perspectivas de múltiplos especialistas');
  }
  
  return suggestions;
}

// Funções auxiliares

/**
 * Calcula similaridade entre dois textos (simplificado)
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Extrai palavras-chave de um texto
 */
function extractKeywords(text: string): Set<string> {
  const stopWords = new Set(['o', 'a', 'de', 'e', 'que', 'do', 'da', 'em', 'para', 'com', 'por']);
  const words = text.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  return new Set(words);
}

/**
 * Calcula sobreposição entre conjuntos de palavras-chave
 */
function calculateKeywordOverlap(set1: Set<string>, set2: Set<string>): number {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const smaller = Math.min(set1.size, set2.size);
  
  return smaller > 0 ? intersection.size / smaller : 0;
}

// Exporta tipos adicionais para uso externo
export type { ValidationCheck, ValidationRules };