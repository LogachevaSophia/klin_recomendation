import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConditionEvaluator } from './conditionEvaluator';
import type { ExecutionContext } from './types';

function makeContext(patientData: Record<string, unknown> = {}, variables: Record<string, unknown> = {}): ExecutionContext {
  return {
    patientData,
    variables,
    executionHistory: [],
    currentPath: [],
  };
}

describe('ConditionEvaluator', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('evaluates numeric comparison on patientData', () => {
    const ctx = makeContext({ age: 25 });
    expect(ConditionEvaluator.evaluate('age > 18', ctx)).toBe(true);
    expect(ConditionEvaluator.evaluate('age < 18', ctx)).toBe(false);
  });

  it('supports has() for defined keys', () => {
    const ctx = makeContext({ cough: true });
    expect(ConditionEvaluator.evaluate("has('cough')", ctx)).toBe(true);
    expect(ConditionEvaluator.evaluate("has('missing')", ctx)).toBe(false);
  });

  it('uses context variables', () => {
    const ctx = makeContext({ age: 20 }, { flag: true });
    expect(ConditionEvaluator.evaluate('flag', ctx)).toBe(true);
  });

  it('returns false on invalid expression', () => {
    const ctx = makeContext({});
    expect(ConditionEvaluator.evaluate('@@@invalid@@@', ctx)).toBe(false);
  });

  it('supports symptoms.includes pattern when symptoms is array', () => {
    const ctx = makeContext({ symptoms: ['кашель', 'озноб'] });
    expect(
      ConditionEvaluator.evaluate("symptoms && symptoms.includes('кашель')", ctx)
    ).toBe(true);
  });
});
