-- 000015_create_virtual_goals.down.sql

DROP TRIGGER IF EXISTS set_updated_at ON virtual_goals;
DROP INDEX IF EXISTS idx_virtual_goals_account_id;
DROP TABLE IF EXISTS virtual_goals;
