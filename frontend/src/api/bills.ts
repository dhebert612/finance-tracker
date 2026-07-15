import { apiClient } from './client.js';

export type BillFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface Bill {
  id: string;
  user_id: string;
  name: string;
  amount: string;
  frequency: BillFrequency;
  due_day: number | null;
  due_month: number | null;
  category: string | null;
  auto_pay_match: string | null;
  created_at: string;
  updated_at: string;
  last_payment: {
    id: string;
    paid_date: string;
    amount_paid: string;
  } | null;
}

export interface CreateBillInput {
  name: string;
  amount: number;
  frequency: BillFrequency;
  due_day?: number;
  due_month?: number;
  category?: string;
}

export interface MarkPaidInput {
  paid_date: string;
  amount_paid: number;
}

export const billsApi = {
  async getAll(): Promise<Bill[]> {
    const { data } = await apiClient.get<Bill[]>('/bills');
    return data;
  },

  async create(input: CreateBillInput): Promise<Bill> {
    const { data } = await apiClient.post<Bill>('/bills', input);
    return data;
  },

  async update(id: string, input: Partial<CreateBillInput>): Promise<Bill> {
    const { data } = await apiClient.patch<Bill>(`/bills/${id}`, input);
    return data;
  },

  async markPaid(id: string, input: MarkPaidInput): Promise<void> {
    await apiClient.post(`/bills/${id}/payments`, input);
  },

  async unmarkPaid(id: string): Promise<void> {
    await apiClient.delete(`/bills/${id}/payments`);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/bills/${id}`);
  },
};