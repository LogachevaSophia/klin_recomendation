import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { recommendationStore } from '../../stores/recommendationStore';
import { Button, Card, Spin, Alert, Modal, Select } from '@gravity-ui/uikit';
import { RecommendationForm } from './RecommendationForm';
import { RecommendationResponse } from '../../api/types';
import styles from './Recommendations.module.scss';

export const Recommendations = observer(() => {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecommendationResponse | undefined>();
  const [comparisonProcess1, setComparisonProcess1] = useState<string>('');
  const [comparisonProcess2, setComparisonProcess2] = useState<string>('');

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

  const handleOpenComparison = () => {
    setIsComparisonOpen(true);
  };

  const handleCloseComparison = () => {
    setIsComparisonOpen(false);
    setComparisonProcess1('');
    setComparisonProcess2('');
  };

  const handleStartComparison = () => {
    if (comparisonProcess1 && comparisonProcess2 && comparisonProcess1 !== comparisonProcess2) {
      navigate(`/compare?process1=${comparisonProcess1}&process2=${comparisonProcess2}`);
    }
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
        <div className={styles.headerActions}>
          <Button
            view="outlined"
            onClick={handleOpenComparison}
          >
            Сравнить процессы
          </Button>
          <Button
            view="action"
            onClick={() => setIsFormOpen(true)}
          >
            Add Recommendation
          </Button>
        </div>
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

      <Modal
        open={isComparisonOpen}
        onClose={handleCloseComparison}
        size="s"
      >
        <div className={styles.comparisonModal}>
          <h2>Сравнение процессов</h2>
          <p>Выберите два процесса для сравнения</p>
          
          <div className={styles.comparisonSelects}>
            <div className={styles.selectGroup}>
              <label>Процесс 1:</label>
              <Select
                value={[comparisonProcess1]}
                onUpdate={(value) => setComparisonProcess1(value[0])}
                options={recommendationStore.recommendations.map(rec => ({
                  value: rec.id,
                  content: rec.title
                }))}
                placeholder="Выберите первый процесс"
              />
            </div>
            
            <div className={styles.selectGroup}>
              <label>Процесс 2:</label>
              <Select
                value={[comparisonProcess2]}
                onUpdate={(value) => setComparisonProcess2(value[0])}
                options={recommendationStore.recommendations
                  .filter(rec => rec.id !== comparisonProcess1)
                  .map(rec => ({
                    value: rec.id,
                    content: rec.title
                  }))}
                placeholder="Выберите второй процесс"
              />
            </div>
          </div>

          <div className={styles.comparisonActions}>
            <Button
              view="action"
              onClick={handleStartComparison}
              disabled={!comparisonProcess1 || !comparisonProcess2 || comparisonProcess1 === comparisonProcess2}
            >
              Сравнить
            </Button>
            <Button
              view="outlined"
              onClick={handleCloseComparison}
            >
              Отмена
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}); 