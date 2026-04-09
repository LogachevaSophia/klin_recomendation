import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Button, 
  Card, 
  TextInput,
  Spin,
  Alert,
  Table,
  Label
} from '@gravity-ui/uikit';
import { ExecutionEngine } from '../engine';
import { bpmnStore } from '../stores/BpmnStore';
import { recommendationStore } from '../stores/recommendationStore';
import type { PatientData, ExecutionResult, ExecutionStep } from '../engine/types';
import { observer } from 'mobx-react-lite';
import styles from './ExecutionPage.module.scss';

export const ExecutionPage: React.FC = observer(() => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pausedExecution, setPausedExecution] = useState<{
    currentData: PatientData;
    requiredFields: Array<{
      field: string;
      label: string;
      type?: 'number' | 'text' | 'boolean' | 'object';
      hint?: string;
      unit?: string;
      compare?: string;
      trueValue?: string;
    }>;
    message?: string;
  } | null>(null);
  const [inputData, setInputData] = useState<Record<string, any>>({});
  // Сохраняем последние введённые значения для использования в циклах
  const [lastInputValues, setLastInputValues] = useState<Record<string, any>>({});
  // Сохраняем ссылку на Promise для ожидания результата
  const [currentEnginePromise, setCurrentEnginePromise] = useState<Promise<any> | null>(null);

  const recommendation = id ? recommendationStore.recommendations.find(r => r.id === id) : null;

  // Вспомогательная функция для получения вложенных значений
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  };

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        // Загружаем процесс
        await bpmnStore.updateMainProcess(id);
        
        // Если рекомендация не найдена, обновляем список
        if (!recommendation) {
          await recommendationStore.fetchRecommendations();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки процесса');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [id, recommendation]);

  const handleExecute = async () => {
    if (!id) {
      setError('ID процесса не указан');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setResult(null);
      setInputData({});
      setLastInputValues({}); // Сбрасываем при новом запуске

      // Начинаем с пустых данных пациента
      const patientData: PatientData = {};

      // Создаём движок с callback для запроса данных
      const engine = new ExecutionEngine({
        onDataRequired: async (requiredFields, currentData, message, fieldMetadata = {}) => {
          // Преобразуем список полей в структурированный формат
          const structuredFields = requiredFields.map(field => {
            // Парсим поле (может быть вложенным, например "bloodPressure.systolic")
            const parts = field.split('.');
            const fieldName = parts[parts.length - 1];
            
            // Получаем метаданные для этого поля
            const metadata = fieldMetadata[field] || {};
            
            // Используем метаданные или значения по умолчанию
            let type: 'number' | 'text' | 'boolean' | 'object' = metadata.type || 'text';
            let label = metadata.label || fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1').trim();
            let hint = metadata.hint || '';
            const unit = metadata.unit || '';
            const compare = metadata.compare || '';
            const trueValue = metadata.trueValue || '';
            
            // Если есть единица измерения, добавляем её к лейблу
            if (unit && !label.includes(unit)) {
              label = `${label} (${unit})`;
            }
            
            // Если есть условие сравнения или значение для true ветки, добавляем в подсказку
            if (compare || trueValue) {
              const comparisonHint = compare ? `Условие: ${compare}` : '';
              const trueValueHint = trueValue ? `Значение для "Да": ${trueValue}` : '';
              if (comparisonHint || trueValueHint) {
                hint = [hint, comparisonHint, trueValueHint].filter(Boolean).join('. ') || hint;
              }
            }
            
            // Специальная обработка для conditionResult
            if (field === 'conditionResult') {
              type = 'boolean';
              label = metadata.label || 'Результат условия';
              hint = metadata.hint || 'Введите true или false для результата условия';
            }

            return { field, label, type, hint, unit, compare, trueValue };
          });

          // Инициализируем inputData значениями из currentData или lastInputValues
          const initialInputData: Record<string, any> = {};
          requiredFields.forEach((field) => {
            // Сначала пытаемся взять из текущих данных пациента
            const valueFromCurrentData = getNestedValue(currentData, field);
            if (valueFromCurrentData !== undefined && valueFromCurrentData !== null && valueFromCurrentData !== '') {
              initialInputData[field] = valueFromCurrentData;
            } else {
              // Если нет в текущих данных, используем последнее введённое значение
              const valueFromLast = lastInputValues[field];
              if (valueFromLast !== undefined && valueFromLast !== null && valueFromLast !== '') {
                initialInputData[field] = valueFromLast;
              }
            }
          });
          setInputData(initialInputData);

          // Сохраняем состояние паузы
          setPausedExecution({
            currentData,
            requiredFields: structuredFields,
            message,
          });
          
          // Возвращаем Promise, который будет разрешён после ввода данных
          return new Promise((resolve) => {
            // Promise будет разрешён в handleContinueExecution
            (window as any).__pendingDataResolve = resolve;
          });
        },
      });

      // Выполняем алгоритм
      const executionPromise = engine.execute('main', patientData);
      setCurrentEnginePromise(executionPromise);
      
      // Обрабатываем результат выполнения
      executionPromise.then((executionResult) => {
        // Если выполнение не приостановлено, очищаем Promise
        if (!executionResult.paused) {
          setCurrentEnginePromise(null);
        }
        setResult(executionResult);
      }).catch((error) => {
        setCurrentEnginePromise(null);
        setError(error instanceof Error ? error.message : 'Неизвестная ошибка');
      });
      
      const executionResult = await executionPromise;

      if (executionResult.paused) {
        // Выполнение приостановлено, ждём ввода данных
        // Используем только базовые значения, метаданные должны приходить из атрибутов узла
        const structuredFields = (executionResult.requiredData || []).map((field: string) => {
          const parts = field.split('.');
          const fieldName = parts[parts.length - 1];
          // Используем только базовые значения по умолчанию
          // Метаданные (type, label, hint) должны быть указаны в атрибутах узла
          const label = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1').trim();
          return { field, label, type: 'text' as const, hint: '' };
        });

        setPausedExecution({
          currentData: patientData,
          requiredFields: structuredFields,
          message: executionResult.message,
        });
      } else if (!executionResult.success) {
        setError(executionResult.error || 'Ошибка выполнения алгоритма');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueExecution = async () => {
    if (!pausedExecution || !id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Преобразуем введённые данные в правильную структуру
      const additionalData: Partial<PatientData> = {};
      
      pausedExecution.requiredFields.forEach(({ field, type }) => {
        const value = inputData[field];
        if (value !== undefined && value !== null && value !== '') {
          // Обрабатываем вложенные поля (например, bloodPressure.systolic)
          if (field.includes('.')) {
            const parts = field.split('.');
            let current: any = additionalData;
            for (let i = 0; i < parts.length - 1; i++) {
              if (!current[parts[i]]) {
                current[parts[i]] = {};
              }
              current = current[parts[i]];
            }
            // Преобразуем значение в нужный тип
            if (type === 'number') {
              current[parts[parts.length - 1]] = Number(value);
            } else {
              current[parts[parts.length - 1]] = value;
            }
          } else {
            // Простые поля
            if (type === 'number') {
              additionalData[field] = Number(value);
            } else if (type === 'boolean') {
              // Для boolean полей преобразуем в boolean (обрабатываем и true, и false, и "Да"/"Нет")
              let boolValue: boolean | undefined = undefined;
              if (value === 'true' || value === true || value === 'True' || value === 'Да' || value === 'да' || value === 'ДА') {
                boolValue = true;
              } else if (value === 'false' || value === false || value === 'False' || value === 'Нет' || value === 'нет' || value === 'НЕТ') {
                boolValue = false;
              }
              
              if (boolValue !== undefined) {
                additionalData[field] = boolValue;
              } else {
                // Если значение не распознано, не добавляем его
                // Это позволит проверке missingFields правильно определить, что поле не заполнено
              }
              console.log('[ExecutionPage] Обработка boolean поля:', {
                field,
                value,
                result: additionalData[field]
              });
            } else {
              additionalData[field] = value;
            }
          }
        }
      });

      // Проверяем, что все обязательные поля заполнены
      const missingFields = pausedExecution.requiredFields.filter(
        ({ field }) => {
          if (field.includes('.')) {
            const parts = field.split('.');
            let current: any = additionalData;
            for (const part of parts) {
              if (!current || !current[part]) return true;
              current = current[part];
            }
            return false;
          }
          // Для conditionResult проверяем, что значение установлено (может быть false)
          if (field === 'conditionResult') {
            // Проверяем, что значение есть либо в additionalData, либо в inputData
            const hasValue = additionalData[field] !== undefined || 
                           (inputData[field] !== undefined && inputData[field] !== '');
            return !hasValue;
          }
          // Для других полей проверяем наличие значения
          const value = additionalData[field];
          return value === undefined || value === null || value === '';
        }
      );

      if (missingFields.length > 0) {
        setError(`Пожалуйста, заполните все обязательные поля: ${missingFields.map(f => f.label).join(', ')}`);
        setIsLoading(false);
        return;
      }

      // Сохраняем введённые значения для использования в следующих итерациях цикла
      const newLastInputValues = { ...lastInputValues };
      pausedExecution.requiredFields.forEach(({ field }) => {
        const value = inputData[field];
        if (value !== undefined && value !== null && value !== '') {
          newLastInputValues[field] = value;
        }
      });
      setLastInputValues(newLastInputValues);

      // Объединяем текущие данные с новыми
      const updatedData = { ...pausedExecution.currentData, ...additionalData };

      console.log('[ExecutionPage] handleContinueExecution:', {
        additionalData,
        updatedData,
        hasPendingResolve: !!(window as any).__pendingDataResolve,
        requiredFields: pausedExecution.requiredFields.map(f => f.field),
        inputData
      });
      
      // Проверяем, что данные действительно сохранены
      console.log('[ExecutionPage] Проверка сохранённых данных:', {
        hasTargetOrganDamage: 'targetOrganDamage' in additionalData,
        hasConditionResult: 'conditionResult' in additionalData,
        targetOrganDamageValue: additionalData.targetOrganDamage,
        targetOrganDamageType: typeof additionalData.targetOrganDamage,
        conditionResultValue: additionalData.conditionResult,
        fullAdditionalData: JSON.stringify(additionalData, null, 2)
      });

      // Если есть pending resolve, разрешаем его
      // ExecutionEngine продолжит выполнение после разрешения Promise
      if ((window as any).__pendingDataResolve) {
        console.log('[ExecutionPage] Разрешаем Promise с данными:', additionalData);
        (window as any).__pendingDataResolve(additionalData);
        delete (window as any).__pendingDataResolve;
        
        // Ждём завершения выполнения текущего движка
        if (currentEnginePromise) {
          try {
            const executionResult = await currentEnginePromise;
            setCurrentEnginePromise(null);
            setResult(executionResult);
            
            if (executionResult.paused) {
              // Выполнение снова приостановлено, показываем форму ввода
              const structuredFields = (executionResult.requiredData || []).map((field: string) => {
                const parts = field.split('.');
                const fieldName = parts[parts.length - 1];
                return { field, label: fieldName, type: 'text' as const };
              });
              setPausedExecution({
                currentData: updatedData,
                requiredFields: structuredFields,
                message: executionResult.message,
              });
            } else if (!executionResult.success) {
              setError(executionResult.error || 'Ошибка выполнения алгоритма');
              setPausedExecution(null);
            } else {
              setPausedExecution(null);
              setInputData({});
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
            setPausedExecution(null);
          }
          return;
        }
        // Если нет Promise, но есть pending resolve, продолжаем создавать новый движок
      }
      
      // Если нет pending resolve, значит ExecutionEngine уже завершился с paused: true
      // Создаём новый движок и запускаем выполнение заново с обновлёнными данными
      console.log('[ExecutionPage] Создаём новый движок с обновлёнными данными');

      // Создаём новый движок и продолжаем выполнение
      const engine = new ExecutionEngine({
        onDataRequired: async (requiredFields, currentData, message, fieldMetadata = {}) => {
          const structuredFields = requiredFields.map(field => {
            const parts = field.split('.');
            const fieldName = parts[parts.length - 1];
            
            // Получаем метаданные для этого поля
            const metadata = fieldMetadata[field] || {};
            
            // Используем метаданные или значения по умолчанию
            let type: 'number' | 'text' | 'boolean' | 'object' = metadata.type || 'text';
            let label = metadata.label || fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1').trim();
            let hint = metadata.hint || '';
            const unit = metadata.unit || '';
            const compare = metadata.compare || '';
            const trueValue = metadata.trueValue || '';
            
            // Если есть единица измерения, добавляем её к лейблу
            if (unit && !label.includes(unit)) {
              label = `${label} (${unit})`;
            }
            
            // Если есть условие сравнения или значение для true ветки, добавляем в подсказку
            if (compare || trueValue) {
              const comparisonHint = compare ? `Условие: ${compare}` : '';
              const trueValueHint = trueValue ? `Значение для "Да": ${trueValue}` : '';
              if (comparisonHint || trueValueHint) {
                hint = [hint, comparisonHint, trueValueHint].filter(Boolean).join('. ') || hint;
              }
            }
            
            // Специальная обработка для conditionResult
            if (field === 'conditionResult') {
              type = 'boolean';
              label = metadata.label || 'Результат условия';
              hint = metadata.hint || 'Введите true или false для результата условия';
            }

            return { field, label, type, hint, unit, compare, trueValue };
          });

          // Инициализируем inputData значениями из currentData или lastInputValues
          const initialInputData: Record<string, any> = {};
          requiredFields.forEach((field) => {
            // Сначала пытаемся взять из текущих данных пациента
            const valueFromCurrentData = getNestedValue(currentData, field);
            if (valueFromCurrentData !== undefined && valueFromCurrentData !== null && valueFromCurrentData !== '') {
              initialInputData[field] = valueFromCurrentData;
            } else {
              // Если нет в текущих данных, используем последнее введённое значение
              const valueFromLast = lastInputValues[field];
              if (valueFromLast !== undefined && valueFromLast !== null && valueFromLast !== '') {
                initialInputData[field] = valueFromLast;
              }
            }
          });
          setInputData(initialInputData);

          setPausedExecution({
            currentData,
            requiredFields: structuredFields,
            message,
          });
          return new Promise((resolve) => {
            (window as any).__pendingDataResolve = resolve;
          });
        },
      });

      // Сохраняем Promise нового движка
      console.log('[ExecutionPage] Запускаем новый движок с данными:', JSON.stringify(updatedData, null, 2));
      
      try {
        const executionPromise = engine.execute('main', updatedData);
        setCurrentEnginePromise(executionPromise);
        
        console.log('[ExecutionPage] Ожидаем результат выполнения...');
        const executionResult = await executionPromise;
        console.log('[ExecutionPage] Получен результат выполнения:', {
          success: executionResult.success,
          paused: executionResult.paused,
          error: executionResult.error,
          stepsCount: executionResult.steps.length
        });
        setCurrentEnginePromise(null);
        setResult(executionResult);

        if (executionResult.paused) {
        // Используем только базовые значения, метаданные должны приходить из атрибутов узла
        const structuredFields = (executionResult.requiredData || []).map((field: string) => {
          const parts = field.split('.');
          const fieldName = parts[parts.length - 1];
          // Используем только базовые значения по умолчанию
          // Метаданные (type, label, hint) должны быть указаны в атрибутах узла
          const label = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1').trim();
          return { field, label, type: 'text' as const, hint: '' };
        });

        // Инициализируем inputData значениями из updatedData или lastInputValues
        const initialInputData: Record<string, any> = {};
        (executionResult.requiredData || []).forEach((field) => {
          // Сначала пытаемся взять из текущих данных пациента
          const valueFromCurrentData = getNestedValue(updatedData, field);
          if (valueFromCurrentData !== undefined && valueFromCurrentData !== null && valueFromCurrentData !== '') {
            initialInputData[field] = valueFromCurrentData;
          } else {
            // Если нет в текущих данных, используем последнее введённое значение
            const valueFromLast = lastInputValues[field];
            if (valueFromLast !== undefined && valueFromLast !== null && valueFromLast !== '') {
              initialInputData[field] = valueFromLast;
            }
          }
        });
        setInputData(initialInputData);

        setPausedExecution({
          currentData: updatedData,
          requiredFields: structuredFields,
          message: executionResult.message,
        });
      } else if (!executionResult.success) {
        setError(executionResult.error || 'Ошибка выполнения алгоритма');
        setPausedExecution(null);
        } else {
          setPausedExecution(null);
          setInputData({});
        }
      } catch (err) {
        console.error('[ExecutionPage] Ошибка при выполнении движка:', err);
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
        setCurrentEnginePromise(null);
        setPausedExecution(null);
      }
    } catch (err) {
      console.error('[ExecutionPage] Ошибка в handleContinueExecution:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      setPausedExecution(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getStepIcon = (step: ExecutionStep) => {
    if (step.error) return '❌';
    if (step.nodeType === 'condition') {
      return step.conditionResult ? '✅' : '❌';
    }
    if (step.nodeType === 'action') return '⚙️';
    if (step.nodeType === 'subprocess') return '📋';
    return '➡️';
  };

  if (!id) {
    return (
      <div className={styles.container}>
        <Alert theme="danger" title="Ошибка" message="ID процесса не указан" />
        <Button view="action" onClick={() => navigate('/')}>
          Вернуться к списку
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Движок исполнения алгоритма</h1>
        <div className={styles.headerActions}>
          <Button view="outlined" onClick={() => navigate(`/flow-editor/${id}`)}>
            Редактор схемы
          </Button>
          <Button view="action" onClick={() => navigate('/')}>
            К списку
          </Button>
        </div>
      </div>

      {recommendation && (
        <Card className={styles.infoCard}>
          <h3>{recommendation.title}</h3>
          <p>{recommendation.description}</p>
        </Card>
      )}

      <div className={styles.content}>
        {!pausedExecution && !result && (
          <Card className={styles.inputCard}>
            <h2>Запуск алгоритма</h2>
            <p className={styles.hint}>
              Нажмите кнопку "Выполнить алгоритм" для начала. Данные пациента будут запрашиваться по мере необходимости во время выполнения.
            </p>
            <Button 
              view="action" 
              size="l" 
              onClick={handleExecute}
              disabled={isLoading}
              className={styles.executeButton}
            >
              {isLoading ? 'Выполнение...' : 'Выполнить алгоритм'}
            </Button>
          </Card>
        )}

        {isLoading && (
          <Card className={styles.resultCard}>
            <div className={styles.loading}>
              <Spin size="l" />
              <p>Выполнение алгоритма...</p>
            </div>
          </Card>
        )}

        {error && (
          <Card className={styles.resultCard}>
            <Alert theme="danger" title="Ошибка" message={error} />
          </Card>
        )}

        {pausedExecution && (
          <Card className={styles.resultCard}>
            <Alert theme="warning" title="Требуется ввод данных" message={pausedExecution.message || 'Пожалуйста, введите следующие данные:'} />
            <div className={styles.pausedSection}>
              <h3>Введите данные:</h3>
              <div className={styles.inputFields}>
                {(() => {
                  // Группируем поля: отделяем вложенные от простых
                  const processedGroups = new Set<string>();
                  const fields: JSX.Element[] = [];
                  
                  pausedExecution.requiredFields.forEach(({ field, label, type, hint, compare, trueValue }) => {
                    // Обрабатываем вложенные поля (например, bloodPressure.systolic)
                    if (field.includes('.')) {
                      const parts = field.split('.');
                      const parentField = parts[0];
                      
                      // Показываем группу только один раз
                      if (!processedGroups.has(parentField)) {
                        processedGroups.add(parentField);
                        
                        // Группируем все вложенные поля с тем же родителем
                        const groupedFields = pausedExecution.requiredFields.filter(f => 
                          f.field.startsWith(parentField + '.')
                        );
                        
                        const parentLabel = parentField === 'bloodPressure' ? 'Артериальное давление' : 
                                          parentField === 'АД' ? 'Артериальное давление' :
                                          parentField;
                        
                        fields.push(
                          <div key={parentField} className={styles.groupedField}>
                            <Label size="m">{parentLabel}</Label>
                            <div className={styles.nestedFields}>
                              {groupedFields.map(({ field: nestedField, label: nestedLabel, type: nestedType, hint: nestedHint, compare: nestedCompare, trueValue: nestedTrueValue }) => {
                                return (
                                  <div key={nestedField} className={styles.inputField}>
                                    <Label size="s">{nestedLabel}</Label>
                                    {nestedHint && <p className={styles.fieldHint}>{nestedHint}</p>}
                                    {nestedCompare && (
                                      <p className={styles.fieldHint} style={{ color: '#0070f3', fontWeight: 'bold' }}>
                                        Условие: {nestedCompare}
                                      </p>
                                    )}
                                    {nestedTrueValue && (
                                      <p className={styles.fieldHint} style={{ color: '#00a86b', fontWeight: 'bold' }}>
                                        ✓ Значение для "Да": {nestedTrueValue}
                                      </p>
                                    )}
                                    <TextInput
                                      type={nestedType === 'number' ? 'number' : 'text'}
                                      value={inputData[nestedField] || ''}
                                      onChange={(e) => setInputData({ ...inputData, [nestedField]: e.target.value })}
                                      placeholder={nestedType === 'number' ? 'Введите число' : 'Введите значение'}
                                      className={styles.textInput}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                    } else {
                      // Простые поля
                      // Специальная обработка для boolean полей - показываем кнопки Да/Нет
                      const fieldType = type || 'text';
                      if (fieldType === 'boolean') {
                        fields.push(
                          <div key={field} className={styles.inputField}>
                            <Label size="m">{label}</Label>
                            {hint && <p className={styles.fieldHint}>{hint}</p>}
                            {compare && (
                              <p className={styles.fieldHint} style={{ color: '#0070f3', fontWeight: 'bold' }}>
                                Условие: {compare} {trueValue || ''}
                              </p>
                            )}
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                              <Button
                                view={inputData[field] === 'true' || inputData[field] === true ? 'action' : 'outlined'}
                                onClick={() => setInputData({ ...inputData, [field]: 'true' })}
                              >
                                Да (true)
                              </Button>
                              <Button
                                view={inputData[field] === 'false' || inputData[field] === false ? 'action' : 'outlined'}
                                onClick={() => setInputData({ ...inputData, [field]: 'false' })}
                              >
                                Нет (false)
                              </Button>
                            </div>
                          </div>
                        );
                      } else {
                        fields.push(
                          <div key={field} className={styles.inputField}>
                            <Label size="m">{label}</Label>
                            {hint && <p className={styles.fieldHint}>{hint}</p>}
                            {compare && (
                              <p className={styles.fieldHint} style={{ color: '#0070f3', fontWeight: 'bold' }}>
                                Условие: {compare}
                              </p>
                            )}
                            {trueValue && (
                              <p className={styles.fieldHint} style={{ color: '#00a86b', fontWeight: 'bold' }}>
                                ✓ Значение для "Да": {trueValue}
                              </p>
                            )}
                            <TextInput
                              type={type === 'number' ? 'number' : type === 'boolean' ? 'text' : 'text'}
                              value={inputData[field] || ''}
                              onChange={(e) => setInputData({ ...inputData, [field]: e.target.value })}
                              placeholder={type === 'number' ? 'Введите число' : type === 'boolean' ? 'true или false' : 'Введите значение'}
                              className={styles.textInput}
                            />
                          </div>
                        );
                      }
                    }
                  });
                  
                  return fields;
                })()}
              </div>
              <div className={styles.pausedActions}>
                <Button view="action" size="l" onClick={handleContinueExecution} disabled={isLoading}>
                  {isLoading ? 'Продолжение...' : 'Продолжить выполнение'}
                </Button>
                <Button view="outlined" onClick={() => {
                  setPausedExecution(null);
                  setInputData({});
                }}>
                  Отмена
                </Button>
              </div>
            </div>
          </Card>
        )}

        {result && (
          <Card className={styles.resultCard}>
            <h2>Результат выполнения</h2>
            
            <div className={styles.summary}>
              <Label theme={result.success ? 'success' : 'danger'}>
                {result.success ? '✅ Успешно' : '❌ Ошибка'}
              </Label>
              <div className={styles.summaryItem}>
                <strong>Шагов выполнено:</strong> {result.steps.length}
              </div>
              <div className={styles.summaryItem}>
                <strong>Время выполнения:</strong> {result.executionTime}ms
              </div>
              {result.finalNodeId && (
                <div className={styles.summaryItem}>
                  <strong>Финальный узел:</strong> {result.finalNodeId}
                </div>
              )}
            </div>

            {result.steps.length > 0 && (
              <div className={styles.stepsSection}>
                <h3>История выполнения</h3>
                <div className={styles.stepsList}>
                  {result.steps.map((step, index) => (
                    <Card key={index} className={styles.stepCard}>
                      <div className={styles.stepHeader}>
                        <span className={styles.stepIcon}>{getStepIcon(step)}</span>
                        <div className={styles.stepInfo}>
                          <strong>{step.nodeLabel}</strong>
                          <Label theme="info">{step.nodeType}</Label>
                        </div>
                        <span className={styles.stepNumber}>#{index + 1}</span>
                      </div>
                      
                      {step.conditionResult !== undefined && (
                        <div className={styles.conditionResult}>
                          <strong>Условие:</strong>{' '}
                          <Label theme={step.conditionResult ? 'success' : 'danger'}>
                            {step.conditionResult ? 'ДА' : 'НЕТ'}
                          </Label>
                        </div>
                      )}

                      {step.result && typeof step.result === 'object' && (
                        <details className={styles.stepDetails}>
                          <summary>Детали</summary>
                          <pre>{JSON.stringify(step.result, null, 2)}</pre>
                        </details>
                      )}

                      {step.error && (
                        <Alert theme="danger" className={styles.stepError} message={step.error} />
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(result.finalVariables).length > 0 && (
              <div className={styles.variablesSection}>
                <h3>Финальные переменные</h3>
                <Table
                  data={Object.entries(result.finalVariables).map(([key, value]) => ({
                    key,
                    value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
                  }))}
                  columns={[
                    { id: 'key', name: 'Переменная' },
                    { id: 'value', name: 'Значение' }
                  ]}
                />
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
});

