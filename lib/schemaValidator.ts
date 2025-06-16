/**
 * Syndicate v3.0 - Schema Validator
 * Validação runtime de schemas com Ajv, cache e mensagens contextualizadas
 * Mantém compatibilidade com schemas v2.0
 */

import Ajv, { ValidateFunction, ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import { schemas, isValidSchemaId, SchemaId } from "./compiledSchemas";

// Inicializa Ajv com configurações otimizadas
const ajv = new Ajv({ 
  allErrors: true,
  coerceTypes: false,
  useDefaults: true,
  removeAdditional: false,
  verbose: true,
  strict: false, // Desabilitado para compatibilidade com schemas v2.0
  validateFormats: true
});

// Adiciona suporte para formatos (date-time, etc)
addFormats(ajv);

// Cache de validators compilados para performance
const validatorCache = new Map<string, ValidateFunction>();

// Mensagens de erro contextualizadas em português
const errorMessages: Record<string, (params: any) => string> = {
  required: (params) => `Campo obrigatório '${params.missingProperty}' não foi fornecido`,
  type: (params) => `Campo '${params.instancePath.replace(/^\//, '').replace(/\//g, '.')}' deve ser do tipo ${params.type}`,
  minimum: (params) => `Campo '${params.instancePath.replace(/^\//, '').replace(/\//g, '.')}' deve ser maior ou igual a ${params.limit}`,
  maximum: (params) => `Campo '${params.instancePath.replace(/^\//, '').replace(/\//g, '.')}' deve ser menor ou igual a ${params.limit}`,
  minLength: (params) => `Campo '${params.instancePath.replace(/^\//, '').replace(/\//g, '.')}' deve ter no mínimo ${params.limit} caracteres`,
  maxLength: (params) => `Campo '${params.instancePath.replace(/^\//, '').replace(/\//g, '.')}' deve ter no máximo ${params.limit} caracteres`,
  minItems: (params) => `Campo '${params.instancePath.replace(/^\//, '').replace(/\//g, '.')}' deve ter no mínimo ${params.limit} itens`,
  maxItems: (params) => `Campo '${params.instancePath.replace(/^\//, '').replace(/\//g, '.')}' deve ter no máximo ${params.limit} itens`,
  pattern: (params) => `Campo '${params.instancePath.replace(/^\//, '').replace(/\//g, '.')}' não está no formato esperado: ${params.pattern}`,
  enum: (params) => `Campo '${params.instancePath.replace(/^\//, '').replace(/\//g, '.')}' deve ser um dos valores: ${params.allowedValues?.join(', ') || 'valores permitidos'}`,
  format: (params) => `Campo '${params.instancePath.replace(/^\//, '').replace(/\//g, '.')}' não está no formato ${params.format}`,
  additionalProperties: () => `Propriedades adicionais não são permitidas neste schema`,
  $ref: () => `Erro ao resolver referência do schema`
};

/**
 * Interface para resultado de validação
 */
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

/**
 * Interface para erro de validação formatado
 */
export interface ValidationError {
  field: string;
  message: string;
  type: string;
  details?: any;
}

/**
 * Formata erros do Ajv para mensagens mais amigáveis
 */
function formatErrors(errors: ErrorObject[] | null | undefined): ValidationError[] {
  if (!errors) return [];

  return errors.map(error => {
    const field = error.instancePath.replace(/^\//, '').replace(/\//g, '.') || error.params.missingProperty || 'root';
    const type = error.keyword;
    
    // Busca mensagem contextualizada
    const messageFormatter = errorMessages[type];
    const message = messageFormatter 
      ? messageFormatter({
          ...error.params,
          instancePath: error.instancePath,
          dataPath: field,
          allowedValues: error.params.allowedValues
        })
      : error.message || 'Erro de validação desconhecido';

    return {
      field,
      message,
      type,
      details: error.params
    };
  });
}

/**
 * Resolve referências $ref nos schemas
 */
function resolveSchemaRefs(schema: any): any {
  if (schema.$ref) {
    const refPath = schema.$ref.replace('#/definitions/', '');
    return schemas[refPath as keyof typeof schemas] || schema;
  }
  return schema;
}

/**
 * Obtém ou cria um validator compilado para o schema
 */
function getValidator(schemaId: SchemaId): ValidateFunction {
  // Verifica cache primeiro
  let validator = validatorCache.get(schemaId);
  
  if (!validator) {
    // Resolve schema (pode ter $ref)
    let schema = resolveSchemaRefs(schemas[schemaId]);
    
    // Compila e adiciona ao cache
    validator = ajv.compile(schema);
    validatorCache.set(schemaId, validator);
  }
  
  return validator;
}

/**
 * Valida dados contra um schema específico
 * 
 * @param schemaId - ID do schema a ser usado
 * @param data - Dados a serem validados
 * @returns Resultado da validação com erros formatados
 */
export function validateAgainstSchema(
  schemaId: string,
  data: any
): ValidationResult {
  // Mapeamento de aliases v3.0 para schemas v2.0
  const schemaMapping: Record<string, string> = {
    'hypothesis': 'strategic_analysis_schema',
    'evidence': 'forensic_analysis_schema',
    'psychological_profile': 'psychological_analysis_schema',
    'spatial_analysis': 'tactical_analysis_schema',
    'coordination_report': 'coordination_report_schema'
  };

  // Resolve alias se existir
  const resolvedSchemaId = schemaMapping[schemaId] || schemaId;

  // Validação inicial do schemaId
  if (!isValidSchemaId(resolvedSchemaId)) {
    return {
      valid: false,
      errors: [{
        field: 'schemaId',
        message: `Schema '${schemaId}' não encontrado. Schemas disponíveis: ${Object.keys(schemas).join(', ')}`,
        type: 'invalid_schema'
      }]
    };
  }

  // Validação de dados nulos ou undefined
  if (data === null || data === undefined) {
    return {
      valid: false,
      errors: [{
        field: 'data',
        message: 'Dados não podem ser nulos ou indefinidos',
        type: 'null_data'
      }]
    };
  }

  try {
    // Obtém validator (com cache)
    const validate = getValidator(resolvedSchemaId as SchemaId);
    
    // Executa validação
    const valid = validate(data) as boolean;
    
    if (valid) {
      return { valid: true };
    } else {
      return {
        valid: false,
        errors: formatErrors(validate.errors)
      };
    }
  } catch (error) {
    // Tratamento de erros inesperados
    return {
      valid: false,
      errors: [{
        field: 'validation',
        message: `Erro inesperado durante validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        type: 'validation_error',
        details: error
      }]
    };
  }
}

/**
 * Type guards para validação TypeScript integrada
 */
export function isStrategicAnalysisValid(data: unknown): data is import('./compiledSchemas').StrategicAnalysisSchema {
  return validateAgainstSchema('strategic_analysis_schema', data).valid;
}

export function isForensicAnalysisValid(data: unknown): data is import('./compiledSchemas').ForensicAnalysisSchema {
  return validateAgainstSchema('forensic_analysis_schema', data).valid;
}

export function isPsychologicalAnalysisValid(data: unknown): data is import('./compiledSchemas').PsychologicalAnalysisSchema {
  return validateAgainstSchema('psychological_analysis_schema', data).valid;
}

export function isTacticalAnalysisValid(data: unknown): data is import('./compiledSchemas').TacticalAnalysisSchema {
  return validateAgainstSchema('tactical_analysis_schema', data).valid;
}

export function isCoordinationReportValid(data: unknown): data is import('./compiledSchemas').CoordinationReportSchema {
  return validateAgainstSchema('coordination_report_schema', data).valid;
}

export function isCrossValidationResultValid(data: unknown): data is import('./compiledSchemas').CrossValidationResultSchema {
  return validateAgainstSchema('cross_validation_result', data).valid;
}

export function isTimelineEntryValid(data: unknown): data is import('./compiledSchemas').TimelineEntrySchema {
  return validateAgainstSchema('entrada_timeline', data).valid;
}

export function isMiscRecordValid(data: unknown): data is import('./compiledSchemas').MiscRecordSchema {
  return validateAgainstSchema('registro_misc', data).valid;
}

/**
 * Função auxiliar para validar múltiplos objetos
 */
export function validateBatch(
  schemaId: string,
  dataArray: any[]
): { results: ValidationResult[], summary: { valid: number, invalid: number } } {
  const results = dataArray.map(data => validateAgainstSchema(schemaId, data));
  const valid = results.filter(r => r.valid).length;
  const invalid = results.length - valid;
  
  return {
    results,
    summary: { valid, invalid }
  };
}

/**
 * Limpa o cache de validators (útil para testes ou hot-reload)
 */
export function clearValidatorCache(): void {
  validatorCache.clear();
}

/**
 * Obtém estatísticas do cache
 */
export function getCacheStats(): { size: number, schemas: string[] } {
  return {
    size: validatorCache.size,
    schemas: Array.from(validatorCache.keys())
  };
}

/**
 * Valida um registro do tipo ingest event
 */
export function validateIngestEvent(event: any): ValidationResult {
  // Validação básica da estrutura
  if (!event || typeof event !== 'object') {
    return {
      valid: false,
      errors: [{
        field: 'event',
        message: 'Evento deve ser um objeto',
        type: 'invalid_type'
      }]
    };
  }

  // Mapeia tipo_registro para schema apropriado
  const schemaMapping: Record<string, string> = {
    'hipotese': 'strategic_analysis_schema',
    'evidencia': 'forensic_analysis_schema',
    'perfil_personagem': 'psychological_analysis_schema',
    'entrada_timeline': 'entrada_timeline',
    'registro_misc': 'registro_misc',
    'cross_validation_result': 'cross_validation_result'
  };

  const schemaId = schemaMapping[event.tipo_registro];
  
  if (!schemaId) {
    return {
      valid: false,
      errors: [{
        field: 'tipo_registro',
        message: `Tipo de registro '${event.tipo_registro}' não reconhecido`,
        type: 'invalid_tipo_registro'
      }]
    };
  }

  // Valida dados contra schema específico
  return validateAgainstSchema(schemaId, event.dados);
}

// Re-export types dos schemas compilados
export type {
  StrategicAnalysisSchema,
  ForensicAnalysisSchema,
  PsychologicalAnalysisSchema,
  TacticalAnalysisSchema,
  CoordinationReportSchema,
  CrossValidationResultSchema,
  TimelineEntrySchema,
  MiscRecordSchema
} from "./compiledSchemas";