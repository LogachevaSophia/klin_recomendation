import { describe, it, expect } from 'vitest';
import {
  normalizeProcessList,
  domainProcessToBackendData,
  resolveNodeIdThroughRemap,
  flowEditorStateToBackendData,
  backendDataToClinrecProcess,
} from './clinrecProcessMapper';
import type { BpmnEdge, BpmnNode } from './types';

describe('normalizeProcessList', () => {
  it('returns empty array for null', () => {
    expect(normalizeProcessList(null)).toEqual([]);
  });

  it('unwraps nested array from swagger', () => {
    const inner = [{ id: 'p1', name: 'Test' }];
    expect(normalizeProcessList([inner])).toEqual(inner);
  });

  it('returns flat array as-is', () => {
    const list = [{ id: 'p1' }];
    expect(normalizeProcessList(list)).toEqual(list);
  });
});

describe('domainProcessToBackendData', () => {
  it('maps domain process with pixel coordinates to grid', () => {
    const result = domainProcessToBackendData({
      id: 'proc-1',
      name: 'Алгоритм',
      nodes: [
        {
          id: 1,
          data: { label: 'Начало' },
          positionX: 200,
          positionY: 400,
        },
        {
          id: 2,
          data: { label: 'Действие' },
          json_data: { x: 2, y: 3 },
        },
      ],
      edges: [{ id: 10, source: 1, target: 2 }],
    });
    expect(result.process_id).toBe('proc-1');
    expect(result.nodes[0].json_data).toEqual({ x: 1, y: 2 });
    expect(result.nodes[0].type).toBe(0);
    expect(result.edges[0]).toEqual({ id: '10', source: '1', target: '2' });
  });
});

describe('resolveNodeIdThroughRemap', () => {
  it('follows remap chain', () => {
    const remap = { a: 'b', b: 'c' };
    expect(resolveNodeIdThroughRemap('a', remap)).toBe('c');
  });

  it('returns original id when no remap', () => {
    expect(resolveNodeIdThroughRemap('x', null)).toBe('x');
  });

  it('stops on cycles in remap chain', () => {
    const remap = { a: 'b', b: 'a' };
    expect(resolveNodeIdThroughRemap('a', remap)).toBe('a');
  });
});

describe('flowEditorStateToBackendData', () => {
  const nodes: BpmnNode[] = [
    {
      id: 'uuid-start',
      type: 'start',
      position: { x: 0, y: 0 },
      data: { label: 'Начало: Алгоритм', backendNumericId: 1 },
    },
    {
      id: 'uuid-action',
      type: 'action',
      position: { x: 200, y: 0 },
      data: { label: 'Измерить АД', backendNumericId: 2 },
    },
  ];
  const edges: BpmnEdge[] = [
    { id: 'e1', source: 'uuid-start', target: 'uuid-action' },
  ];

  it('exports editor state with numeric backend ids', () => {
    const result = flowEditorStateToBackendData(nodes, edges, 'p1', 'Алгоритм');
    expect(result.nodes[0].id).toBe(1);
    expect(result.nodes[0].type).toBe(0);
    expect(result.edges[0].source).toBe('1');
    expect(result.edges[0].target).toBe('2');
  });

  it('maps condition edges with ДА/НЕТ handles', () => {
    const condNodes: BpmnNode[] = [
      {
        id: 'c1',
        type: 'condition',
        position: { x: 0, y: 0 },
        data: { label: 'АД > 140', backendNumericId: 1, backendType: 2 },
      },
    ];
    const condEdges: BpmnEdge[] = [
      { id: 'e-yes', source: 'c1', target: 'a1', sourceHandle: 'true', label: 'ДА' },
      { id: 'e-no', source: 'c1', target: 'a2', sourceHandle: 'false', label: 'НЕТ' },
    ];
    const result = flowEditorStateToBackendData(condNodes, condEdges, 'p1', 'Test');
    expect(result.edges[0].data).toEqual({ type: 'condition', value: true });
    expect(result.edges[1].data).toEqual({ type: 'condition', value: false });
  });
});

describe('backendDataToClinrecProcess', () => {
  it('converts to Clinrec PUT body format', () => {
    const body = backendDataToClinrecProcess({
      process_id: 'p1',
      name: 'Test',
      nodes: [
        {
          id: 1,
          type: 3,
          data: { label: 'Action' },
          json_data: { x: 1, y: 2 },
          subprocess_id: null,
        },
      ],
      edges: [{ id: 'edge-uuid', source: '1', target: '1', label: 'loop' }],
    });
    expect(body.process_id).toBe('p1');
    expect((body.nodes as unknown[]).length).toBe(1);
    expect((body.edges as { id: number }[])[0].id).toBe(1);
    expect((body.edges as { source: number }[])[0].source).toBe(1);
  });
});
