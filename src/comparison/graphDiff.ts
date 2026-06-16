import type { BackendData, BackendEdge, BackendNode } from '../api/types';
import type {
  EdgeComparison,
  NodeComparison,
  ProcessComparison,
} from '../api/comparisonTypes';

function nodeKey(n: BackendNode): string {
  return String(n.id);
}

function edgeKey(e: BackendEdge): string {
  return `${e.source}->${e.target}:${e.label ?? ''}`;
}

function nodesEqual(a: BackendNode, b: BackendNode): boolean {
  return (
    a.type === b.type &&
    a.data.label === b.data.label &&
    a.json_data.x === b.json_data.x &&
    a.json_data.y === b.json_data.y &&
    (a.subprocess_id ?? null) === (b.subprocess_id ?? null)
  );
}

function nodeChanges(
  oldNode: BackendNode,
  newNode: BackendNode,
): NodeComparison['changes'] | undefined {
  const changes: NonNullable<NodeComparison['changes']> = {};
  if (oldNode.data.label !== newNode.data.label) {
    changes.label = { old: oldNode.data.label, new: newNode.data.label };
  }
  if (
    oldNode.json_data.x !== newNode.json_data.x ||
    oldNode.json_data.y !== newNode.json_data.y
  ) {
    changes.position = {
      old: { x: oldNode.json_data.x, y: oldNode.json_data.y },
      new: { x: newNode.json_data.x, y: newNode.json_data.y },
    };
  }
  if (oldNode.type !== newNode.type) {
    changes.type = { old: oldNode.type, new: newNode.type };
  }
  return Object.keys(changes).length > 0 ? changes : undefined;
}

function edgesEqual(a: BackendEdge, b: BackendEdge): boolean {
  return (
    a.source === b.source &&
    a.target === b.target &&
    (a.label ?? '') === (b.label ?? '') &&
    JSON.stringify(a.data ?? null) === JSON.stringify(b.data ?? null)
  );
}

function edgeChanges(
  oldEdge: BackendEdge,
  newEdge: BackendEdge,
): EdgeComparison['changes'] | undefined {
  const changes: NonNullable<EdgeComparison['changes']> = {};
  if (oldEdge.source !== newEdge.source) {
    changes.source = {
      old: Number(oldEdge.source),
      new: Number(newEdge.source),
    };
  }
  if (oldEdge.target !== newEdge.target) {
    changes.target = {
      old: Number(oldEdge.target),
      new: Number(newEdge.target),
    };
  }
  if ((oldEdge.label ?? '') !== (newEdge.label ?? '')) {
    changes.label = { old: oldEdge.label, new: newEdge.label };
  }
  if (JSON.stringify(oldEdge.data ?? null) !== JSON.stringify(newEdge.data ?? null)) {
    changes.data = { old: oldEdge.data, new: newEdge.data };
  }
  return Object.keys(changes).length > 0 ? changes : undefined;
}

/**
 * Структурное сравнение двух графов клинических рекомендаций (BPMN-подобная нотация).
 */
export function compareGraphs(
  process1: BackendData,
  process2: BackendData,
): ProcessComparison {
  const map1 = new Map(process1.nodes.map((n) => [nodeKey(n), n]));
  const map2 = new Map(process2.nodes.map((n) => [nodeKey(n), n]));

  const added: BackendNode[] = [];
  const removed: BackendNode[] = [];
  const modified: NodeComparison[] = [];
  const unchanged: BackendNode[] = [];

  for (const [key, n2] of map2) {
    const n1 = map1.get(key);
    if (!n1) {
      added.push(n2);
    } else if (nodesEqual(n1, n2)) {
      unchanged.push(n2);
    } else {
      modified.push({ node: n2, status: 'modified', changes: nodeChanges(n1, n2) });
    }
  }
  for (const [key, n1] of map1) {
    if (!map2.has(key)) removed.push(n1);
  }

  const emap1 = new Map(process1.edges.map((e) => [edgeKey(e), e]));
  const emap2 = new Map(process2.edges.map((e) => [edgeKey(e), e]));

  const edgesAdded: BackendEdge[] = [];
  const edgesRemoved: BackendEdge[] = [];
  const edgesModified: EdgeComparison[] = [];
  const edgesUnchanged: BackendEdge[] = [];

  for (const [key, e2] of emap2) {
    const e1 = emap1.get(key);
    if (!e1) {
      edgesAdded.push(e2);
    } else if (edgesEqual(e1, e2)) {
      edgesUnchanged.push(e2);
    } else {
      edgesModified.push({ edge: e2, status: 'modified', changes: edgeChanges(e1, e2) });
    }
  }
  for (const [key, e1] of emap1) {
    if (!emap2.has(key)) edgesRemoved.push(e1);
  }

  return {
    process1: { id: process1.process_id, name: process1.name },
    process2: { id: process2.process_id, name: process2.name },
    nodes: { added, removed, modified, unchanged },
    edges: {
      added: edgesAdded,
      removed: edgesRemoved,
      modified: edgesModified,
      unchanged: edgesUnchanged,
    },
    summary: {
      totalNodes1: process1.nodes.length,
      totalNodes2: process2.nodes.length,
      totalEdges1: process1.edges.length,
      totalEdges2: process2.edges.length,
      nodesAdded: added.length,
      nodesRemoved: removed.length,
      nodesModified: modified.length,
      edgesAdded: edgesAdded.length,
      edgesRemoved: edgesRemoved.length,
      edgesModified: edgesModified.length,
    },
  };
}
