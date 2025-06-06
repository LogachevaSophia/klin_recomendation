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