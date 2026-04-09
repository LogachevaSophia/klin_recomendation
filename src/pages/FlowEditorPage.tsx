import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spin } from '@gravity-ui/uikit';
import { FlowEditor } from '../components/FlowEditor/FlowEditor';
import { recommendationStore } from '../stores/recommendationStore';
import { bpmnStore } from '../stores/BpmnStore';
import { BackendData } from '../api/types';
import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';
import styles from './FlowEditorPage.module.scss';

export const FlowEditorPage: React.FC = observer(() => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Используем реактивность MobX для получения рекомендации
  const recommendation = id ? recommendationStore.recommendations.find(r => r.id === id) : null;
  const recommendationTitle = recommendation?.title || 'Flow Editor';

  const handleDumpData = () => {
    // Преобразуем данные из формата ReactFlow обратно в формат бэкенда
    const nodes = toJS(bpmnStore.initialNodes);
    const edges = toJS(bpmnStore.initialEdges);
    
    // Обратный маппинг типов: строка -> число
    // 2: condition - нода условий
    // 3: action - нода действий
    // 4: subprocess - нода подпроцесса
    const typeMap: Record<string, number> = {
      'condition': 2,
      'action': 3,
      'subprocess': 4,
    };
    
    // Преобразуем nodes
    const backendNodes = nodes.map((node) => {
      // Убираем префиксы "Начало: " и "Конец: " из label, если они есть
      let label = node.data.label;
      if (label.startsWith('Начало: ')) {
        label = label.replace('Начало: ', '');
      } else if (label.startsWith('Конец: ')) {
        label = label.replace('Конец: ', '');
      }
      
      // Преобразуем координаты обратно (делим на 200, как в transformBackendData)
      const x = Math.round(node.position.x / 200);
      const y = Math.round(node.position.y / 200);
      
      const nodeData: any = {
        label: label,
      };
      
      // Сохраняем атрибуты, если они есть
      if (node.data.attributes && Array.isArray(node.data.attributes) && node.data.attributes.length > 0) {
        nodeData.attributes = node.data.attributes.map((attr: any) => ({
          name: attr.name || '',
          value: attr.value || ''
        }));
        console.log(`Node ${node.id} attributes:`, node.data.attributes);
      }
      
      // Сохраняем другие данные узла (loopCondition, maxIterations и т.д.)
      if (node.data.loopCondition) {
        nodeData.loopCondition = node.data.loopCondition;
      }
      if (node.data.loopSubprocessId) {
        nodeData.loopSubprocessId = node.data.loopSubprocessId;
      }
      if (node.data.maxIterations) {
        nodeData.maxIterations = node.data.maxIterations;
      }
      
      // Все ноды, которые не condition или subprocess, становятся action (тип 3)
      // Это включает бывшие start и finish
      const nodeType = typeMap[node.type] || 3;
      
      return {
        id: parseInt(node.id),
        type: nodeType,
        data: nodeData,
        json_data: {
          x: x,
          y: y,
        },
        subprocess_id: node.data.subprocess_id || null,
      };
    });
    
    // Преобразуем edges
    const backendEdges = edges.map((edge) => {
      const backendEdge: any = {
        id: edge.id,
        source: parseInt(edge.source),
        target: parseInt(edge.target),
      };
      
      if (edge.label && edge.label !== 'ДА' && edge.label !== 'НЕТ') {
        backendEdge.label = edge.label;
      }
      
      // Восстанавливаем data для condition edges
      if (edge.sourceHandle === 'true' || edge.label === 'ДА') {
        backendEdge.data = {
          type: 'condition',
          value: true,
        };
      } else if (edge.sourceHandle === 'false' || edge.label === 'НЕТ') {
        backendEdge.data = {
          type: 'condition',
          value: false,
        };
      }
      
      if (edge.sourceHandle) {
        backendEdge.sourceHandle = edge.sourceHandle;
      }
      if (edge.targetHandle) {
        backendEdge.targetHandle = edge.targetHandle;
      }
      if (edge.style) {
        backendEdge.style = edge.style;
      }
      
      return backendEdge;
    });
    
    // Формируем данные в формате бэкенда
    const backendData: BackendData = {
      process_id: id || '',
      name: recommendation?.title || 'Новый процесс',
      nodes: backendNodes,
      edges: backendEdges,
    };
    
    // Выводим в консоль в формате, готовом для копирования
    console.log('=== Данные для бэкенда (скопируйте JSON и вставьте в data.ts) ===');
    console.log('Узлы с атрибутами:', backendNodes.filter(n => n.data.attributes && n.data.attributes.length > 0));
    const jsonString = JSON.stringify(backendData, null, 2);
    console.log(jsonString);
    console.log('\n=== Конец данных ===');
    
    // Также копируем в буфер обмена (если доступно)
    if (navigator.clipboard) {
      navigator.clipboard.writeText(jsonString).then(() => {
        console.log('✓ Данные скопированы в буфер обмена!');
      }).catch(() => {
        console.log('⚠ Не удалось скопировать в буфер обмена, скопируйте вручную');
      });
    }
  };

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
        <div className={styles.headerActions}>
          <Button view="outlined" onClick={handleDumpData}>
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