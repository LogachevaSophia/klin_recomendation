import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { recommendationStore } from '../../stores/recommendationStore';
import { authStore } from '../../stores/authStore';
import { hasPermission } from '../../utils/permissions';
import { Button, Card, Spin, Alert, Modal, Select } from '@gravity-ui/uikit';
import { RecommendationForm } from './RecommendationForm';
import type { DomainProcess } from '../../api/clinrecProcessMapper';
import styles from './Recommendations.module.scss';

export const Recommendations = observer(() => {
  const navigate = useNavigate();

  const handleLogout = () => {
    authStore.logout();
    navigate('/login', { replace: true });
  };
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<DomainProcess | undefined>();
  const [comparisonProcess1, setComparisonProcess1] = useState<string>('');
  const [comparisonProcess2, setComparisonProcess2] = useState<string>('');

  useEffect(() => {
    recommendationStore.fetchRecommendations();
    void authStore.refreshPermissions();
  }, []);

  const handleCreate = async (data: any) => {
    await recommendationStore.createRecommendation(data);
    recommendationStore.fetchRecommendations();
    setIsFormOpen(false);
  };

  const handleUpdate = async (data: any) => {
    if (selectedRecommendation) {
      await recommendationStore.updateRecommendation({ ...data, id: selectedRecommendation.process_id });
      setIsFormOpen(false);
      setSelectedRecommendation(undefined);
    }
  };

  const handleEdit = (recommendation: DomainProcess) => {
    setSelectedRecommendation(recommendation);
    setIsFormOpen(true);
  };

  const handleOpenFlowEditor = (recommendation: DomainProcess) => {
    const pid = recommendation.process_id || recommendation.id || '';
    window.open(`/flow-editor/${pid}`, '_blank');
  };

  const handleOpenExecution = (recommendation: DomainProcess) => {
    navigate(`/execution/${recommendation.process_id || recommendation.id || ''}`);
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
  console.log('recommendationStore.recommendations', recommendationStore.recommendations)
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
          {authStore.user && (
            <span className={styles.userEmail} title={authStore.user.email}>
              {authStore.user.email}
            </span>
          )}
          <Button view="outlined" onClick={handleLogout}>
            Выйти
          </Button>
          <Button
            view="outlined"
            onClick={handleOpenComparison}
          >
            Сравнить процессы
          </Button>
          {hasPermission('create', 'process') && (
            <Button view="action" onClick={() => setIsFormOpen(true)}>
              Add Recommendation
            </Button>
          )}
        </div>
      </div>

      <div className={styles.recommendationGrid}>
        
        {recommendationStore.recommendations.map((recommendation) => (
          <Card
            key={recommendation.process_id || recommendation.id || ''}
            className={styles.recommendationCard}
          >
            <div className={styles.cardHeader}>
              <h3>{recommendation.name}</h3>
              {recommendation.priority != null && (
                <span className={styles[`priority-${recommendation.priority}`]}>
                  {recommendation.priority}
                </span>
              )}
            </div>
            {recommendation.description != null && recommendation.description !== '' && (
              <p>{recommendation.description}</p>
            )}
            <div className={styles.cardFooter}>
              {recommendation.category != null && recommendation.category !== '' && (
                <span className={styles.category}>{recommendation.category}</span>
              )}
              <div className={styles.actions}>
                <Button
                  view="action"
                  size="s"
                  onClick={() => handleOpenExecution(recommendation)}
                >
                  🚀 Выполнить
                </Button>
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
                {hasPermission('delete', 'process') && (
                  <Button
                    view="outlined"
                    size="s"
                    onClick={() =>
                      recommendationStore.deleteRecommendation(
                        recommendation.process_id || recommendation.id || '',
                      )
                    }
                  >
                    Delete
                  </Button>
                )}
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
                  value: rec.process_id,
                  content: rec.name
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
                  .filter(rec => rec.process_id !== comparisonProcess1)
                  .map(rec => ({
                    value: rec.process_id,
                    content: rec.name
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