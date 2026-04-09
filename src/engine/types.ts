import type { BpmnNode, BpmnEdge } from '../api/types';

/**
 * Данные пациента для выполнения алгоритма
 */
export interface PatientData {
  [key: string]: any; // Динамические поля пациента (возраст, симптомы, анализы и т.д.)
}

/**
 * Контекст выполнения узла
 */
export interface ExecutionContext {
  patientData: PatientData;
  variables: Record<string, any>; // Переменные, созданные во время выполнения
  executionHistory: ExecutionStep[]; // История выполнения
  currentPath: string[]; // Путь пройденных узлов
  updatePatientData?: (updates: Partial<PatientData>) => void; // Функция для обновления данных пациента
}

/**
 * Шаг выполнения алгоритма
 */
export interface ExecutionStep {
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  timestamp: number;
  result?: any; // Результат выполнения узла
  conditionResult?: boolean; // Для condition узлов
  error?: string; // Ошибка, если была
}

/**
 * Результат выполнения алгоритма
 */
export interface ExecutionResult {
  success: boolean;
  finalNodeId?: string;
  steps: ExecutionStep[];
  finalVariables: Record<string, any>;
  error?: string;
  executionTime: number;
  paused?: boolean; // Выполнение приостановлено, требуется ввод данных
  requiredData?: string[]; // Список полей, которые нужно ввести
  message?: string; // Сообщение для пользователя
}

/**
 * Обработчик узла
 */
export interface NodeHandler {
  execute(
    node: BpmnNode,
    context: ExecutionContext,
    edges: BpmnEdge[]
  ): Promise<{
    nextNodeId?: string;
    shouldContinue: boolean;
    result?: any;
  }>;
}

/**
 * Конфигурация движка
 */
export interface EngineConfig {
  maxSteps?: number; // Максимальное количество шагов для предотвращения бесконечных циклов
  timeout?: number; // Таймаут выполнения в миллисекундах
  onStep?: (step: ExecutionStep) => void; // Callback для каждого шага
  onError?: (error: Error, step: ExecutionStep) => void; // Callback для ошибок
  onPatientDataUpdate?: (updates: Partial<PatientData>, currentData: PatientData) => Promise<PatientData> | PatientData; // Callback для обновления данных пациента (например, после приёма препарата)
  onDataRequired?: (
    requiredFields: string[], 
    currentData: PatientData, 
    message?: string,
    fieldMetadata?: Record<string, {
      type?: 'number' | 'text' | 'boolean';
      label?: string;
      unit?: string;
      compare?: string;
      trueValue?: string;
      hint?: string;
    }>
  ) => Promise<Partial<PatientData>>; // Callback для запроса недостающих данных у пользователя
}

