import React, { useState } from 'react';
import styles from './HelpPanel.module.scss';

export const HelpPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  const shortcuts = [
    { key: 'Delete / Backspace', action: 'Удалить выделенные элементы' },
    { key: 'Ctrl + D', action: 'Дублировать выделенную ноду' },
    { key: 'Ctrl + A', action: 'Выделить все элементы' },
    { key: 'Escape', action: 'Снять выделение' },
    { key: 'Shift + клик', action: 'Множественное выделение' },
    { key: 'ПКМ', action: 'Контекстное меню' },
    { key: 'Двойной клик', action: 'Редактировать ноду' },
    { key: 'Drag & Drop', action: 'Перетащить ноду из боковой панели' },
  ];

  return (
    <div className={styles.helpPanel}>
      <button 
        className={styles.helpButton}
        onClick={() => setIsVisible(!isVisible)}
        title="Помощь и горячие клавиши"
      >
        ❓
      </button>
      
      {isVisible && (
        <div className={styles.helpContent}>
          <div className={styles.helpHeader}>
            <h3>Горячие клавиши</h3>
            <button 
              className={styles.closeButton}
              onClick={() => setIsVisible(false)}
            >
              ✕
            </button>
          </div>
          
          <div className={styles.shortcuts}>
            {shortcuts.map((shortcut, index) => (
              <div key={index} className={styles.shortcutItem}>
                <span className={styles.key}>{shortcut.key}</span>
                <span className={styles.action}>{shortcut.action}</span>
              </div>
            ))}
          </div>
          
          <div className={styles.tips}>
            <h4>💡 Советы:</h4>
            <ul>
              <li>Используйте Shift для выделения нескольких элементов</li>
              <li>Перетаскивайте ноды из боковой панели на диаграмму</li>
              <li>Правый клик открывает контекстное меню с действиями</li>
              <li>Двойной клик по ноде открывает редактор атрибутов</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
