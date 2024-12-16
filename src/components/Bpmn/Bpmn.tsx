import { addEdge, Background, BackgroundVariant, Controls, MiniMap, ReactFlow, useEdgesState, useNodesState } from "@xyflow/react"
import { useCallback } from "react";
import { CustomDiamondNode } from "../../NodeTriangle";

const initialNodes = [
    { id: '1', position: { x: 0, y: 0 }, data: { label: 'dfkhvb ' } },
    { id: '2', position: { x: 0, y: 100 }, data: { label: '2' } },
    // {
    //   id: '3', type: TextUpdaterNode, data: { value: 123 },position: { x: 250, y: 5 },
    // },
    {
        id: 'node-1',
        type: 'textUpdater',
        position: { x: 200, y: 0 },
        data: { value: 123 },
    },
];


export const Bpmn = () => {
    const nodeTypes = { textUpdater: CustomDiamondNode };
    const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: any) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

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
}