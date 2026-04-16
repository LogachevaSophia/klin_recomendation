import { makeAutoObservable, runInAction } from 'mobx';
import { recommendationService } from '../api/recommendationService';
import type { CreateRecommendationRequest, UpdateRecommendationRequest } from '../api/types';
import type { DomainProcess } from '../api/clinrecProcessMapper';

class RecommendationStore {
  recommendations: DomainProcess[] = [];
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async fetchRecommendations() {
    try {
      this.loading = true;
      const data = await recommendationService.getAll();
      runInAction(() => {
        this.recommendations = data;
        this.error = null;
      });
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
      const newRecommendation = await recommendationService.create(data);
      runInAction(() => {
        this.recommendations.push(newRecommendation);
        this.error = null;
      });
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
      const updatedRecommendation = await recommendationService.update(data);
      runInAction(() => {
        const index = this.recommendations.findIndex(r => (r.process_id || r.id) === data.id);
        if (index !== -1) {
          this.recommendations[index] = updatedRecommendation;
        }
        this.error = null;
      });
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
      await recommendationService.delete(id);
      runInAction(() => {
        this.recommendations = this.recommendations.filter(
          r => (r.process_id || r.id) !== id,
        );
        this.error = null;
      });
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