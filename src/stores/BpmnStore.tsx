import { makeAutoObservable, runInAction } from "mobx";

import { addEdge } from "@xyflow/react";
import { transformBackendData } from "./BpmnBackEdit";
import { SubprocessService } from "./SubprocessService";
import { recommendationService } from "../api/recommendationService";
import type { BpmnNode, BpmnEdge as Edge } from "../api/types";

// Export Node type for use in other components
export type Node = BpmnNode;

interface ProcessData {
    nodes: BpmnNode[];
    edges: Edge[];
    name: string;
}

class BpmnStore {
    processes: Map<string, ProcessData> = new Map();
    activeProcessId: string = 'main';
    
    constructor() {
        makeAutoObservable(this);
        // Инициализируем основной процесс
        // const mainProcess = transformBackendData(backendData);
        // this.processes.set('main', { ...mainProcess, name: backendData.name });
        
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
                console.log(`Loading subprocess ${subprocessId}:`, {
                    nodes: transformedData.nodes.length,
                    edges: transformedData.edges.length,
                    name: subprocessData.name
                });
                runInAction(() => {
                    this.processes.set(subprocessId, {
                        ...transformedData,
                        name: subprocessData.name
                    });
                });
            } else {
                console.warn(`Subprocess data not found for ${subprocessId}`);
            }
        } catch (error) {
            console.error(`Error loading subprocess ${subprocessId}:`, error);
        }
    }

    get activeProcess(): ProcessData {
        const process = this.processes.get(this.activeProcessId);
        if (!process) {
            // Если процесс не найден, возвращаем пустой процесс вместо main
            return { nodes: [], edges: [], name: 'Неизвестный процесс' };
        }
        return process;
    }

    get initialNodes(): BpmnNode[] {
        return this.activeProcess?.nodes || [];
    }

    get initialEdges(): Edge[] {
        return this.activeProcess?.edges || [];
    }

    get availableProcesses() {
        return Array.from(this.processes.entries()).map(([id, process]) => ({
            id,
            name: process.name
        }));
    }

    async setActiveProcess(processId: string) {
        console.log(`Setting active process to: ${processId}`);
        // Если процесс уже загружен, просто переключаемся
        if (this.processes.has(processId)) {
            const process = this.processes.get(processId);
            console.log(`Process ${processId} already loaded:`, {
                nodes: process?.nodes.length,
                edges: process?.edges.length
            });
            runInAction(() => {
                this.activeProcessId = processId;
            });
            return;
        }
        
        // Если процесс не загружен, пытаемся загрузить его как подпроцесс
        try {
            await this.loadSubprocess(processId);
            runInAction(() => {
                if (this.processes.has(processId)) {
                    this.activeProcessId = processId;
                    const process = this.processes.get(processId);
                    console.log(`Switched to process ${processId}:`, {
                        nodes: process?.nodes.length,
                        edges: process?.edges.length
                    });
                } else {
                    console.error(`Process ${processId} was not loaded`);
                }
            });
        } catch (error) {
            console.error(`Failed to load subprocess ${processId}:`, error);
        }
    }

    addNewNode(data: BpmnNode) {
        runInAction(() => {
            const currentProcess = this.processes.get(this.activeProcessId);
            if (currentProcess) {
                currentProcess.nodes = [...currentProcess.nodes, data];
            }
        });
    }

    updateNodes = (updatedNodes: BpmnNode[]) => {
        runInAction(() => {
            const currentProcess = this.processes.get(this.activeProcessId);
            if (currentProcess) {
                currentProcess.nodes = updatedNodes;
            }
        });
    };

    deleteNode = (nodeId: string) => {
        runInAction(() => {
            const currentProcess = this.processes.get(this.activeProcessId);
            if (currentProcess) {
                // Удаляем ноду
                currentProcess.nodes = currentProcess.nodes.filter(node => node.id !== nodeId);
                // Удаляем связанные рёбра
                currentProcess.edges = currentProcess.edges.filter(
                    edge => edge.source !== nodeId && edge.target !== nodeId
                );
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

    deleteEdge = (edgeId: string) => {
        runInAction(() => {
            const currentProcess = this.processes.get(this.activeProcessId);
            if (currentProcess) {
                currentProcess.edges = currentProcess.edges.filter(edge => edge.id !== edgeId);
            }
        });
    };

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

    async updateMainProcess(id: string) {
        try{
            const mainProcess = await recommendationService.getById(id);
            const transformedData = transformBackendData(mainProcess);
            
            runInAction(() => {
                this.processes.set('main', { ...transformedData, name: mainProcess.name });
                this.activeProcessId = 'main';
            });
            
            // Загружаем подпроцессы при инициализации
            this.loadSubprocesses();
        }
        catch(error){
            console.error(`Error updateMainProcess ${id}:`, error);
            // Если произошла ошибка, создаем пустой процесс
            runInAction(() => {
                this.processes.set('main', { 
                    nodes: [], 
                    edges: [], 
                    name: 'Новый процесс' 
                });
                this.activeProcessId = 'main';
            });
        }
    }
}

export const bpmnStore = new BpmnStore();