import type { BackendData, RecommendationResponse } from './types';

/** Ответ бэкенда Clinrec (domain), см. definitions в doc.json */
export interface DomainProcess {
  id?: string;
  /** Некоторые ответы бэкенда используют только process_id */
  process_id?: string;
  name?: string;
  nodes?: DomainNode[];
  edges?: DomainEdge[];
}

export interface DomainNode {
  id?: number;
  label?: string;
  positionX?: number;
  positionY?: number;
  processId?: string;
  subprocessId?: string;
}

export interface DomainEdge {
  id?: number;
  source?: number;
  target?: number;
  processId?: string;
  type?: boolean;
}

/** Swagger иногда описывает вложенный массив; бэкенд может вернуть null */
export function normalizeProcessList(raw: unknown): DomainProcess[] {
  if (raw == null) return [];
  if (!Array.isArray(raw)) return [];
  if (raw.length > 0 && Array.isArray(raw[0])) {
    return raw[0] as DomainProcess[];
  }
  return raw as DomainProcess[];
}

/** Бэкенд может отдавать координаты сетки (1,2) или пиксели (200,400). */
function toGridX(v: number | undefined): number {
  if (v == null || Number.isNaN(v)) return 0;
  return v > 100 ? Math.max(0, Math.round(v / 200)) : Math.round(v);
}

function toGridY(v: number | undefined): number {
  if (v == null || Number.isNaN(v)) return 0;
  return v > 100 ? Math.max(0, Math.round(v / 200)) : Math.round(v);
}

function inferNodeType(label: string | undefined): number {
  const l = (label || '').toLowerCase();
  if (l.includes('начало') || l.startsWith('start')) return 0;
  if (l.includes('конец') || l.includes('finish')) return 1;
  return 3;
}

/**
 * Преобразует domain Process из GET /api/v1/process в формат редактора (BackendData).
 */
export function domainProcessToBackendData(p: DomainProcess): BackendData {
  const process_id = p.id || p.process_id || '';
  const name = p.name || '';
  const nodes = (p.nodes || []).map((n, idx) => {
    const label = n.label || '';
    const t = inferNodeType(label);
    const displayLabel =
      t === 0 ? `Начало: ${name || label}` : t === 1 ? `Конец: ${name || label}` : label;
    return {
      id: n.id ?? idx + 1,
      type: t,
      data: { label: displayLabel },
      json_data: {
        x: toGridX(n.positionX),
        y: toGridY(n.positionY),
      },
      subprocess_id: n.subprocessId ?? null,
    };
  });
  const edges = (p.edges || []).map((e, i) => ({
    id: String(e.id ?? i + 1),
    source: e.source ?? 0,
    target: e.target ?? 0,
  }));
  return { process_id, name, nodes, edges };
}

/** Тело PUT/POST в формате Clinrec (Swagger /api/v1/process). */
export function backendDataToClinrecProcess(b: BackendData): Record<string, unknown> {
  return {
    process_id: b.process_id,
    name: b.name,
    nodes: b.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      data: { ...n.data },
      json_data: { x: n.json_data.x, y: n.json_data.y },
      subprocess_id: n.subprocess_id ?? undefined,
    })),
    edges: b.edges.map((e) => {
      const out: Record<string, unknown> = {
        source: e.source,
        target: e.target,
      };
      const idNum = typeof e.id === 'string' ? parseInt(e.id, 10) : Number(e.id);
      if (Number.isFinite(idNum)) out.id = idNum;
      if (e.label != null) out.label = e.label;
      if (e.data) out.data = e.data;
      if (e.sourceHandle) out.sourceHandle = e.sourceHandle;
      if (e.targetHandle) out.targetHandle = e.targetHandle;
      if (e.style) out.style = e.style;
      return out;
    }),
  };
}

export function domainProcessToRecommendation(p: DomainProcess): RecommendationResponse {
  const pid = p.id || p.process_id || '';
  return {
    id: pid,
    title: p.name || '',
    description: '',
    category: 'general',
    priority: 'medium',
    createdAt: new Date().toISOString(),
  };
}
