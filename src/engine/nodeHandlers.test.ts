import { describe, it, expect } from 'vitest';
import {
  NodeHandlerFactory,
  StartNodeHandler,
  FinishNodeHandler,
  ActionNodeHandler,
} from './nodeHandlers';
import type { BpmnEdge, BpmnNode } from '../api/types';
import type { ExecutionContext } from './types';

function ctx(patientData: Record<string, unknown> = {}): ExecutionContext {
  return {
    patientData,
    variables: {},
    executionHistory: [],
    currentPath: [],
  };
}

describe('NodeHandlerFactory', () => {
  it('returns handlers for known types', () => {
    expect(NodeHandlerFactory.getHandler('start')).toBeInstanceOf(StartNodeHandler);
    expect(NodeHandlerFactory.getHandler('finish')).toBeInstanceOf(FinishNodeHandler);
    expect(NodeHandlerFactory.getHandler('action')).toBeInstanceOf(ActionNodeHandler);
  });

  it('defaults unknown type to ActionNodeHandler', () => {
    expect(NodeHandlerFactory.getHandler('unknown')).toBeInstanceOf(ActionNodeHandler);
  });
});

describe('StartNodeHandler', () => {
  it('moves to next node via edge', async () => {
    const handler = new StartNodeHandler();
    const node: BpmnNode = {
      id: 'n1',
      type: 'start',
      position: { x: 0, y: 0 },
      data: { label: 'Начало' },
    } as BpmnNode;
    const edges: BpmnEdge[] = [
      { id: 'e1', source: 'n1', target: 'n2' },
    ];
    const out = await handler.execute(node, ctx(), edges);
    expect(out.nextNodeId).toBe('n2');
    expect(out.shouldContinue).toBe(true);
  });
});

describe('FinishNodeHandler', () => {
  it('marks final and stops', async () => {
    const handler = new FinishNodeHandler();
    const node: BpmnNode = {
      id: 'f1',
      type: 'finish',
      position: { x: 0, y: 0 },
      data: { label: 'Конец' },
    } as BpmnNode;
    const out = await handler.execute(node, ctx(), []);
    expect(out.shouldContinue).toBe(false);
    expect(out.result?.final).toBe(true);
  });
});

describe('ActionNodeHandler', () => {
  it('follows outgoing edge', async () => {
    const handler = new ActionNodeHandler();
    const node: BpmnNode = {
      id: 'a1',
      type: 'action',
      position: { x: 0, y: 0 },
      data: { label: 'Действие', attributes: [] },
    } as BpmnNode;
    const edges: BpmnEdge[] = [{ id: 'e1', source: 'a1', target: 'a2' }];
    const out = await handler.execute(node, ctx(), edges);
    expect(out.nextNodeId).toBe('a2');
  });
});
