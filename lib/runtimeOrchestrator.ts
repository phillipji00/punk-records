// lib/runtimeOrchestrator.ts — corrigido para exportar tipos usados externamente

export interface IngestEvent {
  id: string;
  timestamp: string;
  tipo_registro: string;
  autor: string;
  dados: Record<string, any>;
  etapa: string;
  especialista?: string;
  id_caso: string;
}

export interface SyndicateContext {
  idRegistro: string;
  contexto: string;
  autor: string;
  etapa: string;
  especialista: string;
  idCaso: string;
  probabilidade?: number;
  timestamp: string;
}

export interface SyndicateAction {
  id: string;
  type: string;
  params?: Record<string, any>;
}

export interface TriggerEvaluationResult {
  triggered: boolean;
  matchedRules: string[];
  actions: SyndicateAction[];
}

export interface ExecutionContext extends SyndicateContext {
  log: (msg: string) => void;
  advancePipeline: (toStage: string) => void;
  activateSpecialist?: (id: string) => Promise<void>;
  activateProtocol?: (id: string) => Promise<void>;
  modifyScore?: (field: string, value: number) => void;
  haltPipeline?: (reason: string) => void;
}

import { evaluateTriggers } from './triggerEngine';
import { executeTriggerActions } from './executeTriggerActions';
import { getCaseStatus, saveCaseStatus } from './casoStore';
import { loadObiState, updateObiState } from './obiState';

export async function orchestrate(event: IngestEvent): Promise<void> {
  const obiState = await loadObiState(event.id_caso);
  if (obiState?.sinalizacaoManual === 'PAUSADO') {
    console.log('⚠️ Caso pausado por sinalização manual. Pipeline encerrado.');
    return;
  }

  const estadoAnterior = await getCaseStatus(event.id_caso);

  const context: SyndicateContext = {
    idRegistro: event.id,
    contexto: event.dados.descricao,
    autor: event.autor,
    etapa: estadoAnterior?.etapa || event.etapa,
    especialista: estadoAnterior?.especialista || event.especialista || 'desconhecido',
    idCaso: event.id_caso,
    probabilidade: event.dados.probabilidade ?? estadoAnterior?.probabilidade,
    timestamp: event.timestamp,
  };

  const execContext: ExecutionContext = {
    ...context,
    log: (msg: string) => console.log(`🧠 Obi: ${msg}`),
    advancePipeline: (toStage: string) => {
      context.etapa = toStage;
      console.log(`📦 Etapa atualizada para ${toStage}`);
    },
    activateSpecialist: async (id: string) => {
      context.especialista = id;
      console.log(`👤 Especialista ${id} ativado`);
    },
  };

  const triggerResult = await evaluateTriggers(execContext);

  if (triggerResult.triggered && triggerResult.actions.length > 0) {
    await executeTriggerActions(triggerResult.actions, execContext);
  }

  await saveCaseStatus(execContext.idCaso, {
    etapa: execContext.etapa,
    especialista: execContext.especialista,
    probabilidade: execContext.probabilidade,
    timestamp: execContext.timestamp,
  });

  await updateObiState(execContext.idCaso, {
    ultimaEtapa: execContext.etapa,
  });

  execContext.log('Pipeline concluído com sucesso.');
}
