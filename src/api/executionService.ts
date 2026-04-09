import { ExecutionEngine } from '../engine';
import type { PatientData, ExecutionResult, EngineConfig } from '../engine';

/**
 * Сервис для выполнения алгоритмов
 */
class ExecutionService {
  private engine: ExecutionEngine;

  constructor(config?: EngineConfig) {
    this.engine = new ExecutionEngine(config);
  }

  /**
   * Выполняет алгоритм для конкретного пациента
   * 
   * @param processId - ID процесса для выполнения
   * @param patientData - Данные пациента
   * @returns Результат выполнения алгоритма
   */
  async executeProcess(
    processId: string,
    patientData: PatientData
  ): Promise<ExecutionResult> {
    return await this.engine.execute(processId, patientData);
  }

  /**
   * Создаёт новый экземпляр движка с кастомной конфигурацией
   */
  createEngine(config?: EngineConfig): ExecutionEngine {
    return new ExecutionEngine(config);
  }
}

export const executionService = new ExecutionService();

