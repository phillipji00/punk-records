// runtimeOrchestrator.ts v2.0 — ajustado com integração a obiState

import { evaluateTriggers } from './triggerEngine';
import { executeTriggerActions } from './executeTriggerActions';
import { getCaseStatus, saveCaseStatus } from './casoStore';
import { loadObiState, updateObiState } from './obiState';

interface IngestEvent {
  id: string;
  timestamp: string;
  tipo_registro: string;
  autor: string;
  dados: Record<string, any>;
  etapa: string;
  especialista?: string;
  id_caso: string;
}

interface SyndicateContext {
  idRegistro: string;
  contexto: string;
  autor: string;
  etapa: string;
  especialista: string;
  idCaso: string;
  probabilidade?: number;
  timestamp: string;
}

interface SyndicateAction {
  id: string;
  type: string;
  params?: Record<string, any>;
}

interface TriggerEvaluationResult {
  triggered: boolean;
  matchedRules: string[];
  actions: SyndicateAction[];
}

interface ExecutionContext extends SyndicateContext {
  log: (msg: string) => void;
  advancePipeline: (toStage: string) => void;
  activateSpecialist?: (id: string) => Promise<void>;
  activateProtocol?: (id: string) => Promise<void>;
  modifyScore?: (field: string, value: number) => void;
  haltPipeline?: (reason: string) => void;
}

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

  const triggerResult: TriggerEvaluationResult = await evaluateTriggers(execContext);

  if (triggerResult.triggered && triggerResult.actions.length > 0) {
    await executeTriggerActions(execContext, triggerResult.actions);
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
