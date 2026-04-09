import type { BpmnNode, BpmnEdge } from '../api/types';
import type { ExecutionContext, NodeHandler, PatientData } from './types';
import { ConditionEvaluator } from './conditionEvaluator';
import { bpmnStore } from '../stores/BpmnStore';

/**
 * Обработчик для action узлов
 */
export class ActionNodeHandler implements NodeHandler {
  async execute(
    node: BpmnNode,
    context: ExecutionContext,
    edges: BpmnEdge[]
  ): Promise<{
    nextNodeId?: string;
    shouldContinue: boolean;
    result?: any;
    requiresData?: string[]; // Поля, которые требуются для продолжения
    pauseMessage?: string; // Сообщение для пользователя
  }> {
    // Выполняем действие (например, записываем в историю, обновляем переменные)
    const actionResult: any = {
      label: node.data.label,
      attributes: node.data.attributes || [],
      executed: true,
    };

    // Обрабатываем атрибуты узла
    const patientDataUpdates: Partial<PatientData> = {};
    
    if (node.data.attributes) {
      node.data.attributes.forEach((attr: any) => {
        // Если атрибут имеет формат "variable=value", создаём переменную
        if (attr.value && attr.value.includes('=')) {
          const [varName, varValue] = attr.value.split('=').map((s: string) => s.trim());
          context.variables[varName] = varValue;
        } else if (attr.name && attr.value) {
          // Проверяем, является ли это обновлением данных пациента
          // Если имя атрибута начинается с "patient." или "update.", обновляем данные пациента
          if (attr.name.startsWith('patient.') || attr.name.startsWith('update.')) {
            const key = attr.name.replace(/^(patient|update)\./, '');
            // Парсим значение (может быть число, булево или строка)
            let parsedValue: any = attr.value;
            if (!isNaN(Number(attr.value))) {
              parsedValue = Number(attr.value);
            } else if (attr.value.toLowerCase() === 'true') {
              parsedValue = true;
            } else if (attr.value.toLowerCase() === 'false') {
              parsedValue = false;
            } else if (attr.value.startsWith('{') || attr.value.startsWith('[')) {
              try {
                parsedValue = JSON.parse(attr.value);
              } catch {
                // Оставляем как строку
              }
            }
            
            // Поддерживаем вложенные ключи (например, "bloodPressure.systolic")
            if (key.includes('.')) {
              const keys = key.split('.');
              let current: any = patientDataUpdates;
              for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                  current[keys[i]] = {};
                }
                current = current[keys[i]];
              }
              current[keys[keys.length - 1]] = parsedValue;
            } else {
              patientDataUpdates[key] = parsedValue;
            }
          } else {
            // Иначе сохраняем как переменную с именем атрибута
            context.variables[attr.name] = attr.value;
          }
        }
      });
    }
    
    // Обновляем данные пациента, если есть изменения
    if (Object.keys(patientDataUpdates).length > 0) {
      if (context.updatePatientData) {
        context.updatePatientData(patientDataUpdates);
      } else {
        // Если нет callback, обновляем напрямую
        Object.assign(context.patientData, patientDataUpdates);
      }
      
      actionResult.patientDataUpdates = patientDataUpdates;
    }

    // Проверяем, требуется ли ввод данных
    // Если в атрибутах есть "require:" или "требуется:", запрашиваем эти данные
    const requiredFields: string[] = [];
    const fieldMessages: Record<string, string> = {};
    let pauseMessage = '';
    
    if (node.data.attributes) {
      node.data.attributes.forEach((attr: any) => {
        if (attr.name && (attr.name.startsWith('require:') || attr.name.startsWith('требуется:'))) {
          const field = attr.name.replace(/^(require|требуется):\s*/i, '');
          requiredFields.push(field);
          // Сохраняем сообщение для конкретного поля
          if (attr.value) {
            fieldMessages[field] = attr.value;
            // Если это первое сообщение, используем его как общее
            if (!pauseMessage) {
              pauseMessage = attr.value;
            }
          }
        }
      });
    }
    
    // Если есть несколько полей, создаём общее сообщение
    if (requiredFields.length > 1 && !pauseMessage) {
      pauseMessage = `Требуется ввести данные: ${requiredFields.join(', ')}`;
    } else if (requiredFields.length === 1 && !pauseMessage) {
      pauseMessage = `Требуется ввести данные: ${requiredFields[0]}`;
    }

    // Проверяем наличие требуемых полей в данных пациента
    // ВАЖНО: Если у узла есть атрибуты require:, мы всегда запрашиваем данные,
    // даже если они уже есть. Это нужно для циклов, где данные могут изменяться
    // на каждой итерации (например, давление после приёма препарата)
    const missingFields: string[] = [];
    const fieldsToRequest: string[] = [];
    
    requiredFields.forEach(field => {
      const value = this.getNestedValue(context.patientData, field);
      if (value === undefined || value === null || value === '') {
        missingFields.push(field);
        fieldsToRequest.push(field);
      } else {
        // Даже если данные есть, запрашиваем их снова (для циклов)
        // Это позволяет пользователю обновить данные на каждой итерации
        fieldsToRequest.push(field);
      }
    });

    // Если есть поля для запроса, возвращаем информацию о паузе
    if (fieldsToRequest.length > 0) {
      return {
        shouldContinue: false,
        result: {
          ...actionResult,
          requiresData: true,
          requiredFields: fieldsToRequest,
          fieldMessages,
        },
        requiresData: fieldsToRequest,
        pauseMessage: pauseMessage || `Требуется ввести данные: ${fieldsToRequest.join(', ')}`,
      };
    }

    // Находим следующий узел
    const nextEdge = edges.find(edge => edge.source === node.id);
    const nextNodeId = nextEdge?.target;

    return {
      nextNodeId,
      shouldContinue: !!nextNodeId,
      result: actionResult,
    };
  }

  /**
   * Получает вложенное значение по пути
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }
}

/**
 * Обработчик для condition узлов
 * Упрощенная логика: использует простые атрибуты для сравнения
 */
export class ConditionNodeHandler implements NodeHandler {
  async execute(
    node: BpmnNode,
    context: ExecutionContext,
    edges: BpmnEdge[]
  ): Promise<{
    nextNodeId?: string;
    shouldContinue: boolean;
    result?: any;
    conditionResult?: boolean;
    requiresData?: string[]; // Поля, которые требуются для продолжения
    pauseMessage?: string; // Сообщение для пользователя
  }> {
    // Читаем простые атрибуты из узла
    const attributes = node.data.attributes || [];
    
    // Сначала проверяем, есть ли старые атрибуты (require:field:type) для обратной совместимости
    let hint = this.getAttributeValue(attributes, 'hint') || '';
    let inputType = (this.getAttributeValue(attributes, 'inputType') || 'text') as 'number' | 'text' | 'boolean';
    let compareOperator = (this.getAttributeValue(attributes, 'compareOperator') || '=') as '=' | '!=' | '<' | '>';
    let compareValueStr = this.getAttributeValue(attributes, 'compareValue') || '';
    let inputField = this.getAttributeValue(attributes, 'inputField') || '';

    // Если новых атрибутов нет, проверяем старые (require:field:type)
    if (!inputField) {
      console.log('[ConditionNodeHandler] Ищем старые атрибуты, attributes:', attributes.map((a: any) => ({ name: a.name, value: a.value })));
      
      // Ищем базовый атрибут require:field (без дополнительных двоеточий после имени поля)
      // Например: require:targetOrganDamage (но не require:targetOrganDamage:type)
      const requireAttr = attributes.find(
        (attr: any) => {
          if (!attr.name) return false;
          const name = attr.name.trim();
          // Проверяем, что начинается с require: или требуется:
          if (!name.startsWith('require:') && !name.startsWith('требуется:')) return false;
          // Проверяем, что после require: или требуется: идет имя поля без дополнительных двоеточий
          // То есть require:field, но не require:field:type
          const afterPrefix = name.replace(/^(require|требуется):\s*/i, '');
          // Если после префикса есть еще двоеточие, это метаданные, а не базовое поле
          const isBaseField = !afterPrefix.includes(':');
          console.log('[ConditionNodeHandler] Проверка атрибута:', { name, afterPrefix, isBaseField });
          return isBaseField;
        }
      );
      
      console.log('[ConditionNodeHandler] Найден базовый атрибут:', requireAttr);
      
      if (requireAttr) {
        // Извлекаем поле из старого формата
        inputField = requireAttr.name.replace(/^(require|требуется):\s*/i, '').trim();
        hint = requireAttr.value || hint;
        
        console.log('[ConditionNodeHandler] Извлечено поле:', { inputField, hint });
        
        // Ищем метаданные в старом формате
        attributes.forEach((attr: any) => {
          const attrName = (attr.name || '').trim();
          if (attrName === `require:${inputField}:type` || attrName === `требуется:${inputField}:type`) {
            if (attr.value === 'number' || attr.value === 'text' || attr.value === 'boolean') {
              inputType = attr.value;
            }
          } else if (attrName === `require:${inputField}:compare` || attrName === `требуется:${inputField}:compare`) {
            if (attr.value === '=' || attr.value === '!=' || attr.value === '<' || attr.value === '>') {
              compareOperator = attr.value;
            }
          } else if (attrName === `require:${inputField}:compareValue` || attrName === `требуется:${inputField}:compareValue` || 
                     attrName === `require:${inputField}:compareValue ` || attrName === `требуется:${inputField}:compareValue `) {
            compareValueStr = attr.value;
          } else if (attrName === `require:${inputField}:hint` || attrName === `требуется:${inputField}:hint`) {
            hint = attr.value || hint;
          }
        });
        
        console.log('[ConditionNodeHandler] После обработки метаданных:', {
          inputField,
          hint,
          inputType,
          compareOperator,
          compareValueStr
        });
      }
    }
    
    // Если указано поле для ввода, работаем с ним
    if (inputField) {
      console.log('[ConditionNodeHandler] Обработка condition узла с inputField:', {
        inputField,
        hint,
        inputType,
        compareOperator,
        compareValueStr,
        attributes: attributes.map((a: any) => ({ name: a.name, value: a.value }))
      });
      
      // Получаем текущее значение из данных пациента
      const currentValue = this.getNestedValue(context.patientData, inputField);
      
      console.log('[ConditionNodeHandler] Текущее значение:', {
        inputField,
        currentValue,
        patientData: context.patientData
      });
      
      // ВАЖНО: Для condition узлов в циклах нужно ВСЕГДА запрашивать данные на каждой итерации
      // Это необходимо, потому что данные могут изменяться после приема препаратов
      // Например, давление может измениться после приема лекарств (141 -> может стать 135 после препарата)
      
      // Проверяем, является ли это частью цикла
      // Ищем в истории выполнения узлы типа 'loop' или результаты с loopResult
      const isInLoop = context.executionHistory.some(step => 
        step.nodeType === 'loop' || 
        step.result?.loopResult !== undefined
      );
      
      // Проверяем, был ли этот узел уже выполнен в текущей итерации
      // Если узел выполняется повторно после ввода данных (через continue в ExecutionEngine),
      // то он будет в executionHistory, но мы должны сравнить данные, а не запрашивать снова
      const wasExecutedBefore = context.executionHistory.some(step => 
        step.nodeId === node.id
      );
      
      // Проверяем наличие данных
      const hasData = currentValue !== undefined && currentValue !== null && currentValue !== '';
      
      // Логика запроса данных:
      // 1. Если данных нет - всегда запрашиваем
      // 2. Если мы в цикле И узел еще не выполнялся в этой итерации - запрашиваем (новая итерация цикла)
      // 3. Если мы в цикле И узел уже выполнялся - это повторное выполнение после ввода, сравниваем
      // 4. Если мы НЕ в цикле И данных нет - запрашиваем
      // 5. Если мы НЕ в цикле И данные есть - сравниваем (повторное выполнение после ввода)
      const shouldRequestData = !hasData || (isInLoop && !wasExecutedBefore);
      
      console.log('[ConditionNodeHandler] Проверка необходимости запроса данных:', {
        inputField,
        hasData,
        isInLoop,
        wasExecutedBefore,
        shouldRequestData,
        currentValue,
        executionHistory: context.executionHistory.map(s => ({ nodeId: s.nodeId, nodeType: s.nodeType }))
      });
      
      if (shouldRequestData) {
        // Преобразуем compareValue в нужный тип для отображения
        let typedCompareValue: any = compareValueStr;
        if (inputType === 'number' && !isNaN(Number(compareValueStr))) {
          typedCompareValue = Number(compareValueStr);
        }
        
        return {
          shouldContinue: false,
          result: {
            condition: node.data.label,
            requiresInput: true,
            inputField,
            inputType,
            compareOperator,
            compareValue: typedCompareValue,
            inputHint: hint,
          },
          requiresData: [inputField],
          pauseMessage: hint || `Введите значение для ${inputField}`,
        };
      }
      
      // Если данных есть и мы не в цикле, это повторное выполнение после ввода - сравниваем их
      let typedInputValue: any = currentValue;
      let typedCompareValue: any = compareValueStr;
      
      // Преобразуем значения в нужные типы
      if (inputType === 'number') {
        typedInputValue = Number(currentValue);
        typedCompareValue = Number(compareValueStr);
      } else if (inputType === 'boolean') {
        typedInputValue = currentValue === true || currentValue === 'true' || currentValue === 'True' || currentValue === 'Да' || currentValue === 'да';
        typedCompareValue = compareValueStr === 'true' || compareValueStr === 'True' || compareValueStr === 'Да' || compareValueStr === 'да';
      }
      
      // Простое сравнение: четыре if для каждого оператора
      let conditionResult = false;
      if (compareOperator === '=') {
        conditionResult = typedInputValue == typedCompareValue;
      } else if (compareOperator === '!=') {
        conditionResult = typedInputValue != typedCompareValue;
      } else if (compareOperator === '<') {
        conditionResult = typedInputValue < typedCompareValue;
      } else if (compareOperator === '>') {
        conditionResult = typedInputValue > typedCompareValue;
      }
      
      console.log('[ConditionNodeHandler] Сравнение:', {
        inputField,
        inputValue: currentValue,
        typedInputValue,
        compareOperator,
        compareValue: compareValueStr,
        typedCompareValue,
        conditionResult
      });
      
      // Находим следующий узел на основе результата сравнения
      const trueEdge = edges.find(
        edge => edge.source === node.id && edge.sourceHandle === 'true'
      );
      const falseEdge = edges.find(
        edge => edge.source === node.id && edge.sourceHandle === 'false'
      );

      const nextEdge = conditionResult ? trueEdge : falseEdge;
      const nextNodeId = nextEdge?.target;

      return {
        nextNodeId,
        shouldContinue: !!nextNodeId,
        result: {
          condition: node.data.label,
          inputField,
          inputValue: typedInputValue,
          compareOperator,
          compareValue: typedCompareValue,
          result: conditionResult,
        },
        conditionResult,
      };
    }

    // Если поле для ввода не указано, используем старую логику с ConditionEvaluator
    // (для обратной совместимости)
    let condition = '';
    
    // Ищем условие в атрибутах
    const conditionAttr = attributes.find(
        (attr: any) => attr.name === 'condition' || attr.name === 'условие'
      );
      if (conditionAttr) {
        condition = conditionAttr.value;
    }

    // Если условие не найдено в атрибутах, используем label
    if (!condition && node.data.label) {
      condition = node.data.label;
    }

    // Оцениваем условие
    const conditionResult = condition
      ? ConditionEvaluator.evaluate(condition, context)
      : false;

    // Находим следующий узел на основе результата условия
    const trueEdge = edges.find(
      edge => edge.source === node.id && edge.sourceHandle === 'true'
    );
    const falseEdge = edges.find(
      edge => edge.source === node.id && edge.sourceHandle === 'false'
    );

    const nextEdge = conditionResult ? trueEdge : falseEdge;
    const nextNodeId = nextEdge?.target;

    return {
      nextNodeId,
      shouldContinue: !!nextNodeId,
      result: {
        condition,
        result: conditionResult,
        label: node.data.label,
      },
      conditionResult,
    };
  }

  /**
   * Получает значение атрибута по имени
   */
  private getAttributeValue(attributes: any[], name: string): string {
    const attr = attributes.find((a: any) => a.name === name);
    return attr?.value || '';
  }

  /**
   * Получает вложенное значение по пути
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }
}

/**
 * Обработчик для subprocess узлов
 */
export class SubprocessNodeHandler implements NodeHandler {
  async execute(
    node: BpmnNode,
    _context: ExecutionContext,
    edges: BpmnEdge[]
  ): Promise<{
    nextNodeId?: string;
    shouldContinue: boolean;
    result?: any;
  }> {
    const subprocessId = node.data.subprocess_id;

    if (!subprocessId) {
      console.warn(`Subprocess node ${node.id} has no subprocess_id`);
      // Продолжаем выполнение как обычный action
      const nextEdge = edges.find(edge => edge.source === node.id);
      return {
        nextNodeId: nextEdge?.target,
        shouldContinue: !!nextEdge,
        result: { error: 'No subprocess_id specified' },
      };
    }

    // Загружаем подпроцесс
    const subprocess = bpmnStore.processes.get(subprocessId);
    
    if (!subprocess) {
      // Пытаемся загрузить подпроцесс
      await bpmnStore.setActiveProcess(subprocessId);
      const loadedSubprocess = bpmnStore.processes.get(subprocessId);
      
      if (!loadedSubprocess) {
        console.error(`Subprocess ${subprocessId} not found`);
        const nextEdge = edges.find(edge => edge.source === node.id);
        return {
          nextNodeId: nextEdge?.target,
          shouldContinue: !!nextEdge,
          result: { error: `Subprocess ${subprocessId} not found` },
        };
      }
    }

    // Выполняем подпроцесс (рекурсивно через ExecutionEngine)
    // Это будет обработано в ExecutionEngine через executeSubprocess
    const result = {
      subprocessId,
      label: node.data.label,
      executed: true,
      note: 'Subprocess execution will be handled by ExecutionEngine',
    };

    // Находим следующий узел
    const nextEdge = edges.find(edge => edge.source === node.id);
    const nextNodeId = nextEdge?.target;

    return {
      nextNodeId,
      shouldContinue: !!nextNodeId,
      result,
    };
  }
}

/**
 * Обработчик для start узлов
 */
export class StartNodeHandler implements NodeHandler {
  async execute(
    node: BpmnNode,
    _context: ExecutionContext,
    edges: BpmnEdge[]
  ): Promise<{
    nextNodeId?: string;
    shouldContinue: boolean;
    result?: any;
  }> {
    // Start узел просто передаёт управление следующему узлу
    const nextEdge = edges.find(edge => edge.source === node.id);
    const nextNodeId = nextEdge?.target;

    return {
      nextNodeId,
      shouldContinue: !!nextNodeId,
      result: {
        label: node.data.label,
        type: 'start',
      },
    };
  }
}

/**
 * Обработчик для finish узлов
 */
export class FinishNodeHandler implements NodeHandler {
  async execute(
    node: BpmnNode,
    _context: ExecutionContext,
    _edges: BpmnEdge[]
  ): Promise<{
    nextNodeId?: string;
    shouldContinue: boolean;
    result?: any;
  }> {
    // Finish узел завершает выполнение
    return {
      shouldContinue: false,
      result: {
        label: node.data.label,
        type: 'finish',
        final: true,
      },
    };
  }
}

/**
 * Обработчик для loop узлов
 */
export class LoopNodeHandler implements NodeHandler {
  async execute(
    node: BpmnNode,
    _context: ExecutionContext,
    edges: BpmnEdge[]
  ): Promise<{
    nextNodeId?: string;
    shouldContinue: boolean;
    result?: any;
  }> {
    const loopSubprocessId = node.data.loopSubprocessId || node.data.loop_subprocess_id;
    const loopCondition = node.data.loopCondition || node.data.loop_condition;
    const maxIterations = node.data.maxIterations || node.data.max_iterations || 100;

    if (!loopSubprocessId) {
      // Если нет подпроцесса цикла, просто переходим к следующему узлу
      const nextEdge = edges.find(edge => edge.source === node.id && edge.sourceHandle === 'main-output');
      return {
        nextNodeId: nextEdge?.target,
        shouldContinue: !!nextEdge,
        result: {
          label: node.data.label,
          type: 'loop',
          error: 'No loop subprocess specified',
        },
      };
    }

    // Выполняем цикл
    // Это будет обработано в ExecutionEngine через executeSubprocess
    // Пока просто записываем информацию о цикле
    const result = {
      label: node.data.label,
      type: 'loop',
      loopSubprocessId,
      loopCondition,
      maxIterations,
      note: 'Loop execution will be handled by ExecutionEngine',
    };

    // Переходим к следующему узлу после цикла
    const nextEdge = edges.find(edge => edge.source === node.id && edge.sourceHandle === 'main-output');
    
    return {
      nextNodeId: nextEdge?.target,
      shouldContinue: !!nextEdge,
      result,
    };
  }
}

/**
 * Фабрика обработчиков узлов
 */
export class NodeHandlerFactory {
  static getHandler(nodeType: string): NodeHandler {
    switch (nodeType) {
      case 'action':
        return new ActionNodeHandler();
      case 'condition':
        return new ConditionNodeHandler();
      case 'subprocess':
        return new SubprocessNodeHandler();
      case 'loop':
        return new LoopNodeHandler();
      case 'start':
        return new StartNodeHandler();
      case 'finish':
        return new FinishNodeHandler();
      default:
        // По умолчанию используем ActionNodeHandler
        return new ActionNodeHandler();
    }
  }
}

