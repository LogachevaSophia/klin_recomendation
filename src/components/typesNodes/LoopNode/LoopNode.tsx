import React, { useState } from 'react';
import classNames from 'classnames';
import { Handle, Position } from '@xyflow/react';
import styles from './LoopNode.module.scss';
import { bpmnStore } from '../../../stores/BpmnStore';

interface LoopNodeProps {
  data: {
    label: string;
    attributes?: Array<{ id: string; name: string; value: string }>;
    loopCondition?: string; // Условие для завершения цикла
    maxIterations?: number; // Максимальное количество итераций
    loopSubprocessId?: string; // ID подпроцесса цикла
  };
  onLoopClick?: (loopSubprocessId: string) => void;
}

export const LoopNode: React.FC<LoopNodeProps> = ({ data, onLoopClick }) => {
  const [_isOpen, setOpen] = useState(false);

  const handleClick = async () => {
    if (data.loopSubprocessId) {
      if (onLoopClick) {
        onLoopClick(data.loopSubprocessId);
      } else {
        // Fallback: прямое обращение к store
        await bpmnStore.setActiveProcess(data.loopSubprocessId);
      }
    }
    setOpen(true);
  };

  return (
    <div onClick={handleClick}>
      <div className={classNames(styles.custom, styles.loopNode)}>
        <div className={styles.loopIcon}>
          🔄
        </div>
        <div className={styles.content}>
          <strong>{data.label}</strong>
          {data.loopSubprocessId && (
            <div className={styles.clickHint}>
              Нажмите для открытия цикла
            </div>
          )}
          {data.loopCondition && (
            <div className={styles.condition}>
              Условие: {data.loopCondition}
            </div>
          )}
          {data.maxIterations && (
            <div className={styles.iterations}>
              Макс. итераций: {data.maxIterations}
            </div>
          )}
        </div>
      </div>
      
      {/* Входящее соединение (основной поток) */}
      <Handle
        type="target"
        position={Position.Top}
        className="loop-handle-input"
        isConnectable={true}
        id="main-input"
      />
      
      {/* Исходящее соединение для выхода из цикла */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="loop-handle-output"
        isConnectable={true}
        id="main-output"
      />
      
      {/* Исходящее соединение для тела цикла */}
      <Handle
        type="source"
        position={Position.Right}
        className="loop-handle-body"
        isConnectable={true}
        id="loop-body"
      />
      
      {/* Входящее соединение для возврата в цикл */}
      <Handle
        type="target"
        position={Position.Left}
        className="loop-handle-return"
        isConnectable={true}
        id="loop-return"
      />
    </div>
  );
};
