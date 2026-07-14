-- 000009_create_paychecks.down.sql

DROP TRIGGER IF EXISTS set_updated_at ON paychecks;
DROP INDEX IF EXISTS idx_paychecks_pay_date;
DROP INDEX IF EXISTS idx_paychecks_user_id;
DROP TABLE IF EXISTS paychecks;
