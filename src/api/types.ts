// import { Edge, Node } from "@xyflow/react";

export interface RecommendationResponse {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface CreateRecommendationRequest {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
}

export interface UpdateRecommendationRequest extends Partial<CreateRecommendationRequest> {
  id: string;
} 

// Backend data structure for BPMN processes
export interface BackendNode {
  id: number;
  type: number;
  data: {
    label: string;
    attributes?: Array<{ name: string; value: string }>;
    loopCondition?: string;
    maxIterations?: number;
    loopSubprocessId?: string;
    exitCondition?: string;
    childNodes?: Array<{ id: string; label: string; type: string; conditionalAction?: string }>;
  };
  json_data: {
    x: number;
    y: number;
  };
  subprocess_id: string | null;
}

export interface BackendEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  data?: {
    type?: string;
    value?: boolean;
  }
  sourceHandle?: string;
  targetHandle?: string;
  style?: {
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  };
}

export interface BackendData {
  process_id: string;
  name: string;
  nodes: BackendNode[];
  edges: BackendEdge[];
}

// Frontend BPMN types
export interface Position {
  x: number;
  y: number;
}

export interface BpmnNode {
  id: string;
  type: "subprocess" | "condition" | "action" | "start" | "finish";
  position: Position;
  data: any;
}

export interface BpmnEdge {
  id: string;
  target: string;
  source: string;
  label?: string;
  sourceHandle?: string;
  targetHandle?: string;
  style?: {
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  };
}

export interface RecommendationResponseById extends BackendData {}

export interface Attribute {
  id: string;
  name: string;
  value: string;
} 