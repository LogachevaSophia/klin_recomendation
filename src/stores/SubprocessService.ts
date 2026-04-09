import { BackendData } from './BpmnBackEdit';
import { recommendationService } from '../api/recommendationService';

// Моковые данные для подпроцессов
const mockSubprocesses: Record<string, BackendData> = {
    '1f675f61-ffdf-4748-8a68-f85d2cf35657': 
        {
        "process_id": "1f675f61-ffdf-4748-8a68-f85d2cf35657",
        "name": "1 линия лекарственного лечения",
        "nodes": [
            {
            "id": 12,
            "type": 0,
            "data": {
                "label": "Начало: \"1 линия лекарственного лечения\""
            },
            "json_data": {
                "x": 1,
                "y": 12
            },
            "subprocess_id": null
            },
            {
            "id": 13,
            "type": 2,
            "data": {
                "label": "Проверка ECOG"
            },
            "json_data": {
                "x": 1,
                "y": 13
            },
            "subprocess_id": null
            },
            {
            "id": 14,
            "type": 3,
            "data": {
                "label": "ECOG 1"
            },
            "json_data": {
                "x": 1,
                "y": 14
            },
            "subprocess_id": null
            },
            {
            "id": 15,
            "type": 3,
            "data": {
                "label": "ECOG 2"
            },
            "json_data": {
                "x": 1,
                "y": 15
            },
            "subprocess_id": null
            },
            {
            "id": 16,
            "type": 2,
            "data": {
                "label": "Условие: \"ECOG 1\""
            },
            "json_data": {
                "x": 1,
                "y": 16
            },
            "subprocess_id": null
            },
            {
            "id": 17,
            "type": 2,
            "data": {
                "label": "Условие: \"ECOG 2\""
            },
            "json_data": {
                "x": 1,
                "y": 17
            },
            "subprocess_id": null
            },
            {
            "id": 18,
            "type": 3,
            "data": {
                "label": "Паклитаксел 175-225 мг/м² в 1-й день + карбоплатин AUC 5-7 в 1-й день; цикл 21 день"
            },
            "json_data": {
                "x": 1,
                "y": 18
            },
            "subprocess_id": null
            },
            {
            "id": 19,
            "type": 3,
            "data": {
                "label": "De Gramont+панитумумаб: кальция фолинат 400 мг/м² в 1-й день + фторурацил 400 мг/м² в/в струйно в 1-й день + фторурацил 2400 мг/м² (по 1200 мг/м² в сутки) 46-часовая инфузия в 1-2-й дни + панитумумаб 6 мг/кг в 1-й день; цикл 14 дней"
            },
            "json_data": {
                "x": 1,
                "y": 19
            },
            "subprocess_id": null
            },
            {
            "id": 20,
            "type": 3,
            "data": {
                "label": "sh680 Эпирубицин 75-120 мг/м² в 1-й день + циклофосфамид 600 мг/м² в 1-й день; цикл 21 день"
            },
            "json_data": {
                "x": 1,
                "y": 20
            },
            "subprocess_id": null
            },
            {
            "id": 21,
            "type": 3,
            "data": {
                "label": "sh576 Паклитаксел 80 мг/м² в 1-й, 8-й, 15-й дни + трастузумаб 6 мг/кг (нагрузочная доза 8 мг/кг) в 1-й день + пертузумаб 420 мг (нагрузочная доза 840 мг) в 1-й день; цикл 21 день"
            },
            "json_data": {
                "x": 1,
                "y": 21
            },
            "subprocess_id": null
            },
            {
            "id": 22,
            "type": 3,
            "data": {
                "label": "sh576 Паклитаксел 80 мг/м² в 1-й, 8-й, 15-й дни + трастузумаб 6 мг/кг (нагрузочная доза 8 мг/кг) в 1-й день + пертузумаб 420 мг (нагрузочная доза 840 мг) в 1-й день; цикл 21 день"
            },
            "json_data": {
                "x": 1,
                "y": 22
            },
            "subprocess_id": null
            },
            {
            "id": 23,
            "type": 1,
            "data": {
                "label": "Конец: \"1 линия лекарственного лечения\""
            },
            "json_data": {
                "x": 1,
                "y": 23
            },
            "subprocess_id": null
            }
        ],
        "edges": [
            {
            "id": "13",
            "source": 12,
            "target": 13
            },
            {
            "id": "14",
            "source": 13,
            "target": 14
            },
            {
            "id": "15",
            "source": 13,
            "target": 15
            },
            {
            "id": "16",
            "source": 14,
            "target": 16
            },
            {
            "id": "17",
            "source": 15,
            "target": 17
            },
            {
            "id": "18",
            "source": 16,
            "target": 18
            },
            {
            "id": "19",
            "source": 16,
            "target": 19
            },
            {
            "id": "20",
            "source": 17,
            "target": 20
            },
            {
            "id": "21",
            "source": 17,
            "target": 22
            },
            {
            "id": "22",
            "source": 18,
            "target": 23
            },
            {
            "id": "23",
            "source": 19,
            "target": 23
            },
            {
            "id": "24",
            "source": 21,
            "target": 23
            }],
        },
    'f1acf1f1-26a6-447e-a6a9-f0231eecb7d1': {
        "process_id": "f1acf1f1-26a6-447e-a6a9-f0231eecb7d1",
        "name": "2 линия лекарственного лечения",
        "nodes": [
          {
            "id": 24,
            "type": 0,
            "data": {
              "label": "Начало: \"2 линия\""
            },
            "json_data": {
              "x": 1,
              "y": 24
            },
            "subprocess_id": null
          },
          {
            "id": 25,
            "type": 3,
            "data": {
              "label": "ECOG 1"
            },
            "json_data": {
              "x": 1,
              "y": 25
            },
            "subprocess_id": null
          },
          {
            "id": 26,
            "type": 2,
            "data": {
              "label": "Условие: ECOG 1"
            },
            "json_data": {
              "x": 1,
              "y": 26
            },
            "subprocess_id": null
          },
          {
            "id": 27,
            "type": 3,
            "data": {
              "label": "Доцетаксел 60-75 мг/м² в 1-й день + цисплатин 75 мг/м² в 1-й день; цикл 21 день"
            },
            "json_data": {
              "x": 1,
              "y": 27
            },
            "subprocess_id": null
          },
          {
            "id": 28,
            "type": 3,
            "data": {
              "label": "Паклитаксел 135 мг/м² в/в в 1-й день + цисплатин 75 мг/м² внутрибрюшинно во 2-й день + паклитаксел 60 мг/м² внутрибрюшинно в 8-й день; цикл 21 день"
            },
            "json_data": {
              "x": 1,
              "y": 28
            },
            "subprocess_id": null
          },
          {
            "id": 29,
            "type": 3,
            "data": {
              "label": "Паклитаксел 135 мг/м² в/в в 1-й день + цисплатин 75 мг/м² внутрибрюшинно во 2-й день + паклитаксел 60 мг/м² внутрибрюшинно в 8-й день; цикл 21 день"
            },
            "json_data": {
              "x": 1,
              "y": 29
            },
            "subprocess_id": null
          },
          {
            "id": 30,
            "type": 1,
            "data": {
              "label": "Конец: \"2 линия"
            },
            "json_data": {
              "x": 1,
              "y": 30
            },
            "subprocess_id": null
          }
        ],
        "edges": [
          {
            "id": "27",
            "source": 24,
            "target": 25
          },
          {
            "id": "28",
            "source": 25,
            "target": 26
          },
          {
            "id": "29",
            "source": 26,
            "target": 27
          },
          {
            "id": "30",
            "source": 26,
            "target": 28
          },
          {
            "id": "31",
            "source": 26,
            "target": 29
          },
          {
            "id": "32",
            "source": 27,
            "target": 30
          },
          {
            "id": "33",
            "source": 28,
            "target": 30
          },
          {
            "id": "34",
            "source": 29,
            "target": 30
          }
        ]
      }
};

export class SubprocessService {
    static async fetchSubprocess(subprocessId: string): Promise<BackendData | null> {
        try {
            // Используем новый метод из recommendationService
            const data = await recommendationService.getSubprocess(subprocessId);
            return data;
        } catch (error) {
            // Fallback на старые мок данные
            console.warn(`Fallback to legacy mock data for subprocess ${subprocessId}`);
            await new Promise(resolve => setTimeout(resolve, 500));
            return mockSubprocesses[subprocessId] || null;
        }
    }
} 