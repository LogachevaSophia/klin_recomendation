import { addEdge, Background, BackgroundVariant, Controls, MiniMap, ReactFlow, useEdgesState, useNodesState } from "@xyflow/react"
import { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { bpmnStore } from "../../stores/BpmnStore";




export const Bpmn = observer(() => {

    const [nodes, setNodes, onNodesChange] = useNodesState(bpmnStore.initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(bpmnStore.initialEdges);
    const onConnect = useCallback(
        (connection: any) => {
          setEdges((eds) => addEdge(connection, eds));
        },
        [setEdges],
      );

    return (
        <ReactFlow

            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={bpmnStore.nodeTypes}
            fitView
        >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
    )
})