import React, { useState } from 'react';
import classNames from 'classnames';
import { Handle, Position } from '@xyflow/react';
import { bpmnStore } from '../../../stores/BpmnStore';
import styles from './SubprocessNode.module.scss';

interface SubprocessNodeProps {
  data: {
    label: string;
    subprocess_id?: string;
    attributes?: Array<{ id: string; name: string; value: string }>;
  };
  onSubprocessClick?: (subprocessId: string) => void;
}

export const SubprocessNode: React.FC<SubprocessNodeProps> = ({ data, onSubprocessClick }) => {
  const [_isOpen, setOpen] = useState(false);

  const handleClick = async () => {
    if (data.subprocess_id) {
      console.log('SubprocessNode clicked:', data.subprocess_id);
      try {
        if (onSubprocessClick) {
          // Используем переданный обработчик
          onSubprocessClick(data.subprocess_id);
        } else {
          // Используем bpmnStore напрямую
          await bpmnStore.setActiveProcess(data.subprocess_id);
        }
      } catch (error) {
        console.error('Error opening subprocess:', error);
      }
    } else {
      setOpen(true);
    }
  };

  return (
    <div onClick={handleClick}>
      <div className={classNames(styles.custom, styles.subprocessNode)}>
        <div className={styles.subprocessIcon}>
          📋
        </div>
        <div className={styles.content}>
          <strong>{data.label}</strong>
          {data.subprocess_id && (
            <div className={styles.subprocessId}>
              ID: {data.subprocess_id.slice(0, 8)}...
            </div>
          )}
          <div className={styles.clickHint}>
            Нажмите для открытия
          </div>
        </div>
        <div className={styles.expandIcon}>
          →
        </div>
      </div>
      
      {/* Входящее соединение */}
      <Handle
        type="target"
        position={Position.Left}
        className="subprocess-handle-input"
        isConnectable={true}
      />
      
      {/* Исходящее соединение */}
      <Handle
        type="source"
        position={Position.Right}
        className="subprocess-handle-output"
        isConnectable={true}
      />
    </div>
  );
};
