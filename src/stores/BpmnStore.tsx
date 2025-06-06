import { makeAutoObservable, runInAction } from "mobx";
import { StartNode } from "../components/typesNodes/StartNode/StartNode";
// import { CustomDiamondNode } from "../NodeTriangle";
import { addEdge } from "@xyflow/react";
import { ActionNode } from "../components/typesNodes/ActionNode/ActionNode";
import { ConditionNode } from "../components/typesNodes/ConditionNode/ConditionNode";
import { FinishNode } from "../components/typesNodes/FinishNode/FinishNode";
import { backendData, transformBackendData, BackendData } from "./BpmnBackEdit";
import { SubprocessService } from "./SubprocessService";

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

interface ProcessData {
    nodes: Node[];
    edges: Edge[];
    name: string;
}

class BpmnStore {
    processes: Map<string, ProcessData> = new Map();
    activeProcessId: string = 'main';
    
    constructor() {
        makeAutoObservable(this);
        // Инициализируем основной процесс
        const mainProcess = transformBackendData(backendData);
        this.processes.set('main', { ...mainProcess, name: backendData.name });
        
        // Загружаем подпроцессы при инициализации
        this.loadSubprocesses();
    }

    private async loadSubprocesses() {
        const mainNodes = this.processes.get('main')?.nodes || [];
        const subprocessNodes = mainNodes.filter(node => node.data.subprocess_id);
        
        for (const node of subprocessNodes) {
            await this.loadSubprocess(node.data.subprocess_id);
        }
    }

    private async loadSubprocess(subprocessId: string) {
        try {
            const subprocessData = await SubprocessService.fetchSubprocess(subprocessId);
            if (subprocessData) {
                const transformedData = transformBackendData(subprocessData);
                runInAction(() => {
                    this.processes.set(subprocessId, {
                        ...transformedData,
                        name: subprocessData.name
                    });
                });
            }
        } catch (error) {
            console.error(`Error loading subprocess ${subprocessId}:`, error);
        }
    }

    get activeProcess(): ProcessData {
        return this.processes.get(this.activeProcessId) || this.processes.get('main')!;
    }

    get initialNodes(): Node[] {
        return this.activeProcess.nodes;
    }

    get initialEdges(): Edge[] {
        return this.activeProcess.edges;
    }

    get availableProcesses() {
        return Array.from(this.processes.entries()).map(([id, process]) => ({
            id,
            name: process.name
        }));
    }

    setActiveProcess(processId: string) {
        runInAction(() => {
            if (this.processes.has(processId)) {
                this.activeProcessId = processId;
            }
        });
    }

    addNewNode(data: Node) {
        runInAction(() => {
            const currentProcess = this.processes.get(this.activeProcessId);
            if (currentProcess) {
                currentProcess.nodes = [...currentProcess.nodes, data];
            }
        });
    }

    updateNodes = (updatedNodes: Node[]) => {
        runInAction(() => {
            const currentProcess = this.processes.get(this.activeProcessId);
            if (currentProcess) {
                currentProcess.nodes = updatedNodes;
            }
        });
    };

    updateEdges(edges: Edge[]) {
        runInAction(() => {
            const currentProcess = this.processes.get(this.activeProcessId);
            if (currentProcess) {
                currentProcess.edges = edges;
            }
        });
    }

    setEdges(connection: any) {
        runInAction(() => {
            const currentProcess = this.processes.get(this.activeProcessId);
            if (currentProcess) {
                const newEdges = addEdge(connection, currentProcess.edges);
                currentProcess.edges = newEdges;
            }
        });
    }

    updateNodePosition = (id: string, position: { x: number; y: number }) => {
        const currentProcess = this.processes.get(this.activeProcessId);
        if (currentProcess) {
            const node = currentProcess.nodes.find(n => n.id === id);
            if (node) {
                node.position = position;
            }
        }
    };

    getApiData() {
        const currentProcess = this.processes.get(this.activeProcessId);
        return currentProcess ? {
            edges: currentProcess.edges,
            nodes: currentProcess.nodes,
            name: currentProcess.name
        } : null;
    }
}

export const bpmnStore = new BpmnStore();