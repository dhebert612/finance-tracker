import { pool } from '../db/pool.js';
import { Bill, BillPayment, BillWithLastPayment, CreateBillInput, UpdateBillInput, MarkPaidInput } from '../models/bill.js';

export const billRepository = {

  async findAllByUser(userId: string): Promise<BillWithLastPayment[]> {
    // Fetch bills with their most recent payment using a LEFT JOIN
    const result = await pool.query<BillWithLastPayment>(
      `SELECT
         b.id, b.user_id, b.name, b.amount, b.frequency, b.due_day,
         b.category, b.auto_pay_match, b.created_at, b.updated_at,
         to_json(bp.*) as last_payment
       FROM bills b
       LEFT JOIN LATERAL (
         SELECT * FROM bill_payments
         WHERE bill_id = b.id
         ORDER BY paid_date DESC
         LIMIT 1
       ) bp ON true
       WHERE b.user_id = $1 AND b.deleted_at IS NULL
       ORDER BY b.due_day ASC NULLS LAST`,
      [userId]
    );
    return result.rows;
  },

  async findById(id: string, userId: string): Promise<Bill | null> {
    const result = await pool.query<Bill>(
      `SELECT id, user_id, name, amount, frequency, due_day, category,
              auto_pay_match, created_at, updated_at
       FROM bills
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId]
    );
    return result.rows[0] ?? null;
  },

  async create(userId: string, input: CreateBillInput): Promise<Bill> {
    const result = await pool.query<Bill>(
      `INSERT INTO bills (user_id, name, amount, frequency, due_day, category)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, name, amount, frequency, due_day, category,
                 auto_pay_match, created_at, updated_at`,
      [userId, input.name.trim(), input.amount, input.frequency, input.due_day ?? null, input.category ?? null]
    );
    return result.rows[0];
  },

  async update(id: string, userId: string, input: UpdateBillInput): Promise<Bill | null> {
    const result = await pool.query<Bill>(
      `UPDATE bills SET
         name      = COALESCE($3, name),
         amount    = COALESCE($4, amount),
         frequency = COALESCE($5, frequency),
         due_day   = COALESCE($6, due_day),
         category  = COALESCE($7, category)
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING id, user_id, name, amount, frequency, due_day, category,
                 auto_pay_match, created_at, updated_at`,
      [id, userId, input.name ?? null, input.amount ?? null, input.frequency ?? null, input.due_day ?? null, input.category ?? null]
    );
    return result.rows[0] ?? null;
  },

  async markPaid(billId: string, userId: string, input: MarkPaidInput): Promise<BillPayment | null> {
    // Verify bill belongs to user first
    const bill = await this.findById(billId, userId);
    if (!bill) return null;

    const result = await pool.query<BillPayment>(
      `INSERT INTO bill_payments (bill_id, paid_date, amount_paid, matched_by)
       VALUES ($1, $2, $3, 'manual')
       RETURNING id, bill_id, transaction_id, paid_date, amount_paid, matched_by, created_at`,
      [billId, input.paid_date, input.amount_paid]
    );
    return result.rows[0];
  },

  async getPaymentHistory(billId: string, userId: string): Promise<BillPayment[]> {
    // Verify bill belongs to user first
    const bill = await this.findById(billId, userId);
    if (!bill) return [];

    const result = await pool.query<BillPayment>(
      `SELECT id, bill_id, transaction_id, paid_date, amount_paid, matched_by, created_at
       FROM bill_payments
       WHERE bill_id = $1
       ORDER BY paid_date DESC`,
      [billId]
    );
    return result.rows;
  },

  async softDelete(id: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE bills SET deleted_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
  },

};