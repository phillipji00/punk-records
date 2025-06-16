// runtimeOrchestrator.ts - Syndicate v3.0
// Orquestrador principal do sistema de investigação narrativa

import { evaluateTriggers, validateContext } from './triggerEngine';
import { executeTriggerActions } from './executeTriggerActions';
import { validateAgainstSchema } from './schemaValidator';
import {
  IngestEvent,
  RuntimeExecutionContext as ExecutionContext,
  SyndicateContext,
  RuntimeTriggerEvaluationResult as TriggerEvaluationResult,
  isValidIngestEvent,
  isValidProbabilidade,
  ETAPAS_PIPELINE,
  ESPECIALISTAS
} from './types/common';

// Interfaces para o novo orquestrador
export interface OrchestrationResult {
  success: boolean;
  context: SyndicateContext;
  triggered: string[];
  actions: Array<{ type: string; result: string }>;
  novaEtapa: string;
  errors?: string[];
  warnings?: string[];
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Classe principal do Orquestrador v3.0
 * Coordena a execução do pipeline de investigação
 */
export class RuntimeOrchestrator {
  private debugMode: boolean;
  
  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
  }

  /**
   * Método principal de orquestração
   * Processa eventos de entrada e coordena a execução do pipeline
   */
  async orchestrate(event: IngestEvent): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. Validação inicial do evento
      const eventValidation = this.validateIngestEvent(event);
      if (!eventValidation.valid) {
        return this.createErrorResult(event, eventValidation.errors);
      }
      warnings.push(...eventValidation.warnings);

      // 2. Construir contexto inicial
      const context = await this.buildExecutionContext(event);
      
      // 3. Validar contexto contra schema
      const schemaValidation = await this.validateContextSchema(context);
      if (!schemaValidation.valid) {
        return this.createErrorResult(event, schemaValidation.errors);
      }
      warnings.push(...schemaValidation.warnings);

      // 4. Avaliar triggers
      const triggerResult = this.evaluateContextTriggers(context);
      
      // 5. Executar ações se houver triggers ativados
      const executedActions: Array<{ type: string; result: string }> = [];
      if (triggerResult.triggered && triggerResult.actions.length > 0) {
        const actionResults = await this.executeActions(triggerResult.actions, context);
        executedActions.push(...actionResults);
      }

      // 6. Determinar próxima etapa
      const novaEtapa = this.determineNextStage(context, triggerResult);

      // 7. Atualizar contexto final
      const finalContext = this.updateFinalContext(context, novaEtapa);

      // Log de conclusão
      if (this.debugMode) {
        console.log(`✅ Orquestração concluída em ${Date.now() - startTime}ms`);
      }

      return {
        success: true,
        context: finalContext,
        triggered: triggerResult.matchedRules,
        actions: executedActions,
        novaEtapa,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      errors.push(`Erro fatal na orquestração: ${errorMsg}`);
      
      return this.createErrorResult(event, errors);
    }
  }

  /**
   * Valida o evento de entrada
   */
  private validateIngestEvent(event: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Usar type guard do módulo types
    if (!isValidIngestEvent(event)) {
      errors.push('Evento não possui estrutura válida de IngestEvent');
      return { valid: false, errors, warnings };
    }

    // Validações adicionais
    if (!event.id_caso || event.id_caso.trim() === '') {
      errors.push('ID do caso é obrigatório');
    }

    if (!event.dados || typeof event.dados !== 'object') {
      errors.push('Dados do evento devem ser um objeto válido');
    }

    // Validar probabilidade se presente
    if (event.dados.probabilidade !== undefined) {
      if (!isValidProbabilidade(event.dados.probabilidade)) {
        warnings.push(`Probabilidade inválida (${event.dados.probabilidade}), será ignorada`);
      }
    }

    // Verificar etapa válida
    const etapasValidas = Object.values(ETAPAS_PIPELINE);
    if (event.etapa && !etapasValidas.includes(event.etapa as any)) {
      warnings.push(`Etapa '${event.etapa}' não reconhecida, usando INTAKE como padrão`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Constrói o contexto de execução a partir do evento
   */
  private async buildExecutionContext(event: IngestEvent): Promise<ExecutionContext> {
    // Contexto base do Syndicate
    const baseContext: SyndicateContext = {
      idRegistro: event.id,
      contexto: event.dados.descricao || '',
      autor: event.autor,
      etapa: event.etapa || ETAPAS_PIPELINE.INTAKE,
      especialista: event.especialista || ESPECIALISTAS.ORQUESTRADOR,
      idCaso: event.id_caso,
      timestamp: event.timestamp,
      tipo_registro: event.tipo_registro,
      probabilidade: isValidProbabilidade(event.dados.probabilidade) 
        ? event.dados.probabilidade 
        : undefined
    };

    // Adicionar funções de controle do pipeline
    const execContext: ExecutionContext = {
      ...baseContext,
      log: (msg: string) => {
        if (this.debugMode) {
          console.log(`🧠 [${event.id_caso}] ${msg}`);
        }
      },
      advancePipeline: (toStage: string) => {
        execContext.etapa = toStage;
        execContext.log(`Pipeline avançado para: ${toStage}`);
      },
      activateSpecialist: async (id: string) => {
        execContext.especialista = id;
        execContext.log(`Especialista ativado: ${id}`);
      },
      activateProtocol: async (name: string) => {
        execContext.log(`Protocolo ativado: ${name}`);
      },
      modifyScore: (field: string, adjustment: number) => {
        if (field === 'probabilidade' && execContext.probabilidade !== undefined) {
          execContext.probabilidade = Math.max(0, Math.min(100, execContext.probabilidade + adjustment));
        }
        execContext.log(`Score ${field} ajustado em: ${adjustment}`);
      },
      haltPipeline: (reason: string) => {
        execContext.log(`Pipeline interrompido: ${reason}`);
        throw new Error(`Pipeline halt: ${reason}`);
      }
    };

    return execContext;
  }

  /**
   * Valida o contexto contra o schema
   */
  private async validateContextSchema(context: ExecutionContext): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validar contra o schema vault_record
      const validation = validateAgainstSchema('vault_record_schema', {
        contexto: context.contexto,
        autor: context.autor,
        tipo_registro: context.tipo_registro,
        timestamp: context.timestamp,
        confidence: context.probabilidade || 0
      });

      if (!validation.valid && validation.errors) {
        validation.errors.forEach(err => {
          if (err.type === 'required') {
            errors.push(`Campo obrigatório ausente: ${err.field}`);
          } else {
            warnings.push(`Validação de schema: ${err.message}`);
          }
        });
      }
    } catch (error) {
      warnings.push('Schema vault_record_schema não encontrado, prosseguindo sem validação de schema');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Avalia triggers para o contexto
   */
  private evaluateContextTriggers(context: ExecutionContext): TriggerEvaluationResult {
    try {
      // Validar contexto antes de avaliar triggers
      if (!validateContext(context)) {
        return {
          triggered: false,
          matchedRules: [],
          actions: []
        };
      }

      // Avaliar triggers usando o engine
      return evaluateTriggers(context);
    } catch (error) {
      if (this.debugMode) {
        console.error('Erro ao avaliar triggers:', error);
      }
      
      return {
        triggered: false,
        matchedRules: [],
        actions: []
      };
    }
  }

  /**
   * Executa as ações dos triggers
   */
  private async executeActions(
    actions: any[], 
    context: ExecutionContext
  ): Promise<Array<{ type: string; result: string }>> {
    const results: Array<{ type: string; result: string }> = [];

    try {
      // Executar ações usando o módulo executeTriggerActions
      const effectLogs = await executeTriggerActions(actions, context);
      
      // Converter logs em resultados
      actions.forEach((action) => {
        const relatedLogs = effectLogs.filter(log => 
          log.metadata?.actionType === action.type || 
          log.message.includes(action.type)
        );
        
        const hasError = relatedLogs.some(log => log.level === 'ERROR');
        
        results.push({
          type: action.type,
          result: hasError ? 'error' : 'success'
        });
      });
    } catch (error) {
      if (this.debugMode) {
        console.error('Erro ao executar ações:', error);
      }
      
      results.push({
        type: 'error',
        result: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }

    return results;
  }

  /**
   * Determina a próxima etapa do pipeline
   */
  private determineNextStage(
    context: ExecutionContext, 
    triggerResult: TriggerEvaluationResult
  ): string {
    // Se uma ação advance_pipeline foi executada, usar a etapa atualizada
    const advanceAction = triggerResult.actions.find(a => 
      a.type === 'advance_pipeline' || a.type === 'state_transition'
    );
    
    if (advanceAction && (advanceAction.to_stage || advanceAction.params?.toState)) {
      return advanceAction.to_stage || advanceAction.params?.toState;
    }

    // Lógica padrão de progressão do pipeline
    const progressionMap: Record<string, string> = {
      [ETAPAS_PIPELINE.INTAKE]: ETAPAS_PIPELINE.DELEGATION,
      [ETAPAS_PIPELINE.DELEGATION]: ETAPAS_PIPELINE.VALIDATION,
      [ETAPAS_PIPELINE.VALIDATION]: ETAPAS_PIPELINE.SYNTHESIS,
      [ETAPAS_PIPELINE.SYNTHESIS]: ETAPAS_PIPELINE.HYPOTHESIS,
      [ETAPAS_PIPELINE.HYPOTHESIS]: ETAPAS_PIPELINE.REVIEW,
      [ETAPAS_PIPELINE.REVIEW]: ETAPAS_PIPELINE.ASSESSMENT,
      [ETAPAS_PIPELINE.ASSESSMENT]: ETAPAS_PIPELINE.ARCHIVAL,
      [ETAPAS_PIPELINE.ARCHIVAL]: ETAPAS_PIPELINE.ARCHIVAL // Fim do pipeline
    };

    return progressionMap[context.etapa] || context.etapa;
  }

  /**
   * Atualiza o contexto final
   */
  private updateFinalContext(
    context: ExecutionContext, 
    novaEtapa: string
  ): SyndicateContext {
    return {
      idRegistro: context.idRegistro,
      contexto: context.contexto,
      autor: context.autor,
      etapa: novaEtapa,
      especialista: context.especialista,
      idCaso: context.idCaso,
      timestamp: new Date().toISOString(),
      tipo_registro: context.tipo_registro,
      probabilidade: context.probabilidade
    };
  }

  /**
   * Cria resultado de erro
   */
  private createErrorResult(event: IngestEvent, errors: string[]): OrchestrationResult {
    return {
      success: false,
      context: {
        idRegistro: event.id,
        contexto: event.dados.descricao || '',
        autor: event.autor,
        etapa: event.etapa || ETAPAS_PIPELINE.INTAKE,
        especialista: event.especialista || ESPECIALISTAS.ORQUESTRADOR,
        idCaso: event.id_caso,
        timestamp: event.timestamp,
        tipo_registro: event.tipo_registro
      },
      triggered: [],
      actions: [],
      novaEtapa: event.etapa || ETAPAS_PIPELINE.INTAKE,
      errors
    };
  }
}

/**
 * Função de compatibilidade com a v2.0
 * Mantém a mesma interface para facilitar migração
 */
export async function orchestrate(event: IngestEvent): Promise<void> {
  const orchestrator = new RuntimeOrchestrator(true);
  const result = await orchestrator.orchestrate(event);
  
  if (!result.success && result.errors) {
    throw new Error(result.errors.join('; '));
  }
}

/**
 * Função helper para criar instância do orquestrador
 */
export function createOrchestrator(debugMode: boolean = false): RuntimeOrchestrator {
  return new RuntimeOrchestrator(debugMode);
}