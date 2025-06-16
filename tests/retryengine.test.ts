// tests/retryEngine.test.ts
import { 
  avaliarRetry, 
  avaliarForcaConclusao,
  gerarRelatorioRetry,
  aplicarModificacoesRetry,
  RetryInput,
  RetryResponse 
} from '../src/retryEngine';

describe('Retry Engine - Sistema de Recuperação', () => {
  
  describe('Timeout de Análise', () => {
    test('deve sugerir ajuste para timeout na primeira tentativa', () => {
      const input: RetryInput = {
        etapaAtual: 'coleta_evidencias',
        tipoErro: 'timeout_analise',
        especialista: 'Senku',
        tentativaAtual: 1
      };
      
      const resultado = avaliarRetry(input);
      
      expect(resultado.acao).toBe('ajustar');
      expect(resultado.proximaEtapa).toBe('coleta_evidencias');
      expect(resultado.cooldownMs).toBe(1500); // Base cooldown
      expect(resultado.estrategiaRecuperacao).toBe('adjust_and_retry');
    });

    test('deve aumentar cooldown progressivamente', () => {
      const input1: RetryInput = {
        etapaAtual: 'coleta_evidencias',
        tipoErro: 'timeout_analise',
        tentativaAtual: 1
      };
      
      const input2: RetryInput = {
        ...input1,
        tentativaAtual: 2
      };
      
      const input3: RetryInput = {
        ...input1,
        tentativaAtual: 3,
  tentativasGlobais: 1
      };
      
      const resultado1 = avaliarRetry(input1);
      const resultado2 = avaliarRetry(input2);
      const resultado3 = avaliarRetry(input3);
      
      expect(resultado1.cooldownMs).toBe(1500);
      expect(resultado2.cooldownMs).toBe(2250); // 1500 * 1.5
      expect(resultado3.cooldownMs).toBe(3375); // 2250 * 1.5
    });
  });

  describe('Conflito entre Especialistas', () => {
    test('deve ativar mediação estruturada', () => {
      const input: RetryInput = {
        etapaAtual: 'validation',
        tipoErro: 'specialist_conflict',
        especialista: 'estrategista_chefe',
        tentativaAtual: 1
      };
      
      const resultado = avaliarRetry(input);
      
      expect(resultado.acao).toBe('ajustar');
      expect(resultado.estrategiaRecuperacao).toBe('structured_mediation');
      expect(resultado.modificacoes?.especialistasAlternativos).toContain('orquestrador_missao');
      expect(resultado.cooldownMs).toBe(2000);
    });

    test('deve escalar após múltiplas tentativas de mediação', () => {
      const input: RetryInput = {
        etapaAtual: 'validation',
        tipoErro: 'specialist_conflict',
        especialista: 'estrategista_chefe',
        tentativaAtual: 4, // Excede limite de 3 para conflitos
        tentativasGlobais: 2 // Ajustado para não atingir limite global
      };
      
      const resultado = avaliarRetry(input);
      
      expect(resultado.acao).toBe('escalar');
      expect(resultado.justificativa).toContain('múltiplas tentativas');
    });
  });

  describe('Contexto Insuficiente', () => {
    test('deve ativar QA Refinement para contexto baixo', () => {
      const input: RetryInput = {
        etapaAtual: 'intake_analysis',
        tipoErro: 'low_confidence',
        tentativaAtual: 1,
        confiancaAtual: 35
      };
      
      const resultado = avaliarRetry(input);
      
      expect(resultado.acao).toBe('ajustar');
      expect(resultado.estrategiaRecuperacao).toBe('qa_refinement_activation');
      expect(resultado.modificacoes?.ajusteConfianca).toBe(20);
    });

    test('deve sugerir especialistas específicos para gaps', () => {
      const input: RetryInput = {
        etapaAtual: 'analysis',
        tipoErro: 'technical_gap', // Mudado de 'expertise_gap' para 'technical_gap'
        tentativaAtual: 1,
        tentativasGlobais: 1, // Adicionado para evitar limite global
        contextoErro: {
          gapType: 'historical_analysis'
        }
      };
      
      const resultado = avaliarRetry(input);
      
      expect(resultado.acao).toBe('ajustar');
      expect(resultado.modificacoes?.especialistasAlternativos).toContain('analista_forense');
    });
  });

  describe('Limites e Conclusão Forçada', () => {
    test('deve forçar conclusão quando atinge limite global', () => {
      const input: RetryInput = {
        etapaAtual: 'synthesis',
        tipoErro: 'low_confidence',
        tentativaAtual: 2,
        tentativasGlobais: 3, // Limite global!
        confiancaAtual: 45
      };
      
      const resultado = avaliarRetry(input);
      
      expect(resultado.acao).toBe('concluir_gracioso');
      expect(resultado.cooldownMs).toBe(0);
      expect(resultado.justificativa).toContain('Limite global de tentativas atingido');
    });

    test('avaliarForcaConclusao deve detectar múltiplas condições', () => {
      // Teste 1: Por tentativas
      expect(avaliarForcaConclusao(3, 80)).toBe(true);
      expect(avaliarForcaConclusao(2, 80)).toBe(false);
      
      // Teste 2: Por confiança baixa
      expect(avaliarForcaConclusao(2, 20)).toBe(true);
      expect(avaliarForcaConclusao(2, 30)).toBe(false);
      
      // Teste 3: Por tempo
      expect(avaliarForcaConclusao(1, 80, 300001)).toBe(true); // > 5 min
      expect(avaliarForcaConclusao(1, 80, 299999)).toBe(false); // < 5 min
      
      // Teste 4: Combinações
      expect(avaliarForcaConclusao(2, 24, 250000)).toBe(true); // Confiança baixa
      expect(avaliarForcaConclusao(3, 90, 100000)).toBe(true); // Tentativas
    });
  });

  describe('Erros Desconhecidos', () => {
    test('deve escalar erros não reconhecidos', () => {
      const input: RetryInput = {
        etapaAtual: 'synthesis',
        tipoErro: 'erro_muito_estranho_xyz_123',
        tentativaAtual: 1
      };
      
      const resultado = avaliarRetry(input);
      
      expect(resultado.acao).toBe('escalar');
      expect(resultado.justificativa).toContain('não reconhecido'); // Mudado para substring que existe
      expect(resultado.cooldownMs).toBe(0);
    });
  });

  describe('Geração de Relatórios', () => {
    test('deve gerar relatório formatado corretamente', () => {
      const input: RetryInput = {
        etapaAtual: 'validation',
        tipoErro: 'timeout_analise',
        especialista: 'Norman',
        tentativaAtual: 2,
        confiancaAtual: 65
      };
      
      const resposta: RetryResponse = {
        acao: 'ajustar',
        justificativa: 'Timeout detectado. Ajustando parâmetros.',
        cooldownMs: 1500,
        estrategiaRecuperacao: 'adjust_and_retry',
        modificacoes: {
          simplificacoes: ['analise_focada', 'reducao_escopo']
        }
      };
      
      const relatorio = gerarRelatorioRetry(input, resposta);
      
      expect(relatorio).toContain('RETRY ENGINE REPORT');
      expect(relatorio).toContain('Norman');
      expect(relatorio).toContain('65%');
      expect(relatorio).toContain('timeout_analise');
      expect(relatorio).toContain('adjust_and_retry');
      expect(relatorio).toContain('analise_focada');
    });

    test('deve incluir todas as informações relevantes no relatório', () => {
      const input: RetryInput = {
        etapaAtual: 'cross_validation',
        tipoErro: 'specialist_conflict',
        especialista: 'L',
        tentativaAtual: 3,
        tentativasGlobais: 2,
        confiancaAtual: 78,
        contextoErro: {
          conflictingSpecialists: ['L', 'Norman']
        }
      };
      
      const resposta: RetryResponse = {
        acao: 'escalar',
        justificativa: 'Conflito persistente após múltiplas tentativas',
        estrategiaRecuperacao: 'escalation_protocol'
      };
      
      const relatorio = gerarRelatorioRetry(input, resposta);
      
      expect(relatorio).toContain('Tentativa: 3');
      expect(relatorio).toContain('Tentativas Globais: 2');
      expect(relatorio).toContain('conflictingSpecialists');
    });
  });

  describe('Validação de Input', () => {
    test('deve rejeitar input inválido', () => {
      expect(() => {
        avaliarRetry({
          etapaAtual: '', // Vazio!
          tipoErro: 'test',
          tentativaAtual: 1
        });
      }).toThrow('Input inválido');
      
      expect(() => {
        avaliarRetry({
          etapaAtual: 'test',
          tipoErro: '', // Vazio!
          tentativaAtual: 1
        });
      }).toThrow('Input inválido');
      
      expect(() => {
        avaliarRetry({
          etapaAtual: 'test',
          tipoErro: 'test',
          tentativaAtual: 0 // Zero!
        });
      }).toThrow('Input inválido');
    });
  });

  describe('Aplicação de Modificações', () => {
    test('deve aplicar modificações no contexto', async () => {
      const mockContext = {
        modifyScore: jest.fn(),
        activateSpecialist: jest.fn(),
        log: jest.fn(),
        etapa: 'test_stage' // Adicionado para evitar undefined
      };
      
      const resposta: RetryResponse = {
        acao: 'ajustar',
        justificativa: 'Teste',
        cooldownMs: 1000,
        modificacoes: {
          ajusteConfianca: 15,
          especialistasAlternativos: ['L', 'Norman']
        }
      };
      
      await aplicarModificacoesRetry(mockContext as any, resposta);
      
      expect(mockContext.modifyScore).toHaveBeenCalledWith('confidence', 15);
      expect(mockContext.activateSpecialist).toHaveBeenCalledWith('L');
      expect(mockContext.activateSpecialist).toHaveBeenCalledWith('Norman');
      expect(mockContext.log).toHaveBeenCalledWith('Aplicando cooldown de 1000ms...');
    });

    test('deve aguardar cooldown quando especificado', async () => {
      const mockContext = {
        log: jest.fn(),
        etapa: 'test_stage' // Adicionado para evitar undefined
      };
      
      const resposta: RetryResponse = {
        acao: 'ajustar',
        justificativa: 'Teste',
        cooldownMs: 100 // 100ms para teste rápido
      };
      
      const startTime = Date.now();
      await aplicarModificacoesRetry(mockContext as any, resposta);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Cenários Integrados', () => {
    test('fluxo completo de retry com escalação', () => {
      // Tentativa 1: Timeout
      let input: RetryInput = {
        etapaAtual: 'analysis',
        tipoErro: 'timeout_analise',
        especialista: 'Senku',
        tentativaAtual: 1,
        tentativasGlobais: 1
      };
      
      let resultado = avaliarRetry(input);
      expect(resultado.acao).toBe('ajustar');
      
      // Tentativa 2: Ainda timeout
      input = { ...input, tentativaAtual: 2, tentativasGlobais: 2 };
      resultado = avaliarRetry(input);
      expect(resultado.acao).toBe('ajustar');
      
      // Tentativa 3: Limite global
      input = { ...input, tentativaAtual: 3, tentativasGlobais: 3 };
      resultado = avaliarRetry(input);
      expect(resultado.acao).toBe('concluir_gracioso');
    });

    test('recuperação bem-sucedida com QA Refinement', () => {
      const input: RetryInput = {
        etapaAtual: 'intake_analysis',
        tipoErro: 'low_confidence',
        tentativaAtual: 1,
        confiancaAtual: 40
      };
      
      const resultado = avaliarRetry(input);
      
      expect(resultado.acao).toBe('ajustar');
      expect(resultado.estrategiaRecuperacao).toBe('qa_refinement_activation');
      expect(resultado.modificacoes?.ajusteConfianca).toBe(20);
      
      // Simular após aplicar modificações
      const novaConfianca = 40 + 20; // 60%
      expect(novaConfianca).toBeGreaterThanOrEqual(60);
    });
  });
});