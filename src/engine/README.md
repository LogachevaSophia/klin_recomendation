# Движок исполнения алгоритма (Execution Engine)

## Описание

Движок исполнения алгоритма — это программный модуль, который преобразует визуальную схему, созданную в React Flow, в последовательность действий, выполняемых на основе данных пациента. Движок проходит по схеме так, как если бы это делал врач, принимая решения на основе данных пациента.

## Архитектура

### Основные компоненты

1. **ExecutionEngine** — основной класс движка, управляет выполнением алгоритма
2. **NodeHandler** — обработчики для различных типов узлов:
   - `ActionNodeHandler` — обработка действий
   - `ConditionNodeHandler` — обработка условий
   - `SubprocessNodeHandler` — обработка подпроцессов
   - `LoopNodeHandler` — обработка циклов
   - `StartNodeHandler` — начальный узел
   - `FinishNodeHandler` — конечный узел
3. **ConditionEvaluator** — оценщик условий на основе данных пациента
4. **ExecutionService** — сервис для удобного использования движка

## Типы узлов

### Action (Действие)
Выполняет действие и переходит к следующему узлу. Может создавать переменные через атрибуты.

**Пример атрибутов:**
- `variable=value` — создаёт переменную с указанным значением
- `name: value` — сохраняет значение в переменную с именем атрибута

### Condition (Условие)
Оценивает условие на основе данных пациента и выбирает путь выполнения (ДА/НЕТ).

**Поддерживаемые операторы:**
- Сравнение: `==`, `!=`, `<`, `>`, `<=`, `>=`
- Логические: `&&`, `||`, `!`
- Функции: `has('key')`, `exists('key')`

**Примеры условий:**
- `age > 18`
- `temperature > 37.5 && has('cough')`
- `bloodPressure.systolic > 140`

### Subprocess (Подпроцесс)
Выполняет подпроцесс рекурсивно. Переменные из подпроцесса объединяются с родительским контекстом.

### Loop (Цикл)
Выполняет подпроцесс в цикле до выполнения условия выхода или достижения максимального количества итераций.

**Параметры:**
- `loopSubprocessId` — ID подпроцесса для выполнения
- `loopCondition` — условие выхода из цикла
- `maxIterations` — максимальное количество итераций (по умолчанию 100)

## Использование

### Базовое использование

```typescript
import { executionService } from '../api/executionService';

// Данные пациента
const patientData = {
  age: 45,
  temperature: 38.5,
  cough: true,
  bloodPressure: {
    systolic: 150,
    diastolic: 90
  }
};

// Выполнение алгоритма
const result = await executionService.executeProcess('main', patientData);

if (result.success) {
  console.log('Алгоритм выполнен успешно');
  console.log('Шаги выполнения:', result.steps);
  console.log('Финальные переменные:', result.finalVariables);
} else {
  console.error('Ошибка выполнения:', result.error);
}
```

### С кастомной конфигурацией

```typescript
import { ExecutionEngine } from '../engine';

const engine = new ExecutionEngine({
  maxSteps: 500, // Максимальное количество шагов
  timeout: 60000, // Таймаут 60 секунд
  onStep: (step) => {
    console.log('Выполнен шаг:', step.nodeLabel);
  },
  onError: (error, step) => {
    console.error('Ошибка на шаге', step.nodeLabel, ':', error);
  }
});

const result = await engine.execute('main', patientData);
```

### Обработка результатов

```typescript
const result = await executionService.executeProcess('main', patientData);

// Проверка успешности
if (result.success) {
  // История выполнения
  result.steps.forEach(step => {
    console.log(`${step.nodeLabel} (${step.nodeType})`);
    if (step.conditionResult !== undefined) {
      console.log(`  Условие: ${step.conditionResult ? 'ДА' : 'НЕТ'}`);
    }
    if (step.error) {
      console.error(`  Ошибка: ${step.error}`);
    }
  });

  // Финальные переменные
  console.log('Переменные:', result.finalVariables);
  
  // Время выполнения
  console.log(`Время выполнения: ${result.executionTime}ms`);
} else {
  console.error('Ошибка:', result.error);
  console.log('Выполнено шагов:', result.steps.length);
}
```

## Структура данных

### PatientData
```typescript
interface PatientData {
  [key: string]: any; // Динамические поля пациента
}
```

### ExecutionResult
```typescript
interface ExecutionResult {
  success: boolean;              // Успешность выполнения
  finalNodeId?: string;         // ID финального узла
  steps: ExecutionStep[];       // История выполнения
  finalVariables: Record<string, any>; // Финальные переменные
  error?: string;               // Ошибка, если была
  executionTime: number;        // Время выполнения в мс
}
```

### ExecutionStep
```typescript
interface ExecutionStep {
  nodeId: string;               // ID узла
  nodeType: string;             // Тип узла
  nodeLabel: string;            // Название узла
  timestamp: number;            // Время выполнения
  result?: any;                 // Результат выполнения
  conditionResult?: boolean;    // Результат условия (для condition узлов)
  error?: string;               // Ошибка, если была
}
```

## Примеры условий

### Простые условия
```typescript
// Числовые сравнения
"age > 18"
"temperature >= 37.5"
"weight < 100"

// Строковые сравнения
"diagnosis == 'pneumonia'"
"status != 'healthy'"
```

### Составные условия
```typescript
// Логические операторы
"age > 18 && temperature > 37"
"has('cough') || has('fever')"
"!(age < 18)"

// Вложенные свойства
"bloodPressure.systolic > 140"
"patient.analysis.result == 'positive'"
```

### Проверка наличия
```typescript
// Проверка наличия ключа
"has('cough')"
"exists('temperature')"
```

## Обработка ошибок

Движок обрабатывает следующие типы ошибок:

1. **Процесс не найден** — возвращается `success: false` с описанием ошибки
2. **Начальный узел не найден** — процесс не может начаться
3. **Превышен лимит шагов** — защита от бесконечных циклов
4. **Таймаут выполнения** — процесс выполняется слишком долго
5. **Ошибка выполнения узла** — ошибка в конкретном узле

## Ограничения

- Максимальное количество шагов: 1000 (по умолчанию)
- Таймаут выполнения: 30 секунд (по умолчанию)
- Максимальное количество итераций цикла: 100 (по умолчанию)

Эти значения можно настроить через конфигурацию движка.

## Интеграция с React Flow

Движок работает с данными из `BpmnStore`, который хранит схемы процессов. Для выполнения алгоритма необходимо:

1. Загрузить процесс в `BpmnStore` (через `bpmnStore.updateMainProcess()`)
2. Убедиться, что все подпроцессы загружены
3. Вызвать `executionService.executeProcess()` с ID процесса и данными пациента

## Отладка

Для отладки выполнения можно использовать callback'и:

```typescript
const engine = new ExecutionEngine({
  onStep: (step) => {
    console.log('Шаг:', step.nodeLabel, step.nodeType);
    if (step.conditionResult !== undefined) {
      console.log('  Условие:', step.conditionResult);
    }
  },
  onError: (error, step) => {
    console.error('Ошибка:', error.message);
    console.error('Узел:', step.nodeLabel);
  }
});
```

## Пример полного сценария

```typescript
import { executionService } from '../api/executionService';
import { bpmnStore } from '../stores/BpmnStore';

// 1. Загружаем процесс
await bpmnStore.updateMainProcess('process-id');

// 2. Подготавливаем данные пациента
const patientData = {
  age: 45,
  temperature: 38.5,
  symptoms: ['cough', 'fever'],
  bloodPressure: {
    systolic: 150,
    diastolic: 90
  }
};

// 3. Выполняем алгоритм
const result = await executionService.executeProcess('main', patientData);

// 4. Обрабатываем результат
if (result.success) {
  console.log('Алгоритм выполнен успешно!');
  console.log(`Выполнено шагов: ${result.steps.length}`);
  console.log(`Время выполнения: ${result.executionTime}ms`);
  
  // Получаем рекомендации из переменных
  const recommendations = result.finalVariables.recommendations || [];
  console.log('Рекомендации:', recommendations);
} else {
  console.error('Ошибка выполнения:', result.error);
}
```

