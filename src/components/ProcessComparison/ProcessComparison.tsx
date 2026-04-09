import React, { useEffect, useState } from 'react';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import { comparisonService } from '../../api/comparisonService';
import { ProcessComparison as ProcessComparisonType } from '../../api/comparisonTypes';
import { transformBackendData } from '../../stores/BpmnBackEdit';
import { ActionNode } from '../typesNodes/ActionNode/ActionNode';
import { ConditionNode } from '../typesNodes/ConditionNode/ConditionNode';
import { SubprocessNode } from '../typesNodes/SubprocessNode/SubprocessNode';
import { Button, Card, Spin, Alert } from '@gravity-ui/uikit';
import styles from './ProcessComparison.module.scss';
import '@xyflow/react/dist/style.css';

interface ProcessComparisonProps {
  processId1: string;
  processId2: string;
  onClose?: () => void;
}

const nodeTypes = {
  action: ActionNode,
  condition: ConditionNode,
  subprocess: SubprocessNode,
};

export const ProcessComparison: React.FC<ProcessComparisonProps> = ({
  processId1,
  processId2,
  onClose
}) => {
  const [comparison, setComparison] = useState<ProcessComparisonType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadComparison = async () => {
      try {
        setLoading(true);
        const data = await comparisonService.compare(processId1, processId2);
        setComparison(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load comparison');
      } finally {
        setLoading(false);
      }
    };

    if (processId1 && processId2) {
      loadComparison();
    }
  }, [processId1, processId2]);

  if (loading) {
    return (
      <div className={styles.container}>
        <Spin size="l" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Alert theme="danger" title="Error" message={error} />
        {onClose && <Button onClick={onClose}>Закрыть</Button>}
      </div>
    );
  }

  if (!comparison) {
    return null;
  }

  // Преобразуем данные для отображения
  // Для первой схемы показываем: неизмененные, удаленные и измененные (старая версия)
  const process1Data = {
    process_id: comparison.process1.id,
    name: comparison.process1.name,
    nodes: [
      ...comparison.nodes.unchanged,
      ...comparison.nodes.removed,
      // Для измененных нод берем старую версию из modified (но у нас только новая версия)
      // Поэтому показываем новую версию, но с пометкой "изменено"
      ...comparison.nodes.modified.map(nc => {
        // Создаем старую версию ноды на основе изменений
        const oldNode = { ...nc.node };
        if (nc.changes?.label) {
          oldNode.data = { ...oldNode.data, label: nc.changes.label.old };
        }
        if (nc.changes?.position) {
          oldNode.json_data = { ...oldNode.json_data, ...nc.changes.position.old };
        }
        if (nc.changes?.type) {
          oldNode.type = nc.changes.type.old;
        }
        return oldNode;
      })
    ],
    edges: [
      ...comparison.edges.unchanged,
      ...comparison.edges.removed,
      ...comparison.edges.modified.map(ec => {
        const oldEdge = { ...ec.edge };
        if (ec.changes?.source) {
          oldEdge.source = ec.changes.source.old;
        }
        if (ec.changes?.target) {
          oldEdge.target = ec.changes.target.old;
        }
        if (ec.changes?.label) {
          oldEdge.label = ec.changes.label.old;
        }
        if (ec.changes?.data) {
          oldEdge.data = ec.changes.data.old;
        }
        return oldEdge;
      })
    ]
  };

  // Для второй схемы показываем: неизмененные, добавленные и измененные (новая версия)
  const process2Data = {
    process_id: comparison.process2.id,
    name: comparison.process2.name,
    nodes: [
      ...comparison.nodes.unchanged,
      ...comparison.nodes.added,
      ...comparison.nodes.modified.map(nc => nc.node)
    ],
    edges: [
      ...comparison.edges.unchanged,
      ...comparison.edges.added,
      ...comparison.edges.modified.map(ec => ec.edge)
    ]
  };

  const transformed1 = transformBackendData(process1Data);
  const transformed2 = transformBackendData(process2Data);

  // Добавляем стили для различий
  const nodes1WithStyles = transformed1.nodes.map(node => {
    const nodeId = parseInt(node.id);
    const isRemoved = comparison.nodes.removed.some(n => n.id === nodeId);
    const isModified = comparison.nodes.modified.some(nc => nc.node.id === nodeId);
    
    return {
      ...node,
      style: {
        border: isRemoved ? '3px solid #dc2626' : isModified ? '3px solid #eab308' : '2px solid #9ca3af',
        opacity: isRemoved ? 0.6 : 1,
        borderRadius: '8px'
      }
    };
  });

  const nodes2WithStyles = transformed2.nodes.map(node => {
    const nodeId = parseInt(node.id);
    const isAdded = comparison.nodes.added.some(n => n.id === nodeId);
    const isModified = comparison.nodes.modified.some(nc => nc.node.id === nodeId);
    
    return {
      ...node,
      style: {
        border: isAdded ? '3px solid #16a34a' : isModified ? '3px solid #eab308' : '2px solid #9ca3af',
        borderRadius: '8px'
      }
    };
  });

  const edges1WithStyles = transformed1.edges.map(edge => {
    const isRemoved = comparison.edges.removed.some(e => e.id === edge.id);
    const isModified = comparison.edges.modified.some(ec => ec.edge.id === edge.id);
    
    return {
      ...edge,
      style: {
        stroke: isRemoved ? '#dc2626' : isModified ? '#eab308' : '#9ca3af',
        strokeWidth: isRemoved || isModified ? 3 : 2,
        strokeDasharray: isRemoved ? '5,5' : undefined,
        opacity: isRemoved ? 0.6 : 1
      }
    };
  });

  const edges2WithStyles = transformed2.edges.map(edge => {
    const isAdded = comparison.edges.added.some(e => e.id === edge.id);
    const isModified = comparison.edges.modified.some(ec => ec.edge.id === edge.id);
    
    return {
      ...edge,
      style: {
        stroke: isAdded ? '#16a34a' : isModified ? '#eab308' : '#9ca3af',
        strokeWidth: isAdded || isModified ? 3 : 2,
      }
    };
  });

  const handleDumpData = () => {
    console.log('=== Данные сравнения ===');
    console.log(JSON.stringify(comparison, null, 2));
    console.log('=== Конец данных ===');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Сравнение процессов</h2>
        <div className={styles.headerActions}>
          <Button onClick={handleDumpData} view="outlined">
            Выплюнуть данные
          </Button>
          {onClose && <Button onClick={onClose}>Закрыть</Button>}
        </div>
      </div>

      {/* Сводка изменений */}
      <Card className={styles.summary}>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <strong>Процесс 1:</strong> {comparison.process1.name}
            <div className={styles.summaryStats}>
              Ноды: {comparison.summary.totalNodes1} | Связи: {comparison.summary.totalEdges1}
            </div>
          </div>
          <div className={styles.summaryItem}>
            <strong>Процесс 2:</strong> {comparison.process2.name}
            <div className={styles.summaryStats}>
              Ноды: {comparison.summary.totalNodes2} | Связи: {comparison.summary.totalEdges2}
            </div>
          </div>
          <div className={styles.summaryItem}>
            <strong>Изменения:</strong>
            <div className={styles.changesList}>
              <span className={styles.changeAdded}>+{comparison.summary.nodesAdded} нод, +{comparison.summary.edgesAdded} связей</span>
              <span className={styles.changeRemoved}>-{comparison.summary.nodesRemoved} нод, -{comparison.summary.edgesRemoved} связей</span>
              <span className={styles.changeModified}>~{comparison.summary.nodesModified} нод, ~{comparison.summary.edgesModified} связей изменено</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Легенда */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#16a34a' }}></div>
          <span>Добавлено</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#dc2626' }}></div>
          <span>Удалено</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#eab308' }}></div>
          <span>Изменено</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#9ca3af' }}></div>
          <span>Без изменений</span>
        </div>
      </div>

      {/* Две схемы рядом */}
      <div className={styles.comparisonGrid}>
        <div className={styles.processPanel}>
          <h3>{comparison.process1.name}</h3>
          <div className={styles.flowContainer}>
            <ReactFlow
              nodes={nodes1WithStyles}
              edges={edges1WithStyles}
              nodeTypes={nodeTypes}
              fitView
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
            >
              <Background />
              <Controls />
              {/* <MiniMap /> */}
            </ReactFlow>
          </div>
        </div>

        <div className={styles.processPanel}>
          <h3>{comparison.process2.name}</h3>
          <div className={styles.flowContainer}>
            <ReactFlow
              nodes={nodes2WithStyles}
              edges={edges2WithStyles}
              nodeTypes={nodeTypes}
              fitView
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
            >
              <Background />
              <Controls />
              {/* <MiniMap /> */}
            </ReactFlow>
          </div>
        </div>
      </div>
      <div>
        <h3>Сводка изменений</h3>
        <p>{comparison?.comparison_summary}</p>
      </div>
    </div>
  );
};

