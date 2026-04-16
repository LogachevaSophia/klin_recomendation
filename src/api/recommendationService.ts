import axios from 'axios';
import {
  CreateRecommendationRequest,
  UpdateRecommendationRequest,
  BackendData,
} from './types';
import {
  domainProcessToBackendData,
  normalizeProcessList,
  backendDataToClinrecProcess,
  type DomainProcess,
} from './clinrecProcessMapper';

/** Базовый URL бэкенда (из браузера), не origin статики фронта */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

function bearerHeaders(): Record<string, string> {
  const token = import.meta.env.VITE_CLINREC_API_TOKEN as string | undefined;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function normalizeDomain(raw: unknown): DomainProcess {
  if (!raw || typeof raw !== 'object') return {};
  const o = raw as Record<string, unknown>;
  const pid = String(o.id ?? o.process_id ?? '');
  return { ...(o as object), id: pid, process_id: pid } as DomainProcess;
}

async function fetchDomainProcess(processId: string): Promise<DomainProcess> {
  const { data } = await axios.get(`${API_BASE_URL}/v1/process`, {
    params: { process_id: processId },
  });
  return normalizeDomain(data);
}

export const recommendationService = {
  /** Список как от бэкенда (после нормализации вложенного массива в `normalizeProcessList`). */
  async getAll(): Promise<DomainProcess[]> {
    const { data } = await axios.get(`${API_BASE_URL}/v1/process/all`);
    const list = normalizeProcessList(data);
    return list;
    // return list.map(domainProcessToRecommendation);
  },

  async getById(id: string): Promise<BackendData> {
    const domain = await fetchDomainProcess(id);
    return domainProcessToBackendData(domain);
  },

  async create(data: CreateRecommendationRequest): Promise<DomainProcess> {
    const body = {
      name: data.title,
      nodes: [] as unknown[],
      edges: [] as unknown[],
    };
    const { data: created } = await axios.post(`${API_BASE_URL}/v1/process`, body, {
      headers: {
        'Content-Type': 'application/json',
        ...bearerHeaders(),
      },
    });
    return normalizeDomain(created);
  },

  async update(data: UpdateRecommendationRequest): Promise<DomainProcess> {
    const backend = await this.getById(data.id);
    const merged: BackendData = {
      ...backend,
      name: data.title != null && data.title !== '' ? data.title : backend.name,
    };
    const body = backendDataToClinrecProcess(merged);
    await axios.put(`${API_BASE_URL}/v1/process`, body, {
      headers: { 'Content-Type': 'application/json' },
    });
    return normalizeDomain({
      process_id: data.id,
      name: merged.name,
      nodes: merged.nodes as unknown[],
      edges: merged.edges as unknown[],
    });
  },

  async delete(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/v1/process`, {
      params: { process_id: id },
    });
  },

  async getSubprocess(subprocessId: string): Promise<BackendData> {
    return this.getById(subprocessId);
  },

  /** Сохранить граф процесса (текущая схема редактора) — PUT /v1/process */
  async saveProcessGraph(data: BackendData): Promise<void> {
    const body = backendDataToClinrecProcess(data);
    await axios.put(`${API_BASE_URL}/v1/process`, body, {
      headers: {
        'Content-Type': 'application/json',
        ...bearerHeaders(),
      },
    });
  },
};
