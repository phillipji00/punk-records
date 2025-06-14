type Action = {
  type: string;
  [key: string]: any;
};

type ExecutionContext = {
  log: (msg: string) => void;
  advancePipeline: (toStage: string) => void;
  activateSpecialist?: (id: string) => Promise<void>;
  activateProtocol?: (name: string) => Promise<void>;
  modifyScore?: (field: string, adjustment: number) => void;
  haltPipeline?: (reason: string) => void;
};

export async function executeTriggerActions(actions: Action[], context: ExecutionContext): Promise<void> {
  for (const action of actions) {
    switch (action.type) {
      case 'log':
        context.log?.(action.message);
        break;

      case 'advance_pipeline':
        context.advancePipeline?.(action.to_stage);
        break;

      case 'activate_specialist':
        await context.activateSpecialist?.(action.target);
        break;

      case 'activate_protocol':
        await context.activateProtocol?.(action.protocol);
        break;

      case 'modify_score':
        context.modifyScore?.(action.field, action.adjustment);
        break;

      case 'halt_pipeline':
        context.haltPipeline?.(action.reason);
        break;

      default:
        context.log?.(`⚠️ Ação desconhecida: ${action.type}`);
        break;
    }
  }
}// executeTriggerActions.ts — versão corrigida com tipagem compatível e sua lógica original mantida

type Action = {
  type: string;
  [key: string]: any;
};

type ExecutionContext = {
  log: (msg: string) => void;
  advancePipeline: (toStage: string) => void;
  activateSpecialist?: (id: string) => Promise<void>;
  activateProtocol?: (name: string) => Promise<void>;
  modifyScore?: (field: string, adjustment: number) => void;
  haltPipeline?: (reason: string) => void;
};

export async function executeTriggerActions(actions: Action[], context: ExecutionContext): Promise<void> {
  for (const action of actions) {
    switch (action.type) {
      case 'log':
        context.log?.(action.message);
        break;

      case 'advance_pipeline':
        context.advancePipeline?.(action.to_stage);
        break;

      case 'activate_specialist':
        await context.activateSpecialist?.(action.target);
        break;

      case 'activate_protocol':
        await context.activateProtocol?.(action.protocol);
        break;

      case 'modify_score':
        context.modifyScore?.(action.field, action.adjustment);
        break;

      case 'halt_pipeline':
        context.haltPipeline?.(action.reason);
        break;

      default:
        context.log?.(`⚠️ Ação desconhecida: ${action.type}`);
        break;
    }
  }
}
