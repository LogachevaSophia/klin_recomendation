/**
 * Пример использования движка исполнения алгоритма
 * 
 * Этот файл демонстрирует, как использовать ExecutionEngine
 * для выполнения алгоритма на основе данных пациента.
 */

import { executionService } from '../api/executionService';
import { ExecutionEngine } from './ExecutionEngine';
import type { PatientData } from './types';

/**
 * Пример 1: Базовое использование через сервис
 */
export async function basicExample() {
  // Данные пациента
  const patientData: PatientData = {
    age: 45,
    temperature: 38.5,
    cough: true,
    bloodPressure: {
      systolic: 150,
      diastolic: 90
    },
    symptoms: ['cough', 'fever', 'headache']
  };

  // Выполнение алгоритма
  const result = await executionService.executeProcess('main', patientData);

  // Обработка результата
  if (result.success) {
    console.log('✅ Алгоритм выполнен успешно');
    console.log(`Выполнено шагов: ${result.steps.length}`);
    console.log(`Время выполнения: ${result.executionTime}ms`);
    console.log('Финальные переменные:', result.finalVariables);
  } else {
    console.error('❌ Ошибка выполнения:', result.error);
  }

  return result;
}

/**
 * Пример 2: Использование с кастомной конфигурацией
 */
export async function customConfigExample() {
  const patientData: PatientData = {
    age: 30,
    temperature: 36.6,
    diagnosis: 'healthy'
  };

  // Создаём движок с кастомной конфигурацией
  const engine = new ExecutionEngine({
    maxSteps: 500,
    timeout: 60000, // 60 секунд
    onStep: (step) => {
      console.log(`📋 Шаг: ${step.nodeLabel} (${step.nodeType})`);
      if (step.conditionResult !== undefined) {
        console.log(`   Условие: ${step.conditionResult ? 'ДА' : 'НЕТ'}`);
      }
    },
    onError: (error, step) => {
      console.error(`❌ Ошибка на шаге "${step.nodeLabel}":`, error.message);
    }
  });

  const result = await engine.execute('main', patientData);
  return result;
}

/**
 * Пример 3: Обработка результатов с детальной информацией
 */
export async function detailedResultExample() {
  const patientData: PatientData = {
    age: 25,
    temperature: 39.0,
    hasInsurance: true
  };

  const result = await executionService.executeProcess('main', patientData);

  // Детальный анализ результатов
  console.log('\n=== Детали выполнения ===');
  console.log(`Успешность: ${result.success ? '✅' : '❌'}`);
  console.log(`Время выполнения: ${result.executionTime}ms`);
  console.log(`Количество шагов: ${result.steps.length}`);
  
  if (result.finalNodeId) {
    console.log(`Финальный узел: ${result.finalNodeId}`);
  }

  // История выполнения
  console.log('\n=== История выполнения ===');
  result.steps.forEach((step, index) => {
    console.log(`\n${index + 1}. ${step.nodeLabel} (${step.nodeType})`);
    if (step.conditionResult !== undefined) {
      console.log(`   Условие: ${step.conditionResult ? 'ДА ✅' : 'НЕТ ❌'}`);
    }
    if (step.result) {
      console.log(`   Результат:`, step.result);
    }
    if (step.error) {
      console.error(`   Ошибка: ${step.error}`);
    }
  });

  // Финальные переменные
  console.log('\n=== Финальные переменные ===');
  Object.entries(result.finalVariables).forEach(([key, value]) => {
    console.log(`${key}: ${JSON.stringify(value)}`);
  });

  return result;
}

/**
 * Пример 4: Работа с условиями
 */
export async function conditionExample() {
  // Тестируем различные условия
  const testCases = [
    {
      name: 'Высокая температура',
      patientData: { temperature: 39.5, age: 30 }
    },
    {
      name: 'Нормальная температура',
      patientData: { temperature: 36.6, age: 30 }
    },
    {
      name: 'Пожилой пациент',
      patientData: { age: 75, temperature: 37.0 }
    },
    {
      name: 'Молодой пациент',
      patientData: { age: 18, temperature: 37.0 }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n=== Тест: ${testCase.name} ===`);
    const result = await executionService.executeProcess('main', testCase.patientData);
    
    // Находим condition узлы
    const conditionSteps = result.steps.filter(step => 
      step.nodeType === 'condition' && step.conditionResult !== undefined
    );
    
    conditionSteps.forEach(step => {
      console.log(`Условие "${step.nodeLabel}": ${step.conditionResult ? 'ДА' : 'НЕТ'}`);
    });
  }
}

/**
 * Пример 5: Обработка ошибок
 */
export async function errorHandlingExample() {
  try {
    // Попытка выполнить несуществующий процесс
    const result = await executionService.executeProcess('non-existent-process', {
      age: 30
    });

    if (!result.success) {
      console.error('Ожидаемая ошибка:', result.error);
      console.log('Выполнено шагов до ошибки:', result.steps.length);
    }
  } catch (error) {
    console.error('Неожиданная ошибка:', error);
  }
}

/**
 * Пример 6: Использование в React компоненте
 */
export function useExecutionEngineExample() {
  // Этот пример показывает, как можно использовать движок в React компоненте
  // (требует React hooks)
  
  /*
  import { useState } from 'react';
  import { executionService } from '../api/executionService';

  function PatientAnalysisComponent() {
    const [result, setResult] = useState<ExecutionResult | null>(null);
    const [loading, setLoading] = useState(false);

    const executeAlgorithm = async (patientData: PatientData) => {
      setLoading(true);
      try {
        const executionResult = await executionService.executeProcess('main', patientData);
        setResult(executionResult);
      } catch (error) {
        console.error('Ошибка выполнения:', error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div>
        <button onClick={() => executeAlgorithm({ age: 30, temperature: 38 })}>
          Выполнить алгоритм
        </button>
        {loading && <p>Выполнение...</p>}
        {result && (
          <div>
            <p>Успешно: {result.success ? 'Да' : 'Нет'}</p>
            <p>Шагов: {result.steps.length}</p>
          </div>
        )}
      </div>
    );
  }
  */
}

// Экспорт всех примеров
export const examples = {
  basic: basicExample,
  customConfig: customConfigExample,
  detailedResult: detailedResultExample,
  condition: conditionExample,
  errorHandling: errorHandlingExample
};

