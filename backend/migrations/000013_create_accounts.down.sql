-- 000013_create_accounts.down.sql

DROP TRIGGER IF EXISTS set_updated_at ON accounts;
DROP INDEX IF EXISTS idx_accounts_linked_bank_id;
DROP TABLE IF EXISTS accounts;
