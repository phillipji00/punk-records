// tests/obiStateManager.test.ts
import {
  decidirAcaoObi,
  interpretarEstadoEmocional,
  diagnosticarSistema,
  processarComandoNarrativo,
  ObiCommand
  // ExecutionContext removido - importar do types
  // ObiSystemDiagnosis removido - não usado
} from '../src/obiStateManager';

// Importar ExecutionContext do local correto
import { RuntimeExecutionContext as ExecutionContext } from '../lib/types/common';

// Função auxiliar para criar contexto de teste
function createObiContext(overrides?: Partial<ExecutionContext>): ExecutionContext {
  return {
    idRegistro: "test-001",
    contexto: "Contexto de teste padrão",
    autor: "orquestrador_missao",
    etapa: "intake_analysis",
    especialista: "orquestrador_missao",
    idCaso: "caso-001",
    timestamp: new Date().toISOString(),
    probabilidade: 75,
    
    // Callbacks mockados
    log: jest.fn(),
    advancePipeline: jest.fn(),
    activateSpecialist: jest.fn(),
    activateProtocol: jest.fn(),
    modifyScore: jest.fn(),
    haltPipeline: jest.fn(),
    
    ...overrides
  };
}

describe('OBI State Manager - Inteligência Central', () => {
  
  describe('Detecção e Resolução de Conflitos', () => {
    test('deve detectar conflitos entre especialistas', () => {
      const context = createObiContext({
        contexto: "Análise contraditória entre L e Norman sobre motivações do suspeito. Informações conflitantes sobre timeline.",
        probabilidade: 35
      });

      const comandos = decidirAcaoObi(context);

      // Deve gerar comando de resolução de conflito com alta prioridade
      const conflictCommand = comandos.find(cmd => cmd.action === 'resolver_conflito');
      expect(conflictCommand).toBeDefined();
      expect(conflictCommand!.prioridade).toBe(10); // Prioridade máxima
      
      // Verificar narrativa
      const narrativa = processarComandoNarrativo(conflictCommand!);
      expect(narrativa).toContain('Detectei divergências');
      expect(narrativa).toContain('mediar');
    });

    test('deve priorizar resolução de conflitos sobre outras ações', () => {
      const context = createObiContext({
        contexto: "Documento histórico contraditório encontrado. Evidências científicas inconsistentes.",
        probabilidade: 60
      });

      const comandos = decidirAcaoObi(context);
      
      // Primeiro comando deve ser resolução de conflito
      expect(comandos[0].action).toBe('resolver_conflito');
      expect(comandos[0].prioridade).toBe(10);
    });
  });

  describe('Ativação Inteligente de Especialistas', () => {
    test('deve ativar L para contextos estratégicos', () => {
      const context = createObiContext({
        contexto: "Necessitamos analisar a estratégia por trás das movimentações financeiras suspeitas e estabelecer hipóteses sobre o caso.",
        probabilidade: 70
      });

      const comandos = decidirAcaoObi(context);
      
      const activateL = comandos.find(cmd => 
        cmd.action === 'ativar_especialista' && cmd.target === 'L'
      );
      expect(activateL).toBeDefined();
      expect(activateL!.prioridade).toBeGreaterThanOrEqual(7);
    });

    test('deve ativar Senku para evidências científicas/históricas', () => {
      const context = createObiContext({
        contexto: "Documento histórico do século XIX encontrado com evidências forenses que precisam de análise científica detalhada.",
        probabilidade: 75
      });

      const comandos = decidirAcaoObi(context);
      
      const activateSenku = comandos.find(cmd => 
        cmd.action === 'ativar_especialista' && cmd.target === 'Senku'
      );
      expect(activateSenku).toBeDefined();
      
      const narrativa = processarComandoNarrativo(activateSenku!);
      expect(narrativa).toContain('Senku');
      expect(narrativa).toContain('expertise');
    });

    test('deve ativar Norman para análises comportamentais', () => {
      const context = createObiContext({
        contexto: "O comportamento psicológico do suspeito mostra padrões de manipulação e possíveis traumas familiares.",
        probabilidade: 80
      });

      const comandos = decidirAcaoObi(context);
      
      const activateNorman = comandos.find(cmd => 
        cmd.action === 'ativar_especialista' && cmd.target === 'Norman'
      );
      expect(activateNorman).toBeDefined();
    });

    test('deve ativar Isagi para otimização tática', () => {
      const context = createObiContext({
        contexto: "Precisamos otimizar nossa estratégia de investigação e melhorar a eficiência da disposição dos recursos no campo.",
        probabilidade: 75
      });

      const comandos = decidirAcaoObi(context);
      
      const activateIsagi = comandos.find(cmd => 
        cmd.action === 'ativar_especialista' && cmd.target === 'Isagi'
      );
      expect(activateIsagi).toBeDefined();
    });

    test('deve ativar múltiplos especialistas quando necessário', () => {
      const context = createObiContext({
        contexto: "Caso complexo envolvendo documentos históricos, análise psicológica do suspeito e necessidade de estratégia coordenada.",
        probabilidade: 70
      });

      const comandos = decidirAcaoObi(context);
      
      const activateCommands = comandos.filter(cmd => cmd.action === 'ativar_especialista');
      expect(activateCommands.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Gerenciamento de Confiança e Pipeline', () => {
    test('deve pausar investigação com confiança muito baixa', () => {
      const context = createObiContext({
        contexto: "Informações extremamente vagas e inconclusivas sobre o caso.",
        probabilidade: 25 // Muito baixa!
      });

      const comandos = decidirAcaoObi(context);

      const pauseCommand = comandos.find(cmd => cmd.action === 'pausar');
      expect(pauseCommand).toBeDefined();
      expect(pauseCommand!.prioridade).toBe(8);
      expect(pauseCommand!.dados?.razaoPausa).toContain('confiança baixa');
    });

    test('deve validar etapa com múltiplos especialistas', () => {
      const context = createObiContext({
        contexto: "Análises completas de L, Norman e Senku prontas para validação cruzada.",
        probabilidade: 85,
        etapa: 'cross_validation'
      });

      const comandos = decidirAcaoObi(context);

      const validateCommand = comandos.find(cmd => cmd.action === 'validar_etapa');
      expect(validateCommand).toBeDefined();
      // Corrigido: verificar especialista individual, não array
      expect(validateCommand!.dados?.especialista).toBeDefined();
    });

    test('deve avançar pipeline quando condições são atendidas', () => {
      const context = createObiContext({
        contexto: "Etapa concluída com sucesso. Todas as análises foram validadas.",
        probabilidade: 90,
        etapa: 'initial_analysis'
      });

      const comandos = decidirAcaoObi(context);

      const advanceCommand = comandos.find(cmd => cmd.action === 'avançar_pipeline');
      expect(advanceCommand).toBeDefined();
      expect(advanceCommand!.dados?.novaEtapa).toBe('cross_validation');
    });
  });

  describe('Interpretação de Estado Emocional', () => {
    test('deve interpretar urgência alta corretamente', () => {
      const context = createObiContext({
        contexto: "URGENTE! Suspeitos se aproximando rapidamente. Decisão crítica necessária AGORA!",
        probabilidade: 85
      });

      const estado = interpretarEstadoEmocional(context);

      expect(estado.urgencia).toBe(5); // Máxima
      expect(estado.recomendacao).toContain('ação imediata');
    });

    test('deve detectar complexidade alta', () => {
      const context = createObiContext({
        contexto: "Múltiplas contradições encontradas. L, Norman e Senku divergem completamente. Documentos históricos conflitantes com evidências forenses. Timeline impossível.",
        probabilidade: 45
      });

      const estado = interpretarEstadoEmocional(context);

      expect(estado.complexidade).toBeGreaterThanOrEqual(8);
      expect(estado.recomendacao).toContain('abordagem sistemática');
    });
  });

  describe('Diagnóstico do Sistema', () => {
    test('deve diagnosticar sistema operacional', () => {
      const context = createObiContext({
        contexto: "Investigação progredindo normalmente. Especialistas trabalhando em harmonia.",
        probabilidade: 85
      });

      const diagnostico = diagnosticarSistema(context);

      expect(diagnostico.statusGeral).toBe('operacional');
      expect(diagnostico.confiancaSistema).toBeGreaterThan(70);
      expect(diagnostico.alertas).toHaveLength(0);
    });

    test('deve diagnosticar sistema em atenção', () => {
      const context = createObiContext({
        contexto: "Algumas contradições detectadas. Confiança oscilando.",
        probabilidade: 55
      });

      const diagnostico = diagnosticarSistema(context);

      expect(diagnostico.statusGeral).toBe('atencao');
      expect(diagnostico.alertas.length).toBeGreaterThan(0);
    });

    test('deve diagnosticar sistema crítico', () => {
      const context = createObiContext({
        contexto: "Múltiplos conflitos não resolvidos. Informações contraditórias graves. Sistema em risco.",
        probabilidade: 25
      });

      const diagnostico = diagnosticarSistema(context);

      expect(diagnostico.statusGeral).toBe('critico');
      expect(diagnostico.confiancaSistema).toBeLessThan(40);
      expect(diagnostico.alertas.length).toBeGreaterThan(1);
      expect(diagnostico.proximasAcoes).toContain('Resolver conflitos urgentemente');
    });

    test('deve recomendar especialistas apropriados', () => {
      const context = createObiContext({
        contexto: "Análise histórica necessária. Documentos antigos encontrados.",
        probabilidade: 70
      });

      const diagnostico = diagnosticarSistema(context);

      expect(diagnostico.especialistasRecomendados).toContain('Senku');
    });
  });

  describe('Processamento Narrativo', () => {
    test('deve manter personalidade do Obi nas narrativas', () => {
      const comando: ObiCommand = {
        action: 'ativar_especialista',
        target: 'L',
        prioridade: 9,
        timestamp: new Date(),
        dados: {},
        mensagemNarrativa: '' // Adicionado campo obrigatório
      };

      const narrativa = processarComandoNarrativo(comando);

      expect(narrativa).toContain('Capitão Obi:');
      expect(narrativa).toContain('Fire Force cuida de Fire Force');
      expect(narrativa).toContain('vamos trabalhar juntos');
    });

    test('deve adaptar tom baseado na prioridade', () => {
      const comandoAlta: ObiCommand = {
        action: 'resolver_conflito',
        prioridade: 10,
        timestamp: new Date(),
        dados: {},
        mensagemNarrativa: '' // Adicionado campo obrigatório
      };

      const comandoBaixa: ObiCommand = {
        action: 'escrever_contexto', // Corrigido de 'registrar_contexto'
        prioridade: 3,
        timestamp: new Date(),
        dados: {},
        mensagemNarrativa: '' // Adicionado campo obrigatório
      };

      const narrativaAlta = processarComandoNarrativo(comandoAlta);
      const narrativaBaixa = processarComandoNarrativo(comandoBaixa);

      expect(narrativaAlta).toContain('alta prioridade');
      expect(narrativaBaixa).toContain('procedimento padrão');
    });
  });

  describe('Casos Extremos e Edge Cases', () => {
    test('deve lidar com contexto vazio', () => {
      const context = createObiContext({
        contexto: "",
        probabilidade: 50
      });

      const comandos = decidirAcaoObi(context);

      // Deve pelo menos registrar contexto
      expect(comandos.length).toBeGreaterThan(0);
      expect(comandos.find(cmd => cmd.action === 'escrever_contexto')).toBeDefined(); // Corrigido
    });

    test('deve lidar com contexto extremamente longo', () => {
      const contextoLongo = "Lorem ipsum ".repeat(100) + 
                           "estratégia " + "evidência " + "comportamento " +
                           "Lorem ipsum ".repeat(100);
      
      const context = createObiContext({
        contexto: contextoLongo,
        probabilidade: 75
      });

      const comandos = decidirAcaoObi(context);

      // Deve processar normalmente
      expect(comandos.length).toBeGreaterThan(0);
      const activateCommands = comandos.filter(cmd => cmd.action === 'ativar_especialista');
      expect(activateCommands.length).toBeGreaterThan(0);
    });

    test('deve priorizar corretamente múltiplas situações críticas', () => {
      const context = createObiContext({
        contexto: "URGENTE! Conflito grave entre especialistas. Confiança caindo. Contradições múltiplas. Decisão crítica necessária!",
        probabilidade: 30
      });

      const comandos = decidirAcaoObi(context);

      // Conflito deve ter prioridade máxima
      expect(comandos[0].action).toBe('resolver_conflito');
      expect(comandos[0].prioridade).toBe(10);

      // Pausar deve vir em seguida
      const pauseCommand = comandos.find(cmd => cmd.action === 'pausar');
      expect(pauseCommand).toBeDefined();
    });
  });
});