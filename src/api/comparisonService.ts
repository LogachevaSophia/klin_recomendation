import { ProcessComparison } from './comparisonTypes';
import { apiClient } from './apiClient';

export const comparisonService = {
  async compare(processId1: string, processId2: string): Promise<ProcessComparison> {
    const { data } = await apiClient.get<ProcessComparison>(
      `/compare/${processId1}/${processId2}`,
    );
    return data;
  },
};

