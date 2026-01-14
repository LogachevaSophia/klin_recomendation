import axios from 'axios';
import { ProcessComparison } from './comparisonTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const comparisonService = {
  async compare(processId1: string, processId2: string): Promise<ProcessComparison> {
    const response = await axios.get(`${API_BASE_URL}/compare/${processId1}/${processId2}`);
    return response.data;
  }
};

