import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

type Condition = {
  field: string;
  operator: string;
  value: any;
};

type Action = {
  type: string;
  [key: string]: any;
};

type Rule = {
  id: string;
  name: string;
  description: string;
  trigger: {
    event: string;
    conditions: Condition[];
  };
  actions: Action[];
  tags?: string[];
};

type EventPayload = {
  event: string;
  [key: string]: any;
};

// Avalia operadores
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
      return false;
  }
}

// Carrega as regras YAML
function loadRules(): Rule[] {
  const rulesPath = path.join(__dirname, 'rules.yaml');
  const fileContent = fs.readFileSync(rulesPath, 'utf8');
  const parsed = yaml.load(fileContent) as { rules: Rule[] };
  return parsed.rules;
}

// Avalia se o payload ativa alguma regra
export function evaluateTriggers(eventPayload: EventPayload): {
  triggered: boolean;
  matchedRules: string[];
  actions: Action[];
} {
  const rules = loadRules();
  const matchingActions: Action[] = [];
  const matchedRuleIds: string[] = [];

  for (const rule of rules) {
    if (rule.trigger.event !== eventPayload.event) continue;

    console.log(`\n🔍 Testando regra: ${rule.id}`);

    const conditionResults = rule.trigger.conditions.map(condition => {
      const rawValue = eventPayload[condition.field];

      // Se esperarmos um número e o valor for array, usa .length
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
      matchedRuleIds.push(rule.id);
      matchingActions.push(...rule.actions);
    }
  }

  return {
    triggered: matchedRuleIds.length > 0,
    matchedRules: matchedRuleIds,
    actions: matchingActions,
  };
}
