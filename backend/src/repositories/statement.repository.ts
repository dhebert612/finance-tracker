import { pool } from '../db/pool.js';

export interface CreditStatement {
  id: string;
  account_id: string;
  statement_date: string;
  due_date: string;
  closing_balance: string;
  minimum_payment: string | null;
  pdf_path: string | null;
  ai_analyzed_at: string | null;
  created_at: string;
}

export interface CreditAccount {
  id: string;
  name: string;
  type: string;
  balance: string;
  is_joint: boolean;
  linked_bank_id: string | null;
}

export const statementRepository = {

  async findAccountsByUser(userId: string): Promise<CreditAccount[]> {
    const result = await pool.query<CreditAccount>(
      `SELECT a.id, a.name, a.type, a.balance, a.is_joint, a.linked_bank_id
       FROM accounts a
       JOIN account_members am ON am.account_id = a.id
       WHERE am.user_id = $1
         AND a.type = 'credit'
         AND a.deleted_at IS NULL
       ORDER BY a.created_at ASC`,
      [userId]
    );
    return result.rows;
  },

  async createAccount(userId: string, name: string): Promise<CreditAccount> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const accountResult = await client.query<CreditAccount>(
        `INSERT INTO accounts (name, type, balance, is_virtual)
         VALUES ($1, 'credit', 0, false)
         RETURNING id, name, type, balance, is_joint, linked_bank_id`,
        [name]
      );
      const account = accountResult.rows[0];

      await client.query(
        `INSERT INTO account_members (account_id, user_id, role)
         VALUES ($1, $2, 'owner')`,
        [account.id, userId]
      );

      await client.query('COMMIT');
      return account;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async findStatementsByAccount(accountId: string, userId: string): Promise<CreditStatement[]> {
    // Verify user has access to this account
    const access = await pool.query(
      `SELECT 1 FROM account_members WHERE account_id = $1 AND user_id = $2`,
      [accountId, userId]
    );
    if (!access.rows[0]) return [];

    const result = await pool.query<CreditStatement>(
      `SELECT id, account_id, statement_date, due_date, closing_balance,
              minimum_payment, pdf_path, ai_analyzed_at, created_at
       FROM credit_statements
       WHERE account_id = $1
       ORDER BY statement_date DESC`,
      [accountId]
    );
    return result.rows;
  },

  async createStatement(
    accountId: string,
    statementDate: string,
    dueDate: string,
    closingBalance: number,
    minimumPayment: number | null,
    pdfPath: string | null
  ): Promise<CreditStatement> {
    const result = await pool.query<CreditStatement>(
      `INSERT INTO credit_statements
         (account_id, statement_date, due_date, closing_balance, minimum_payment, pdf_path)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, account_id, statement_date, due_date, closing_balance,
                 minimum_payment, pdf_path, ai_analyzed_at, created_at`,
      [accountId, statementDate, dueDate, closingBalance, minimumPayment, pdfPath]
    );
    return result.rows[0];
  },

  async markAnalyzed(statementId: string): Promise<void> {
    await pool.query(
      `UPDATE credit_statements SET ai_analyzed_at = NOW() WHERE id = $1`,
      [statementId]
    );
  },

  async deleteAccount(accountId: string, userId: string): Promise<boolean> {
    // Only owner can delete
    const result = await pool.query(
      `UPDATE accounts SET deleted_at = NOW()
       WHERE id = $1
         AND deleted_at IS NULL
         AND id IN (
           SELECT account_id FROM account_members
           WHERE user_id = $2 AND role = 'owner'
         )`,
      [accountId, userId]
    );
    return (result.rowCount ?? 0) > 0;
  },

};

export async function saveAnalysisTransactions(
  accountId: string,
  statementId: string,
  transactions: { date: string; merchant: string; amount: number; category: string }[]
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const txn of transactions) {
      await client.query(
        `INSERT INTO transactions
           (account_id, transaction_date, merchant_name, amount, currency, category, source)
         VALUES ($1, $2, $3, $4, 'CAD', $5, 'pdf_import')
         ON CONFLICT DO NOTHING`,
        [accountId, txn.date, txn.merchant, txn.amount, txn.category]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}