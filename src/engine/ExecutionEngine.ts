import type { BpmnNode, BpmnEdge } from '../api/types';
import type {
  PatientData,
  ExecutionContext,
  ExecutionResult,
  ExecutionStep,
  EngineConfig,
} from './types';
import { NodeHandlerFactory } from './nodeHandlers';
import { bpmnStore } from '../stores/BpmnStore';

/**
 * Движок исполнения алгоритма
 * 
 * Преобразует визуальную схему React Flow в последовательность действий,
 * выполняемых на основе данных пациента.
 */
export class ExecutionEngine {
  private config: EngineConfig;
  private startTime: number = 0;

  constructor(config: EngineConfig = {}) {
    this.config = {
      maxSteps: config.maxSteps || 1000,
      timeout: config.timeout || 30000, // 30 секунд по умолчанию
      onStep: config.onStep,
      onError: config.onError,
    };
  }

  /**
   * Выполняет алгоритм на основе схемы и данных пациента
   */
  async execute(
    processId: string,
    patientData: PatientData
  ): Promise<ExecutionResult> {
    this.startTime = Date.now();

    // Получаем схему процесса
    const process = bpmnStore.processes.get(processId);
    if (!process) {
      // Пытаемся загрузить процесс
      await bpmnStore.setActiveProcess(processId);
      const loadedProcess = bpmnStore.processes.get(processId);
      
      if (!loadedProcess) {
        return {
          success: false,
          steps: [],
          finalVariables: {},
          error: `Process ${processId} not found`,
          executionTime: Date.now() - this.startTime,
        };
      }
    }

    const finalProcess = bpmnStore.processes.get(processId)!;
    const nodes = finalProcess.nodes;
    const edges = finalProcess.edges;

    // Инициализируем контекст выполнения
    const context: ExecutionContext = {
      patientData: { ...patientData }, // Копируем, чтобы не изменять оригинал
      variables: {},
      executionHistory: [],
      currentPath: [],
      updatePatientData: (updates: Partial<PatientData>) => {
        // Обновляем данные пациента
        if (this.config.onPatientDataUpdate) {
          // Если есть callback, используем его (может быть асинхронным)
          const result = this.config.onPatientDataUpdate(updates, context.patientData);
          if (result instanceof Promise) {
            // Если callback асинхронный, ждём его выполнения
            result.then(updatedData => {
              Object.assign(context.patientData, updatedData);
            });
            // Пока ждём, применяем обновления напрямую
            Object.assign(context.patientData, updates);
          } else {
            Object.assign(context.patientData, result);
          }
        } else {
          // Если нет callback, обновляем напрямую
          Object.assign(context.patientData, updates);
        }
      },
    };

    // Находим начальный узел
    const startNode = this.findStartNode(nodes);
    if (!startNode) {
      return {
        success: false,
        steps: [],
        finalVariables: context.variables,
        error: 'Start node not found',
        executionTime: Date.now() - this.startTime,
      };
    }

    // Выполняем алгоритм
    let currentNode: BpmnNode | undefined = startNode;
    let stepCount = 0;
    const visitedNodes = new Map<string, number>(); // Отслеживаем посещённые узлы для защиты от бесконечных циклов

    try {
      while (currentNode && stepCount < this.config.maxSteps!) {
        // Проверяем таймаут
        if (Date.now() - this.startTime > this.config.timeout!) {
          throw new Error('Execution timeout exceeded');
        }

        // Защита от бесконечных циклов: если узел посещён слишком много раз, останавливаемся
        const visitCount = visitedNodes.get(currentNode.id) || 0;
        if (visitCount > 50) {
          return {
            success: false,
            steps: context.executionHistory,
            finalVariables: context.variables,
            error: `Возможен бесконечный цикл: узел "${currentNode.data?.label || currentNode.id}" посещён ${visitCount} раз. Проверьте условие выхода из цикла.`,
            executionTime: Date.now() - this.startTime,
          };
        }
        visitedNodes.set(currentNode.id, visitCount + 1);

        // Выполняем текущий узел
        const step = await this.executeNode(currentNode, context, edges);
        
        // Добавляем шаг в историю
        context.executionHistory.push(step);
        context.currentPath.push(currentNode.id);

        // Вызываем callback для шага
        if (this.config.onStep) {
          this.config.onStep(step);
        }

        // Если произошла ошибка
        if (step.error) {
          if (this.config.onError) {
            this.config.onError(new Error(step.error), step);
          }
          return {
            success: false,
            steps: context.executionHistory,
            finalVariables: context.variables,
            error: step.error,
            executionTime: Date.now() - this.startTime,
          };
        }

        // Проверяем, требуется ли ввод данных
        const requiresData = step.result?.requiresData || (step.result as any)?.requiresData;
        const requiredFields = (step.result as any)?.requiredFields || [];
        const pauseMessage = (step.result as any)?.pauseMessage;
        
        // Для упрощенной логики condition узлов используем данные из result
        const inputField = (step.result as any)?.inputField;
        const inputType = (step.result as any)?.inputType;
        const compareOperator = (step.result as any)?.compareOperator;
        const compareValue = (step.result as any)?.compareValue;
        const inputHint = (step.result as any)?.inputHint;
        
        // Формируем метаданные для упрощенной логики
        let fieldMetadata = (step.result as any)?.fieldMetadata || {};
        
        // Если есть упрощенные атрибуты, используем их
        if (inputField) {
          fieldMetadata = {
            [inputField]: {
              type: inputType,
              hint: inputHint,
              compare: compareOperator && compareValue ? `${compareOperator} ${compareValue}` : undefined,
            }
          };
        }

        if (requiresData && requiredFields.length > 0) {
          // Если есть callback для запроса данных, используем его
          if (this.config.onDataRequired) {
            try {
              const newData = await this.config.onDataRequired(
                requiredFields,
                context.patientData,
                pauseMessage,
                fieldMetadata // Передаём метаданные
              );
              
              // Обновляем данные пациента
              if (newData && Object.keys(newData).length > 0) {
                Object.assign(context.patientData, newData);
                
                // ПОВТОРНО выполняем тот же узел с обновлёнными данными
                // Это важно для condition узлов, чтобы переоценить условие с новыми данными
                // Не увеличиваем stepCount, так как это повторное выполнение
                continue;
              }
            } catch (error) {
              // Если пользователь отменил ввод, возвращаем паузу
              return {
                success: false,
                steps: context.executionHistory,
                finalVariables: context.variables,
                paused: true,
                requiredData: requiredFields,
                message: pauseMessage || `Требуется ввести данные: ${requiredFields.join(', ')}`,
                executionTime: Date.now() - this.startTime,
              };
            }
          } else {
            // Если нет callback, возвращаем результат с паузой
            return {
              success: false,
              steps: context.executionHistory,
              finalVariables: context.variables,
              paused: true,
              requiredData: requiredFields,
              message: pauseMessage || `Требуется ввести данные: ${requiredFields.join(', ')}`,
              executionTime: Date.now() - this.startTime,
            };
          }
        }

        // Если это finish узел, завершаем выполнение
        // Проверяем по result.final или по label (содержит "Конец" или "finish")
        const isFinishNode = step.result?.final || 
          currentNode.data?.label?.toLowerCase().includes('конец') ||
          currentNode.data?.label?.toLowerCase().includes('finish');
        
        if (isFinishNode) {
          return {
            success: true,
            finalNodeId: currentNode.id,
            steps: context.executionHistory,
            finalVariables: context.variables,
            executionTime: Date.now() - this.startTime,
          };
        }

        // Переходим к следующему узлу
        const nextNodeId = step.result?.nextNodeId;
        if (nextNodeId) {
          currentNode = nodes.find(n => n.id === nextNodeId);
        } else {
          // Нет следующего узла - завершаем выполнение
          return {
            success: true,
            finalNodeId: currentNode.id,
            steps: context.executionHistory,
            finalVariables: context.variables,
            executionTime: Date.now() - this.startTime,
          };
        }

        stepCount++;
      }

      // Превышено максимальное количество шагов
      return {
        success: false,
        steps: context.executionHistory,
        finalVariables: context.variables,
        error: `Maximum steps (${this.config.maxSteps}) exceeded. Possible infinite loop.`,
        executionTime: Date.now() - this.startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const lastStep: ExecutionStep = {
        nodeId: currentNode?.id || 'unknown',
        nodeType: currentNode?.type || 'unknown',
        nodeLabel: currentNode?.data?.label || 'unknown',
        timestamp: Date.now(),
        error: errorMessage,
      };

      if (this.config.onError) {
        this.config.onError(error instanceof Error ? error : new Error(errorMessage), lastStep);
      }

      return {
        success: false,
        steps: [...context.executionHistory, lastStep],
        finalVariables: context.variables,
        error: errorMessage,
        executionTime: Date.now() - this.startTime,
      };
    }
  }

  /**
   * Выполняет один узел
   */
  private async executeNode(
    node: BpmnNode,
    context: ExecutionContext,
    edges: BpmnEdge[]
  ): Promise<ExecutionStep> {
    const stepStartTime = Date.now();

    try {
      // Получаем обработчик для типа узла
      const handler = NodeHandlerFactory.getHandler(node.type);

      // Выполняем узел
      const result = await handler.execute(node, context, edges);

      // Создаём шаг выполнения
      const step: ExecutionStep = {
        nodeId: node.id,
        nodeType: node.type,
        nodeLabel: node.data?.label || node.id,
        timestamp: stepStartTime,
        result: {
          ...result.result,
          nextNodeId: result.nextNodeId,
          requiresData: 'requiresData' in result ? result.requiresData : undefined,
          requiredFields: 'requiresData' in result && Array.isArray(result.requiresData) ? result.requiresData : undefined,
          pauseMessage: 'pauseMessage' in result ? result.pauseMessage : undefined,
        },
        conditionResult: 'conditionResult' in result && typeof result.conditionResult === 'boolean' 
          ? result.conditionResult 
          : undefined,
      };

      // Если нужно обработать подпроцесс
      if (node.type === 'subprocess' && node.data.subprocess_id) {
        const subprocessResult = await this.executeSubprocess(
          node.data.subprocess_id,
          context
        );
        step.result = {
          ...step.result,
          subprocessResult,
        };
      }

      // Если нужно обработать цикл (проверяем по наличию loopSubprocessId в data)
      // Также проверяем, является ли узел частью цикла по данным
      const isLoopNode = (node.data.loopSubprocessId || node.data.loop_subprocess_id) || 
                         node.data.label?.toLowerCase().includes('цикл') ||
                         node.data.label?.toLowerCase().includes('loop');
      
      if (isLoopNode && (node.data.loopSubprocessId || node.data.loop_subprocess_id)) {
        const loopSubprocessId = node.data.loopSubprocessId || node.data.loop_subprocess_id;
        const loopCondition = node.data.loopCondition || node.data.loop_condition;
        const maxIterations = node.data.maxIterations || node.data.max_iterations || 100;
        
        const loopResult = await this.executeLoop(
          loopSubprocessId,
          loopCondition,
          maxIterations,
          context
        );
        step.result = {
          ...step.result,
          loopResult,
        };
      }

      // Добавляем информацию о следующем узле
      if (result.nextNodeId) {
        step.result = {
          ...step.result,
          nextNodeId: result.nextNodeId,
        };
      }

      return step;
    } catch (error) {
      return {
        nodeId: node.id,
        nodeType: node.type,
        nodeLabel: node.data?.label || node.id,
        timestamp: stepStartTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Выполняет подпроцесс рекурсивно
   */
  private async executeSubprocess(
    subprocessId: string,
    parentContext: ExecutionContext
  ): Promise<ExecutionResult> {
    // Создаём новый контекст для подпроцесса (наследуем данные пациента и переменные)
    // Важно: используем ссылку на те же данные пациента, чтобы изменения были видны в родительском контексте
    const subprocessContext: ExecutionContext = {
      patientData: parentContext.patientData, // Используем ссылку, а не копию!
      variables: { ...parentContext.variables },
      executionHistory: [],
      currentPath: [],
      updatePatientData: parentContext.updatePatientData, // Наследуем функцию обновления
    };

    // Сохраняем текущий активный процесс
    const previousProcessId = bpmnStore.activeProcessId;

    try {
      // Выполняем подпроцесс
      const result = await this.execute(subprocessId, subprocessContext.patientData);

      // Объединяем переменные обратно в родительский контекст
      Object.assign(parentContext.variables, result.finalVariables);

      // Объединяем историю выполнения
      parentContext.executionHistory.push(...subprocessContext.executionHistory);

      return result;
    } finally {
      // Восстанавливаем предыдущий активный процесс
      if (previousProcessId) {
        bpmnStore.setActiveProcess(previousProcessId);
      }
    }
  }

  /**
   * Выполняет цикл
   */
  private async executeLoop(
    loopSubprocessId: string,
    loopCondition: string | undefined,
    maxIterations: number,
    context: ExecutionContext
  ): Promise<{
    iterations: number;
    loopResults: any[];
  }> {
    let iteration = 0;
    const loopResults: any[] = [];

    console.log(`[Loop] Начало цикла. Подпроцесс: ${loopSubprocessId}, Условие выхода: ${loopCondition || 'нет'}, Макс. итераций: ${maxIterations}`);

    while (iteration < maxIterations) {
      iteration++;

      // Проверяем условие выхода из цикла (ПЕРЕД выполнением итерации)
      // Это важно, чтобы использовать актуальные данные пациента после предыдущей итерации
      if (loopCondition) {
        const shouldExit = await this.evaluateCondition(loopCondition, context);
        console.log(`[Loop] Итерация ${iteration}: проверка условия "${loopCondition}" = ${shouldExit}, данные:`, JSON.stringify(context.patientData, null, 2));
        if (shouldExit) {
          console.log(`[Loop] Условие выхода выполнено, завершаем цикл`);
          break;
        }
      }

      // Выполняем тело цикла (подпроцесс)
      // Подпроцесс может обновить данные пациента через action узлы
      try {
        console.log(`[Loop] Итерация ${iteration}: выполнение подпроцесса ${loopSubprocessId}`);
        const subprocessResult = await this.executeSubprocess(loopSubprocessId, context);
        loopResults.push({
          iteration,
          result: subprocessResult,
          patientDataSnapshot: { ...context.patientData }, // Сохраняем снимок данных
        });

        console.log(`[Loop] Итерация ${iteration} завершена. Данные пациента:`, JSON.stringify(context.patientData, null, 2));

        // Если подпроцесс завершился с ошибкой, прерываем цикл
        if (!subprocessResult.success) {
          console.log(`[Loop] Подпроцесс завершился с ошибкой, прерываем цикл`);
          break;
        }

        // Если есть callback для обновления данных, вызываем его
        // Это позволяет симулировать изменения данных после действий (например, приём препарата)
        if (this.config.onPatientDataUpdate) {
          const updatedData = await Promise.resolve(
            this.config.onPatientDataUpdate({}, context.patientData)
          );
          if (updatedData) {
            Object.assign(context.patientData, updatedData);
            console.log(`[Loop] Данные обновлены через callback:`, JSON.stringify(updatedData, null, 2));
          }
        }
      } catch (error) {
        console.error(`[Loop] Ошибка в итерации ${iteration}:`, error);
        loopResults.push({
          iteration,
          error: error instanceof Error ? error.message : String(error),
        });
        break;
      }
    }

    console.log(`[Loop] Цикл завершён. Выполнено итераций: ${iteration}`);

    return {
      iterations: iteration,
      loopResults,
    };
  }

  /**
   * Оценивает условие (вспомогательный метод)
   */
  private async evaluateCondition(
    condition: string,
    context: ExecutionContext
  ): Promise<boolean> {
    const { ConditionEvaluator } = await import('./conditionEvaluator');
    return ConditionEvaluator.evaluate(condition, context);
  }

  /**
   * Находит начальный узел в схеме
   */
  private findStartNode(nodes: BpmnNode[]): BpmnNode | undefined {
    // Ищем узел с label, содержащим "Начало" или "Start"
    let startNode = nodes.find(node => {
      const label = node.data?.label?.toLowerCase() || '';
      return label.includes('начало') || label.includes('start');
    });
    
    if (startNode) {
      return startNode;
    }

    // Если start узла нет, ищем узел без входящих рёбер
    const edges = bpmnStore.processes.get(bpmnStore.activeProcessId)?.edges || [];
    const nodesWithIncomingEdges = new Set(
      edges.map(edge => edge.target)
    );

    startNode = nodes.find(
      node => !nodesWithIncomingEdges.has(node.id)
    );

    return startNode;
  }
}

