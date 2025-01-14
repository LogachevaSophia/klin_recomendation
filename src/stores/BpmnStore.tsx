import { makeAutoObservable, runInAction } from "mobx";
import { StartFinishNode } from "../components/typesNodes/StartNode/StartNode";
import { CustomDiamondNode } from "../NodeTriangle";
import { addEdge } from "@xyflow/react";

interface Position{
    x: number,
    y: number
}

export interface Node{
    id: string,
    type: "start" | "fork" | "action" | "newprocess",
    position:Position,
    data: any
}

export interface Edge{
    id: string,
    target: string,
    source: string
}

class BpmnStore{

    initialNodes: Node[] =  [{
        id: "3",
        type: "start",
        position: {x: 0, y:0},
        data: {
            type: "start",
            label: "start"
        }
    }]
    nodeTypes = {
        start: StartFinishNode,
        textUpdater: CustomDiamondNode  
    }
    initialEdges:Edge[] = [{ id: 'e1-2', source: '1', target: '2' }];


    constructor(){
        makeAutoObservable(this);
    }
    
    addNewNode(data: Node){
        runInAction(()=>{
            this.initialNodes = [...this.initialNodes, data];
            
            console.log(this.initialNodes)
        })
       
    }

    setEdges(connection: any){
        runInAction(()=>{
            const newEdges = addEdge(connection, this.initialEdges);
            this.initialEdges = newEdges;
        })
    }
   

}

export const bpmnStore = new BpmnStore();