export type IncomeType = 'employment' | 'freelance' | 'rental' | 'investment' | 'other';

export interface IncomeSource {
  id: string;
  user_id: string;
  name: string;
  type: IncomeType;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface CreateIncomeSourceInput {
  name: string;
  type: IncomeType;
}

export interface UpdateIncomeSourceInput {
  name?: string;
  type?: IncomeType;
  is_active?: boolean;
}