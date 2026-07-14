import { pool } from '../db/pool.js';
import { Paycheck, PaycheckWithAllocations, PaycheckAllocation } from '../models/paycheck.js';
import { ResolvedBucket } from '../services/splitter.service.js';

export const paycheckRepository = {

  async findAllByUser(userId: string): Promise<Paycheck[]> {
    const result = await pool.query<Paycheck>(
      `SELECT id, user_id, income_source_id, pay_date, gross_amount,
              net_amount, note, created_at, updated_at
       FROM paychecks
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY pay_date DESC`,
      [userId]
    );
    return result.rows;
  },

  async findByIdWithAllocations(id: string, userId: string): Promise<PaycheckWithAllocations | null> {
    // Fetch paycheck
    const paycheckResult = await pool.query<Paycheck>(
      `SELECT id, user_id, income_source_id, pay_date, gross_amount,
              net_amount, note, created_at, updated_at
       FROM paychecks
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId]
    );

    if (!paycheckResult.rows[0]) return null;

    // Fetch its allocations
    const allocationsResult = await pool.query<PaycheckAllocation>(
      `SELECT id, paycheck_id, bucket_name, split_type, value, resolved_amount, sort_order
       FROM paycheck_allocations
       WHERE paycheck_id = $1
       ORDER BY sort_order ASC`,
      [id]
    );

    return {
      ...paycheckResult.rows[0],
      allocations: allocationsResult.rows,
    };
  },

  async create(
    userId: string,
    incomeSourceId: string,
    payDate: string,
    grossAmount: number,
    netAmount: number,
    note: string | undefined,
    buckets: ResolvedBucket[]
  ): Promise<PaycheckWithAllocations> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert paycheck
      const paycheckResult = await client.query<Paycheck>(
        `INSERT INTO paychecks (user_id, income_source_id, pay_date, gross_amount, net_amount, note)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, user_id, income_source_id, pay_date, gross_amount, net_amount, note, created_at, updated_at`,
        [userId, incomeSourceId, payDate, grossAmount, netAmount, note ?? null]
      );

      const paycheck = paycheckResult.rows[0];

      // Insert allocations
      const allocations: PaycheckAllocation[] = [];
      for (const bucket of buckets) {
        const allocationResult = await client.query<PaycheckAllocation>(
          `INSERT INTO paycheck_allocations (paycheck_id, bucket_name, split_type, value, resolved_amount, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, paycheck_id, bucket_name, split_type, value, resolved_amount, sort_order`,
          [paycheck.id, bucket.bucket_name, bucket.split_type, bucket.value, bucket.resolved_amount, bucket.sort_order]
        );
        allocations.push(allocationResult.rows[0]);
      }

      await client.query('COMMIT');

      return { ...paycheck, allocations };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async softDelete(id: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE paychecks SET deleted_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
  },

};