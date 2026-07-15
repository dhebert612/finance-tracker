export type IncomeType = 'employment' | 'freelance' | 'rental' | 'investment' | 'other';
export type PayFrequency = 'weekly' | 'biweekly' | 'semi_monthly' | 'monthly';

export interface IncomeSource {
  id: string;
  user_id: string;
  name: string;
  type: IncomeType;
  pay_frequency: PayFrequency;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface CreateIncomeSourceInput {
  name: string;
  type: IncomeType;
  pay_frequency: PayFrequency;
}

export interface UpdateIncomeSourceInput {
  name?: string;
  type?: IncomeType;
  pay_frequency?: PayFrequency;
  is_active?: boolean;
}