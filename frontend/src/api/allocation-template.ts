import { apiClient } from './client.js';

export interface TemplateRule {
  bucket_name: string;
  split_type: 'percent' | 'fixed' | 'remainder';
  value: number;
  sort_order: number;
}

export interface AllocationTemplate {
  id: string;
  user_id: string;
  name: string;
  rules: TemplateRule[];
  created_at: string;
  updated_at: string;
}

export const allocationTemplateApi = {
  async getMine(): Promise<AllocationTemplate | null> {
    const { data } = await apiClient.get<AllocationTemplate | null>('/allocation-templates/mine');
    return data;
  },

  async saveMine(rules: TemplateRule[]): Promise<AllocationTemplate> {
    const { data } = await apiClient.put<AllocationTemplate>('/allocation-templates/mine', { rules });
    return data;
  },
};