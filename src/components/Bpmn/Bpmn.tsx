import { addEdge, Background, BackgroundVariant, Controls, MiniMap, ReactFlow, useEdgesState, useNodesState } from "@xyflow/react"
import { useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { bpmnStore } from "../../stores/BpmnStore";




export const Bpmn = observer(() => {

    const {initialNodes, initialEdges, nodeTypes} = bpmnStore

    useEffect(()=>{
        setNodes(initialNodes)
    }, [initialNodes])

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const onConnect = useCallback(
        (connection: any) => {
          setEdges((eds) => addEdge(connection, eds));
        },
        [setEdges],
      );
      const customOnNodesChange = (data: any) => {
        console.log(data)
        onNodesChange(data)
      } 
    return (
        <ReactFlow

            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
        >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
    )
})