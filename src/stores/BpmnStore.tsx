import { makeAutoObservable } from "mobx";
import { StartFinishNode } from "../components/typesNodes/StartNode/StartNode";
import { CustomDiamondNode } from "../NodeTriangle";

interface Position{
    x: number,
    y: number
}

export interface Nodes{
    id: string,
    type: string,
    position:Position,
    data: any
}

export interface Edge{
    id: string,
    target: string,
    source: string
}

class BpmnStore{

    initialNodes: Nodes[] =  [{
        id: "3",
        type: "startFinish",
        position: {x: 0, y:0},
        data: {
            type: "start",
            label: "start"
        }
    }]
    nodeTypes = {
        startFinish: StartFinishNode,
        textUpdater: CustomDiamondNode  
    }
    initialEdges:Edge[] = [{ id: 'e1-2', source: '1', target: '2' }];

    constructor(){
        makeAutoObservable(this);
    }

}

export const bpmnStore = new BpmnStore();