import { describe, it, expect } from 'vitest';
import { compareGraphs } from './graphDiff';
import type { BackendData } from '../api/types';

function makeProcess(
  id: string,
  name: string,
  nodes: BackendData['nodes'],
  edges: BackendData['edges'] = [],
): BackendData {
  return { process_id: id, name, nodes, edges };
}

const baseNode = (id: number, label: string, type = 3) => ({
  id,
  type,
  data: { label },
  json_data: { x: 1, y: 2 },
  subprocess_id: null,
});

describe('compareGraphs', () => {
  it('detects identical graphs as unchanged', () => {
    const p = makeProcess('p1', 'A', [baseNode(1, 'Start')]);
    const result = compareGraphs(p, { ...p, process_id: 'p2', name: 'B' });
    expect(result.nodes.unchanged).toHaveLength(1);
    expect(result.nodes.added).toHaveLength(0);
    expect(result.nodes.removed).toHaveLength(0);
    expect(result.nodes.modified).toHaveLength(0);
  });

  it('detects added and removed nodes', () => {
    const p1 = makeProcess('p1', 'Old', [baseNode(1, 'A'), baseNode(2, 'B')]);
    const p2 = makeProcess('p2', 'New', [baseNode(1, 'A'), baseNode(3, 'C')]);
    const result = compareGraphs(p1, p2);
    expect(result.nodes.removed.map((n) => n.id)).toEqual([2]);
    expect(result.nodes.added.map((n) => n.id)).toEqual([3]);
    expect(result.summary.nodesRemoved).toBe(1);
    expect(result.summary.nodesAdded).toBe(1);
  });

  it('detects modified node label', () => {
    const p1 = makeProcess('p1', 'A', [baseNode(1, 'Действие A')]);
    const p2 = makeProcess('p2', 'B', [baseNode(1, 'Действие B')]);
    const result = compareGraphs(p1, p2);
    expect(result.nodes.modified).toHaveLength(1);
    expect(result.nodes.modified[0].changes?.label).toEqual({
      old: 'Действие A',
      new: 'Действие B',
    });
  });

  it('detects edge additions and removals', () => {
    const p1 = makeProcess(
      'p1',
      'A',
      [baseNode(1, 'A'), baseNode(2, 'B')],
      [{ id: '1', source: '1', target: '2' }],
    );
    const p2 = makeProcess(
      'p2',
      'B',
      [baseNode(1, 'A'), baseNode(2, 'B')],
      [
        { id: '1', source: '1', target: '2' },
        { id: '2', source: '2', target: '1', label: 'back' },
      ],
    );
    const result = compareGraphs(p1, p2);
    expect(result.edges.added).toHaveLength(1);
    expect(result.edges.removed).toHaveLength(0);
    expect(result.summary.edgesAdded).toBe(1);
  });
});
