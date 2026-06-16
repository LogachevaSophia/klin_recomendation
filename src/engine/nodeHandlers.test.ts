import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  NodeHandlerFactory,
  StartNodeHandler,
  FinishNodeHandler,
  ActionNodeHandler,
  ConditionNodeHandler,
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
    };
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
    };
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

  it('updates patient data from patient.* attributes', async () => {
    const handler = new ActionNodeHandler();
    const context = ctx({ age: 50 });
    const node: BpmnNode = {
      id: 'a1',
      type: 'action',
      position: { x: 0, y: 0 },
      data: {
        label: 'Обновить',
        attributes: [{ name: 'patient.systolicBP', value: '145' }],
      },
    } as BpmnNode;
    const edges: BpmnEdge[] = [{ id: 'e1', source: 'a1', target: 'a2' }];
    await handler.execute(node, context, edges);
    expect(context.patientData.systolicBP).toBe(145);
  });

  it('pauses when require: field is missing', async () => {
    const handler = new ActionNodeHandler();
    const node: BpmnNode = {
      id: 'a1',
      type: 'action',
      position: { x: 0, y: 0 },
      data: {
        label: 'Ввод',
        attributes: [{ name: 'require:systolicBP', value: 'Введите АД' }],
      },
    } as BpmnNode;
    const out = await handler.execute(node, ctx(), []);
    expect(out.shouldContinue).toBe(false);
    expect(out.result?.requiresData).toBe(true);
  });
});

describe('ConditionNodeHandler', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('routes to true branch when comparison passes', async () => {
    const handler = new ConditionNodeHandler();
    const node: BpmnNode = {
      id: 'c1',
      type: 'condition',
      position: { x: 0, y: 0 },
      data: {
        label: 'АД > 140',
        attributes: [
          { name: 'inputField', value: 'systolicBP' },
          { name: 'inputType', value: 'number' },
          { name: 'compareOperator', value: '>' },
          { name: 'compareValue', value: '140' },
        ],
      },
    } as BpmnNode;
    const edges: BpmnEdge[] = [
      { id: 'e-yes', source: 'c1', target: 'yes-node', sourceHandle: 'true' },
      { id: 'e-no', source: 'c1', target: 'no-node', sourceHandle: 'false' },
    ];
    const out = await handler.execute(node, ctx({ systolicBP: 150 }), edges);
    expect(out.conditionResult).toBe(true);
    expect(out.nextNodeId).toBe('yes-node');
  });

  it('routes to false branch when comparison fails', async () => {
    const handler = new ConditionNodeHandler();
    const node: BpmnNode = {
      id: 'c1',
      type: 'condition',
      position: { x: 0, y: 0 },
      data: {
        label: 'АД > 140',
        attributes: [
          { name: 'inputField', value: 'systolicBP' },
          { name: 'inputType', value: 'number' },
          { name: 'compareOperator', value: '>' },
          { name: 'compareValue', value: '140' },
        ],
      },
    } as BpmnNode;
    const edges: BpmnEdge[] = [
      { id: 'e-yes', source: 'c1', target: 'yes-node', sourceHandle: 'true' },
      { id: 'e-no', source: 'c1', target: 'no-node', sourceHandle: 'false' },
    ];
    const out = await handler.execute(node, ctx({ systolicBP: 120 }), edges);
    expect(out.conditionResult).toBe(false);
    expect(out.nextNodeId).toBe('no-node');
  });
});
