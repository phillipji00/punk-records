// lib/types/common.ts - Tipos compartilhados entre módulos

export interface CasoStatus {
  etapa: string;
  especialista: string;
  probabilidade?: number; // Sempre number, nunca null
  timestamp: string;
}

export interface IngestEvent {
  id: string;
  timestamp: string;
  tipo_registro: TipoRegistro;
  autor: string;
  dados: RegistroDados;
  etapa: string;
  especialista?: string;
  id_caso: string;
  trace_id?: string;
}

export type TipoRegistro = 
  | 'hipotese' 
  | 'evidencia' 
  | 'perfil_personagem' 
  | 'entrada_timeline' 
  | 'registro_misc' 
  | 'cross_validation_result';

export interface RegistroDados {
  descricao?: string;
  probabilidade?: number;
  arquivo_alvo?: string;
  conteudo?: string;
  [key: string]: any;
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
  tipo_registro?: TipoRegistro;
}

export interface SyndicateAction {
  id?: string;
  type: string;
  params?: Record<string, any>;
  [key: string]: any;
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

// Type guards para validação runtime
export function isValidProbabilidade(value: any): value is number {
  return typeof value === 'number' && value >= 0 && value <= 100;
}

export function isValidTipoRegistro(value: any): value is TipoRegistro {
  const tipos: TipoRegistro[] = [
    'hipotese', 
    'evidencia', 
    'perfil_personagem', 
    'entrada_timeline', 
    'registro_misc', 
    'cross_validation_result'
  ];
  return typeof value === 'string' && tipos.includes(value as TipoRegistro);
}

export function isValidIngestEvent(event: any): event is IngestEvent {
  return (
    event &&
    typeof event === 'object' &&
    typeof event.id === 'string' &&
    typeof event.timestamp === 'string' &&
    isValidTipoRegistro(event.tipo_registro) &&
    typeof event.autor === 'string' &&
    typeof event.dados === 'object' &&
    typeof event.etapa === 'string' &&
    typeof event.id_caso === 'string'
  );
}

// Constantes compartilhadas
export const ESPECIALISTAS = {
  ORQUESTRADOR: 'orquestrador_missao',
  ESTRATEGISTA: 'estrategista_chefe',
  FORENSE: 'analista_forense',
  COMPORTAMENTAL: 'analista_comportamental',
  ESPACIAL: 'analista_espacial'
} as const;

export const ETAPAS_PIPELINE = {
  INTAKE: 'intake_analysis',
  DELEGATION: 'task_delegation',
  VALIDATION: 'validation',
  SYNTHESIS: 'synthesis',
  HYPOTHESIS: 'hypothesis_formation',
  REVIEW: 'collaborative_review',
  ASSESSMENT: 'final_assessment',
  ARCHIVAL: 'archival'
} as const;

export const CONFIDENCE_THRESHOLDS = {
  CRITICAL_LOW: 40,
  CONCERNING_LOW: 60,
  ACCEPTABLE: 80,
  HIGH: 90,
  VERY_HIGH: 95
} as const;
