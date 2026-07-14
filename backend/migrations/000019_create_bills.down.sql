-- 000019_create_bills.down.sql

DROP TRIGGER IF EXISTS set_updated_at ON bills;
DROP INDEX IF EXISTS idx_bills_user_id;
DROP TABLE IF EXISTS bills;
