import { makeAutoObservable, runInAction } from 'mobx';
import { recommendationService } from '../api/recommendationService';
import type { RecommendationResponse, CreateRecommendationRequest, UpdateRecommendationRequest } from '../api/types';

// Mock data
const mockRecommendations: RecommendationResponse[] = [
  {
    id: '1',
    title: 'Клинрека 1',
    description: 'Пытаемся диагностировать и лечить простуды',
    category: 'Простуда',
    priority: 'low',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Клинрека 2',
    description: 'Лечение гриппа с насморком и всякими другими симптомами',
    category: 'Грипп',
    priority: 'medium',
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Клинрека 3',
    description: 'Лечение онкологии',
    category: 'Онкология',
    priority: 'high',
    createdAt: new Date().toISOString()
  }
];

class RecommendationStore {
  recommendations: RecommendationResponse[] = [];
  loading = false;
  error: string | null = null;
  useMockData = true; // Flag to control whether to use mock data

  constructor() {
    makeAutoObservable(this);
  }

  async fetchRecommendations() {
    try {
      this.loading = true;
      if (this.useMockData) {
        // Use mock data
        runInAction(() => {
          this.recommendations = [...mockRecommendations];
          this.error = null;
        });
      } else {
        const data = await recommendationService.getAll();
        runInAction(() => {
          this.recommendations = data;
          this.error = null;
        });
      }
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to fetch recommendations';
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async createRecommendation(data: CreateRecommendationRequest) {
    try {
      this.loading = true;
      if (this.useMockData) {
        // Create mock recommendation
        const newRecommendation: RecommendationResponse = {
          ...data,
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString()
        };
        runInAction(() => {
          this.recommendations.push(newRecommendation);
          this.error = null;
        });
      } else {
        const newRecommendation = await recommendationService.create(data);
        runInAction(() => {
          this.recommendations.push(newRecommendation);
          this.error = null;
        });
      }
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to create recommendation';
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async updateRecommendation(data: UpdateRecommendationRequest) {
    try {
      this.loading = true;
      if (this.useMockData) {
        // Update mock recommendation
        const updatedRecommendation: RecommendationResponse = {
          ...(this.recommendations.find(r => r.id === data.id) as RecommendationResponse),
          ...data,
          createdAt: new Date().toISOString()
        };
        runInAction(() => {
          const index = this.recommendations.findIndex(r => r.id === data.id);
          if (index !== -1) {
            this.recommendations[index] = updatedRecommendation;
          }
          this.error = null;
        });
      } else {
        const updatedRecommendation = await recommendationService.update(data);
        runInAction(() => {
          const index = this.recommendations.findIndex(r => r.id === data.id);
          if (index !== -1) {
            this.recommendations[index] = updatedRecommendation;
          }
          this.error = null;
        });
      }
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to update recommendation';
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async deleteRecommendation(id: string) {
    try {
      this.loading = true;
      if (this.useMockData) {
        // Delete mock recommendation
        runInAction(() => {
          this.recommendations = this.recommendations.filter(r => r.id !== id);
          this.error = null;
        });
      } else {
        await recommendationService.delete(id);
        runInAction(() => {
          this.recommendations = this.recommendations.filter(r => r.id !== id);
          this.error = null;
        });
      }
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to delete recommendation';
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }
}

export const recommendationStore = new RecommendationStore(); 