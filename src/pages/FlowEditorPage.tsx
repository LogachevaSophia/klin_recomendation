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

  useEffect(() => {
    const loadData = async () => {
      if (recommendationStore.recommendations.length === 0) {
        await recommendationStore.fetchRecommendations();
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const recommendation = recommendationStore.recommendations.find(r => r.id === id);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="l" />
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Recommendation not found</h1>
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
        <h1>{recommendation.title} - Flow Editor</h1>
        <Button view="action" onClick={() => navigate('/')}>
          Back to List
        </Button>
      </div>
      <div className={styles.editorContainer}>
        <FlowEditor recommendationId={recommendation.id} />
      </div>
    </div>
  );
}); 