import { pool } from '../db/pool.js';
import { IncomeSource, CreateIncomeSourceInput, UpdateIncomeSourceInput } from '../models/income-source.js';

export const incomeSourceRepository = {

  async findAllByUser(userId: string): Promise<IncomeSource[]> {
    const result = await pool.query<IncomeSource>(
      `SELECT id, user_id, name, type, is_active, created_at, updated_at
       FROM income_sources
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [userId]
    );
    return result.rows;
  },

  async findById(id: string, userId: string): Promise<IncomeSource | null> {
    const result = await pool.query<IncomeSource>(
      `SELECT id, user_id, name, type, is_active, created_at, updated_at
       FROM income_sources
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId]
    );
    return result.rows[0] ?? null;
  },

  async create(userId: string, input: CreateIncomeSourceInput): Promise<IncomeSource> {
    const result = await pool.query<IncomeSource>(
      `INSERT INTO income_sources (user_id, name, type)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, name, type, is_active, created_at, updated_at`,
      [userId, input.name.trim(), input.type]
    );
    return result.rows[0];
  },

  async update(id: string, userId: string, input: UpdateIncomeSourceInput): Promise<IncomeSource | null> {
    const result = await pool.query<IncomeSource>(
      `UPDATE income_sources
       SET
         name      = COALESCE($3, name),
         type      = COALESCE($4, type),
         is_active = COALESCE($5, is_active)
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING id, user_id, name, type, is_active, created_at, updated_at`,
      [id, userId, input.name ?? null, input.type ?? null, input.is_active ?? null]
    );
    return result.rows[0] ?? null;
  },

  async softDelete(id: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE income_sources
       SET deleted_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
  },

};