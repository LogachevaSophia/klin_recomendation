import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spin } from '@gravity-ui/uikit';
import { FlowEditor } from '../components/FlowEditor/FlowEditor';
import { recommendationStore } from '../stores/recommendationStore';
import { observer } from 'mobx-react-lite';
import styles from './FlowEditorPage.module.scss';

export const FlowEditorPage: React.FC = observer(() => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Используем реактивность MobX для получения рекомендации
  const recommendation = id ? recommendationStore.recommendations.find(r => r.id === id) : null;
  const recommendationTitle = recommendation?.title || 'Flow Editor';

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        // Если рекомендация не найдена в списке, обновляем список
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
        <Button view="action" onClick={() => navigate('/')}>
          Back to List
        </Button>
      </div>
      <div className={styles.editorContainer}>
        <FlowEditor recommendationId={id} />
      </div>
    </div>
  );
}); 