import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BpmnEdge, BpmnNode } from '../api/types';
import { ExecutionEngine } from './ExecutionEngine';

const { mockProcesses, bpmnStoreMock } = vi.hoisted(() => {
  const mockProcesses = new Map<string, { nodes: BpmnNode[]; edges: BpmnEdge[]; name: string }>();
  const bpmnStoreMock = {
    processes: mockProcesses,
    activeProcessId: 'main',
    setActiveProcess: vi.fn(),
  };
  return { mockProcesses, bpmnStoreMock };
});

vi.mock('../stores/BpmnStore', () => ({
  bpmnStore: bpmnStoreMock,
}));

describe('ExecutionEngine', () => {
  beforeEach(() => {
    mockProcesses.clear();
    mockProcesses.set('main', {
      name: 'test',
      nodes: [
        {
          id: 'n1',
          type: 'start',
          position: { x: 0, y: 0 },
          data: { label: 'Начало' },
        },
        {
          id: 'n2',
          type: 'finish',
          position: { x: 0, y: 0 },
          data: { label: 'Конец' },
        },
      ],
      edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
    });
    bpmnStoreMock.activeProcessId = 'main';
  });

  it('executes linear flow start -> finish', async () => {
    const engine = new ExecutionEngine({ maxSteps: 50, timeout: 60_000 });
    const res = await engine.execute('main', {});
    expect(res.success).toBe(true);
    expect(res.steps.length).toBeGreaterThanOrEqual(2);
    expect(res.error).toBeUndefined();
  });

  it('fails when process id is unknown', async () => {
    mockProcesses.clear();
    const engine = new ExecutionEngine();
    const res = await engine.execute('missing-process', {});
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/not found/i);
  });

  it('executes flow with condition branch (true path)', async () => {
    mockProcesses.set('main', {
      name: 'conditional',
      nodes: [
        { id: 'n1', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Начало' } },
        {
          id: 'n2',
          type: 'condition',
          position: { x: 0, y: 0 },
          data: {
            label: 'age > 18',
            attributes: [{ name: 'condition', value: 'age > 18' }],
          },
        },
        { id: 'n3', type: 'finish', position: { x: 0, y: 0 }, data: { label: 'Конец' } },
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3', sourceHandle: 'true', label: 'ДА' },
      ],
    });
    const engine = new ExecutionEngine({ maxSteps: 50 });
    const res = await engine.execute('main', { age: 30 });
    expect(res.success).toBe(true);
    expect(res.steps.some((s) => s.nodeType === 'condition')).toBe(true);
  });

  it('respects maxSteps limit', async () => {
    mockProcesses.set('main', {
      name: 'loop',
      nodes: [
        { id: 'n1', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Начало' } },
        { id: 'n2', type: 'action', position: { x: 0, y: 0 }, data: { label: 'A', attributes: [] } },
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n2' },
      ],
    });
    const engine = new ExecutionEngine({ maxSteps: 3 });
    const res = await engine.execute('main', {});
    expect(res.success).toBe(false);
  });
});
