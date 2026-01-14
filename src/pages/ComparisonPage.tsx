import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ProcessComparison } from '../components/ProcessComparison/ProcessComparison';
import { Button, Card } from '@gravity-ui/uikit';
import styles from './ComparisonPage.module.scss';

export const ComparisonPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const processId1 = searchParams.get('process1') || '';
  const processId2 = searchParams.get('process2') || '';

  const handleClose = () => {
    navigate('/recommendations');
  };

  // Если параметры не переданы, показываем сообщение с предложением выбрать процессы через список
  if (!processId1 || !processId2) {
    return (
      <div className={styles.container}>
        <Card className={styles.selectCard}>
          <h2>Сравнение процессов</h2>
          <p>Для сравнения процессов выберите их в списке рекомендаций и нажмите кнопку "Сравнить процессы".</p>
          <Button onClick={handleClose}>Вернуться к списку</Button>
        </Card>
      </div>
    );
  }

  return (
    <ProcessComparison
      processId1={processId1}
      processId2={processId2}
      onClose={handleClose}
    />
  );
};

