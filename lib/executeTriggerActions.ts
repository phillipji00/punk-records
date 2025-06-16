import {
  SyndicateAction,
  RuntimeExecutionContext as ExecutionContext,
  CONFIDENCE_THRESHOLDS
} from './types/common';

// Tipos específicos para o módulo de execução de ações
export interface EffectLog {
  id: string;
  actionId: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
}

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

// Tipos de ação suportados pelo sistema
export enum ActionType {
  UPDATE_FIELD = 'UPDATE_FIELD',
  CROSS_VALIDATION = 'CROSS_VALIDATION',
  NOTIFICATION = 'NOTIFICATION',
  TASK_CREATION = 'TASK_CREATION',
  MEMORY_UPDATE = 'MEMORY_UPDATE',
  STATE_TRANSITION = 'STATE_TRANSITION',
  SPECIALIST_ACTIVATION = 'SPECIALIST_ACTIVATION',
  PROTOCOL_ACTIVATION = 'PROTOCOL_ACTIVATION',
  SCORE_MODIFICATION = 'SCORE_MODIFICATION',
  PIPELINE_HALT = 'PIPELINE_HALT'
}

// Tipos específicos de ação com seus parâmetros
export interface UpdateFieldAction extends SyndicateAction {
  type: ActionType.UPDATE_FIELD;
  params: {
    field: string;
    value: any;
    operator?: 'set' | 'increment' | 'append';
  };
}

export interface CrossValidationAction extends SyndicateAction {
  type: ActionType.CROSS_VALIDATION;
  params: {
    sourceSpecialist: string;
    targetSpecialists: string[];
    dataToValidate: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface NotificationAction extends SyndicateAction {
  type: ActionType.NOTIFICATION;
  params: {
    channel: NotificationChannel;
    recipient: string;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    metadata?: Record<string, any>;
  };
}

export interface TaskCreationAction extends SyndicateAction {
  type: ActionType.TASK_CREATION;
  params: {
    taskType: string;
    assignee: string;
    description: string;
    priority: number;
    dueDate?: string;
    dependencies?: string[];
  };
}

export interface MemoryUpdateAction extends SyndicateAction {
  type: ActionType.MEMORY_UPDATE;
  params: {
    memoryType: 'short_term' | 'long_term' | 'working';
    operation: 'store' | 'retrieve' | 'update' | 'delete';
    key: string;
    value?: any;
    ttl?: number;
  };
}

export interface StateTransitionAction extends SyndicateAction {
  type: ActionType.STATE_TRANSITION;
  params: {
    fromState: string;
    toState: string;
    reason: string;
    metadata?: Record<string, any>;
  };
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SLACK = 'SLACK',
  WEBHOOK = 'WEBHOOK',
  INTERNAL = 'INTERNAL',
  SMS = 'SMS'
}

/**
 * Execute ações disparadas por triggers, simulando efeitos sem persistência real
 * Cada ação gera logs de efeitos que representam o que seria executado em produção
 * 
 * EVOLUÇÃO v2.0 → v3.0:
 * - Mantido: Processamento sequencial, tratamento de erros, tipos base
 * - Alterado: Retorna EffectLog[] ao invés de void, simula ao invés de executar
 * - Adicionado: Sistema de logging estruturado, rastreabilidade completa
 * - Removido: Dependência de utils/logger, execução direta de efeitos
 */
export async function executeTriggerActions(
  actions: SyndicateAction[],
  context: ExecutionContext
): Promise<EffectLog[]> {
  const effectLogs: EffectLog[] = [];
  const timestamp = new Date().toISOString();

  // Log inicial de execução
  effectLogs.push({
    id: generateEffectId(),
    actionId: 'batch-execution',
    timestamp,
    level: LogLevel.INFO,
    message: `Iniciando execução de ${actions.length} ações para o caso ${context.idCaso}`,
    metadata: {
      totalActions: actions.length,
      etapaAtual: context.etapa,
      especialistaAtivo: context.especialista
    }
  });

  for (const action of actions) {
    try {
      const effects = await executeAction(action, context, timestamp);
      effectLogs.push(...effects);
    } catch (error) {
      // Log de erro para ação que falhou
      effectLogs.push({
        id: generateEffectId(),
        actionId: action.id || 'unknown',
        timestamp,
        level: LogLevel.ERROR,
        message: `Erro ao executar ação ${action.type}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        metadata: {
          actionType: action.type,
          error: error instanceof Error ? error.stack : String(error),
          context: {
            caso: context.idCaso,
            etapa: context.etapa
          }
        }
      });
    }
  }

  // Log final com resumo
  const successCount = effectLogs.filter(log => log.level !== LogLevel.ERROR).length - 1;
  const errorCount = effectLogs.filter(log => log.level === LogLevel.ERROR).length;
  
  effectLogs.push({
    id: generateEffectId(),
    actionId: 'batch-execution-complete',
    timestamp: new Date().toISOString(),
    level: errorCount > 0 ? LogLevel.WARNING : LogLevel.INFO,
    message: `Execução de ações concluída: ${successCount} sucesso, ${errorCount} erros`,
    metadata: {
      successCount,
      errorCount,
      duration: Date.now() - new Date(timestamp).getTime()
    }
  });

  return effectLogs;
}

/**
 * Executa uma ação individual e retorna os logs de efeito correspondentes
 */
async function executeAction(
  action: SyndicateAction,
  context: ExecutionContext,
  timestamp: string
): Promise<EffectLog[]> {
  const logs: EffectLog[] = [];
  const actionId = action.id || generateEffectId();

  // Log de início da ação
  logs.push({
    id: generateEffectId(),
    actionId,
    timestamp,
    level: LogLevel.DEBUG,
    message: `Executando ação ${action.type}`,
    metadata: { params: action.params }
  });

  // Mapear tipos de ação string para ActionType enum quando possível
  const actionTypeMap: Record<string, ActionType> = {
    'update_field': ActionType.UPDATE_FIELD,
    'cross_validation': ActionType.CROSS_VALIDATION,
    'notification': ActionType.NOTIFICATION,
    'task_creation': ActionType.TASK_CREATION,
    'memory_update': ActionType.MEMORY_UPDATE,
    'state_transition': ActionType.STATE_TRANSITION,
    'advance_pipeline': ActionType.STATE_TRANSITION,
    'activate_specialist': ActionType.SPECIALIST_ACTIVATION,
    'activate_protocol': ActionType.PROTOCOL_ACTIVATION,
    'modify_score': ActionType.SCORE_MODIFICATION,
    'halt_pipeline': ActionType.PIPELINE_HALT,
    'log': ActionType.NOTIFICATION // log é tratado como notificação interna
  };

  const mappedType = actionTypeMap[action.type] || action.type;

  switch (mappedType as any) {
    case ActionType.UPDATE_FIELD:
      logs.push(...executeUpdateField(action as UpdateFieldAction, context, actionId));
      break;

    case ActionType.CROSS_VALIDATION:
      logs.push(...executeCrossValidation(action as CrossValidationAction, context, actionId));
      break;

    case ActionType.NOTIFICATION:
      logs.push(...executeNotification(action as NotificationAction, context, actionId));
      break;

    case ActionType.TASK_CREATION:
      logs.push(...executeTaskCreation(action as TaskCreationAction, context, actionId));
      break;

    case ActionType.MEMORY_UPDATE:
      logs.push(...executeMemoryUpdate(action as MemoryUpdateAction, context, actionId));
      break;

    case ActionType.STATE_TRANSITION:
      logs.push(...executeStateTransition(action as StateTransitionAction, context, actionId));
      break;

    case ActionType.SPECIALIST_ACTIVATION:
      logs.push(...executeSpecialistActivation(action, context, actionId));
      break;

    case ActionType.PROTOCOL_ACTIVATION:
      logs.push(...executeProtocolActivation(action, context, actionId));
      break;

    case ActionType.SCORE_MODIFICATION:
      logs.push(...executeScoreModification(action, context, actionId));
      break;

    case ActionType.PIPELINE_HALT:
      logs.push(...executePipelineHalt(action, context, actionId));
      break;

    case 'log':
      // Tratar ação de log como notificação interna
      logs.push({
        id: generateEffectId(),
        actionId,
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message: action.message || action.params?.message || 'Log action',
        metadata: {
          source: 'trigger_action',
          context: {
            caso: context.idCaso,
            etapa: context.etapa,
            especialista: context.especialista
          }
        }
      });
      break;

    case 'advance_pipeline':
      // Tratar advance_pipeline como state transition
      logs.push(...executeStateTransition({
        ...action,
        type: ActionType.STATE_TRANSITION,
        params: {
          fromState: context.etapa,
          toState: action.to_stage || action.params?.to_stage || context.etapa,
          reason: 'Pipeline advancement triggered',
          metadata: action.params
        }
      }, context, actionId));
      break;

    default:
      logs.push({
        id: generateEffectId(),
        actionId,
        timestamp: new Date().toISOString(),
        level: LogLevel.WARNING,
        message: `Tipo de ação não reconhecido: ${action.type}`,
        metadata: { action }
      });
  }

  return logs;
}

// Implementações específicas para cada tipo de ação

function executeUpdateField(action: UpdateFieldAction, context: ExecutionContext, actionId: string): EffectLog[] {
  const { field, value, operator = 'set' } = action.params;
  
  return [{
    id: generateEffectId(),
    actionId,
    timestamp: new Date().toISOString(),
    level: LogLevel.INFO,
    message: `Campo '${field}' ${operator === 'set' ? 'atualizado para' : operator === 'increment' ? 'incrementado em' : 'anexado com'} '${JSON.stringify(value)}'`,
    metadata: {
      field,
      previousValue: (context as any)[field],
      newValue: value,
      operator
    }
  }];
}

function executeCrossValidation(action: CrossValidationAction, context: ExecutionContext, actionId: string): EffectLog[] {
  const { sourceSpecialist, targetSpecialists, dataToValidate, priority } = action.params;
  
  const logs: EffectLog[] = [];
  
  // Log principal da validação cruzada
  logs.push({
    id: generateEffectId(),
    actionId,
    timestamp: new Date().toISOString(),
    level: LogLevel.INFO,
    message: `Validação cruzada iniciada: ${sourceSpecialist} → [${targetSpecialists.join(', ')}]`,
    metadata: {
      sourceSpecialist,
      targetSpecialists,
      dataToValidate,
      priority,
      caso: context.idCaso
    }
  });

  // Simular envio para cada especialista
  targetSpecialists.forEach(specialist => {
    logs.push({
      id: generateEffectId(),
      actionId,
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message: `Solicitação de validação enviada para ${specialist}`,
      metadata: {
        specialist,
        expectedResponseTime: priority === 'critical' ? '5min' : priority === 'high' ? '30min' : '2h'
      }
    });
  });

  return logs;
}

function executeNotification(action: NotificationAction | SyndicateAction, context: ExecutionContext, actionId: string): EffectLog[] {
  // Handle both NotificationAction and generic log actions
  if (action.type === 'log') {
    return [{
      id: generateEffectId(),
      actionId,
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message: action.message || action.params?.message || 'Log notification',
      metadata: {
        channel: 'INTERNAL',
        caso: context.idCaso,
        etapa: context.etapa
      }
    }];
  }

  const notifAction = action as NotificationAction;
  const { channel, recipient, message, severity, metadata } = notifAction.params;
  
  return [{
    id: generateEffectId(),
    actionId,
    timestamp: new Date().toISOString(),
    level: severity === 'critical' ? LogLevel.CRITICAL : 
           severity === 'error' ? LogLevel.ERROR :
           severity === 'warning' ? LogLevel.WARNING : LogLevel.INFO,
    message: `Notificação enviada via ${channel} para ${recipient}`,
    metadata: {
      channel,
      recipient,
      messagePreview: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      severity,
      additionalData: metadata,
      caso: context.idCaso,
      etapa: context.etapa
    }
  }];
}

function executeTaskCreation(action: TaskCreationAction, context: ExecutionContext, actionId: string): EffectLog[] {
  const { taskType, assignee, description, priority, dueDate, dependencies } = action.params;
  
  const taskId = `TASK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return [{
    id: generateEffectId(),
    actionId,
    timestamp: new Date().toISOString(),
    level: LogLevel.INFO,
    message: `Tarefa criada: ${taskType} atribuída a ${assignee}`,
    metadata: {
      taskId,
      taskType,
      assignee,
      description,
      priority,
      dueDate: dueDate || 'Sem prazo definido',
      dependencies: dependencies || [],
      createdFrom: {
        caso: context.idCaso,
        etapa: context.etapa,
        especialista: context.especialista
      }
    }
  }];
}

function executeMemoryUpdate(action: MemoryUpdateAction, context: ExecutionContext, actionId: string): EffectLog[] {
  const { memoryType, operation, key, value, ttl } = action.params;
  
  const logs: EffectLog[] = [];
  
  switch (operation) {
    case 'store':
      logs.push({
        id: generateEffectId(),
        actionId,
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message: `Dado armazenado na memória ${memoryType}: ${key}`,
        metadata: {
          memoryType,
          key,
          valueSize: JSON.stringify(value).length,
          ttl: ttl || 'permanente',
          caso: context.idCaso
        }
      });
      break;
      
    case 'retrieve':
      logs.push({
        id: generateEffectId(),
        actionId,
        timestamp: new Date().toISOString(),
        level: LogLevel.DEBUG,
        message: `Dado recuperado da memória ${memoryType}: ${key}`,
        metadata: {
          memoryType,
          key,
          found: true, // Simulação
          caso: context.idCaso
        }
      });
      break;
      
    case 'update':
      logs.push({
        id: generateEffectId(),
        actionId,
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message: `Dado atualizado na memória ${memoryType}: ${key}`,
        metadata: {
          memoryType,
          key,
          caso: context.idCaso
        }
      });
      break;
      
    case 'delete':
      logs.push({
        id: generateEffectId(),
        actionId,
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message: `Dado removido da memória ${memoryType}: ${key}`,
        metadata: {
          memoryType,
          key,
          caso: context.idCaso
        }
      });
      break;
  }
  
  return logs;
}

function executeStateTransition(action: StateTransitionAction | SyndicateAction, context: ExecutionContext, actionId: string): EffectLog[] {
  let fromState: string;
  let toState: string;
  let reason: string;
  let metadata: any;

  if ('params' in action && action.params) {
    ({ fromState, toState, reason, metadata } = action.params as any);
  } else {
    // Handle advance_pipeline action
    fromState = context.etapa;
    toState = (action as any).to_stage || action.params?.toState || context.etapa;
    reason = 'Pipeline advancement';
    metadata = {};
  }
  
  // Usar o método advancePipeline do contexto
  context.advancePipeline(toState);
  
  return [{
    id: generateEffectId(),
    actionId,
    timestamp: new Date().toISOString(),
    level: LogLevel.INFO,
    message: `Transição de estado: ${fromState} → ${toState}`,
    metadata: {
      fromState,
      toState,
      reason,
      additionalData: metadata,
      caso: context.idCaso,
      especialistaAtivo: context.especialista
    }
  }];
}

function executeSpecialistActivation(action: SyndicateAction, context: ExecutionContext, actionId: string): EffectLog[] {
  const specialistId = action.target || action.params?.specialist || action.params?.specialistId || action.params?.id;
  
  if (!specialistId) {
    return [{
      id: generateEffectId(),
      actionId,
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message: 'ID do especialista não fornecido para ativação',
      metadata: { action }
    }];
  }

  // Usar o método activateSpecialist do contexto
  context.activateSpecialist(specialistId);
  
  return [{
    id: generateEffectId(),
    actionId,
    timestamp: new Date().toISOString(),
    level: LogLevel.INFO,
    message: `Especialista ${specialistId} ativado`,
    metadata: {
      specialistId,
      previousSpecialist: context.especialista,
      caso: context.idCaso,
      etapa: context.etapa
    }
  }];
}

function executeProtocolActivation(action: SyndicateAction, context: ExecutionContext, actionId: string): EffectLog[] {
  const protocolId = action.params?.protocol || action.params?.protocolId || action.params?.id;
  const parameters = action.params?.parameters || {};
  
  if (!protocolId) {
    return [{
      id: generateEffectId(),
      actionId,
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message: 'ID do protocolo não fornecido para ativação',
      metadata: { action }
    }];
  }

  // Usar o método activateProtocol do contexto
  context.activateProtocol(protocolId);
  
  return [{
    id: generateEffectId(),
    actionId,
    timestamp: new Date().toISOString(),
    level: LogLevel.INFO,
    message: `Protocolo ${protocolId} ativado`,
    metadata: {
      protocolId,
      parameters,
      caso: context.idCaso,
      etapa: context.etapa,
      especialista: context.especialista
    }
  }];
}

function executeScoreModification(action: SyndicateAction, context: ExecutionContext, actionId: string): EffectLog[] {
  const field = action.params?.field || 'probabilidade';
  const value = action.params?.value || action.params?.adjustment || 0;
  const operation = action.params?.operation || 'set';
  
  // Usar o método modifyScore do contexto
  context.modifyScore(field, value);
  
  const currentValue = context.probabilidade || 0;
  const newValue = operation === 'increment' ? currentValue + value : value;
  
  return [{
    id: generateEffectId(),
    actionId,
    timestamp: new Date().toISOString(),
    level: newValue < CONFIDENCE_THRESHOLDS.CRITICAL_LOW ? LogLevel.WARNING : LogLevel.INFO,
    message: `Score ${field} ${operation === 'increment' ? 'incrementado em' : 'definido para'} ${value}`,
    metadata: {
      field,
      previousValue: currentValue,
      newValue,
      operation,
      threshold: getConfidenceLevel(newValue),
      caso: context.idCaso
    }
  }];
}

function executePipelineHalt(action: SyndicateAction, context: ExecutionContext, actionId: string): EffectLog[] {
  const reason = action.params?.reason || 'Motivo não especificado';
  const severity = action.params?.severity || 'warning';
  
  // Usar o método haltPipeline do contexto
  try {
    context.haltPipeline(reason);
  } catch (e) {
    // Expected - haltPipeline throws
  }
  
  return [{
    id: generateEffectId(),
    actionId,
    timestamp: new Date().toISOString(),
    level: severity === 'critical' ? LogLevel.CRITICAL : LogLevel.WARNING,
    message: `Pipeline interrompido: ${reason}`,
    metadata: {
      reason,
      severity,
      haltedAt: context.etapa,
      specialist: context.especialista,
      caso: context.idCaso
    }
  }];
}

// Funções auxiliares

function generateEffectId(): string {
  return `EFFECT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getConfidenceLevel(value: number): string {
  if (value >= CONFIDENCE_THRESHOLDS.VERY_HIGH) return 'VERY_HIGH';
  if (value >= CONFIDENCE_THRESHOLDS.HIGH) return 'HIGH';
  if (value >= CONFIDENCE_THRESHOLDS.ACCEPTABLE) return 'ACCEPTABLE';
  if (value >= CONFIDENCE_THRESHOLDS.CONCERNING_LOW) return 'CONCERNING';
  return 'CRITICAL';
}

// Exportar tipos e enums para uso em outros módulos
export {
  ActionType as SyndicateActionType,
  NotificationChannel as SyndicateNotificationChannel
};