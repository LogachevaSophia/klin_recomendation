import React from 'react';
import { observer } from 'mobx-react-lite';
import { bpmnStore } from '../../stores/BpmnStore';
import styles from './ProcessTabs.module.scss';

export const ProcessTabs: React.FC = observer(() => {
  const availableProcesses = bpmnStore.availableProcesses;
  const activeProcessId = bpmnStore.activeProcessId;

  const handleTabClick = (processId: string) => {
    bpmnStore.setActiveProcess(processId);
  };

  const getTabTitle = (processId: string, processName: string) => {
    if (processId === 'main') {
      return '🏠 Главный процесс';
    }
    return `📋 ${processName}`;
  };

  if (availableProcesses.length <= 1) {
    return null; // Не показываем вкладки, если процесс только один
  }

  return (
    <div className={styles.processTabsContainer}>
      <div className={styles.tabsWrapper}>
        {availableProcesses.map(({ id, name }) => (
          <button
            key={id}
            className={`${styles.tab} ${id === activeProcessId ? styles.active : ''}`}
            onClick={() => handleTabClick(id)}
          >
            {getTabTitle(id, name)}
            {id !== 'main' && (
              <span className={styles.closeButton}>
                ×
              </span>
            )}
          </button>
        ))}
      </div>
      <div className={styles.breadcrumb}>
        Текущий процесс: {availableProcesses.find(p => p.id === activeProcessId)?.name || 'Неизвестный'}
      </div>
    </div>
  );
});
