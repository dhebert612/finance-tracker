import { BucketInput, PaycheckAllocation } from '../models/paycheck.js';

export interface ResolvedBucket {
  bucket_name: string;
  split_type: 'percent' | 'fixed' | 'remainder';
  value: number;
  resolved_amount: number;
  sort_order: number;
}

export function splitPaycheck(netAmount: number, buckets: BucketInput[]): ResolvedBucket[] {
  // Validate there is at most one remainder bucket
  const remainderBuckets = buckets.filter(b => b.split_type === 'remainder');
  if (remainderBuckets.length > 1) {
    throw new Error('MULTIPLE_REMAINDER_BUCKETS');
  }

  // Resolve fixed and percent buckets first
  let allocated = 0;
  const resolved: ResolvedBucket[] = [];

  for (const bucket of buckets) {
    if (bucket.split_type === 'remainder') {
      // Skip for now — resolved last
      resolved.push({
        bucket_name:     bucket.bucket_name,
        split_type:      'remainder',
        value:           0,
        resolved_amount: 0, // placeholder
        sort_order:      bucket.sort_order,
      });
      continue;
    }

    if (bucket.split_type === 'fixed') {
      if (bucket.value < 0) {
        throw new Error('NEGATIVE_FIXED_AMOUNT');
      }
      allocated += bucket.value;
      resolved.push({
        bucket_name:     bucket.bucket_name,
        split_type:      'fixed',
        value:           bucket.value,
        resolved_amount: round(bucket.value),
        sort_order:      bucket.sort_order,
      });
    }

    if (bucket.split_type === 'percent') {
      if (bucket.value < 0 || bucket.value > 100) {
        throw new Error('INVALID_PERCENT');
      }
      const amount = (bucket.value / 100) * netAmount;
      allocated += amount;
      resolved.push({
        bucket_name:     bucket.bucket_name,
        split_type:      'percent',
        value:           bucket.value,
        resolved_amount: round(amount),
        sort_order:      bucket.sort_order,
      });
    }
  }

  // Validate total doesn't exceed net amount
  if (round(allocated) > round(netAmount)) {
    throw new Error('ALLOCATION_EXCEEDS_NET');
  }

  // Resolve remainder bucket
  const remainder = round(netAmount - allocated);
  const remainderIndex = resolved.findIndex(b => b.split_type === 'remainder');
  if (remainderIndex !== -1) {
    resolved[remainderIndex].value           = remainder;
    resolved[remainderIndex].resolved_amount = remainder;
  }

  return resolved;
}

// Round to 2 decimal places to avoid floating point issues
function round(value: number): number {
  return Math.round(value * 100) / 100;
}