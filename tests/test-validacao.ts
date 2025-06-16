// tests/test-pipeline-flow.ts
import { ETAPAS_PIPELINE } from '../lib/types/common';

console.log('Etapas do pipeline:');
Object.entries(ETAPAS_PIPELINE).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});

// Verificar progressão
const progressao = {
  'intake_analysis': 'task_delegation',
  'task_delegation': 'collaborative_review',
  'collaborative_review': 'synthesis',
  'synthesis': '???', // Qual vem depois?
};

console.log('\nProgressão esperada pelo teste:');
console.log('synthesis → hypothesis_formation');
console.log('\nMas parece que está retornando algo diferente...');