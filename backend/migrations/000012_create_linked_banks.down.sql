-- 000012_create_linked_banks.down.sql

DROP TRIGGER IF EXISTS set_updated_at ON linked_banks;
DROP INDEX IF EXISTS idx_linked_banks_user_id;
DROP TABLE IF EXISTS linked_banks;
