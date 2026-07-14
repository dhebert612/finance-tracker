import { pool } from '../db/pool.js';
import { User } from '../models/user.js';

export const userRepository = {

  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query<User>(
      `SELECT id, email, password_hash, display_name, family_id, family_role,
              created_at, updated_at, deleted_at
       FROM users
       WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );
    return result.rows[0] ?? null;
  },

  async findById(id: string): Promise<User | null> {
    const result = await pool.query<User>(
      `SELECT id, email, password_hash, display_name, family_id, family_role,
              created_at, updated_at, deleted_at
       FROM users
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return result.rows[0] ?? null;
  },

  async create(email: string, passwordHash: string, displayName: string): Promise<User> {
    const result = await pool.query<User>(
      `INSERT INTO users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, password_hash, display_name, family_id, family_role,
                 created_at, updated_at, deleted_at`,
      [email, passwordHash, displayName]
    );
    return result.rows[0];
  },

  async emailExists(email: string): Promise<boolean> {
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM users WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );
    return parseInt(result.rows[0].count) > 0;
  },

};