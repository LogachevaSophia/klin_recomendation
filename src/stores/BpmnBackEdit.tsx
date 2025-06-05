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

interface BackendData {
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
export const backendData = 
  {
  "process_id": "d10a7410-b09b-4f27-a8b0-4361d2ef67db",
  "name": "Диагностика",
  "nodes": [
    {
      "id": 1,
      "type": 0,
      "data": {
        "label": "Начало: \"Диагностика\""
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
        "x": 1,
        "y": 2
      },
      "subprocess_id": null
    },
    {
      "id": 3,
      "type": 2,
      "data": {
        "label": "Проверка типа гистогологического исследования"
      },
      "json_data": {
        "x": 1,
        "y": 3
      },
      "subprocess_id": null
    },
    {
      "id": 4,
      "type": 3,
      "data": {
        "label": "Аденокарцинома"
      },
      "json_data": {
        "x": 1,
        "y": 4
      },
      "subprocess_id": null
    },
    {
      "id": 5,
      "type": 3,
      "data": {
        "label": "Плоскоклеточный"
      },
      "json_data": {
        "x": 1,
        "y": 5
      },
      "subprocess_id": null
    },
    {
      "id": 6,
      "type": 3,
      "data": {
        "label": "Молекулярно-генетическое исследование"
      },
      "json_data": {
        "x": 1,
        "y": 6
      },
      "subprocess_id": null
    },
    {
      "id": 7,
      "type": 2,
      "data": {
        "label": "Выбор молекулярно-генетического исследования"
      },
      "json_data": {
        "x": 1,
        "y": 7
      },
      "subprocess_id": null
    },
    {
      "id": 8,
      "type": 3,
      "data": {
        "label": "BRAF"
      },
      "json_data": {
        "x": 1,
        "y": 8
      },
      "subprocess_id": null
    },
    {
      "id": 9,
      "type": 3,
      "data": {
        "label": "BRCA"
      },
      "json_data": {
        "x": 1,
        "y": 9
      },
      "subprocess_id": null
    },
    {
      "id": 10,
      "type": 3,
      "data": {
        "label": "Не проводилось"
      },
      "json_data": {
        "x": 1,
        "y": 10
      },
      "subprocess_id": null
    },
    {
      "id": 11,
      "type": 1,
      "data": {
        "label": "Конец: \"Диагностика\""
      },
      "json_data": {
        "x": 1,
        "y": 11
      },
      "subprocess_id": null
    }
  ],
  "edges": [
    {
      "id": "0",
      "source": 1,
      "target": 2
    },
    {
      "id": "1",
      "source": 2,
      "target": 3
    },
    {
      "id": "2",
      "source": 3,
      "target": 4
    },
    {
      "id": "3",
      "source": 3,
      "target": 5
    },
    {
      "id": "4",
      "source": 4,
      "target": 6
    },
    {
      "id": "5",
      "source": 5,
      "target": 11
    },
    {
      "id": "6",
      "source": 6,
      "target": 7
    },
    {
      "id": "7",
      "source": 7,
      "target": 8
    },
    {
      "id": "8",
      "source": 7,
      "target": 9
    },
    {
      "id": "9",
      "source": 7,
      "target": 10
    },
    {
      "id": "10",
      "source": 8,
      "target": 11
    },
    {
      "id": "11",
      "source": 9,
      "target": 11
    },
    {
      "id": "12",
      "source": 10,
      "target": 11
    }
  ]
}
