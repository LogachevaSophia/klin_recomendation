# Обновление данных пациента во время выполнения

## Проблема

В медицинских алгоритмах часто встречаются ситуации, когда данные пациента изменяются во время выполнения алгоритма. Например:

- **Приём препарата** → давление может измениться
- **Выполнение процедуры** → состояние пациента меняется
- **Ожидание эффекта** → данные обновляются через некоторое время

Без механизма обновления данных циклы могут работать некорректно, так как условие выхода будет проверяться на устаревших данных.

## Решение

Движок поддерживает обновление данных пациента тремя способами:

### 1. Обновление через атрибуты Action узлов

В атрибутах action узла можно указать обновления данных пациента, используя префикс `patient.` или `update.`:

**Пример:**
```
Атрибут 1:
  name: "patient.bloodPressure.systolic"
  value: "130"

Атрибут 2:
  name: "update.temperature"
  value: "36.6"
```

**Поддерживаемые форматы:**
- Простые значения: `patient.age = "45"`
- Вложенные свойства: `patient.bloodPressure.systolic = "130"`
- Числа: автоматически преобразуются из строк
- Булевы значения: `"true"` / `"false"`
- JSON объекты: `{"systolic": 130, "diastolic": 80}`

### 2. Callback для обновления данных

Можно передать callback `onPatientDataUpdate` в конфигурацию движка. Этот callback вызывается после каждой итерации цикла и может симулировать изменения данных (например, эффект от препарата).

**Пример:**
```typescript
const engine = new ExecutionEngine({
  onPatientDataUpdate: async (updates, currentData) => {
    // Симулируем эффект от препарата
    // Например, если был приём препарата, давление снижается
    if (currentData.medicationTaken) {
      return {
        ...currentData,
        bloodPressure: {
          systolic: Math.max(120, currentData.bloodPressure.systolic - 5),
          diastolic: Math.max(80, currentData.bloodPressure.diastolic - 3)
        }
      };
    }
    return currentData;
  }
});
```

### 3. Прямое обновление через контекст

В обработчиках узлов можно напрямую обновлять данные через `context.updatePatientData()`:

```typescript
context.updatePatientData({
  bloodPressure: {
    systolic: 130,
    diastolic: 85
  }
});
```

## Пример: Цикл с обновлением давления

Рассмотрим сценарий: "Принимаем препарат, пока давление не будет < 140/90"

### Схема алгоритма:

1. **Start** → **Action: "Принять препарат"**
   - Атрибут: `patient.medicationTaken = "true"`
   
2. **Action** → **Loop: "Проверка давления"**
   - Условие выхода: `bloodPressure.systolic < 140 && bloodPressure.diastolic < 90`
   - Подпроцесс цикла: "Ожидание эффекта"
   
3. **Подпроцесс "Ожидание эффекта":**
   - **Action: "Подождать 10 минут"**
   - **Action: "Измерить давление"**
     - Атрибут: `patient.bloodPressure.systolic = "135"` (симуляция измерения)
     - Атрибут: `patient.bloodPressure.diastolic = "88"`

4. **Loop** → **Condition: "Давление < 140/90?"**
   - Если ДА → **Finish**
   - Если НЕТ → возврат в цикл

### Код для выполнения:

```typescript
const engine = new ExecutionEngine({
  onPatientDataUpdate: async (updates, currentData) => {
    // Если был приём препарата, симулируем постепенное снижение давления
    if (currentData.medicationTaken && !updates.bloodPressure) {
      // Эффект препарата: давление снижается на 2-5 мм рт.ст. каждую итерацию
      const systolic = currentData.bloodPressure?.systolic || 150;
      const diastolic = currentData.bloodPressure?.diastolic || 95;
      
      return {
        ...currentData,
        bloodPressure: {
          systolic: Math.max(120, systolic - Math.random() * 3 - 2),
          diastolic: Math.max(80, diastolic - Math.random() * 2 - 1)
        }
      };
    }
    return currentData;
  }
});

const patientData = {
  bloodPressure: {
    systolic: 150,
    diastolic: 95
  },
  medicationTaken: false
};

const result = await engine.execute('main', patientData);
```

## Важные моменты

1. **Данные обновляются немедленно** - изменения видны в следующем узле
2. **В циклах данные проверяются перед каждой итерацией** - условие выхода использует актуальные данные
3. **Подпроцессы наследуют ссылку на данные** - изменения в подпроцессе видны в родительском контексте
4. **Callback может быть асинхронным** - для симуляции задержек (например, ожидание эффекта препарата)

## Отладка

Чтобы увидеть, как изменяются данные пациента, можно использовать callback `onStep`:

```typescript
const engine = new ExecutionEngine({
  onStep: (step) => {
    if (step.result?.patientDataUpdates) {
      console.log('Обновлены данные пациента:', step.result.patientDataUpdates);
    }
  }
});
```

В истории выполнения каждый шаг содержит информацию об обновлениях данных в поле `result.patientDataUpdates`.

