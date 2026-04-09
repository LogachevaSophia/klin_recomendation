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
        } as BpmnNode,
        {
          id: 'n2',
          type: 'finish',
          position: { x: 0, y: 0 },
          data: { label: 'Конец' },
        } as BpmnNode,
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
});
