// src/index.ts - Export dos módulos de domínio

// Pipeline exports
export { 
  advanceStage, 
  getStageInfo, 
  canSkipToStage, 
  resetPipeline,
  getPipelineMetrics 
} from './pipelineEngine';

// Obi State Manager
export {
  decidirAcaoObi,
  interpretarEstadoEmocional,
  diagnosticarSistema,
  processarComandoNarrativo
} from './obiStateManager';

// Retry Engine
export {
  avaliarRetry,
  avaliarForcaConclusao,
  aplicarModificacoesRetry
} from './retryEngine';

// Specialist exports
export { 
  gerarAnaliseEspecialista,
  getFullSpecialistName,
  refineAndAnalyze
} from './specialistAgent';

// QA Refiner
export {
  generateRefinementQuestions,
  executeRefinement,
  generateCollaborativeQuestions,
  assessRefinementComplete,
  calculateConfidenceGain
} from './qaRefiner';

// Template Builder
export {
  generatePromptForPersona,
  generateMultiplePrompts,
  selectBestTemplateCategory,
  validateContextForTemplate
} from './personaTemplateBuilder';

// Review Engine
export { reviewAnalysis } from './reviewEngine';

// Export types
export type {
  ObiCommand,
  AnaliseEspecialista,
  RetryInput,
  RetryResponse,
  ReviewInput,
  ReviewResult,
  RefinementInput,
  RefinementQuestion,
  RefinementResult
} from '../lib/types/common';