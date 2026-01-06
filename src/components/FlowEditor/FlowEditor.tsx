import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  addEdge,
  Connection,
  BackgroundVariant,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import { SideBar } from '../SideBar/SideBar';
import { ProcessTabs } from '../ProcessTabs/ProcessTabs';
import { StartNode } from '../typesNodes/StartNode/StartNode';
import { FinishNode } from '../typesNodes/FinishNode/FinishNode';
import { ActionNode } from '../typesNodes/ActionNode/ActionNode';
import { ConditionNode } from '../typesNodes/ConditionNode/ConditionNode';
import { SubprocessNode } from '../typesNodes/SubprocessNode/SubprocessNode';
import { LoopNode } from '../typesNodes/LoopNode/LoopNode';
import { LoopContainer } from '../typesNodes/LoopContainer/LoopContainer';
import { bpmnStore } from '../../stores/BpmnStore';
import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';
import { ModalAddNode, Attribute } from '../ModalAddNode/ModalAddNode';
import { ContextMenu } from '../ContextMenu/ContextMenu';
import { HelpPanel } from '../HelpPanel/HelpPanel';
import type { Node as BpmnNode } from '../../stores/BpmnStore';
import '@xyflow/react/dist/style.css';
import styles from './FlowEditor.module.scss';

interface FlowEditorProps {
  recommendationId: string;
}

export const FlowEditor: React.FC<FlowEditorProps> = observer(({ recommendationId }) => {
  const [nodes, setNodes] = useState(() => toJS(bpmnStore.initialNodes));
  const [edges, setEdges] = useState(() => toJS(bpmnStore.initialEdges));
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<BpmnNode | null>(null);
  const [selectedElements, setSelectedElements] = useState<{ nodes: string[], edges: string[] }>({ nodes: [], edges: [] });
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    elementType: 'node' | 'edge' | 'canvas';
    elementId?: string;
  }>({ visible: false, x: 0, y: 0, elementType: 'canvas' });

  // Load data for the specific recommendation
  useEffect(() => {
    const loadData = async () => {
      await bpmnStore.updateMainProcess(recommendationId);
      setNodes(toJS(bpmnStore.initialNodes));
      setEdges(toJS(bpmnStore.initialEdges));
    };
    
    if (recommendationId) {
      loadData();
    }
  }, [recommendationId]);

  // Listen for changes in bpmnStore - отслеживаем activeProcessId для переключения между процессами
  useEffect(() => {
    setNodes(toJS(bpmnStore.initialNodes));
    setEdges(toJS(bpmnStore.initialEdges));
  }, [bpmnStore.initialNodes, bpmnStore.initialEdges, bpmnStore.activeProcessId]);

  const handleNodesChange = useCallback((changes: any) => {
    const updatedNodes = applyNodeChanges(changes, nodes);
    setNodes(updatedNodes);
    bpmnStore.updateNodes(updatedNodes);
  }, [nodes]);

  const handleEdgesChange = useCallback((changes: any) => {
    const updatedEdges = applyEdgeChanges(changes, edges);
    setEdges(updatedEdges);
    bpmnStore.updateEdges(updatedEdges);
  }, [edges]);

  const onConnect = useCallback((params: Connection) => {
    let connectionParams: any = { ...params };
    
    // Добавляем подписи и цвета для рёбер из ConditionNode
    if (params.sourceHandle && params.source) {
      const sourceNode = nodes.find(n => n.id === params.source);
      if (sourceNode && sourceNode.type === 'condition') {
        if (params.sourceHandle === 'true') {
          connectionParams.label = 'ДА';
          connectionParams.style = {
            stroke: '#16a34a', // Зелёный цвет для "ДА"
            strokeWidth: 2
          };
        } else if (params.sourceHandle === 'false') {
          connectionParams.label = 'НЕТ';
          connectionParams.style = {
            stroke: '#dc2626', // Красный цвет для "НЕТ"
            strokeWidth: 2
          };
        }
      }
    }
    
    const newEdges = addEdge(connectionParams, edges);
    setEdges(newEdges);
    bpmnStore.updateEdges(newEdges);
  }, [edges, nodes]);

  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: BpmnNode) => {
    setSelectedNode(node);
    setIsEditModalOpen(true);
  }, []);

  const handleEditSave = useCallback((attributes: Attribute[]) => {
    if (selectedNode) {
      const updatedNode: BpmnNode = {
        ...selectedNode,
        data: {
          ...selectedNode.data,
          attributes,
        },
      };
      
      const updatedNodes = nodes.map((n) => 
        n.id === selectedNode.id ? updatedNode : n
      );
      
      setNodes(updatedNodes);
      bpmnStore.updateNodes(updatedNodes);
      setIsEditModalOpen(false);
      setSelectedNode(null);
    }
  }, [selectedNode, nodes]);

  // Обработка клика по подпроцессу
  const handleSubprocessClick = useCallback(async (subprocessId: string) => {
    console.log('Opening subprocess:', subprocessId);
    try {
      // Переключаемся на подпроцесс
      await bpmnStore.setActiveProcess(subprocessId);
      // Принудительно обновляем nodes и edges после переключения
      const newNodes = toJS(bpmnStore.initialNodes);
      const newEdges = toJS(bpmnStore.initialEdges);
      console.log('Switched to subprocess, nodes:', newNodes.length, 'edges:', newEdges.length);
      setNodes(newNodes);
      setEdges(newEdges);
    } catch (error) {
      console.error('Error opening subprocess:', error);
    }
  }, []);

  // Обработчик добавления дочерней ноды в цикл-контейнер
  const handleAddChildNode = useCallback((containerId: string, nodeData: any) => {
    console.log('Adding child node to container:', containerId, nodeData);
    
    // Найдем контейнер и обновим его данные
    const updatedNodes = nodes.map(node => {
      if (node.id === containerId && node.type === 'loop-container') {
        const currentChildNodes = node.data.childNodes || [];
        const newChildNode = {
          id: `child-${Date.now()}`,
          label: nodeData.label || `${nodeData.type} node`,
          type: nodeData.type
        };
        
        return {
          ...node,
          data: {
            ...node.data,
            childNodes: [...currentChildNodes, newChildNode]
          }
        };
      }
      return node;
    });
    
    setNodes(updatedNodes);
    bpmnStore.updateNodes(updatedNodes);
  }, [nodes]);

  // Создаем wrapper для SubprocessNode с обработчиком
  const SubprocessNodeWithHandler = useCallback((props: any) => (
    <SubprocessNode {...props} onSubprocessClick={handleSubprocessClick} />
  ), [handleSubprocessClick]);

  // Создаем wrapper для LoopContainer с обработчиком
  const LoopContainerWithHandler = useCallback((props: any) => (
    <LoopContainer {...props} onAddChildNode={handleAddChildNode} />
  ), [handleAddChildNode]);

  // Создаем wrapper для LoopNode с обработчиком
  const LoopNodeWithHandler = useCallback((props: any) => (
    <LoopNode {...props} onLoopClick={handleSubprocessClick} />
  ), [handleSubprocessClick]);

  const nodeTypes = {
    start: StartNode,
    finish: FinishNode,
    action: ActionNode,
    condition: ConditionNode,
    subprocess: SubprocessNodeWithHandler,
    loop: LoopNodeWithHandler,
    'loop-container': LoopContainerWithHandler,
  };

  // Обработка выделения элементов
  const onSelectionChange = useCallback((params: any) => {
    const selectedNodeIds = params.nodes.map((node: any) => node.id);
    const selectedEdgeIds = params.edges.map((edge: any) => edge.id);
    setSelectedElements({ nodes: selectedNodeIds, edges: selectedEdgeIds });
  }, []);

  // Обработка клавиш для удаления и других действий
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Игнорируем, если фокус в input или textarea
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Delete/Backspace - удаление
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      
      // Удаляем выделенные ноды
      selectedElements.nodes.forEach(nodeId => {
        bpmnStore.deleteNode(nodeId);
      });
      
      // Удаляем выделенные рёбра
      selectedElements.edges.forEach(edgeId => {
        bpmnStore.deleteEdge(edgeId);
      });
      
      // Обновляем локальное состояние
      setNodes(toJS(bpmnStore.initialNodes));
      setEdges(toJS(bpmnStore.initialEdges));
      
      // Очищаем выделение
      setSelectedElements({ nodes: [], edges: [] });
    }
    
    // Ctrl+D - дублирование выделенной ноды
    else if (event.ctrlKey && event.key === 'd') {
      event.preventDefault();
      if (selectedElements.nodes.length === 1) {
        const nodeId = selectedElements.nodes[0];
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          const newNode: BpmnNode = {
            ...node,
            id: `node_${Date.now()}`,
            position: {
              x: node.position.x + 250,
              y: node.position.y
            },
            data: {
              ...node.data,
              label: `${node.data.label} (копия)`
            }
          };
          bpmnStore.addNewNode(newNode);
          setNodes(toJS(bpmnStore.initialNodes));
        }
      }
    }
    
    // Ctrl+A - выделить все
    else if (event.ctrlKey && event.key === 'a') {
      event.preventDefault();
      setSelectedElements({
        nodes: nodes.map(n => n.id),
        edges: edges.map(e => e.id)
      });
    }
    
    // Escape - снять выделение и закрыть контекстное меню
    else if (event.key === 'Escape') {
      event.preventDefault();
      setSelectedElements({ nodes: [], edges: [] });
      setContextMenu(prev => ({ ...prev, visible: false }));
    }
  }, [selectedElements, nodes, edges]);

  // Добавляем обработчик клавиш
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Обработка drag & drop для добавления нод
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow');
    if (typeof type === 'undefined' || !type) {
      return;
    }

    // Получаем позицию мыши относительно React Flow
    const reactFlowBounds = (event.target as HTMLElement).getBoundingClientRect();
    const position = {
      x: event.clientX - reactFlowBounds.left - 75, // Центрируем ноду
      y: event.clientY - reactFlowBounds.top - 35,
    };

    // Создаем новую ноду
    const newNode: BpmnNode = {
      id: `node_${Date.now()}`,
      type: type as any,
      position,
      data: { 
        label: `Новая ${type}`,
        attributes: []
      },
    };

    bpmnStore.addNewNode(newNode);
    setNodes(toJS(bpmnStore.initialNodes));
  }, []);

  // Обработчики контекстного меню
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: BpmnNode) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      elementType: 'node',
      elementId: node.id
    });
  }, []);

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: any) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      elementType: 'edge',
      elementId: edge.id
    });
  }, []);

  const onPaneContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      elementType: 'canvas'
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // Обработчики действий контекстного меню
  const handleContextDelete = useCallback(() => {
    if (contextMenu.elementType === 'node' && contextMenu.elementId) {
      bpmnStore.deleteNode(contextMenu.elementId);
      setNodes(toJS(bpmnStore.initialNodes));
      setEdges(toJS(bpmnStore.initialEdges));
    } else if (contextMenu.elementType === 'edge' && contextMenu.elementId) {
      bpmnStore.deleteEdge(contextMenu.elementId);
      setEdges(toJS(bpmnStore.initialEdges));
    }
  }, [contextMenu]);

  const handleContextEdit = useCallback(() => {
    if (contextMenu.elementType === 'node' && contextMenu.elementId) {
      const node = nodes.find(n => n.id === contextMenu.elementId);
      if (node) {
        setSelectedNode(node);
        setIsEditModalOpen(true);
      }
    }
  }, [contextMenu, nodes]);

  const handleContextDuplicate = useCallback(() => {
    if (contextMenu.elementType === 'node' && contextMenu.elementId) {
      const node = nodes.find(n => n.id === contextMenu.elementId);
      if (node) {
        const newNode: BpmnNode = {
          ...node,
          id: `node_${Date.now()}`,
          position: {
            x: node.position.x + 250,
            y: node.position.y
          },
          data: {
            ...node.data,
            label: `${node.data.label} (копия)`
          }
        };
        bpmnStore.addNewNode(newNode);
        setNodes(toJS(bpmnStore.initialNodes));
      }
    }
  }, [contextMenu, nodes]);

  // Закрытие контекстного меню при клике
  useEffect(() => {
    const handleClick = () => closeContextMenu();
    if (contextMenu.visible) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu.visible, closeContextMenu]);

  return (
    <div className={styles.flowEditorContainer}>
      <SideBar />
      <div className={styles.flowEditor}>
        <ProcessTabs />
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={handleNodesChange}
                  onEdgesChange={handleEdgesChange}
                  onConnect={onConnect}
                  onNodeDoubleClick={onNodeDoubleClick}
                  onNodeContextMenu={onNodeContextMenu}
                  onEdgeContextMenu={onEdgeContextMenu}
                  onPaneContextMenu={onPaneContextMenu}
                  onSelectionChange={onSelectionChange}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  nodeTypes={nodeTypes}
                  fitView
                  multiSelectionKeyCode="Shift"
                  deleteKeyCode={null} // Отключаем встроенное удаление, используем свое
                >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
      <ModalAddNode
        isOpen={isEditModalOpen}
        setOpen={setIsEditModalOpen}
        onSave={handleEditSave}
        attributes={selectedNode?.data?.attributes || []}
        type="edit"
      />
      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          elementType={contextMenu.elementType}
          onClose={closeContextMenu}
          onDelete={contextMenu.elementType !== 'canvas' ? handleContextDelete : undefined}
          onEdit={contextMenu.elementType === 'node' ? handleContextEdit : undefined}
          onDuplicate={contextMenu.elementType === 'node' ? handleContextDuplicate : undefined}
        />
      )}
      <HelpPanel />
    </div>
  );
}); 