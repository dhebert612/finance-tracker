-- 000022_create_debts.down.sql

DROP TRIGGER IF EXISTS set_updated_at ON debts;
DROP INDEX IF EXISTS idx_debts_user_id;
DROP TABLE IF EXISTS debts;
