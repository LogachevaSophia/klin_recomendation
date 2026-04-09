import React, { useState, useCallback } from 'react';
import classNames from 'classnames';
import { Handle, Position } from '@xyflow/react';
import styles from './LoopContainer.module.scss';

interface LoopContainerProps {
  data: {
    label: string;
    exitCondition?: string; // Условие выхода из цикла
    maxIterations?: number; // Максимальное количество итераций
    childNodes?: Array<{ id: string; label: string; type: string; conditionalAction?: string }>; // Дочерние ноды внутри цикла
    attributes?: Array<{ id: string; name: string; value: string }>;
  };
  id: string; // ID самого контейнера
  onAddChildNode?: (containerId: string, nodeData: any) => void; // Callback для добавления дочерней ноды
}

export const LoopContainer: React.FC<LoopContainerProps> = ({ data, id, onAddChildNode }) => {
  const [_isOpen, setOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    
    try {
      const nodeData = JSON.parse(event.dataTransfer.getData('application/reactflow'));
      if (nodeData && onAddChildNode) {
        onAddChildNode(id, nodeData);
      }
    } catch (error) {
      console.error('Error parsing dropped node data:', error);
    }
  }, [id, onAddChildNode]);

  return (
    <div onClick={() => { setOpen(true); }}>
      <div className={classNames(styles.custom, styles.loopContainer)}>
        {/* Заголовок цикла */}
        <div className={styles.header}>
          <div className={styles.loopIcon}>🔄</div>
          <div className={styles.headerText}>
            <strong>{data.label}</strong>
            {data.exitCondition && (
              <div className={styles.exitCondition}>
                Условие выхода: {data.exitCondition}
              </div>
            )}
            {data.maxIterations && (
              <div className={styles.maxIterations}>
                Макс. итераций: {data.maxIterations}
              </div>
            )}
          </div>
        </div>

        {/* Область для содержимого цикла */}
        <div 
          className={classNames(styles.content, { [styles.dragOver]: isDragOver })}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {data.childNodes && data.childNodes.length > 0 ? (
            <div className={styles.childNodes}>
              {data.childNodes.map((childNode, index) => (
                <div key={childNode.id}>
                  <div className={classNames(
                    styles.childNode,
                    { [styles.conditionalNode]: childNode.conditionalAction }
                  )}>
                    <div className={styles.childNodeIcon}>
                      {childNode.type === 'action' && '⚡'}
                      {childNode.type === 'condition' && '❓'}
                      {childNode.type === 'subprocess' && '📋'}
                    </div>
                    <div className={styles.childNodeContent}>
                      <div className={styles.childNodeLabel}>{childNode.label}</div>
                      {childNode.conditionalAction && (
                        <div className={styles.conditionalLabel}>
                          ← Если {childNode.conditionalAction}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Специальная стрелка для условий */}
                  {childNode.type === 'condition' && index < data.childNodes!.length - 1 && (
                    <div className={styles.conditionArrows}>
                      <div className={styles.conditionArrowYes}>ДА →</div>
                      <div className={styles.conditionArrowNo}>НЕТ → Выход</div>
                    </div>
                  )}
                  {/* Обычная стрелка */}
                  {childNode.type !== 'condition' && index < data.childNodes!.length - 1 && (
                    <div className={styles.childNodeArrow}>↓</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.placeholder}>
              Перетащите сюда ноды для выполнения в цикле
            </div>
          )}
        </div>

        {/* Условие выхода внизу */}
        <div className={styles.footer}>
          <div className={styles.exitConditionBlock}>
            🚪 Выход из цикла: {data.exitCondition || 'не указано'}
          </div>
          {data.maxIterations && (
            <div className={styles.maxIterationsBlock}>
              🔢 Максимум итераций: {data.maxIterations}
            </div>
          )}
        </div>
      </div>
      
      {/* Входящее соединение (основной поток) */}
      <Handle
        type="target"
        position={Position.Top}
        className="loop-container-handle-input"
        isConnectable={true}
        id="main-input"
      />
      
      {/* Исходящее соединение для выхода из цикла */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="loop-container-handle-output"
        isConnectable={true}
        id="main-output"
      />
      
      {/* Внутренние соединения для тела цикла */}
      <Handle
        type="source"
        position={Position.Right}
        className="loop-container-handle-body-start"
        isConnectable={true}
        id="body-start"
        style={{ top: '30%' }}
      />
      
      <Handle
        type="target"
        position={Position.Left}
        className="loop-container-handle-body-end"
        isConnectable={true}
        id="body-end"
        style={{ top: '70%' }}
      />
    </div>
  );
};
