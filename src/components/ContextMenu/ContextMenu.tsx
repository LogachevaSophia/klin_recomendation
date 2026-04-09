import React from 'react';
import styles from './ContextMenu.module.scss';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  elementType: 'node' | 'edge' | 'canvas';
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onDelete,
  onEdit,
  onDuplicate,
  elementType
}) => {
  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div 
      className={styles.contextMenu} 
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {elementType === 'node' && (
        <>
          {onEdit && (
            <div 
              className={styles.menuItem} 
              onClick={() => handleAction(onEdit)}
            >
              <span className={styles.icon}>✏️</span>
              Редактировать
            </div>
          )}
          {onDuplicate && (
            <div 
              className={styles.menuItem} 
              onClick={() => handleAction(onDuplicate)}
            >
              <span className={styles.icon}>📋</span>
              Дублировать
            </div>
          )}
          <div className={styles.separator} />
        </>
      )}
      
      {(elementType === 'node' || elementType === 'edge') && onDelete && (
        <div 
          className={`${styles.menuItem} ${styles.danger}`} 
          onClick={() => handleAction(onDelete)}
        >
          <span className={styles.icon}>🗑️</span>
          Удалить
        </div>
      )}

      {elementType === 'canvas' && (
        <div className={styles.menuItem} onClick={onClose}>
          <span className={styles.icon}>ℹ️</span>
          Пустая область
        </div>
      )}
    </div>
  );
};
