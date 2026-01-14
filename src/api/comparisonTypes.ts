import { BackendData, BackendNode, BackendEdge } from './types';

// Типы для сравнения нод
export type NodeComparisonStatus = 'added' | 'removed' | 'modified' | 'unchanged';

export interface NodeComparison {
  node: BackendNode;
  status: NodeComparisonStatus;
  changes?: {
    label?: { old: string; new: string };
    position?: { old: { x: number; y: number }; new: { x: number; y: number } };
    type?: { old: number; new: number };
  };
}

// Типы для сравнения edges
export type EdgeComparisonStatus = 'added' | 'removed' | 'modified' | 'unchanged';

export interface EdgeComparison {
  edge: BackendEdge;
  status: EdgeComparisonStatus;
  changes?: {
    source?: { old: number; new: number };
    target?: { old: number; new: number };
    label?: { old?: string; new?: string };
    data?: { old?: any; new?: any };
  };
}

// Полная структура сравнения двух схем
export interface ProcessComparison {
  process1: {
    id: string;
    name: string;
  };
  process2: {
    id: string;
    name: string;
  };
  nodes: {
    added: BackendNode[];      // Ноды, которые есть только во второй схеме
    removed: BackendNode[];    // Ноды, которые есть только в первой схеме
    modified: NodeComparison[]; // Ноды, которые изменились
    unchanged: BackendNode[];   // Ноды без изменений
  };
  edges: {
    added: BackendEdge[];      // Edges, которые есть только во второй схеме
    removed: BackendEdge[];    // Edges, которые есть только в первой схеме
    modified: EdgeComparison[]; // Edges, которые изменились
    unchanged: BackendEdge[];   // Edges без изменений
  };
  summary: {
    totalNodes1: number;
    totalNodes2: number;
    totalEdges1: number;
    totalEdges2: number;
    nodesAdded: number;
    nodesRemoved: number;
    nodesModified: number;
    edgesAdded: number;
    edgesRemoved: number;
    edgesModified: number;
  };
  comparison_summary?: string
}

