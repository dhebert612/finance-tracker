import { apiClient } from './client.js';

export interface PaycheckAllocation {
  id: string;
  paycheck_id: string;
  bucket_name: string;
  split_type: 'percent' | 'fixed' | 'remainder';
  value: string;
  resolved_amount: string;
  sort_order: number;
}

export interface Paycheck {
  id: string;
  user_id: string;
  income_source_id: string;
  pay_date: string;
  gross_amount: string;
  net_amount: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaycheckWithAllocations extends Paycheck {
  allocations: PaycheckAllocation[];
}

export interface BucketInput {
  bucket_name: string;
  split_type: 'percent' | 'fixed' | 'remainder';
  value: number;
  sort_order: number;
}

export interface CreatePaycheckInput {
  income_source_id: string;
  pay_date: string;
  gross_amount: number;
  net_amount: number;
  note?: string;
  buckets: BucketInput[];
}

export interface IncomeSource {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
}

export const paychecksApi = {
  async getAll(): Promise<Paycheck[]> {
    const { data } = await apiClient.get<Paycheck[]>('/paychecks');
    return data;
  },

  async getOne(id: string): Promise<PaycheckWithAllocations> {
    const { data } = await apiClient.get<PaycheckWithAllocations>(`/paychecks/${id}`);
    return data;
  },

  async create(input: CreatePaycheckInput): Promise<PaycheckWithAllocations> {
    const { data } = await apiClient.post<PaycheckWithAllocations>('/paychecks', input);
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/paychecks/${id}`);
  },

  async getIncomeSources(): Promise<IncomeSource[]> {
    const { data } = await apiClient.get<IncomeSource[]>('/income-sources');
    return data;
  },
};