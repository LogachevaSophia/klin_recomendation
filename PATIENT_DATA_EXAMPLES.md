# Примеры данных пациента для выполнения алгоритмов

## Базовый пример

```json
{
  "age": 45,
  "temperature": 38.5,
  "cough": true
}
```

## Пример с артериальным давлением (АД)

### Вариант 1: Вложенный объект (рекомендуется)

```json
{
  "age": 45,
  "temperature": 38.5,
  "cough": true,
  "bloodPressure": {
    "systolic": 150,
    "diastolic": 90
  }
}
```

### Вариант 2: Плоская структура

```json
{
  "age": 45,
  "temperature": 38.5,
  "cough": true,
  "bloodPressure.systolic": 150,
  "bloodPressure.diastolic": 90
}
```

### Вариант 3: Русские названия

```json
{
  "age": 45,
  "temperature": 38.5,
  "cough": true,
  "АД": {
    "systolic": 150,
    "diastolic": 90
  }
}
```

### Вариант 4: Альтернативные названия полей

```json
{
  "age": 45,
  "temperature": 38.5,
  "cough": true,
  "bloodPressure": {
    "systolicValue": 150,
    "diastolicValue": 90
  }
}
```

Или:

```json
{
  "age": 45,
  "temperature": 38.5,
  "cough": true,
  "bloodPressure": {
    "верхнее": 150,
    "нижнее": 90
  }
}
```

## Полный пример для циклического мониторинга

```json
{
  "age": 60,
  "temperature": 36.6,
  "bloodPressure": {
    "systolic": 160,
    "diastolic": 95
  },
  "medicationTaken": false,
  "symptoms": ["headache", "dizziness"]
}
```

## Пример для алгоритма с измерением давления

Если алгоритм запрашивает данные давления во время выполнения (через `require:`), можно начать без них:

```json
{
  "age": 45,
  "temperature": 36.6
}
```

А затем ввести данные давления, когда алгоритм попросит (появится форма для ввода).

## Все поддерживаемые варианты названий

### Температура:
- `temperature`
- `temp`
- `t`
- `температура`
- `температуры`

### Артериальное давление:
- `bloodPressure.systolic` / `bloodPressure.diastolic`
- `АД.systolic` / `АД.diastolic`
- `bloodPressure.systolicValue` / `bloodPressure.diastolicValue`
- `bloodPressure.верхнее` / `bloodPressure.нижнее`
- `bp.systolic` / `bp.diastolic`

### Симптомы:
- `cough` (булево)
- `symptoms` (массив строк)
- `fever` (булево)
- И другие...

## Примеры для разных алгоритмов

### Грипп с насморком
```json
{
  "age": 30,
  "temperature": 38.5,
  "cough": true,
  "runnyNose": true,
  "headache": true,
  "symptoms": ["cough", "fever", "runnyNose"]
}
```

### Циклический мониторинг давления
```json
{
  "age": 55,
  "bloodPressure": {
    "systolic": 150,
    "diastolic": 95
  },
  "medicationTaken": false
}
```

### Комплексное обследование
```json
{
  "age": 45,
  "temperature": 37.2,
  "bloodPressure": {
    "systolic": 140,
    "diastolic": 90
  },
  "heartRate": 75,
  "respiratoryRate": 18,
  "oxygenSaturation": 98,
  "symptoms": ["fatigue", "shortnessOfBreath"]
}
```

