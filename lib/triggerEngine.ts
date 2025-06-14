// triggerEngine.ts — versão corrigida com validação de campos

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Tipos importados (adicionar no arquivo real)
interface ExecutionContext {
  tipo_registro: string;
  [key: string]: any;
}

interface SyndicateAction {
  type: string;
  [key: string]: any;
}

interface TriggerEvaluationResult {
  triggered: boolean;
  matchedRules: string[];
  actions: SyndicateAction[];
}

interface Condition {
  field: string;
  operator: string;
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

function evaluateCondition(payloadValue: any, operator: string, targetValue: any): boolean {
  switch (operator) {
    case '==': return payloadValue === targetValue;
    case '!=': return payloadValue !== targetValue;
    case '>': return payloadValue > targetValue;
    case '>=': return payloadValue >= targetValue;
    case '<': return payloadValue < targetValue;
    case '<=': return payloadValue <= targetValue;
    case 'includes_both':
      return (
        Array.isArray(payloadValue) &&
        Array.isArray(targetValue) &&
        targetValue.every(val => payloadValue.includes(val))
      );
    default:
      console.warn(`⚠️ Operador desconhecido: ${operator}`);
    return false;
  }
}

function loadRules(): Rule[] {
  // Tentar múltiplos caminhos possíveis
  const possiblePaths = [
    path.join(__dirname, 'rules.yaml'),
    path.join(__dirname, '..', 'lib', 'rules.yaml'),
    path.join(process.cwd(), 'lib', 'rules.yaml'),
    path.join(process.cwd(), 'rules.yaml'),
  ];
  
  let rulesPath: string | null = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      rulesPath = possiblePath;
      console.log(`✅ rules.yaml encontrado em: ${rulesPath}`);
      break;
    }
  }
  
  if (!rulesPath) {
    console.error('❌ rules.yaml não encontrado em nenhum dos caminhos:', possiblePaths);
    // Retornar regras padrão mínimas
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
        message: 'Sistema operando com regras de fallback'
      }]
    }];
  }
  
  try {
    const fileContent = fs.readFileSync(rulesPath, 'utf8');
    const parsed = yaml.load(fileContent) as { rules: Rule[] };
    return parsed.rules || [];
  } catch (error) {
    console.error('❌ Erro ao carregar rules.yaml:', error);
    return [];
  }
}

export function evaluateTriggers(context: ExecutionContext): TriggerEvaluationResult {
  const rules = loadRules();
  const matchingActions: SyndicateAction[] = [];
  const matchedRuleIds: string[] = [];

  for (const rule of rules) {
    if (rule.trigger.event !== context.tipo_registro) continue;

    console.log(`\n🔍 Testando regra: ${rule.id}`);

    const conditionResults = rule.trigger.conditions.map(condition => {
      // CORREÇÃO CRÍTICA: Validar existência do campo
      if (!(condition.field in context)) {
        console.log(`⚠️ Campo não encontrado no contexto: ${condition.field}`);
        return false; // Campo não existe, condição falha
      }

      const rawValue = context[condition.field];
      
      // Validação adicional para valores null/undefined
      if (rawValue === null || rawValue === undefined) {
        console.log(`⚠️ Campo ${condition.field} é null ou undefined`);
    return false;
      }

      const payloadValue =
        Array.isArray(rawValue) && typeof condition.value === 'number'
          ? rawValue.length
          : rawValue;

      const passed = evaluateCondition(payloadValue, condition.operator, condition.value);

      if (!passed) {
        console.log(`❌ Falha ➜ ${condition.field} ${condition.operator} ${JSON.stringify(condition.value)}`);
        console.log(`   ↪️ recebido: ${JSON.stringify(payloadValue)}`);
      } else {
        console.log(`✅ Passou ➜ ${condition.field} ${condition.operator} ${JSON.stringify(condition.value)}`);
      }

      return passed;
    });

    const allConditionsMet = conditionResults.every(Boolean);

    if (allConditionsMet) {
      console.log(`✅ Regra ${rule.id} ativada!`);
      matchedRuleIds.push(rule.id);
      matchingActions.push(...rule.actions);
    } else {
      console.log(`❌ Regra ${rule.id} não ativada - nem todas as condições foram atendidas`);
    }
  }

  return {
    triggered: matchedRuleIds.length > 0,
    matchedRules: matchedRuleIds,
    actions: matchingActions,
  };
}

// Função auxiliar para validar contexto antes de processar
export function validateContext(context: any): context is ExecutionContext {
  if (!context || typeof context !== 'object') {
    console.error('❌ Contexto inválido: deve ser um objeto');
    return false;
  }
  
  if (!context.tipo_registro || typeof context.tipo_registro !== 'string') {
    console.error('❌ Contexto inválido: tipo_registro é obrigatório');
    return false;
  }
  
    return true;
}

// Wrapper seguro para evaluateTriggers
export function evaluateTriggerssSafe(context: any): TriggerEvaluationResult {
  if (!validateContext(context)) {
    return {
      triggered: false,
      matchedRules: [],
      actions: []
    };
  }
  
  try {
    return evaluateTriggers(context);
  } catch (error) {
    console.error('❌ Erro ao avaliar triggers:', error);
    return {
      triggered: false,
      matchedRules: [],
      actions: []
    };
  }
}