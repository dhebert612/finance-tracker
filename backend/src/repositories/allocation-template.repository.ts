import { pool } from '../db/pool.js';

export interface TemplateRule {
  bucket_name: string;
  split_type: 'percent' | 'fixed' | 'remainder';
  value: number;
  sort_order: number;
}

export interface AllocationTemplate {
  id: string;
  user_id: string;
  name: string;
  rules: TemplateRule[];
  created_at: Date;
  updated_at: Date;
}

export const allocationTemplateRepository = {

  async findByUser(userId: string): Promise<AllocationTemplate | null> {
    const result = await pool.query<AllocationTemplate>(
      `SELECT id, user_id, name, rules, created_at, updated_at
       FROM allocation_templates
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY created_at ASC
       LIMIT 1`,
      [userId]
    );
    return result.rows[0] ?? null;
  },

  async upsert(userId: string, rules: TemplateRule[]): Promise<AllocationTemplate> {
    // Check if template already exists
    const existing = await this.findByUser(userId);

    if (existing) {
      const result = await pool.query<AllocationTemplate>(
        `UPDATE allocation_templates
         SET rules = $2
         WHERE id = $1
         RETURNING id, user_id, name, rules, created_at, updated_at`,
        [existing.id, JSON.stringify(rules)]
      );
      return result.rows[0];
    }

    const result = await pool.query<AllocationTemplate>(
      `INSERT INTO allocation_templates (user_id, name, rules)
       VALUES ($1, 'My Split', $2)
       RETURNING id, user_id, name, rules, created_at, updated_at`,
      [userId, JSON.stringify(rules)]
    );
    return result.rows[0];
  },

};