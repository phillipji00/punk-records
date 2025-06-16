// lib/index.ts - Export principal do Syndicate v3.1

// Re-export types
export * from './types/common';

// Core exports
export { RuntimeOrchestrator } from './runtimeOrchestrator';
export { evaluateTriggers, evaluateTriggersSafe } from './triggerEngine';
export { executeTriggerActions } from './executeTriggerActions';
export { validateAgainstSchema } from './schemaValidator';
export { schemas } from './compiledSchemas';

// Export classes if using new instead of just functions
export type { OrchestrationResult } from './runtimeOrchestrator';