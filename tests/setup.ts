// Test setup file
export interface MockContext {
  executionId: string;
  startTime: Date;
  input: { content: string };
  state: {
    phase: 'initialization' | 'validation' | 'analysis' | 'synthesis' | 'completed' | 'error';
    activatedSpecialists: string[];
    partialResults: Map<any, any>;
    flags: {};
  };
  config: {};
  actionHistory: any[];
  effectLogs: any[];
}

export function createMockContext(overrides: any = {}): MockContext {
  return {
    executionId: 'test-123',
    startTime: new Date(),
    input: { content: 'teste' },
    state: {
      phase: 'analysis' as const,
      activatedSpecialists: [],
      partialResults: new Map(),
      flags: {}
    },
    config: {},
    actionHistory: [],
    effectLogs: [],
    ...overrides
  };
}
