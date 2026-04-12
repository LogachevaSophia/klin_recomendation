interface BackendNode {
  id: number;
  type: number;
  data: {
    label: string;
    attributes?: Array<{ name: string; value: string }>;
    loopCondition?: string;
    maxIterations?: number;
    loopSubprocessId?: string;
    exitCondition?: string;
    [key: string]: any; // Для других полей
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
  label?: string;
  data?: {
    type?: string;
    value?: boolean;
  };
  sourceHandle?: string;
  targetHandle?: string;
  style?: {
    stroke?: string;
    strokeWidth?: number;
  };
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
  type: "subprocess" | "condition" | "action";
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
  // Маппинг типов нод:
  // 0: action (было start) - преобразуется в action
  // 1: action (было finish) - преобразуется в action
  // 2: condition - нода условий
  // 3: action - нода действий
  // 4: subprocess - нода подпроцесса
  const typeMap: Record<number, Node["type"]> = {
    0: "action", // Было start, теперь action
    1: "action", // Было finish, теперь action
    2: "condition",
    3: "action",
    4: "subprocess",
  };

  const nodes: Node[] = backendData.nodes.map((backendNode) => {
    // Убираем префиксы "Начало: " и "Конец: " из label
    let label = backendNode.data.label;
    if (label.startsWith('Начало: ')) {
      label = label.replace('Начало: ', '');
    } else if (label.startsWith('Конец: ')) {
      label = label.replace('Конец: ', '');
    }

    // Собираем данные узла, включая все поля из backendNode.data
    const nodeData: any = {
      label: label,
    };

    // Копируем атрибуты, если они есть
    if (backendNode.data.attributes && Array.isArray(backendNode.data.attributes)) {
      nodeData.attributes = backendNode.data.attributes;
    }

    // Копируем другие поля из data (loopCondition, maxIterations и т.д.)
    if (backendNode.data.loopCondition) {
      nodeData.loopCondition = backendNode.data.loopCondition;
    }
    if (backendNode.data.loopSubprocessId) {
      nodeData.loopSubprocessId = backendNode.data.loopSubprocessId;
    }
    if (backendNode.data.maxIterations) {
      nodeData.maxIterations = backendNode.data.maxIterations;
    }
    if (backendNode.data.exitCondition) {
      nodeData.exitCondition = backendNode.data.exitCondition;
    }

    // Добавляем subprocess_id, если есть
    if (backendNode.subprocess_id) {
      nodeData.subprocess_id = backendNode.subprocess_id;
    }

    // Сохраняем числовой тип бэкенда (0 начало, 1 конец, …) для корректного PUT при сохранении
    nodeData.backendType = backendNode.type;

    return {
      id: String(backendNode.id),
      type: typeMap[backendNode.type] || "action",
      position: {
        x: backendNode.json_data.x * 200, // Горизонтальная позиция (слева направо)
        y: backendNode.json_data.y * 200, // Вертикальная позиция (для веток)
      },
      data: nodeData,
    };
  });

  // Преобразование соединений
  const edges: Edge[] = backendData.edges.map((backendEdge) => {
    const edge: any = {
      id: backendEdge.id,
      source: String(backendEdge.source),
      target: String(backendEdge.target),
    };

    // Обработка condition edges: если data.type === 'condition', устанавливаем sourceHandle, label и style
    if (backendEdge.data?.type === 'condition') {
      if (backendEdge.data.value === true) {
        // Условие выполняется - это "ДА", связь снизу (handle "true")
        edge.sourceHandle = 'true';
        edge.label = 'ДА';
        edge.style = {
          stroke: '#16a34a', // Зелёный цвет для "ДА"
          strokeWidth: 2
        };
      } else if (backendEdge.data.value === false) {
        // Условие не выполняется - это "НЕТ", связь справа (handle "false")
        edge.sourceHandle = 'false';
        edge.label = 'НЕТ';
        edge.style = {
          stroke: '#dc2626', // Красный цвет для "НЕТ"
          strokeWidth: 2
        };
      }
    } else {
      // Для обычных edges используем данные из backendEdge
      if (backendEdge.label) edge.label = backendEdge.label;
      if (backendEdge.sourceHandle) edge.sourceHandle = backendEdge.sourceHandle;
      if (backendEdge.targetHandle) edge.targetHandle = backendEdge.targetHandle;
      if (backendEdge.style) edge.style = backendEdge.style;
    }

    return edge;
  });

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
// export const backendData: BackendData = {
//     "process_id": "main",
//     "name": "Диагностика",
//     "nodes": [
//         {
//             "id": 1,
//             "type": 0,
//             "data": {
//                 "label": "Начало: Диагностика"
//             },
//             "json_data": {
//                 "x": 1,
//                 "y": 1
//             },
//             "subprocess_id": null
//         },
//         {
//             "id": 2,
//             "type": 3,
//             "data": {
//                 "label": "Гистологическое исследование"
//             },
//             "json_data": {
//                 "x": 2,
//                 "y": 1
//             },
//             "subprocess_id": "1f675f61-ffdf-4748-8a68-f85d2cf35657"
//         },
//         {
//             "id": 3,
//             "type": 3,
//             "data": {
//                 "label": "Молекулярно-генетическое исследование"
//             },
//             "json_data": {
//                 "x": 3,
//                 "y": 1
//             },
//             "subprocess_id": "f1acf1f1-26a6-447e-a6a9-f0231eecb7d1"
//         },
//         {
//             "id": 4,
//             "type": 1,
//             "data": {
//                 "label": "Конец: Диагностика"
//             },
//             "json_data": {
//                 "x": 4,
//                 "y": 1
//             },
//             "subprocess_id": null
//         }
//     ],
//     "edges": [
//         {
//             "id": "1",
//             "source": 1,
//             "target": 2
//         },
//         {
//             "id": "2",
//             "source": 2,
//             "target": 3
//         },
//         {
//             "id": "3",
//             "source": 3,
//             "target": 4
//         }
//     ]
// };
