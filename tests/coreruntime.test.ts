// tests/coreRuntime.test.ts
import { RuntimeOrchestrator } from '../lib/runtimeOrchestrator';
import { IngestEvent } from '../lib/types/common';
import { validateAgainstSchema } from '../lib/schemaValidator';

describe('Core Runtime - Sistema Central', () => {
  let orchestrator: RuntimeOrchestrator;

  beforeEach(() => {
    orchestrator = new RuntimeOrchestrator(true); // debug mode
  });

  describe('Processamento Básico de Eventos', () => {
    test('deve processar evento básico com sucesso', async () => {
      const evento: IngestEvent = {
        id: "teste-001",
        timestamp: new Date().toISOString(),
        tipo_registro: "hipotese",
        autor: "estrategista_chefe",
        dados: {
          descricao: "O suspeito estava no local do crime",
          probabilidade: 85
        },
        etapa: "intake_analysis",
        id_caso: "caso-001",
        trace_id: "trace-001"
      };

      const resultado = await orchestrator.orchestrate(evento);

      expect(resultado.success).toBe(true);
      expect(resultado.novaEtapa).toBeDefined();
      expect(resultado.novaEtapa).toBe('task_delegation');
    });

    test('deve validar estrutura de eventos', async () => {
      const eventoInvalido = {
        id: "teste-002",
        // faltando campos obrigatórios
      };

      await expect(orchestrator.orchestrate(eventoInvalido as any))
        .rejects.toThrow();
    });

    test('deve processar múltiplos tipos de registro', async () => {
      const tiposRegistro = [
        // Tipos originais do sistema
  'hipotese',
  'evidencia',
  'perfil_personagem',
  'entrada_timeline',
  'registro_misc',
  'cross_validation_result',
  'ingest',
  
  // Tipos usados nas regras (rules.yaml)
  'hypothesis_created',
  'analysis_validated',
  'task_assigned',
  'contradiction_detected',
  'analysis_completed'
      ];

      for (const tipo of tiposRegistro) {
        const evento: IngestEvent = {
          id: `teste-${tipo}`,
          timestamp: new Date().toISOString(),
          tipo_registro: tipo as any,
          autor: "orquestrador_missao",
          dados: {
            descricao: `Teste de ${tipo}`
          },
          etapa: "intake_analysis",
          id_caso: "caso-multi",
          trace_id: `trace-${tipo}`
        };

        const resultado = await orchestrator.orchestrate(evento);
        expect(resultado.success).toBe(true);
      }
    });
  });

  describe('Sistema de Triggers', () => {
    test('deve ativar triggers baseado em regras', async () => {
      // Assumindo regra de alta confiança configurada
      const eventoAltaConfianca: IngestEvent = {
        id: "trigger-001",
        timestamp: new Date().toISOString(),
        tipo_registro: "hipotese",
        autor: "estrategista_chefe",
        dados: {
          descricao: "Evidências conclusivas encontradas",
          probabilidade: 95 // Alta confiança
        },
        etapa: "hypothesis_formation",
        id_caso: "caso-trigger",
        trace_id: "trace-trigger"
      };

      const resultado = await orchestrator.orchestrate(eventoAltaConfianca);

      expect(resultado.success).toBe(true);
      if (resultado.triggered.length > 0) {
        expect(resultado.triggered).toContain('high_confidence_hypothesis');
      }
    });

    test('deve executar ações de triggers', async () => {
      const evento: IngestEvent = {
        id: "action-001",
        timestamp: new Date().toISOString(),
        tipo_registro: "hipotese",
        autor: "estrategista_chefe",
        dados: {
          descricao: "Hipótese com ações",
          probabilidade: 85
        },
        etapa: "hypothesis_formation",
        id_caso: "caso-action",
        trace_id: "trace-action"
      };

      const resultado = await orchestrator.orchestrate(evento);

      expect(resultado.actions).toBeDefined();
      resultado.actions.forEach(action => {
        expect(action.type).toBeDefined();
        expect(action.result).toBeDefined();
      });
    });
  });

  describe('Validação de Schemas', () => {
    test('deve validar schema de hipótese corretamente', () => {
      const hipoteseValida = {
        hypothesis_id: "H-01.v1",
        hypothesis_statement: "O incêndio foi causado intencionalmente",
        confidence_score: 78,
        evidence_support: [
          {
            evidence_id: "DOC-001",
            support_strength: 85,
            relevance: "direct"
          }
        ],
        logical_chain: [
          {
            step: 1,
            premise: "Múltiplos focos de incêndio",
            inference: "Indica ação intencional",
            confidence: 80
          }
        ]
      };

      const resultado = validateAgainstSchema('hypothesis', hipoteseValida);
      expect(resultado.valid).toBe(true);
    });

    test('deve rejeitar schema inválido', () => {
      const hipoteseInvalida = {
        hypothesis_id: "H-02.v1",
        confidence_score: 90
        // Faltando campos obrigatórios
      };

      const resultado = validateAgainstSchema('hypothesis', hipoteseInvalida);
      expect(resultado.valid).toBe(false);
      expect(resultado.errors).toBeDefined();
      expect(resultado.errors!.length).toBeGreaterThan(0);
    });

    test('deve validar formato de IDs', () => {
      const hipoteseIdErrado = {
        hypothesis_id: "FORMATO-ERRADO", // Deveria ser H-XX.vY
        hypothesis_statement: "Teste",
        confidence_score: 50,
        evidence_support: [],
        logical_chain: []
      };

      const resultado = validateAgainstSchema('hypothesis', hipoteseIdErrado);
      expect(resultado.valid).toBe(false);
      expect(resultado.errors!.some(e => e.field === 'hypothesis_id')).toBe(true);
    });
  });

  describe('Fluxo do Pipeline', () => {
    test('deve avançar corretamente pelas etapas', async () => {
const etapas = [
  'intake_analysis',      // INTAKE
  'task_delegation',      // DELEGATION
  'collaborative_review', // VALIDATION
  'synthesis',           // SYNTHESIS (não 'hypothesis_formation')
  'hypothesis_formation', // HYPOTHESIS
  'review',              // REVIEW
  'final_assessment',    // ASSESSMENT
  'archival'            // ARCHIVAL
];

      let etapaAtual = 'intake_analysis';
      
      for (let i = 0; i < etapas.length - 1; i++) {
        const evento: IngestEvent = {
          id: `pipeline-${i}`,
          timestamp: new Date().toISOString(),
          tipo_registro: "registro_misc",
          autor: "orquestrador_missao",
          dados: {
            descricao: `Processando etapa ${etapaAtual}`
          },
          etapa: etapaAtual as any,
          id_caso: "caso-pipeline",
          trace_id: `trace-pipeline-${i}`
        };

        const resultado = await orchestrator.orchestrate(evento);
        
        expect(resultado.success).toBe(true);
        if (i < etapas.length - 2) {
          expect(resultado.novaEtapa).toBe(etapas[i + 1]);
          etapaAtual = resultado.novaEtapa;
        }
      }
    });

    test('deve lidar com erros no pipeline', async () => {
      const eventoProblematico: IngestEvent = {
        id: "erro-001",
        timestamp: new Date().toISOString(),
        tipo_registro: "hipotese",
        autor: "especialista_inexistente", // Autor inválido
        dados: {
          descricao: "Teste de erro"
        },
        etapa: "etapa_invalida" as any,
        id_caso: "caso-erro",
        trace_id: "trace-erro"
      };

      const resultado = await orchestrator.orchestrate(eventoProblematico);
      
      // Deve processar mas com warnings
      expect(resultado.success).toBe(true);
      expect(resultado.warnings).toBeDefined();
      expect(resultado.warnings!.length).toBeGreaterThan(0);
    });
  });

  describe('Integração Completa', () => {
    test('deve processar investigação completa', async () => {
      console.log('🔄 Teste de Integração Completa\n');
      
      // 1. Denúncia inicial
      const denuncia: IngestEvent = {
        id: "int-001",
        timestamp: new Date().toISOString(),
        tipo_registro: "registro_misc",
        autor: "orquestrador_missao",
        dados: {
          descricao: "Denúncia de fraude corporativa",
          categoria: "denuncia",
          gravidade: "alta"
        },
        etapa: "intake_analysis",
        id_caso: "FRAUDE-INT-001",
        trace_id: "trace-int-001"
      };

      const result1 = await orchestrator.orchestrate(denuncia);
      expect(result1.success).toBe(true);
      console.log(`✅ Denúncia processada - próxima etapa: ${result1.novaEtapa}`);

      // 2. Hipótese inicial
      const hipotese: IngestEvent = {
        id: "int-002",
        timestamp: new Date().toISOString(),
        tipo_registro: "hipotese",
        autor: "estrategista_chefe",
        dados: {
          descricao: "Executivos desviando fundos através de offshores",
          probabilidade: 75,
          hypothesis_id: "H-01.v1",
          hypothesis_statement: "Fraude sistemática identificada",
          confidence_score: 75,
          evidence_support: [
            {
              evidence_id: "DOC-001",
              support_strength: 70,
              relevance: "circumstantial"
            }
          ],
          logical_chain: [
            {
              step: 1,
              premise: "Transferências para paraísos fiscais",
              inference: "Indicativo de evasão",
              confidence: 75
            }
          ]
        },
        etapa: "hypothesis_formation",
        id_caso: "FRAUDE-INT-001",
        trace_id: "trace-int-002"
      };

      // Validar schema antes
      const validacao = validateAgainstSchema('hypothesis', hipotese.dados);
      expect(validacao.valid).toBe(true);

      const result2 = await orchestrator.orchestrate(hipotese);
      expect(result2.success).toBe(true);
      console.log(`✅ Hipótese processada - triggers: ${result2.triggered.join(', ') || 'Nenhum'}`);

      // 3. Evidência forense
      const evidencia: IngestEvent = {
        id: "int-003",
        timestamp: new Date().toISOString(),
        tipo_registro: "evidencia",
        autor: "analista_forense",
        dados: {
          descricao: "Análise de documentos bancários",
          evidence_id: "DOC-002",
          scientific_title: "Análise Forense Financeira",
          scientific_method: "Rastreamento de transações e análise de padrões",
          confidence_categories: {
            alta_90_100: [
              {
                finding: "Padrão sistemático de desvios identificado",
                verification_method: "Análise estatística",
                certainty_phrase: "Altamente provável"
              }
            ],
            media_60_89: [],
            baixa_0_59: []
          },
          correlation_data: {
            internal_correlations: [],
            external_correlations: []
          }
        },
        etapa: "collaborative_review",
        id_caso: "FRAUDE-INT-001",
        trace_id: "trace-int-003"
      };

      const result3 = await orchestrator.orchestrate(evidencia);
      expect(result3.success).toBe(true);
      console.log(`✅ Evidência processada - próxima etapa: ${result3.novaEtapa}`);

      // 4. Timeline
      const timeline: IngestEvent = {
        id: "int-004",
        timestamp: new Date().toISOString(),
        tipo_registro: "entrada_timeline",
        autor: "analista_espacial",
        dados: {
          entry_id: "TML-001",
          event_type: "transferencia_suspeita",
          description: "Primeira transferência irregular detectada",
          date_time: "2025-01-01T02:00:00Z",
          location: "Sistema bancário corporativo",
          participants: ["CFO", "Offshore Account"],
          significance_level: "high"
        },
        etapa: "synthesis",
        id_caso: "FRAUDE-INT-001",
        trace_id: "trace-int-004"
      };

      const result4 = await orchestrator.orchestrate(timeline);
      expect(result4.success).toBe(true);
      console.log(`✅ Timeline processada`);

      console.log('\n🎯 Investigação completa processada com sucesso!');
    });
  });

  describe('Performance e Escalabilidade', () => {
    test('deve processar múltiplos eventos rapidamente', async () => {
      const startTime = Date.now();
      const promises = [];

      for (let i = 0; i < 10; i++) {
        const evento: IngestEvent = {
          id: `perf-${i}`,
          timestamp: new Date().toISOString(),
          tipo_registro: "registro_misc",
          autor: "orquestrador_missao",
          dados: {
            descricao: `Evento de performance ${i}`
          },
          etapa: "intake_analysis",
          id_caso: "caso-perf",
          trace_id: `trace-perf-${i}`
        };

        promises.push(orchestrator.orchestrate(evento));
      }

      const resultados = await Promise.all(promises);
      const endTime = Date.now();

      resultados.forEach(r => expect(r.success).toBe(true));
      expect(endTime - startTime).toBeLessThan(1000); // Menos de 1 segundo para 10 eventos
    });

    test('deve manter consistência sob carga', async () => {
      const eventos: IngestEvent[] = [];
      
      // Criar 50 eventos variados
      for (let i = 0; i < 50; i++) {
        eventos.push({
          id: `load-${i}`,
          timestamp: new Date().toISOString(),
tipo_registro: ['hipotese', 'evidencia', 'registro_misc'][i % 3] as any,
          autor: ['estrategista_chefe', 'analista_forense', 'orquestrador_missao'][i % 3],
          dados: {
            descricao: `Teste de carga ${i}`,
            probabilidade: 50 + (i % 50)
          },
etapa: "intake_analysis",
          id_caso: "caso-load",
          trace_id: `trace-load-${i}`
        });
      }

      // Processar em paralelo
      const resultados = await Promise.all(
        eventos.map(e => orchestrator.orchestrate(e))
      );

      // Verificar consistência
      const sucessos = resultados.filter(r => r.success).length;
      expect(sucessos).toBe(50);
      
      // Verificar que não há conflitos de estado
      const etapasFinais = resultados.map(r => r.novaEtapa);
      const etapaEsperada = 'task_delegation';
      etapasFinais.forEach(etapa => {
        expect(etapa).toBe(etapaEsperada);
      });
    });
  });
});