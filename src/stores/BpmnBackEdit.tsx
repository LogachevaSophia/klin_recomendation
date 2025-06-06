interface BackendNode {
  id: number;
  type: number;
  data: {
    label: string;
  };
  json_data: {
    x: number;
    y: number;
  };
  subprocess_id: string | null;
}

interface BackendEdge {
  id: string;
  source: number;
  target: number;
}

export interface BackendData {
  process_id: string;
  name: string;
  nodes: BackendNode[];
  edges: BackendEdge[];
}

export interface Position {
  x: number;
  y: number;
}

export interface Node {
  id: string;
  type: "start" | "condition" | "action" | "newprocess" | "finish";
  position: Position;
  data: any;
}

export interface Edge {
  id: string;
  target: string;
  source: string;
}

export function transformBackendData(backendData: BackendData): {
  nodes: Node[];
  edges: Edge[];
} {
  // Преобразование узлов
  const typeMap: Record<number, Node["type"]> = {
    0: "start",
    1: "finish",
    2: "condition",
    3: "action",
    4: "newprocess",
  };

  const nodes: Node[] = backendData.nodes.map((backendNode) => {
    // Обработка label для start и finish
    let label = backendNode.data.label;
    if (backendNode.type === 0 && label.startsWith('Начало: ')) {
      label = label.replace('Начало: ', '');
    } else if (backendNode.type === 1 && label.startsWith('Конец: ')) {
      label = label.replace('Конец: ', '');
    }

    return {
      id: String(backendNode.id),
      type: typeMap[backendNode.type] || "action",
      position: {
        x: backendNode.json_data.x * 200, // Масштабируем позицию для лучшего отображения
        y: backendNode.json_data.y * 100,
      },
      data: {
        label: label,
        ...(backendNode.subprocess_id && { subprocess_id: backendNode.subprocess_id }),
      },
    };
  });

  // Преобразование соединений
  const edges: Edge[] = backendData.edges.map((backendEdge) => ({
    id: backendEdge.id,
    source: String(backendEdge.source),
    target: String(backendEdge.target),
  }));

  return { nodes, edges };
}

// Пример использования:
// export const backendData = 
//   {
//   "process_id": "d10a7410-b09b-4f27-a8b0-4361d2ef67db",
//   "name": "Диагностика",
//   "nodes": [
//     {
//       "id": 1,
//       "type": 0,
//       "data": {
//         "label": "Начало: Диагностика"
//       },
//       "json_data": {
//         "x": 1,
//         "y": 1
//       },
//       "subprocess_id": null
//     },
//     {
//       "id": 2,
//       "type": 3,
//       "data": {
//         "label": "Гистологическое исследование"
//       },
//       "json_data": {
//         "x": 2,
//         "y": 1
//       },
//       "subprocess_id": "subprocess-1"
//     },
//     {
//       "id": 3,
//       "type": 3,
//       "data": {
//         "label": "Молекулярно-генетическое исследование"
//       },
//       "json_data": {
//         "x": 3,
//         "y": 1
//       },
//       "subprocess_id": "subprocess-2"
//     },
//     {
//       "id": 4,
//       "type": 1,
//       "data": {
//         "label": "Конец: Диагностика"
//       },
//       "json_data": {
//         "x": 4,
//         "y": 1
//       },
//       "subprocess_id": null
//     }
//   ],
//   "edges": [
//     {
//       "id": "1",
//       "source": 1,
//       "target": 2
//     },
//     {
//       "id": "2",
//       "source": 2,
//       "target": 3
//     },
//     {
//       "id": "3",
//       "source": 3,
//       "target": 4
//     }
//   ]
// }
export const backendData: BackendData = {
    "process_id": "main",
    "name": "Диагностика",
    "nodes": [
        {
            "id": 1,
            "type": 0,
            "data": {
                "label": "Начало: Диагностика"
            },
            "json_data": {
                "x": 1,
                "y": 1
            },
            "subprocess_id": null
        },
        {
            "id": 2,
            "type": 3,
            "data": {
                "label": "Гистологическое исследование"
            },
            "json_data": {
                "x": 2,
                "y": 1
            },
            "subprocess_id": "1f675f61-ffdf-4748-8a68-f85d2cf35657"
        },
        {
            "id": 3,
            "type": 3,
            "data": {
                "label": "Молекулярно-генетическое исследование"
            },
            "json_data": {
                "x": 3,
                "y": 1
            },
            "subprocess_id": "f1acf1f1-26a6-447e-a6a9-f0231eecb7d1"
        },
        {
            "id": 4,
            "type": 1,
            "data": {
                "label": "Конец: Диагностика"
            },
            "json_data": {
                "x": 4,
                "y": 1
            },
            "subprocess_id": null
        }
    ],
    "edges": [
        {
            "id": "1",
            "source": 1,
            "target": 2
        },
        {
            "id": "2",
            "source": 2,
            "target": 3
        },
        {
            "id": "3",
            "source": 3,
            "target": 4
        }
    ]
};
