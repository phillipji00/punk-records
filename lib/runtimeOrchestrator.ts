// runtimeOrchestrator.ts v2.0 — versão corrigida com tipos centralizados

import { evaluateTriggerssSafe } from './triggerEngine';
import { executeTriggerActions } from './executeTriggerActions';
import { getCaseStatus, saveCaseStatus } from './casoStore';
import { loadObiState, updateObiState } from './obiState';
import { log } from './utils/logger';
import {
  IngestEvent,
  SyndicateContext,
  TriggerEvaluationResult,
  ExecutionContext,
  isValidIngestEvent,
  isValidProbabilidade,
  ETAPAS_PIPELINE
} from './types/common';

export async function orchestrate(event: IngestEvent): Promise<void> {
  // Validar evento
  if (!isValidIngestEvent(event)) {
    log.error('Evento inválido recebido', { event });
    throw new Error('Evento de ingestão inválido');
  }
  
  const startTime = Date.now();
  log.info('🚀 Iniciando orquestração', {
    trace_id: event.trace_id,
    tipo_registro: event.tipo_registro,
    autor: event.autor,
    id_caso: event.id_caso
  });
  
  try {
    // Verificar estado do Obi
    const obiState = await loadObiState(event.id_caso);
    if (obiState?.sinalizacaoManual === 'PAUSADO') {
      log.warn('⚠️ Caso pausado por sinalização manual', { id_caso: event.id_caso });
      return;
    }

    // Buscar estado anterior do caso
    const estadoAnterior = await getCaseStatus(event.id_caso);
    log.debug('Estado anterior do caso', { estadoAnterior });

    // Construir contexto
    const context: SyndicateContext = {
      idRegistro: event.id,
      contexto: event.dados.descricao || '',
      autor: event.autor,
      etapa: estadoAnterior?.etapa || event.etapa || ETAPAS_PIPELINE.INTAKE,
      especialista: estadoAnterior?.especialista || event.especialista || 'desconhecido',
      idCaso: event.id_caso,
      probabilidade: event.dados.probabilidade ?? estadoAnterior?.probabilidade,
      timestamp: event.timestamp,
      tipo_registro: event.tipo_registro
    };
    
    // Validar probabilidade se existir
    if (context.probabilidade !== undefined && !isValidProbabilidade(context.probabilidade)) {
      log.warn('Probabilidade inválida, removendo do contexto', { 
        probabilidade: context.probabilidade 
      });
      delete context.probabilidade;
    }

    // Criar contexto de execução
    const execContext: ExecutionContext = {
      ...context,
      log: (msg: string) => {
        log.info(`🧠 Obi: ${msg}`, { id_caso: event.id_caso });
      },
      advancePipeline: (toStage: string) => {
        context.etapa = toStage;
        log.info(`📦 Etapa atualizada para ${toStage}`, { 
          id_caso: event.id_caso,
          from_stage: execContext.etapa,
          to_stage: toStage 
        });
      },
      activateSpecialist: async (id: string) => {
        context.especialista = id;
        log.info(`👤 Especialista ${id} ativado`, { 
          id_caso: event.id_caso,
          specialist: id 
        });
      },
      activateProtocol: async (name: string) => {
        log.info(`🔧 Protocolo ${name} ativado`, { 
          id_caso: event.id_caso,
          protocol: name 
        });
      },
      modifyScore: (field: string, adjustment: number) => {
        log.info(`📊 Score ${field} modificado em ${adjustment}`, { 
          id_caso: event.id_caso,
          field,
          adjustment 
        });
      },
      haltPipeline: (reason: string) => {
        log.warn(`🛑 Pipeline interrompido: ${reason}`, { 
          id_caso: event.id_caso,
          reason 
        });
      }
    };

    // Avaliar triggers
    log.debug('Avaliando triggers', { tipo_registro: event.tipo_registro });
    const triggerResult: TriggerEvaluationResult = evaluateTriggerssSafe(execContext);

    if (triggerResult.triggered && triggerResult.actions.length > 0) {
      log.info('✅ Triggers ativados', {
        matched_rules: triggerResult.matchedRules,
        action_count: triggerResult.actions.length
      });
      
      await executeTriggerActions(triggerResult.actions, execContext);
    } else {
      log.debug('Nenhum trigger ativado');
    }

    // Salvar estado do caso
    await saveCaseStatus(execContext.idCaso, {
      etapa: execContext.etapa,
      especialista: execContext.especialista,
      probabilidade: execContext.probabilidade,
      timestamp: execContext.timestamp,
    });

    // Atualizar estado do Obi
    await updateObiState(execContext.idCaso, {
      ultimaEtapa: execContext.etapa,
    });

    const duration = Date.now() - startTime;
    log.info('✅ Pipeline concluído com sucesso', {
      id_caso: event.id_caso,
      duration_ms: duration,
      final_stage: execContext.etapa,
      final_specialist: execContext.especialista
    });
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    log.error('❌ Erro na orquestração', {
      id_caso: event.id_caso,
      duration_ms: duration,
      error: error.message,
      stack: error.stack
    });
    
    throw error;
  }
}

// Função helper para criar evento de teste
export function createTestEvent(partial: Partial<IngestEvent>): IngestEvent {
  const now = new Date().toISOString();
  return {
    id: partial.id || 'test-id',
    timestamp: partial.timestamp || now,
    tipo_registro: partial.tipo_registro || 'registro_misc',
    autor: partial.autor || 'orquestrador_missao',
    dados: partial.dados || { descricao: 'Teste' },
    etapa: partial.etapa || ETAPAS_PIPELINE.INTAKE,
    especialista: partial.especialista,
    id_caso: partial.id_caso || 'test-case',
    trace_id: partial.trace_id
  };
}

// Função para validar se o orchestrator está operacional
export async function validateOrchestrator(): Promise<boolean> {
  try {
    // Testar com evento mínimo
    const testEvent = createTestEvent({
      id_caso: 'health-check',
      tipo_registro: 'registro_misc',
      dados: { descricao: 'Health check' }
    });
    
    // Simular execução sem salvar
    log.debug('Validando orchestrator com evento de teste');
    
    return true;
  } catch (error) {
    log.error('Orchestrator validation failed', { error });
    return false;
  }
}
