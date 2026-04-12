import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spin, Alert } from '@gravity-ui/uikit';
import { FlowEditor } from '../components/FlowEditor/FlowEditor';
import { recommendationStore } from '../stores/recommendationStore';
import { bpmnStore } from '../stores/BpmnStore';
import { recommendationService } from '../api/recommendationService';
import { flowEditorStateToBackendData } from '../api/clinrecProcessMapper';
import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';
import styles from './FlowEditorPage.module.scss';

export const FlowEditorPage: React.FC = observer(() => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ theme: 'success' | 'danger'; text: string } | null>(
    null
  );

  const recommendation = id ? recommendationStore.recommendations.find((r) => r.id === id) : null;
  const recommendationTitle = recommendation?.title || 'Flow Editor';

  const handleDumpData = async () => {
    if (!id) return;

    setSaveMessage(null);
    const nodes = toJS(bpmnStore.initialNodes);
    const edges = toJS(bpmnStore.initialEdges);
    const backendData = flowEditorStateToBackendData(
      nodes,
      edges,
      id,
      recommendation?.title || 'Новый процесс'
    );

    const jsonString = JSON.stringify(backendData, null, 2);
    console.log('=== Данные для бэкенда ===');
    console.log(jsonString);
    console.log('=== Конец ===');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(jsonString).catch(() => undefined);
    }

    setIsSaving(true);
    try {
      await recommendationService.saveProcessGraph(backendData);
      setSaveMessage({ theme: 'success', text: 'Схема сохранена на сервере.' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка сохранения';
      setSaveMessage({ theme: 'danger', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        if (!recommendation) {
          await recommendationStore.fetchRecommendations();
        }
      } catch (error) {
        console.error('Error loading recommendation:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id, recommendation]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="l" />
      </div>
    );
  }

  if (!id) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Invalid recommendation ID</h1>
          <Button view="action" onClick={() => navigate('/')}>
            Back to List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{recommendationTitle} - Flow Editor!</h1>
        <div className={styles.headerActions}>
          {saveMessage && (
            <Alert theme={saveMessage.theme} message={saveMessage.text} className={styles.saveAlert} />
          )}
          <Button view="outlined" onClick={handleDumpData} loading={isSaving} disabled={isSaving}>
            Выплюнуть данные
          </Button>
          <Button view="action" onClick={() => navigate('/')}>
            Back to List
          </Button>
        </div>
      </div>
      <div className={styles.editorContainer}>
        <FlowEditor recommendationId={id} />
      </div>
    </div>
  );
});
