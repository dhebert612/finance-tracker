-- 000018_create_transactions.down.sql

DROP TRIGGER IF EXISTS set_updated_at ON transactions;
DROP INDEX IF EXISTS idx_transactions_category;
DROP INDEX IF EXISTS idx_transactions_transaction_date;
DROP INDEX IF EXISTS idx_transactions_account_id;
DROP TABLE IF EXISTS transactions;
