import { apiClient } from './client.js';

export interface UpcomingBill {
  id: string;
  name: string;
  amount: string;
  frequency: string;
  due_day: number | null;
  category: string | null;
  last_paid_date: string | null;
}

export interface PaycheckAllocation {
  bucket_name: string;
  split_type: string;
  resolved_amount: string;
}

export interface RecentPaycheck {
  id: string;
  pay_date: string;
  gross_amount: string;
  net_amount: string;
  income_source_name: string;
  allocations: PaycheckAllocation[];
}

export interface DashboardSummary {
  income_this_month: number;
  spending_this_month: number;
  savings_rate: number;
  upcoming_bills: UpcomingBill[];
  recent_paychecks: RecentPaycheck[];
}

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummary> {
    const { data } = await apiClient.get<DashboardSummary>('/dashboard/summary');
    return data;
  },
};