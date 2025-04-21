import { makeAutoObservable, runInAction } from "mobx";
import { StartNode } from "../components/typesNodes/StartNode/StartNode";
// import { CustomDiamondNode } from "../NodeTriangle";
import { addEdge } from "@xyflow/react";
import { ActionNode } from "../components/typesNodes/ActionNode/ActionNode";
import { ConditionNode } from "../components/typesNodes/ConditionNode/ConditionNode";
import { FinishNode } from "../components/typesNodes/FinishNode/FinishNode";

interface Position {
    x: number,
    y: number
}

export interface Node {
    id: string,
    type: "start" | "condition" | "action" | "newprocess" | "finish",
    position: Position,
    data: any
}

export interface Edge {
    id: string,
    target: string,
    source: string
}

class BpmnStore {

    initialNodes: Node[] = [
            {
                "id": "3",
                "type": "start",
                "position": {
                    "x": -88,
                    "y": -53.5
                },
                "data": {
                    "type": "start",
                    "label": "start"
                },
            },
            {
                "id": "faf2be7e-0687-473c-91c3-29b0011ad69e",
                "type": "finish",
                "position": {
                    "x": 396.04166762033014,
                    "y": -62.48328353021324
                },
                "data": {
                    "attributes": [],
                    "label": "конец"
                },
            },
            {
                "id": "0c187cdb-23a0-4d97-b139-d7aa2b1b2c13",
                "type": "condition",
                "position": {
                    "x": -4,
                    "y": -60
                },
                "data": {
                    "attributes": [],
                    "label": "параллель"
                },
            },
            {
                "id": "ea4d689c-f017-4695-b974-453849d6969a",
                "type": "action",
                "position": {
                    "x": 165.54765543870207,
                    "y": -102.36152740866312
                },
                "data": {
                    "attributes": [],
                    "label": "действие 1"
                },
            },
            {
                "id": "d41d47fe-3e1b-4603-b23f-70e82f280539",
                "type": "action",
                "position": {
                    "x": 174.39371336290753,
                    "y": -31.59306401501948
                },
                "data": {
                    "attributes": [],
                    "label": "действие 2"
                },
            },
            {
                "id": "81ef81c6-c0dd-4247-a8e7-f8bf7d8d4b6d",
                "type": "action",
                "position": {
                    "x": 0,
                    "y": 0
                },
                "data": {
                    "attributes": [],
                    "label": "действие 3"
                }
            }
        ]
    nodeTypes = {
        start: StartNode,
        // action: ActionNode //на action можно не ставить кастоный тип, он сам по себе подходит по дефолту,
        condition: ConditionNode,
        finish: FinishNode,
        // textUpdater: CustomDiamondNode
    }
    initialEdges: Edge[] = [
        {
            "source": "ea4d689c-f017-4695-b974-453849d6969a",
            "target": "faf2be7e-0687-473c-91c3-29b0011ad69e",
            "id": "xy-edge__ea4d689c-f017-4695-b974-453849d6969a-faf2be7e-0687-473c-91c3-29b0011ad69e"
        },
        {
            "source": "d41d47fe-3e1b-4603-b23f-70e82f280539",
            "target": "faf2be7e-0687-473c-91c3-29b0011ad69e",
            "id": "xy-edge__d41d47fe-3e1b-4603-b23f-70e82f280539-faf2be7e-0687-473c-91c3-29b0011ad69e"
        },
        {
            "source": "81ef81c6-c0dd-4247-a8e7-f8bf7d8d4b6d",
            "target": "faf2be7e-0687-473c-91c3-29b0011ad69e",
            "id": "xy-edge__81ef81c6-c0dd-4247-a8e7-f8bf7d8d4b6d-faf2be7e-0687-473c-91c3-29b0011ad69e"
        },
        {
            "source": "0c187cdb-23a0-4d97-b139-d7aa2b1b2c13",
            "target": "ea4d689c-f017-4695-b974-453849d6969a",
            "id": "xy-edge__0c187cdb-23a0-4d97-b139-d7aa2b1b2c13true-ea4d689c-f017-4695-b974-453849d6969a"
        },
        {
            "source": "0c187cdb-23a0-4d97-b139-d7aa2b1b2c13",
            "target": "d41d47fe-3e1b-4603-b23f-70e82f280539",
            "id": "xy-edge__0c187cdb-23a0-4d97-b139-d7aa2b1b2c13true-d41d47fe-3e1b-4603-b23f-70e82f280539"
        },
        {
            "source": "0c187cdb-23a0-4d97-b139-d7aa2b1b2c13",
            "target": "81ef81c6-c0dd-4247-a8e7-f8bf7d8d4b6d",
            "id": "xy-edge__0c187cdb-23a0-4d97-b139-d7aa2b1b2c13true-81ef81c6-c0dd-4247-a8e7-f8bf7d8d4b6d"
        },
        {
            "source": "3",
            "target": "0c187cdb-23a0-4d97-b139-d7aa2b1b2c13",
            "id": "xy-edge__3-0c187cdb-23a0-4d97-b139-d7aa2b1b2c13next"
        }
    ];


    constructor() {
        makeAutoObservable(this);
    }

    addNewNode(data: Node) {
        runInAction(() => {
            this.initialNodes = [...this.initialNodes, data];

            console.log(this.initialNodes)
        })

    }

    setEdges(connection: any) {
        runInAction(() => {
            const newEdges = addEdge(connection, this.initialEdges);
            this.initialEdges = newEdges;
            console.log(newEdges)
        })
    }

    updateNodePosition = (id: string, position: { x: number; y: number }) => {
        const node = this.initialNodes.find(n => n.id === id);
        if (node) {
            node.position = position;
        }
    };

    updateNodes = (updatedNodes: Node[]) => {
        runInAction(() => {
            this.initialNodes = updatedNodes;
        });
    };
    updateEdges(edges: Edge[]) {
        runInAction(() => {
        this.initialEdges = edges;
        console.log(edges)
        })
    };
    getApiData() {
        return {edges: this.initialEdges, nodes: this.initialNodes, "name": "Обследование пациента"}
    }


}

export const bpmnStore = new BpmnStore();