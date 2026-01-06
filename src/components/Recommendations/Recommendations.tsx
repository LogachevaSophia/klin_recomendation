import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
// import { useNavigate } from 'react-router-dom'; // Unused for now
import { recommendationStore } from '../../stores/recommendationStore';
import { Button, Card, Spin, Alert, Modal } from '@gravity-ui/uikit';
import { RecommendationForm } from './RecommendationForm';
import { RecommendationResponse } from '../../api/types';
import styles from './Recommendations.module.scss';

export const Recommendations = observer(() => {
  // const navigate = useNavigate(); // Unused for now
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecommendationResponse | undefined>();

  useEffect(() => {
    recommendationStore.fetchRecommendations();
  }, []);

  const handleCreate = async (data: any) => {
    await recommendationStore.createRecommendation(data);
    setIsFormOpen(false);
  };

  const handleUpdate = async (data: any) => {
    if (selectedRecommendation) {
      await recommendationStore.updateRecommendation({ ...data, id: selectedRecommendation.id });
      setIsFormOpen(false);
      setSelectedRecommendation(undefined);
    }
  };

  const handleEdit = (recommendation: RecommendationResponse) => {
    setSelectedRecommendation(recommendation);
    setIsFormOpen(true);
  };

  const handleOpenFlowEditor = (recommendation: RecommendationResponse) => {
    window.open(`/flow-editor/${recommendation.id}`, '_blank');
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedRecommendation(undefined);
  };

  if (recommendationStore.loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="l" />
      </div>
    );
  }

  if (recommendationStore.error) {
    return (
      <Alert
        theme="danger"
        title="Error"
        message={recommendationStore.error}
        className={styles.error}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Recommendations</h1>
        <Button
          view="action"
          onClick={() => setIsFormOpen(true)}
        >
          Add Recommendation
        </Button>
      </div>

      <div className={styles.recommendationGrid}>
        {recommendationStore.recommendations.map((recommendation) => (
          <Card key={recommendation.id} className={styles.recommendationCard}>
            <div className={styles.cardHeader}>
              <h3>{recommendation.title}</h3>
              <span className={styles[`priority-${recommendation.priority}`]}>
                {recommendation.priority}
              </span>
            </div>
            <p>{recommendation.description}</p>
            <div className={styles.cardFooter}>
              <span className={styles.category}>{recommendation.category}</span>
              <div className={styles.actions}>
                <Button
                  view="outlined"
                  size="s"
                  onClick={() => handleOpenFlowEditor(recommendation)}
                >
                  Flow Editor
                </Button>
                <Button
                  view="outlined"
                  size="s"
                  onClick={() => handleEdit(recommendation)}
                >
                  Edit
                </Button>
                <Button
                  view="outlined"
                  size="s"
                  onClick={() => recommendationStore.deleteRecommendation(recommendation.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={isFormOpen}
        onClose={handleCloseForm}
      >
        <RecommendationForm
          initialData={selectedRecommendation}
          onSubmit={selectedRecommendation ? handleUpdate : handleCreate}
          onCancel={handleCloseForm}
        />
      </Modal>
    </div>
  );
}); 