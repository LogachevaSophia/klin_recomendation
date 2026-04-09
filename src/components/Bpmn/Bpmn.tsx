import { addEdge, applyNodeChanges, Background, BackgroundVariant, Controls, MiniMap, ReactFlow, useEdgesState, useNodesState } from "@xyflow/react"
import { useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { bpmnStore } from "../../stores/BpmnStore";

export const Bpmn = observer(() => {
    const {initialNodes, initialEdges} = bpmnStore;

    const [nodes, setNodes] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Синхронизация nodes при изменении initialNodes
    useEffect(() => {
        if (JSON.stringify(nodes) !== JSON.stringify(bpmnStore.initialNodes)) {
            setNodes(bpmnStore.initialNodes);
        }
    }, [bpmnStore.initialNodes]);

    // Синхронизация edges при изменении initialEdges
    useEffect(() => {
        if (JSON.stringify(edges) !== JSON.stringify(bpmnStore.initialEdges)) {
            setEdges(bpmnStore.initialEdges);
        }
    }, [bpmnStore.initialEdges]);

    const handleNodesChange = useCallback((changes: any) => {
        const newNodes = applyNodeChanges(changes, nodes);
        setNodes(newNodes);
        bpmnStore.updateNodes(newNodes);
    }, [nodes, bpmnStore]);

    const handleEdgesChange = useCallback((changes: any) => {
        // Здесь можно добавить обработку изменений edges, если нужно
        // Аналогично handleNodesChange
        onEdgesChange(changes);
        bpmnStore.updateEdges(edges);
    }, [edges, bpmnStore]);

    const onConnect = useCallback(
        (connection: any) => {
            const newEdges = addEdge(connection, edges);
            setEdges(newEdges);
            bpmnStore.updateEdges(newEdges); // Сохраняем новые edges в хранилище
        },
        [edges, bpmnStore],
    );

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            // nodeTypes={nodeTypes} // nodeTypes not available in bpmnStore
            fitView
        >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
    )
});