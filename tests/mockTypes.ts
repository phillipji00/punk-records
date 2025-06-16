// Mock types for testing
export interface RefinementResult {
  questions: Array<{ question: string; targetVariable: string; priority: number }>;
  mode: string;
  estimatedQuestions: number;
  confidenceTarget: number;
  escapeAvailable: boolean;
}

export function calculateConfidenceGain(response: string): number {
  if (response.length < 10) return 0;
  if (response.toLowerCase().includes('não sei')) return 0;
  return Math.min(20, response.length / 5);
}

export function selectBestTemplateCategory(persona: string): string {
  const categories: Record<string, string> = {
    'estrategista_chefe': 'deteccao_contradicao',
    'orquestrador_missao': 'sintese_final',
    'analista_forense': 'analise_inicial'
  };
  return categories[persona] || 'analise_inicial';
}

export function validateContextForTemplate(context: any, requiredFields: string[]): boolean {
  if (!context || typeof context !== 'object') return false;
  return requiredFields.every(field => field in context);
}

export function executeRefinement(_input: any): RefinementResult {
  return {
    questions: [
      { question: 'Teste?', targetVariable: 'test', priority: 1 }
    ],
    mode: 'rapid',
    estimatedQuestions: 1,
    confidenceTarget: 80,
    escapeAvailable: true
  };
}
