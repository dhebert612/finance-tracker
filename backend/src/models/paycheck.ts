export interface Paycheck {
  id: string;
  user_id: string;
  income_source_id: string;
  pay_date: string;
  gross_amount: string;
  net_amount: string;
  note: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface PaycheckAllocation {
  id: string;
  paycheck_id: string;
  bucket_name: string;
  split_type: 'percent' | 'fixed' | 'remainder';
  value: string;
  resolved_amount: string;
  sort_order: number;
}

export interface PaycheckWithAllocations extends Paycheck {
  allocations: PaycheckAllocation[];
}

// A single bucket definition sent by the client
export interface BucketInput {
  bucket_name: string;
  split_type: 'percent' | 'fixed' | 'remainder';
  value: number;  // percentage (0-100) or fixed dollar amount; ignored for remainder
  sort_order: number;
}

export interface CreatePaycheckInput {
  income_source_id: string;
  pay_date: string;           // YYYY-MM-DD
  gross_amount: number;
  net_amount: number;
  note?: string;
  buckets: BucketInput[];
}

export interface UpdatePaycheckInput {
  income_source_id?: string;
  pay_date?: string;
  gross_amount?: number;
  net_amount?: number;
  note?: string;
  buckets?: BucketInput[];
}