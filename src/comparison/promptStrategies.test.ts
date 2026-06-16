import { describe, it, expect } from 'vitest';
import {
  buildComparisonPrompt,
  buildAllStrategyPrompts,
} from './promptStrategies';
import type { ProcessComparison } from '../api/comparisonTypes';

const sampleComparison: ProcessComparison = {
  process1: { id: 'p1', name: 'Гипертония v1' },
  process2: { id: 'p2', name: 'Гипертония v2' },
  nodes: {
    added: [{ id: 5, type: 3, data: { label: 'Назначить АПФ-и' }, json_data: { x: 0, y: 0 }, subprocess_id: null }],
    removed: [],
    modified: [],
    unchanged: [],
  },
  edges: { added: [], removed: [], modified: [], unchanged: [] },
  summary: {
    totalNodes1: 4,
    totalNodes2: 5,
    totalEdges1: 3,
    totalEdges2: 4,
    nodesAdded: 1,
    nodesRemoved: 0,
    nodesModified: 0,
    edgesAdded: 0,
    edgesRemoved: 0,
    edgesModified: 0,
  },
};

describe('promptStrategies', () => {
  it('builds zero_shot prompt with summary', () => {
    const prompt = buildComparisonPrompt(sampleComparison, { strategy: 'zero_shot' });
    expect(prompt).toContain('Гипертония v1');
    expect(prompt).toContain('Назначить АПФ-и');
  });

  it('builds chain_of_thought with numbered steps', () => {
    const prompt = buildComparisonPrompt(sampleComparison, { strategy: 'chain_of_thought' });
    expect(prompt).toMatch(/1\)/);
    expect(prompt).toContain('Риски для пациента');
  });

  it('builds structured_json requesting JSON fields', () => {
    const prompt = buildComparisonPrompt(sampleComparison, { strategy: 'structured_json' });
    expect(prompt).toContain('risk_level');
    expect(prompt).toContain('recommendations');
  });

  it('builds few_shot with example block', () => {
    const prompt = buildComparisonPrompt(sampleComparison, { strategy: 'few_shot' });
    expect(prompt).toContain('АПФ-и');
    expect(prompt).toContain('Пример');
  });

  it('buildAllStrategyPrompts returns all four strategies', () => {
    const all = buildAllStrategyPrompts(sampleComparison);
    expect(Object.keys(all)).toEqual([
      'zero_shot',
      'chain_of_thought',
      'structured_json',
      'few_shot',
    ]);
    expect(all.zero_shot.length).toBeGreaterThan(50);
  });

  it('supports English language', () => {
    const prompt = buildComparisonPrompt(sampleComparison, {
      strategy: 'zero_shot',
      language: 'en',
    });
    expect(prompt).toContain('Compare two clinical');
  });
});
