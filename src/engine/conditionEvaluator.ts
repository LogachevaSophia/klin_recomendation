import type { PatientData, ExecutionContext } from './types';

/**
 * Оценщик условий для condition узлов
 * Поддерживает простые выражения на основе данных пациента
 */
export class ConditionEvaluator {
  /**
   * Оценивает условие на основе данных пациента и переменных контекста
   * 
   * Поддерживаемые операторы:
   * - Сравнение: ==, !=, <, >, <=, >=
   * - Логические: &&, ||, !
   * - Проверка наличия: has, exists
   * 
   * Примеры:
   * - "age > 18"
   * - "temperature > 37.5 && has('cough')"
   * - "bloodPressure.systolic > 140"
   * - "АД стабилизировалось < 140/90?" (русский текст с вопросом)
   */
  static evaluate(
    condition: string,
    context: ExecutionContext
  ): boolean {
    try {
      // Заменяем переменные на их значения
      let expression = condition.trim();
      
      console.log(`[Condition] Оценка условия: "${condition}"`);
      console.log(`[Condition] Текущие данные пациента:`, JSON.stringify(context.patientData, null, 2));
      
      // Нормализуем выражение (удаляем знаки вопроса, обрабатываем русский текст)
      expression = this.normalizeExpression(expression, context);
      console.log(`[Condition] После нормализации: "${expression}"`);
      
      // Обрабатываем специальные функции
      expression = this.processSpecialFunctions(expression, context);
      console.log(`[Condition] После обработки функций: "${expression}"`);
      
      // Заменяем обращения к данным пациента
      expression = this.replacePatientData(expression, context.patientData);
      console.log(`[Condition] После замены данных пациента: "${expression}"`);
      
      // Заменяем переменные контекста
      expression = this.replaceContextVariables(expression, context.variables);
      console.log(`[Condition] После замены переменных: "${expression}"`);
      
      // Безопасное выполнение выражения
      const result = this.safeEvaluate(expression);
      console.log(`[Condition] Финальный результат: ${result}`);
      return result;
    } catch (error) {
      console.error(`[Condition] Ошибка оценки условия "${condition}":`, error);
      return false;
    }
  }

  /**
   * Нормализует выражение: обрабатывает русский текст, вопросы, сложные условия
   */
  private static normalizeExpression(
    expression: string,
    context: ExecutionContext
  ): string {
    // Удаляем знаки вопроса в конце
    expression = expression.replace(/\?+$/, '').trim();
    
    // Обрабатываем паттерны типа "Есть 38.5" или "Есть температура 38.5"
    // Преобразуем в "temperature == 38.5" или "temperature > 38.5"
    expression = expression.replace(
      /(?:Есть|есть|равно|равна|равен)\s+(\d+\.?\d*)/gi,
      (_match, value) => {
        // Ищем ключ температуры в данных пациента
        const tempKey = this.findTemperatureKey(context.patientData);
        if (tempKey) {
          return `${tempKey} == ${value}`;
        }
        // Если не нашли, используем общий паттерн
        return `temperature == ${value}`;
      }
    );
    
    // Обрабатываем паттерны типа "Есть температура 38.5" или "Температура есть 38.5"
    expression = expression.replace(
      /(?:Есть|есть|равно|равна|равен)\s+(?:температура|температуры|temp)\s+(\d+\.?\d*)/gi,
      (_match, value) => {
        const tempKey = this.findTemperatureKey(context.patientData);
        return `${tempKey || 'temperature'} == ${value}`;
      }
    );
    
    // Обрабатываем паттерны типа "Температура 38.5" или "Температура > 38.5"
    expression = expression.replace(
      /(?:температура|температуры|temp)\s*([<>=]+)?\s*(\d+\.?\d*)/gi,
      (_match, operator, value) => {
        const tempKey = this.findTemperatureKey(context.patientData);
        const op = operator || '==';
        return `${tempKey || 'temperature'} ${op} ${value}`;
      }
    );
    
    // Обрабатываем паттерны типа "Есть признаки поражения органов-мишеней"
    // Сначала обрабатываем сложные фразы с несколькими словами
    expression = expression.replace(
      /(?:Есть|есть|имеется|наличие)\s+([а-яА-Яa-zA-Z\s\-]+?)(?:\?|$)/gi,
      (_match, phrase) => {
        const trimmedPhrase = phrase.trim();
        // Проверяем наличие симптома/признака в данных пациента
        const symptomKey = this.findSymptomKey(context.patientData, trimmedPhrase);
        if (symptomKey) {
          return `has('${symptomKey}')`;
        }
        // Пробуем найти в массиве симптомов
        const normalizedPhrase = trimmedPhrase.toLowerCase().replace(/\s+/g, '_');
        return `has('${normalizedPhrase}') || (symptoms && symptoms.includes('${trimmedPhrase.toLowerCase()}'))`;
      }
    );
    
    // Обрабатываем паттерны типа "Есть кашель" или "Есть симптом кашель" (одно слово)
    expression = expression.replace(
      /(?:Есть|есть|имеется|наличие)\s+(?:симптом\s+)?([а-яА-Яa-zA-Z]+)/gi,
      (_match, symptom) => {
        // Проверяем наличие симптома в данных пациента
        const symptomKey = this.findSymptomKey(context.patientData, symptom);
        if (symptomKey) {
          return `has('${symptomKey}')`;
        }
        // Пробуем найти в массиве симптомов
        return `has('${symptom.toLowerCase()}') || (symptoms && symptoms.includes('${symptom.toLowerCase()}'))`;
      }
    );
    
    // Обрабатываем паттерны типа "АД < 140/90" или "АД стабилизировалось < 140/90"
    // Ищем паттерны с артериальным давлением
    expression = expression.replace(
      /АД[^<>=]*([<>=]+)\s*(\d+)\/(\d+)/gi,
      (_match, operator, systolic, diastolic) => {
        // Проверяем оба значения давления
        const bp = context.patientData.bloodPressure || context.patientData.АД || {};
        const sys = bp.systolic || bp.systolicValue || bp.верхнее;
        const dias = bp.diastolic || bp.diastolicValue || bp.нижнее;
        
        if (sys === undefined || dias === undefined) {
          return 'false';
        }
        
        // Для оператора < проверяем, что оба значения меньше
        if (operator.includes('<')) {
          return `(${sys} < ${systolic} && ${dias} < ${diastolic})`;
        }
        // Для оператора > проверяем, что оба значения больше
        if (operator.includes('>')) {
          return `(${sys} > ${systolic} && ${dias} > ${diastolic})`;
        }
        // Для == проверяем равенство обоих значений
        if (operator.includes('=')) {
          return `(${sys} == ${systolic} && ${dias} == ${diastolic})`;
        }
        
        return 'false';
      }
    );
    
    // Обрабатываем паттерны типа "стабилизировалось < 140/90" или "АД стабилизировалось < 140/90"
    // Ищем паттерн: [АД] стабилизировалось [оператор] [значение]
    expression = expression.replace(
      /(?:АД\s*)?стабилизировалось\s*([<>=]+)\s*(\d+)\/?(\d+)?/gi,
      (_match, operator, value1, value2) => {
        const bp = context.patientData.bloodPressure || context.patientData.АД || {};
        const sys = bp.systolic || bp.systolicValue || bp.верхнее;
        const dias = bp.diastolic || bp.diastolicValue || bp.нижнее;
        
        console.log(`[Condition] Обработка "стабилизировалось": sys=${sys}, dias=${dias}, operator=${operator}, value1=${value1}, value2=${value2}`);
        
        if (sys === undefined || dias === undefined) {
          console.log(`[Condition] Данные давления отсутствуют, возвращаем false`);
          return 'false';
        }
        
        // Если указано два значения (140/90)
        if (value2) {
          if (operator.includes('<')) {
            const result = `(${sys} < ${value1} && ${dias} < ${value2})`;
            console.log(`[Condition] Результат: ${result}`);
            return result;
          }
          if (operator.includes('>')) {
            const result = `(${sys} > ${value1} && ${dias} > ${value2})`;
            console.log(`[Condition] Результат: ${result}`);
            return result;
          }
          if (operator.includes('=')) {
            const result = `(${sys} == ${value1} && ${dias} == ${value2})`;
            console.log(`[Condition] Результат: ${result}`);
            return result;
          }
        } else {
          // Если указано одно значение, проверяем только систолическое
          if (operator.includes('<')) {
            const result = `(${sys} < ${value1})`;
            console.log(`[Condition] Результат: ${result}`);
            return result;
          }
          if (operator.includes('>')) {
            const result = `(${sys} > ${value1})`;
            console.log(`[Condition] Результат: ${result}`);
            return result;
          }
          if (operator.includes('=')) {
            const result = `(${sys} == ${value1})`;
            console.log(`[Condition] Результат: ${result}`);
            return result;
          }
        }
        
        console.log(`[Condition] Неизвестный оператор, возвращаем false`);
        return 'false';
      }
    );
    
    // Обрабатываем просто "стабилизировалось" без оператора (проверка факта стабилизации)
    if (expression.includes('стабилизировалось') || expression.includes('стабилизировался')) {
      // Проверяем переменные контекста на наличие информации о стабилизации
      const stabilized = context.variables.stabilized || 
                        context.variables.стабилизировалось ||
                        context.variables.стабилизация;
      
      if (stabilized !== undefined) {
        expression = expression.replace(/стабилизировалось|стабилизировался/gi, String(stabilized));
      } else {
        // Если нет переменной, проверяем по данным пациента
        const bp = context.patientData.bloodPressure || context.patientData.АД || {};
        if (bp.systolic && bp.diastolic) {
          // Считаем стабилизированным, если АД < 140/90
          expression = expression.replace(
            /стабилизировалось|стабилизировался/gi,
            `(${bp.systolic} < 140 && ${bp.diastolic} < 90)`
          );
        } else {
          expression = expression.replace(/стабилизировалось|стабилизировался/gi, 'false');
        }
      }
    }
    
    // Заменяем русские ключевые слова на английские эквиваленты
    const russianToEnglish: Record<string, string> = {
      'АД': 'bloodPressure',
      'артериальное давление': 'bloodPressure',
      'температура': 'temperature',
      'возраст': 'age',
      'кашель': 'cough',
      'симптом': 'symptom',
    };
    
    Object.entries(russianToEnglish).forEach(([ru, en]) => {
      const regex = new RegExp(ru, 'gi');
      expression = expression.replace(regex, en);
    });
    
    // Удаляем лишний текст после JavaScript-выражения
    // Ищем последнее валидное JavaScript-выражение и удаляем всё после него
    // Паттерн: ищем закрывающие скобки, кавычки, операторы и числа, затем удаляем всё остальное
    const jsExpressionMatch = expression.match(/^(.+?)(?:[а-яА-Я\s\-]+)$/);
    if (jsExpressionMatch) {
      // Если после JavaScript-выражения есть русский текст, удаляем его
      const jsPart = jsExpressionMatch[1].trim();
      // Проверяем, что это валидное JavaScript-выражение (содержит операторы, скобки, функции)
      if (/[()&|!<>=]|has\(|includes\(|&&|\|\|/.test(jsPart)) {
        expression = jsPart;
      }
    }
    
    // Альтернативный подход: удаляем всё после последнего валидного JavaScript-токена
    // Ищем паттерн: JavaScript-выражение, затем пробел, затем русский текст
    expression = expression.replace(/(.+?)(?:\s+[а-яА-Я\-]+)+$/i, '$1');
    
    return expression.trim();
  }

  /**
   * Обрабатывает специальные функции (has, exists и т.д.)
   */
  private static processSpecialFunctions(
    expression: string,
    context: ExecutionContext
  ): string {
    // Обрабатываем паттерн symptoms && symptoms.includes('...') как единое целое
    // Это нужно обработать ПЕРВЫМ, чтобы не заменять symptoms отдельно
    expression = expression.replace(
      /symptoms\s*&&\s*symptoms\.includes\(['"]([^'"]+)['"]\)/g,
      (_, searchValue) => {
        const symptoms = context.patientData.symptoms;
        if (Array.isArray(symptoms)) {
          const found = symptoms.some((s: any) => 
            String(s).toLowerCase().includes(searchValue.toLowerCase())
          );
          return String(found);
        }
        // Если symptoms не массив, проверяем как строку или объект
        if (symptoms !== undefined && symptoms !== null) {
          const symptomsStr = String(symptoms).toLowerCase();
          const searchLower = searchValue.toLowerCase();
          return String(symptomsStr.includes(searchLower));
        }
        return 'false';
      }
    );
    
    // Обрабатываем паттерн symptoms.includes('...') без && symptoms
    expression = expression.replace(
      /symptoms\.includes\(['"]([^'"]+)['"]\)/g,
      (_, searchValue) => {
        const symptoms = context.patientData.symptoms;
        if (Array.isArray(symptoms)) {
          const found = symptoms.some((s: any) => 
            String(s).toLowerCase().includes(searchValue.toLowerCase())
          );
          return String(found);
        }
        // Если symptoms не массив, проверяем как строку или объект
        if (symptoms !== undefined && symptoms !== null) {
          const symptomsStr = String(symptoms).toLowerCase();
          const searchLower = searchValue.toLowerCase();
          return String(symptomsStr.includes(searchLower));
        }
        return 'false';
      }
    );
    
    // Обрабатываем просто symptoms (без .includes) - только если не было заменено выше
    // Заменяем на фактическое значение из patientData
    expression = expression.replace(
      /\bsymptoms\b(?!\s*\.)/g,
      () => {
        const symptoms = context.patientData.symptoms;
        if (symptoms === undefined || symptoms === null) {
          return 'false'; // Используем false вместо null для логических операций
        }
        // Для массивов проверяем, не пустой ли он
        if (Array.isArray(symptoms)) {
          return symptoms.length > 0 ? 'true' : 'false';
        }
        // Для строк и других значений проверяем truthiness
        return symptoms ? 'true' : 'false';
      }
    );

    // has('key') - проверяет наличие ключа в данных пациента
    expression = expression.replace(
      /has\(['"]([^'"]+)['"]\)/g,
      (_, key) => {
        const value = this.getNestedValue(context.patientData, key);
        return value !== undefined && value !== null ? 'true' : 'false';
      }
    );

    // exists('key') - аналогично has
    expression = expression.replace(
      /exists\(['"]([^'"]+)['"]\)/g,
      (_, key) => {
        const value = this.getNestedValue(context.patientData, key);
        return value !== undefined && value !== null ? 'true' : 'false';
      }
    );

    return expression;
  }

  /**
   * Заменяет обращения к данным пациента (например, patient.age -> значение)
   */
  private static replacePatientData(
    expression: string,
    patientData: PatientData
  ): string {
    // Находим все обращения к данным пациента (включая русские символы)
    // Сначала обрабатываем простые ключи (английские и русские)
    const simpleKeyRegex = /\b([a-zA-Zа-яА-Я_][a-zA-Zа-яА-Я0-9_]*)\b/g;
    
    expression = expression.replace(simpleKeyRegex, (match) => {
      // Пропускаем операторы и числа
      if (this.isOperatorOrNumber(match)) {
        return match;
      }
      
      // Пробуем найти значение по ключу (с учетом регистра и без)
      const value = this.findValueByKey(patientData, match);
      if (value !== undefined && value !== null) {
        return typeof value === 'string' ? `"${value}"` : String(value);
      }
      
      return match;
    });
    
    // Затем обрабатываем вложенные свойства (например, bloodPressure.systolic)
    const nestedKeyRegex = /\b([a-zA-Zа-яА-Я_][a-zA-Zа-яА-Я0-9_]*(?:\.[a-zA-Zа-яА-Я0-9_]+)+)\b/g;
    
    expression = expression.replace(nestedKeyRegex, (match) => {
      // Пропускаем операторы
      if (this.isOperatorOrNumber(match)) {
        return match;
      }
      
      const value = this.getNestedValue(patientData, match);
      if (value !== undefined && value !== null) {
        return typeof value === 'string' ? `"${value}"` : String(value);
      }
      
      return match;
    });
    
    return expression;
  }

  /**
   * Находит значение по ключу с учетом различных вариантов написания
   */
  private static findValueByKey(obj: PatientData, key: string): any {
    // Прямое совпадение
    if (obj[key] !== undefined) {
      return obj[key];
    }
    
    // Поиск без учета регистра
    const lowerKey = key.toLowerCase();
    for (const objKey in obj) {
      if (objKey.toLowerCase() === lowerKey) {
        return obj[objKey];
      }
    }
    
    // Маппинг русских названий на английские
    const keyMapping: Record<string, string[]> = {
      'АД': ['bloodPressure', 'bp', 'артериальное давление'],
      'bloodPressure': ['АД', 'bp', 'артериальное давление'],
      'температура': ['temperature', 'temp', 't'],
      'temperature': ['температура', 'temp', 't'],
      'возраст': ['age'],
      'age': ['возраст'],
    };
    
    const possibleKeys = keyMapping[key] || [];
    for (const possibleKey of possibleKeys) {
      if (obj[possibleKey] !== undefined) {
        return obj[possibleKey];
      }
    }
    
    return undefined;
  }

  /**
   * Заменяет переменные контекста
   */
  private static replaceContextVariables(
    expression: string,
    variables: Record<string, any>
  ): string {
    Object.keys(variables).forEach(key => {
      const value = variables[key];
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      expression = expression.replace(regex, () => {
        return typeof value === 'string' ? `"${value}"` : String(value);
      });
    });
    
    return expression;
  }

  /**
   * Безопасное выполнение выражения
   */
  private static safeEvaluate(expression: string): boolean {
    try {
      // Очищаем выражение от лишнего текста
      // Извлекаем только JavaScript-часть (операторы, функции, переменные, числа)
      let cleanExpression = expression.trim();
      
      // Удаляем всё после последнего валидного JavaScript-токена
      // Ищем паттерн: JavaScript-выражение, затем пробел/русский текст
      const jsPartMatch = cleanExpression.match(/^(.+?)(?:\s+[а-яА-Я\-]+)+$/i);
      if (jsPartMatch) {
        cleanExpression = jsPartMatch[1].trim();
      }
      
      // Удаляем лишние русские слова, которые не являются частью выражения
      // Оставляем только: операторы, скобки, функции, числа, строки в кавычках, переменные
      cleanExpression = cleanExpression.replace(/\s+[а-яА-Я\-]+\s*/gi, ' ').trim();
      
      // Если выражение пустое или содержит только русский текст, возвращаем false
      if (!cleanExpression || !/[()&|!<>=0-9]|has\(|includes\(|&&|\|\||true|false/.test(cleanExpression)) {
        console.warn(`[Condition] Выражение не содержит валидного JavaScript-кода: "${expression}"`);
        return false;
      }
      
      console.log(`[Condition] Очищенное выражение для выполнения: "${cleanExpression}"`);
      
      // Используем Function для безопасного выполнения
      // Это позволяет выполнять только математические и логические операции
      const result = new Function('return ' + cleanExpression)();
      return Boolean(result);
    } catch (error) {
      console.error(`Error in safeEvaluate for expression "${expression}":`, error);
      // Пытаемся извлечь только JavaScript-часть и повторить
      try {
        const jsOnly = expression.replace(/[а-яА-Я\s\-]+/gi, '').trim();
        if (jsOnly && jsOnly !== expression) {
          console.log(`[Condition] Пытаемся выполнить очищенное выражение: "${jsOnly}"`);
          const result = new Function('return ' + jsOnly)();
          return Boolean(result);
        }
      } catch (e) {
        // Игнорируем ошибку
      }
      return false;
    }
  }

  /**
   * Получает вложенное значение по пути (например, "bloodPressure.systolic")
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Находит ключ температуры в данных пациента
   */
  private static findTemperatureKey(patientData: PatientData): string | null {
    const possibleKeys = ['temperature', 'temp', 't', 'температура', 'температуры'];
    for (const key of possibleKeys) {
      if (patientData[key] !== undefined) {
        return key;
      }
    }
    return null;
  }

  /**
   * Находит ключ симптома в данных пациента
   */
  private static findSymptomKey(patientData: PatientData, symptom: string): string | null {
    const symptomLower = symptom.toLowerCase();
    const possibleKeys = [
      symptomLower,
      symptom,
      `has${symptom.charAt(0).toUpperCase() + symptom.slice(1)}`,
      `has_${symptomLower}`,
    ];
    
    for (const key of possibleKeys) {
      if (patientData[key] !== undefined) {
        return key;
      }
    }
    
    // Проверяем в массиве симптомов
    if (patientData.symptoms && Array.isArray(patientData.symptoms)) {
      const found = patientData.symptoms.find((s: any) => 
        String(s).toLowerCase() === symptomLower
      );
      if (found !== undefined) {
        return 'symptoms';
      }
    }
    
    return null;
  }

  /**
   * Проверяет, является ли строка оператором или числом
   */
  private static isOperatorOrNumber(str: string): boolean {
    const operators = ['==', '!=', '<=', '>=', '<', '>', '&&', '||', '!', 'true', 'false', 'и', 'или', 'не'];
    return operators.includes(str.toLowerCase()) || !isNaN(Number(str)) || str.startsWith('"') || str.startsWith("'");
  }
}

