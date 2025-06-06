import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  BackgroundVariant,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import { SideBar } from '../SideBar/SideBar';
import { StartNode } from '../typesNodes/StartNode/StartNode';
import { FinishNode } from '../typesNodes/FinishNode/FinishNode';
import { ActionNode } from '../typesNodes/ActionNode/ActionNode';
import { ConditionNode } from '../typesNodes/ConditionNode/ConditionNode';
import { bpmnStore } from '../../stores/BpmnStore';
import { observer } from 'mobx-react-lite';
import { ModalAddNode, Attribute } from '../ModalAddNode/ModalAddNode';
import type { Node as BpmnNode } from '../../stores/BpmnStore';
import '@xyflow/react/dist/style.css';
import styles from './FlowEditor.module.scss';

const nodeTypes = {
  start: StartNode,
  finish: FinishNode,
  action: ActionNode,
  condition: ConditionNode,
};

interface FlowEditorProps {
  recommendationId: string;
}

export const FlowEditor: React.FC<FlowEditorProps> = observer(({ recommendationId }) => {
  const [nodes, setNodes] = useState(bpmnStore.initialNodes);
  const [edges, setEdges] = useState(bpmnStore.initialEdges);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<BpmnNode | null>(null);

  // Initial setup
  useEffect(() => {
    setNodes(bpmnStore.initialNodes);
  }, []);

  useEffect(() => {
    setEdges(bpmnStore.initialEdges);
  }, []);

  // Listen for changes in bpmnStore
  useEffect(() => {
    setNodes(bpmnStore.initialNodes);
  }, [bpmnStore.initialNodes]);

  useEffect(() => {
    setEdges(bpmnStore.initialEdges);
  }, [bpmnStore.initialEdges]);

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
    const newEdges = addEdge(params, edges);
    setEdges(newEdges);
    bpmnStore.updateEdges(newEdges);
  }, [edges]);

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: BpmnNode) => {
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

  return (
    <div className={styles.flowEditorContainer}>
      <SideBar />
      <div className={styles.flowEditor}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
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
    </div>
  );
}); 