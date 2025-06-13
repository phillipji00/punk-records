
// runtimeOrchestrator.ts v2.0

import { evaluateTriggers } from './triggerEngine';
import { executeTriggerActions } from './executeTriggerActions';
import { getCaseStatus, saveCaseStatus } from '@/lib/casoStore';

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

interface SyndicateAction {
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
  const estadoAnterior = await getCaseStatus(event.id_caso);

  const context: SyndicateContext = {
    idRegistro: event.id,
    contexto: event.dados.descricao,
    autor: event.autor,
    etapa: estadoAnterior?.etapa || event.etapa,
    especialista: estadoAnterior?.especialista || event.especialista || "desconhecido",
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
      console.log(`👤 Especialista ativado: ${id}`);
    },
    activateProtocol: async (id: string) => {
      console.log(`📜 Protocolo ativado: ${id}`);
    },
  };

  const triggerResult = await checkTriggers(context);

  if (triggerResult.triggered && triggerResult.actions.length > 0) {
    await executeTriggerActions(triggerResult.actions, execContext);
  }

  await autoHandleContextGaps(context);
  await advancePipelineIfNecessary(context);
  await logOrchestration(context, triggerResult);
  await saveCaseStatus(context);
}

async function checkTriggers(context: SyndicateContext): Promise<TriggerEvaluationResult> {
  console.log(`🧪 Probabilidade recebida no context: ${context.probabilidade}`);
  return await evaluateTriggers({ event: 'ingest', ...context });
}

async function autoHandleContextGaps(context: SyndicateContext): Promise<void> {
  const completeness = estimateContextCompleteness(context);
  if (completeness < 80) {
    console.log('⚠️ Contexto incompleto. Ativando refinamento Q&A.');
    // Placeholder: await runQARefinement(context);
  }
}

function estimateContextCompleteness(context: SyndicateContext): number {
  let score = 0;
  if (context.contexto.length > 30) score += 30;
  if (context.etapa) score += 20;
  if (context.probabilidade) score += 20;
  if (context.especialista && context.especialista !== 'desconhecido') score += 30;
  return score;
}

async function advancePipelineIfNecessary(context: SyndicateContext): Promise<void> {
  console.log(`📦 Avaliando progresso do pipeline para etapa: ${context.etapa}`);
  if (context.etapa === 'validação' && context.probabilidade && context.probabilidade > 90) {
    console.log(`✅ Critérios atingidos. Avançando caso ${context.idCaso} para próxima etapa.`);
    // Placeholder: await pipelineEngine.advanceStage(context.idCaso);
  }
}

async function logOrchestration(context: SyndicateContext, result: TriggerEvaluationResult): Promise<void> {
  console.log(`📝 Log de orquestração do registro ${context.idRegistro}`);
  console.log(`→ Etapa atual: ${context.etapa}`);
  console.log(`→ Triggers ativadas: ${result.triggered ? result.matchedRules.join(', ') : 'nenhuma'}`);
  console.log(`→ Especialista: ${context.especialista}`);
  console.log(`→ Contexto: ${context.contexto.slice(0, 100)}...`);
}
