import { apiClient } from './client.js';

export type IncomeType = 'employment' | 'freelance' | 'rental' | 'investment' | 'other';
export type PayFrequency = 'weekly' | 'biweekly' | 'semi_monthly' | 'monthly';

export interface IncomeSource {
  id: string;
  user_id: string;
  name: string;
  type: IncomeType;
  pay_frequency: PayFrequency;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateIncomeSourceInput {
  name: string;
  type: IncomeType;
  pay_frequency: PayFrequency;
}

const FREQUENCY_LABELS: Record<PayFrequency, string> = {
  weekly:       'weekly',
  biweekly:     'bi-weekly',
  semi_monthly: 'semi-monthly',
  monthly:      'monthly',
};

export function formatFrequency(freq: PayFrequency): string {
  return FREQUENCY_LABELS[freq] ?? freq;
}

export const incomeSourcesApi = {
  async getAll(): Promise<IncomeSource[]> {
    const { data } = await apiClient.get<IncomeSource[]>('/income-sources');
    return data;
  },

  async create(input: CreateIncomeSourceInput): Promise<IncomeSource> {
    const { data } = await apiClient.post<IncomeSource>('/income-sources', input);
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/income-sources/${id}`);
  },
};