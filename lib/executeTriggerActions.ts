// executeTriggerActions.ts — versão corrigida com tipos centralizados

import { SyndicateAction, ExecutionContext } from './types/common';
import { log } from './utils/logger';

export async function executeTriggerActions(
  actions: SyndicateAction[], 
  context: ExecutionContext
): Promise<void> {
  log.debug('Executando ações de trigger', { 
    action_count: actions.length,
    id_caso: context.idCaso 
  });
  
  for (const action of actions) {
    try {
      await executeSingleAction(action, context);
    } catch (error: any) {
      log.error('Erro ao executar ação de trigger', {
        action_type: action.type,
        error: error.message,
        id_caso: context.idCaso
      });
      // Continuar com outras ações mesmo se uma falhar
    }
  }
}

async function executeSingleAction(
  action: SyndicateAction, 
  context: ExecutionContext
): Promise<void> {
  log.debug('Executando ação', { 
    type: action.type, 
    params: action.params 
  });
  
  switch (action.type) {
    case 'log':
      if (action.message) {
        context.log(action.message);
      }
      break;

    case 'advance_pipeline':
      if (action.to_stage) {
        context.advancePipeline(action.to_stage);
      }
      break;

    case 'activate_specialist':
      if (action.target && context.activateSpecialist) {
        await context.activateSpecialist(action.target);
      }
      break;

    case 'activate_protocol':
      if (action.protocol && context.activateProtocol) {
        await context.activateProtocol(action.protocol);
      }
      break;

    case 'modify_score':
      if (action.field && action.adjustment !== undefined && context.modifyScore) {
        context.modifyScore(action.field, action.adjustment);
      }
      break;

    case 'halt_pipeline':
      if (action.reason && context.haltPipeline) {
        context.haltPipeline(action.reason);
      }
      break;

    default:
      log.warn(`⚠️ Ação desconhecida: ${action.type}`, {
        action,
        id_caso: context.idCaso
      });
      break;
  }
  
  log.debug('Ação executada com sucesso', { 
    type: action.type 
  });
}
