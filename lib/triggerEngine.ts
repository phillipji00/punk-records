// lib/triggerEngine.ts - Syndicate v3.0
// Motor de avaliação de triggers com suporte completo aos tipos e especialistas

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { 
  RuntimeExecutionContext as ExecutionContext, 
  RuntimeTriggerEvaluationResult as TriggerEvaluationResult, 
  SyndicateAction,
  isValidTipoRegistro,
  ESPECIALISTAS
} from './types/common';

// Interfaces específicas do Trigger Engine
interface Condition {
  field: string;
  operator: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'includes_both';
  value: any;
}

interface Rule {
  id: string;
  name: string;
  description: string;
  trigger: {
    event: string;
    conditions: Condition[];
  };
  actions: SyndicateAction[];
  tags?: string[];
}

interface RulesConfig {
  version: string;
  rules: Rule[];
}

// Mapeamento de especialistas entre rules.yaml e personas.md
const SPECIALIST_MAPPING: Record<string, string> = {
  'L Lawliet': ESPECIALISTAS.ESTRATEGISTA,
  'Norman': ESPECIALISTAS.COMPORTAMENTAL,
  'Senku': ESPECIALISTAS.FORENSE,
  'Isagi': ESPECIALISTAS.ESPACIAL,
  'devil_advocate': ESPECIALISTAS.ESTRATEGISTA, // L atua como advogado do diabo
  'Captain Obi': ESPECIALISTAS.ORQUESTRADOR,
  'orquestrador_missao': ESPECIALISTAS.ORQUESTRADOR,
  'estrategista_chefe': ESPECIALISTAS.ESTRATEGISTA,
  'analista_forense': ESPECIALISTAS.FORENSE,
  'analista_comportamental': ESPECIALISTAS.COMPORTAMENTAL,
  'analista_espacial': ESPECIALISTAS.ESPACIAL
};

// Cache de regras para evitar leitura repetida do arquivo
let rulesCache: Rule[] | null = null;
let rulesCacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Avalia uma condição específica contra o valor do contexto
 */
function evaluateCondition(payloadValue: any, operator: Condition['operator'], targetValue: any): boolean {
  switch (operator) {
    case '==': 
      return payloadValue === targetValue;
    
    case '!=': 
      return payloadValue !== targetValue;
    
    case '>': 
      return typeof payloadValue === 'number' && payloadValue > targetValue;
    
    case '>=': 
      return typeof payloadValue === 'number' && payloadValue >= targetValue;
    
    case '<': 
      return typeof payloadValue === 'number' && payloadValue < targetValue;
    
    case '<=': 
      return typeof payloadValue === 'number' && payloadValue <= targetValue;
    
    case 'includes_both':
      return (
        Array.isArray(payloadValue) &&
        Array.isArray(targetValue) &&
        targetValue.every((val: any) => payloadValue.includes(val))
      );
    
    default:
      console.warn(`⚠️ Operador desconhecido: ${operator}`);
      return false;
  }
}

/**
 * Carrega as regras do arquivo YAML com cache
 */
function loadRules(): Rule[] {
  const now = Date.now();
  
  // Verifica se o cache ainda é válido
  if (rulesCache && (now - rulesCacheTimestamp) < CACHE_TTL) {
    return rulesCache;
  }

  // Possíveis caminhos para o arquivo de regras
  const possiblePaths = [
    path.join(__dirname, 'rules.yaml'),
    path.join(__dirname, '..', 'rules.yaml'),
    path.join(process.cwd(), 'lib', 'rules.yaml'),
    path.join(process.cwd(), 'rules.yaml'),
  ];
  
  let rulesPath: string | null = null;
  
  // Busca o arquivo em múltiplos caminhos
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      rulesPath = possiblePath;
      console.log(`✅ rules.yaml encontrado em: ${rulesPath}`);
      break;
    }
  }
  
  if (!rulesPath) {
    console.error('❌ rules.yaml não encontrado em nenhum dos caminhos:', possiblePaths);
    // Retorna regra de fallback mínima
    return [{
      id: 'fallback_rule',
      name: 'Regra de Fallback',
      description: 'Regra padrão quando rules.yaml não é encontrado',
      trigger: {
        event: 'any',
        conditions: []
      },
      actions: [{
        type: 'log',
        params: { message: 'Sistema operando com regras de fallback' }
      }]
    }];
  }
  
  try {
    const fileContent = fs.readFileSync(rulesPath, 'utf8');
    const parsed = yaml.load(fileContent) as RulesConfig;
    
    if (!parsed.rules || !Array.isArray(parsed.rules)) {
      throw new Error('Formato inválido: esperado objeto com array "rules"');
    }
    
    // Atualiza cache
    rulesCache = parsed.rules;
    rulesCacheTimestamp = now;
    
    return parsed.rules;
  } catch (error) {
    console.error('❌ Erro ao carregar rules.yaml:', error);
    return [];
  }
}

/**
 * Extrai valor do contexto com suporte a caminhos aninhados
 */
function getFieldValue(context: ExecutionContext, fieldPath: string): any {
  const parts = fieldPath.split('.');
  let value: any = context;
  
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return undefined;
    }
  }
  
  return value;
}

/**
 * Processa e enriquece as ações com informações adicionais
 */
function processActions(actions: SyndicateAction[], context: ExecutionContext): SyndicateAction[] {
  return actions.map(action => {
    const processedAction = { ...action };
    
    // Mapeia especialistas se necessário
    if (action.type === 'activate_specialist' && action.target) {
      const mappedSpecialist = SPECIALIST_MAPPING[action.target] || action.target;
      processedAction.params = {
        ...processedAction.params,
        specialist: mappedSpecialist,
        originalTarget: action.target
      };
    }
    
    // Adiciona contexto às ações de log
    if (action.type === 'log' && !processedAction.params) {
      processedAction.params = {
        message: action.message || 'Ação de log sem mensagem',
        context: {
          tipo_registro: context.tipo_registro,
          autor: context.autor,
          etapa: context.etapa
        }
      };
    }
    
    // Adiciona timestamp a todas as ações
    processedAction.timestamp = new Date().toISOString();
    
    return processedAction;
  });
}

/**
 * Função principal de avaliação de triggers
 */
export function evaluateTriggers(context: ExecutionContext): TriggerEvaluationResult {
  const rules = loadRules();
  const matchingActions: SyndicateAction[] = [];
  const matchedRuleIds: string[] = [];
  
  // Log do contexto de entrada (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    console.log('\n📊 Contexto de avaliação:', {
      tipo_registro: context.tipo_registro,
      autor: context.autor,
      etapa: context.etapa,
      especialista: context.especialista
    });
  }

  for (const rule of rules) {
    // Verifica se o evento da regra corresponde ao tipo_registro
    if (rule.trigger.event !== context.tipo_registro && rule.trigger.event !== 'any') {
      continue;
    }

    console.log(`\n🔍 Testando regra: ${rule.id} - ${rule.name}`);

    // Avalia todas as condições da regra
    const conditionResults = rule.trigger.conditions.map(condition => {
      const fieldValue = getFieldValue(context, condition.field);
      
      // Validação de campo ausente
      if (fieldValue === undefined) {
        console.log(`⚠️ Campo não encontrado no contexto: ${condition.field}`);
        return false;
      }
      
      // Validação de valores null
      if (fieldValue === null) {
        console.log(`⚠️ Campo ${condition.field} é null`);
        return false;
      }

      // Tratamento especial para arrays (conta elementos se comparando com número)
      const payloadValue = Array.isArray(fieldValue) && typeof condition.value === 'number'
        ? fieldValue.length
        : fieldValue;

      const passed = evaluateCondition(payloadValue, condition.operator, condition.value);

      if (!passed) {
        console.log(`❌ Falha ➜ ${condition.field} ${condition.operator} ${JSON.stringify(condition.value)}`);
        console.log(`   ↪️ valor atual: ${JSON.stringify(payloadValue)}`);
      } else {
        console.log(`✅ Passou ➜ ${condition.field} ${condition.operator} ${JSON.stringify(condition.value)}`);
      }

      return passed;
    });

    // Verifica se todas as condições foram atendidas
    const allConditionsMet = conditionResults.every(Boolean);

    if (allConditionsMet) {
      console.log(`✅ Regra ${rule.id} ativada!`);
      matchedRuleIds.push(rule.id);
      
      // Processa e adiciona as ações
      const processedActions = processActions(rule.actions, context);
      matchingActions.push(...processedActions);
    } else {
      console.log(`❌ Regra ${rule.id} não ativada - nem todas as condições foram atendidas`);
    }
  }

  // Log do resultado final
  if (matchedRuleIds.length > 0) {
    console.log(`\n🎯 Total de regras ativadas: ${matchedRuleIds.length}`);
    console.log(`📋 Regras: ${matchedRuleIds.join(', ')}`);
    console.log(`⚡ Total de ações a executar: ${matchingActions.length}`);
  } else {
    console.log('\n🔇 Nenhuma regra foi ativada para este contexto');
  }

  return {
    triggered: matchedRuleIds.length > 0,
    matchedRules: matchedRuleIds,
    actions: matchingActions,
  };
}

/**
 * Função auxiliar para validar contexto antes de processar
 */
export function validateContext(context: any): context is ExecutionContext {
  if (!context || typeof context !== 'object') {
    console.error('❌ Contexto inválido: deve ser um objeto');
    return false;
  }
  
  // Campos obrigatórios
  const requiredFields = ['idRegistro', 'contexto', 'autor', 'etapa', 'especialista', 'idCaso', 'timestamp'];
  for (const field of requiredFields) {
    if (!(field in context)) {
      console.error(`❌ Contexto inválido: campo obrigatório '${field}' ausente`);
      return false;
    }
  }
  
  // Valida tipo_registro se presente
  if (context.tipo_registro && !isValidTipoRegistro(context.tipo_registro)) {
    console.error(`❌ Contexto inválido: tipo_registro '${context.tipo_registro}' não é válido`);
    return false;
  }
  
  // Valida probabilidade se presente
  if ('probabilidade' in context && (typeof context.probabilidade !== 'number' || context.probabilidade < 0 || context.probabilidade > 100)) {
    console.error(`❌ Contexto inválido: probabilidade deve ser um número entre 0 e 100`);
    return false;
  }
  
  return true;
}

/**
 * Wrapper seguro para evaluateTriggers com validação completa
 */
export function evaluateTriggersSafe(context: any): TriggerEvaluationResult {
  const emptyResult: TriggerEvaluationResult = {
    triggered: false,
    matchedRules: [],
    actions: []
  };
  
  if (!validateContext(context)) {
    return emptyResult;
  }
  
  try {
    return evaluateTriggers(context);
  } catch (error) {
    console.error('❌ Erro ao avaliar triggers:', error);
    return emptyResult;
  }
}

/**
 * Limpa o cache de regras (útil para testes ou hot-reload)
 */
export function clearRulesCache(): void {
  rulesCache = null;
  rulesCacheTimestamp = 0;
  console.log('🗑️ Cache de regras limpo');
}

/**
 * Retorna sugestão de especialista baseado no tipo de registro
 */
export function suggestSpecialist(tipoRegistro: string): string {
  const specialistMap: Record<string, string> = {
    'hipotese': ESPECIALISTAS.ESTRATEGISTA,
    'evidencia': ESPECIALISTAS.FORENSE,
    'perfil_personagem': ESPECIALISTAS.COMPORTAMENTAL,
    'entrada_timeline': ESPECIALISTAS.ESPACIAL,
    'registro_misc': ESPECIALISTAS.ORQUESTRADOR,
    'cross_validation_result': ESPECIALISTAS.ORQUESTRADOR
  };
  
  return specialistMap[tipoRegistro] || ESPECIALISTAS.ORQUESTRADOR;
}