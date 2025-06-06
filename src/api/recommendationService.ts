import axios from 'axios';
import { 
  RecommendationResponse, 
  CreateRecommendationRequest, 
  UpdateRecommendationRequest 
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const recommendationService = {
  async getAll(): Promise<RecommendationResponse[]> {
    const response = await axios.get(`${API_BASE_URL}/recommendations`);
    return response.data;
  },

  async getById(id: string): Promise<RecommendationResponse> {
    const response = await axios.get(`${API_BASE_URL}/recommendations/${id}`);
    return response.data;
  },

  async create(data: CreateRecommendationRequest): Promise<RecommendationResponse> {
    const response = await axios.post(`${API_BASE_URL}/recommendations`, data);
    return response.data;
  },

  async update(data: UpdateRecommendationRequest): Promise<RecommendationResponse> {
    const response = await axios.put(`${API_BASE_URL}/recommendations/${data.id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/recommendations/${id}`);
  }
}; 