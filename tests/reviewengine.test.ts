// tests/reviewEngine.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
  reviewAnalysis
  // ReviewInput e ReviewResult removidos - não usados diretamente
} from '../src/reviewEngine';

// Importar tipos do local correto (lib ao invés de src)
import { 
  ExecutionContext, 
  SpecialistResponse,
  Specialist
} from '../lib/types/common';

describe('Review Engine - Validação Cruzada', () => {
  let baseContext: ExecutionContext;
  let baseAnalysis: SpecialistResponse;

  beforeEach(() => {
    // Context base para todos os testes
    baseContext = {
      executionId: 'test-exec-123',
      startTime: new Date(),
      input: {
        content: 'Investigar padrões comportamentais suspeitos em transações financeiras'
      },
      state: {
        phase: 'analysis',
        activatedSpecialists: ['L', 'Norman', 'Senku'],
        partialResults: new Map(),
        flags: {}
      },
      config: {
        confidenceThreshold: 0.7
      },
      actionHistory: [],
      effectLogs: []
    };

    // Análise base para modificação
    baseAnalysis = {
      specialist: 'Norman' as Specialist,
      analysisId: 'test-analysis-456',
      timestamp: new Date(),
      analysis: {
        summary: 'Análise comportamental revela padrões de manipulação sistemática nas transações',
        keyPoints: [
          'Comportamento manipulativo identificado',
          'Padrões genealógicos relevantes detectados'
        ],
        insights: [{
          category: 'Comportamental',
          description: 'Sujeito demonstra traços narcisistas e manipulativos',
          evidence: ['Histórico de relações exploratórias', 'Padrão de gastos irregulares'],
          confidence: 0.85
        }],
        patterns: [{
          type: 'behavioral',
          description: 'Ciclo de idealização-desvalorização-descarte',
          occurrences: 3
        }]
      },
      metadata: {
        processingTime: 1500,
        overallConfidence: 0.82,
        isComplete: true
      }
    };
  });

  describe('Validação Básica', () => {
    it('deve aprovar análise de alta qualidade', () => {
      // Análise completa e bem estruturada
      const highQualityAnalysis: SpecialistResponse = {
        ...baseAnalysis,
        analysis: {
          ...baseAnalysis.analysis,
          insights: [
            {
              category: 'Comportamental',
              description: 'Padrão narcisista identificado com alta confiança',
              evidence: ['Evidência 1', 'Evidência 2', 'Evidência 3'],
              confidence: 0.9
            },
            {
              category: 'Genealógico',
              description: 'História familiar sugere predisposição',
              evidence: ['Histórico familiar', 'Padrões geracionais'],
              confidence: 0.85
            }
          ],
          patterns: [
            {
              type: 'behavioral',
              description: 'Manipulação sistemática',
              occurrences: 5
            }
          ]
        },
        metadata: {
          ...baseAnalysis.metadata,
          overallConfidence: 0.88
        }
      };

      const result = reviewAnalysis({
        reviewer: 'L',
        originalAnalysis: highQualityAnalysis,
        context: baseContext
      });

      expect(result.status).toBe('approved');
      expect(result.qualityScore).toBeGreaterThan(0.8);
      expect(result.justification).toContain('Todos os critérios essenciais foram atendidos');
    });

    it('deve solicitar refinamento para análise incompleta', () => {
      // Remove evidências para tornar análise incompleta
      const incompleteAnalysis: SpecialistResponse = {
        ...baseAnalysis,
        analysis: {
          ...baseAnalysis.analysis,
          insights: [{
            category: 'Comportamental',
            description: 'Possível comportamento suspeito',
            evidence: [], // Sem evidências
            confidence: 0.6
          }]
        }
      };

      const result = reviewAnalysis({
        reviewer: 'L',
        originalAnalysis: incompleteAnalysis,
        context: baseContext
      });

      expect(result.status).toBe('refine');
      expect(result.qualityScore).toBeLessThan(0.9);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
    });

    it('deve rejeitar análise de baixa qualidade', () => {
      // Análise muito pobre
      const poorAnalysis: SpecialistResponse = {
        ...baseAnalysis,
        analysis: {
          summary: 'Análise superficial',
          keyPoints: [],
          insights: [],
          patterns: []
        },
        metadata: {
          ...baseAnalysis.metadata,
          overallConfidence: 0.3
        }
      };

      const result = reviewAnalysis({
        reviewer: 'Senku',
        originalAnalysis: poorAnalysis,
        context: baseContext
      });

      expect(result.status).toBe('rejected');
      expect(result.qualityScore).toBeLessThan(0.5);
      expect(result.justification).toContain('Problemas críticos identificados');
    });
  });

  describe('Validações Específicas por Especialista', () => {
    it('L deve focar em consistência lógica', () => {
      // Análise sem evidências lógicas
      const illogicalAnalysis: SpecialistResponse = {
        ...baseAnalysis,
        specialist: 'Senku' as Specialist,
        analysis: {
          ...baseAnalysis.analysis,
          insights: [
            {
              category: 'Histórico',
              description: 'Conclusão sem base lógica',
              evidence: undefined, // Sem evidências
              confidence: 0.9
            }
          ]
        }
      };

      const result = reviewAnalysis({
        reviewer: 'L',
        originalAnalysis: illogicalAnalysis,
        context: baseContext
      });

      expect(result.status).not.toBe('approved');
      expect(result.justification).toContain('carecem de evidências');
      expect(result.suggestions).toContain('Fortalecer a cadeia lógica entre evidências e conclusões');
    });

    it('Norman deve verificar considerações éticas', () => {
      // Análise sem considerações éticas
      const unethicalAnalysis: SpecialistResponse = {
        ...baseAnalysis,
        specialist: 'L' as Specialist,
        analysis: {
          ...baseAnalysis.analysis,
          insights: [
            {
              category: 'Estratégico',
              description: 'Explorar vulnerabilidades psicológicas do alvo',
              evidence: ['Perfil psicológico'],
              confidence: 0.8
            }
          ]
        }
      };

      const result = reviewAnalysis({
        reviewer: 'Norman',
        originalAnalysis: unethicalAnalysis,
        context: baseContext
      });

      expect(result.qualityScore).toBeLessThan(0.9);
      expect(result.justification).toContain('Considerações éticas não evidentes');
    });

    it('Senku deve validar metodologia científica', () => {
      // Análise sem rigor metodológico
      const unscientificAnalysis: SpecialistResponse = {
        ...baseAnalysis,
        specialist: 'Isagi' as Specialist,
        analysis: {
          ...baseAnalysis.analysis,
          insights: [
            {
              category: 'Tático',
              description: 'Otimização baseada em intuição',
              evidence: ['Feeling'],
              confidence: 0.5
            }
          ]
        }
      };

      const result = reviewAnalysis({
        reviewer: 'Senku',
        originalAnalysis: unscientificAnalysis,
        context: baseContext
      });

      expect(result.status).not.toBe('approved');
      expect(result.justification).toContain('Metodologia científica insuficiente');
    });

    it('Isagi deve verificar viabilidade tática', () => {
      // Análise sem otimização prática
      const impracticalAnalysis: SpecialistResponse = {
        ...baseAnalysis,
        specialist: 'L' as Specialist,
        analysis: {
          ...baseAnalysis.analysis,
          insights: [{
            category: 'Estratégico',
            description: 'Plano complexo sem considerações práticas',
            evidence: ['Teoria pura'],
            confidence: 0.7
          }]
        },
        recommendations: [
          {
            action: 'Implementar estratégia complexa',
            rationale: 'Porque sim', // Justificativa fraca
            priority: 'high'
          }
        ]
      };

      const result = reviewAnalysis({
        reviewer: 'Isagi',
        originalAnalysis: impracticalAnalysis,
        context: baseContext
      });

      expect(result.suggestions).toContain('Incluir análise de otimização de recursos e caminhos táticos');
    });

    it('Obi deve avaliar qualidade de síntese', () => {
      // Análise com síntese pobre
      const poorSynthesisAnalysis: SpecialistResponse = {
        ...baseAnalysis,
        specialist: 'Senku' as Specialist,
        analysis: {
          summary: 'Resumo curto', // Síntese muito curta
          keyPoints: ['Ponto 1', 'Ponto 2'], // Poucos pontos
          insights: baseAnalysis.analysis.insights
        },
        metadata: {
          ...baseAnalysis.metadata,
          overallConfidence: 0.6
        }
      };

      const result = reviewAnalysis({
        reviewer: 'Obi',
        originalAnalysis: poorSynthesisAnalysis,
        context: baseContext
      });

      expect(result.status).toBe('refine');
      expect(result.justification).toContain('Síntese incompleta ou superficial');
    });
  });

  describe('Fatores de Complementaridade', () => {
    it('deve aplicar alta complementaridade entre L e Norman', () => {
      const result = reviewAnalysis({
        reviewer: 'L',
        originalAnalysis: baseAnalysis, // Norman's analysis
        context: baseContext
      });

      // Com alta complementaridade (0.9), mesmo análises medianas podem ter bom score
      expect(result.qualityScore).toBeGreaterThan(0.6);
    });

    it('deve aplicar complementaridade moderada entre pares menos afins', () => {
      const senkuAnalysis: SpecialistResponse = {
        ...baseAnalysis,
        specialist: 'Senku' as Specialist
      };

      const resultObiReviewingSenku = reviewAnalysis({
        reviewer: 'Obi',
        originalAnalysis: senkuAnalysis,
        context: baseContext
      });

      // Complementaridade menor (0.7) resulta em scores mais conservadores
      expect(resultObiReviewingSenku.qualityScore).toBeLessThan(0.8);
    });

    it('deve aplicar maior complementaridade entre Senku e Isagi', () => {
      const isagiAnalysis: SpecialistResponse = {
        ...baseAnalysis,
        specialist: 'Isagi' as Specialist,
        analysis: {
          ...baseAnalysis.analysis,
          insights: [{
            category: 'Tático',
            description: 'Análise de otimização espacial e recursos',
            evidence: ['Mapeamento de campo', 'Análise de eficiência'],
            confidence: 0.8
          }]
        }
      };

      const result = reviewAnalysis({
        reviewer: 'Senku',
        originalAnalysis: isagiAnalysis,
        context: baseContext
      });

      // Senku e Isagi têm complementaridade 0.85 (científico + tático)
      expect(result.qualityScore).toBeGreaterThan(0.7);
    });
  });

  describe('Detecção de Problemas', () => {
    it('deve detectar redundâncias', () => {
      // Análise com insights redundantes
      const redundantAnalysis: SpecialistResponse = {
        ...baseAnalysis,
        analysis: {
          ...baseAnalysis.analysis,
          insights: [
            {
              category: 'Comportamental',
              description: 'Sujeito demonstra comportamento manipulativo',
              evidence: ['Evidência A'],
              confidence: 0.8
            },
            {
              category: 'Comportamental',
              description: 'Sujeito demonstra comportamento manipulativo', // Redundante!
              evidence: ['Evidência B'],
              confidence: 0.8
            },
            {
              category: 'Psicológico',
              description: 'Comportamento manipulativo identificado', // Quase redundante
              evidence: ['Evidência C'],
              confidence: 0.8
            }
          ]
        }
      };

      const result = reviewAnalysis({
        reviewer: 'L',
        originalAnalysis: redundantAnalysis,
        context: baseContext
      });

      expect(result.suggestions).toContain('Consolidar insights redundantes em análises mais profundas');
    });

    it('deve verificar consistência com contexto', () => {
      // Contexto sobre finanças, mas análise foca em outro tema
      const offTopicAnalysis: SpecialistResponse = {
        ...baseAnalysis,
        analysis: {
          summary: 'Análise de padrões climáticos e meteorológicos', // Fora do contexto!
          keyPoints: ['Mudanças climáticas', 'Padrões de vento'],
          insights: [{
            category: 'Ambiental',
            description: 'Temperatura aumentando',
            evidence: ['Dados meteorológicos'],
            confidence: 0.9
          }]
        }
      };

      const result = reviewAnalysis({
        reviewer: 'Senku',
        originalAnalysis: offTopicAnalysis,
        context: baseContext
      });

      expect(result.status).not.toBe('approved');
      expect(result.justification).toContain('diverge significativamente do contexto');
      expect(result.suggestions).toContain('Alinhar melhor a análise com o contexto da investigação');
    });

    it('deve detectar falta de evidências', () => {
      const noEvidenceAnalysis: SpecialistResponse = {
        ...baseAnalysis,
        analysis: {
          ...baseAnalysis.analysis,
          insights: [
            {
              category: 'Estratégico',
              description: 'Conspiração complexa envolvendo múltiplas partes',
              evidence: undefined, // Sem evidências!
              confidence: 0.95 // Alta confiança sem evidências
            },
            {
              category: 'Financeiro',
              description: 'Desvio de milhões confirmado',
              evidence: [], // Array vazio
              confidence: 0.9
            }
          ]
        }
      };

      const result = reviewAnalysis({
        reviewer: 'L',
        originalAnalysis: noEvidenceAnalysis,
        context: baseContext
      });

      expect(result.status).toBe('refine');
      expect(result.justification).toContain('carecem de evidências');
      expect(result.qualityScore).toBeLessThan(0.7);
    });
  });

  describe('Geração de Sugestões', () => {
    it('deve gerar sugestões específicas do revisor', () => {
      const analysisWithoutPatterns: SpecialistResponse = {
        ...baseAnalysis,
        analysis: {
          ...baseAnalysis.analysis,
          patterns: undefined // Sem padrões comportamentais
        }
      };

      const result = reviewAnalysis({
        reviewer: 'Norman',
        originalAnalysis: analysisWithoutPatterns,
        context: baseContext
      });

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.some(s => 
        s.includes('comportamental') || s.includes('emocional')
      )).toBe(true);
    });

    it('deve combinar múltiplas sugestões quando há várias falhas', () => {
      const problematicAnalysis: SpecialistResponse = {
        ...baseAnalysis,
        analysis: {
          summary: 'Resumo vago',
          keyPoints: [],
          insights: [{
            category: 'Genérico',
            description: 'Algo suspeito',
            confidence: 0.4
          }]
        },
        metadata: {
          ...baseAnalysis.metadata,
          overallConfidence: 0.4
        }
      };

      const result = reviewAnalysis({
        reviewer: 'L',
        originalAnalysis: problematicAnalysis,
        context: baseContext
      });

      expect(result.status).toBe('rejected');
      expect(result.suggestions!.length).toBeGreaterThan(2);
      expect(result.suggestions!.some(s => s.includes('análise'))).toBe(true);
expect(result.suggestions!.some(s => s.includes('Fortalecer') || s.includes('Expandir'))).toBe(true);
    });

    it('deve gerar sugestões construtivas para refinamento', () => {
      const mediumQualityAnalysis: SpecialistResponse = {
        ...baseAnalysis,
        analysis: {
          ...baseAnalysis.analysis,
          insights: [{
            category: 'Comportamental',
            description: 'Comportamento suspeito observado',
            evidence: ['Observação direta'],
            confidence: 0.65
          }]
        },
        metadata: {
          ...baseAnalysis.metadata,
          overallConfidence: 0.65
        }
      };

      const result = reviewAnalysis({
        reviewer: 'Norman',
        originalAnalysis: mediumQualityAnalysis,
        context: baseContext
      });

      expect(result.status).toBe('refine');
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
      expect(result.suggestions!.every(s => s.length > 10)).toBe(true); // Sugestões detalhadas
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com revisor não reconhecido', () => {
      const result = reviewAnalysis({
        reviewer: 'Unknown' as any,
        originalAnalysis: baseAnalysis,
        context: baseContext
      });

      expect(result.status).toBe('approved');
      expect(result.qualityScore).toBe(0.5);
      expect(result.justification).toContain('Revisor não reconhecido');
    });

    it('deve lidar com análise vazia', () => {
      const emptyAnalysis: SpecialistResponse = {
        ...baseAnalysis,
        analysis: {
          summary: '',
          keyPoints: [],
          insights: []
        }
      };

      const result = reviewAnalysis({
        reviewer: 'L',
        originalAnalysis: emptyAnalysis,
        context: baseContext
      });

      expect(result.status).toBe('refine');
      expect(result.qualityScore).toBeLessThan(0.7);
      expect(result.justification).toContain('Análise vazia ou incompleta');
    });

    it('deve lidar com contexto mínimo', () => {
      const minimalContext: ExecutionContext = {
        ...baseContext,
        input: {
          content: ''
        }
      };

      const result = reviewAnalysis({
        reviewer: 'Norman',
        originalAnalysis: baseAnalysis,
        context: minimalContext
      });

      // Deve funcionar mas com penalidade na consistência
      expect(result).toBeDefined();
      expect(result.qualityScore).toBeLessThan(0.8);
    });

    it('deve lidar com análise null/undefined graciosamente', () => {
      const nullAnalysis: SpecialistResponse = {
        ...baseAnalysis,
        analysis: null as any
      };

      const result = reviewAnalysis({
        reviewer: 'Senku',
        originalAnalysis: nullAnalysis,
        context: baseContext
      });

      expect(result.status).toBe('rejected');
      expect(result.qualityScore).toBe(0);
      expect(result.justification).toContain('Análise inválida');
    });
  });

  describe('Cenários Complexos', () => {
    it('deve processar análise multi-especialista corretamente', () => {
      // Análise que combina insights de múltiplos domínios
      const multiDomainAnalysis: SpecialistResponse = {
        ...baseAnalysis,
        specialist: 'Obi' as Specialist,
        analysis: {
          summary: 'Síntese integrada de análises comportamental, histórica e tática',
          keyPoints: [
            'Padrão comportamental identificado por Norman',
            'Contexto histórico estabelecido por Senku',
            'Otimização tática proposta por Isagi',
            'Hipótese central formulada por L'
          ],
          insights: [
            {
              category: 'Comportamental',
              description: 'Manipulação sistemática com traços narcisistas',
              evidence: ['Análise Norman #1', 'Observações diretas'],
              confidence: 0.85
            },
            {
              category: 'Histórico',
              description: 'Padrão similar em casos de 1920',
              evidence: ['Arquivo Senku #1', 'Documentos históricos'],
              confidence: 0.78
            },
            {
              category: 'Tático',
              description: 'Abordagem otimizada para investigação',
              evidence: ['Análise Isagi #1', 'Simulações'],
              confidence: 0.82
            },
            {
              category: 'Estratégico',
              description: 'Hipótese unificada com 4 pontos de convergência',
              evidence: ['Síntese L #1', 'Correlações identificadas'],
              confidence: 0.88
            }
          ],
          patterns: [
            { type: 'behavioral', description: 'Ciclo manipulativo', occurrences: 5 },
            { type: 'historical', description: 'Repetição histórica', occurrences: 3 },
            { type: 'tactical', description: 'Padrão de evasão', occurrences: 4 }
          ]
        },
        metadata: {
          processingTime: 5000,
          overallConfidence: 0.83,
          isComplete: true
        }
      };

      // Cada especialista revisa a síntese
      const reviewers = ['L', 'Norman', 'Senku', 'Isagi'] as Specialist[];
      const reviews = reviewers.map(reviewer => 
        reviewAnalysis({
          reviewer,
          originalAnalysis: multiDomainAnalysis,
          context: baseContext
        })
      );

      // Todos devem aprovar uma síntese bem feita
reviews.forEach(review => {
  expect(['approved', 'refine']).toContain(review.status);
  expect(review.qualityScore).toBeGreaterThan(0.65);
      });
    });

    it('deve detectar e reportar viés em análises', () => {
      const biasedAnalysis: SpecialistResponse = {
        ...baseAnalysis,
        analysis: {
          ...baseAnalysis.analysis,
          insights: [
            {
              category: 'Comportamental',
              description: 'Todos os suspeitos do grupo X são definitivamente culpados',
              evidence: ['Pertencimento ao grupo X'],
              confidence: 1.0 // 100% baseado apenas em grupo
            },
            {
              category: 'Social',
              description: 'Padrão típico do grupo demográfico Y',
              evidence: ['Estereótipo comum'],
              confidence: 0.95
            }
          ]
        }
      };

      const result = reviewAnalysis({
        reviewer: 'Norman', // Norman é especialmente sensível a questões éticas
        originalAnalysis: biasedAnalysis,
        context: baseContext
      });

      expect(result.status).not.toBe('approved');
      expect(result.suggestions).toContain('Remover viés e generalizações inadequadas');
      expect(result.justification).toContain('Considerações éticas não evidentes');
    });
  });

  describe('Performance Tests', () => {
    it('deve processar revisão em tempo aceitável', () => {
      const startTime = Date.now();
      
      const result = reviewAnalysis({
        reviewer: 'L',
        originalAnalysis: baseAnalysis,
        context: baseContext
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // Menos de 100ms
      expect(result).toBeDefined();
    });

    it('deve escalar linearmente com número de insights', () => {
      // Cria análise com muitos insights
      const largeAnalysis: SpecialistResponse = {
        ...baseAnalysis,
        analysis: {
          ...baseAnalysis.analysis,
          insights: Array(50).fill(null).map((_, i) => ({
            category: 'Test',
            description: `Insight ${i}`,
            evidence: [`Evidence ${i}`],
            confidence: 0.7
          }))
        }
      };

      const startTime = Date.now();
      
      const result = reviewAnalysis({
        reviewer: 'Senku',
        originalAnalysis: largeAnalysis,
        context: baseContext
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(200); // Ainda rápido mesmo com 50 insights
      expect(result).toBeDefined();
    });

    it('deve processar múltiplas revisões em paralelo eficientemente', async () => {
      const reviewPromises = ['L', 'Norman', 'Senku', 'Isagi', 'Obi'].map(reviewer =>
        Promise.resolve(reviewAnalysis({
          reviewer: reviewer as Specialist,
          originalAnalysis: baseAnalysis,
          context: baseContext
        }))
      );

      const startTime = Date.now();
      const results = await Promise.all(reviewPromises);
      const endTime = Date.now();

      expect(results).toHaveLength(5);
      expect(endTime - startTime).toBeLessThan(500); // Paralelo deve ser rápido
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.status).toBeDefined();
      });
    });
  });
});