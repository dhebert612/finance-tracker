export type BillFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface Bill {
  id: string;
  user_id: string;
  name: string;
  amount: string;
  frequency: BillFrequency;
  due_day: number | null;
  category: string | null;
  auto_pay_match: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface BillPayment {
  id: string;
  bill_id: string;
  transaction_id: string | null;
  paid_date: string;
  amount_paid: string;
  matched_by: 'plaid_auto' | 'manual';
  created_at: Date;
}

export interface BillWithLastPayment extends Bill {
  last_payment: BillPayment | null;
}

export interface CreateBillInput {
  name: string;
  amount: number;
  frequency: BillFrequency;
  due_day?: number;
  category?: string;
}

export interface UpdateBillInput {
  name?: string;
  amount?: number;
  frequency?: BillFrequency;
  due_day?: number | null;
  category?: string | null;
}

export interface MarkPaidInput {
  paid_date: string;
  amount_paid: number;
}