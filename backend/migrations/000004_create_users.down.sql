-- 000004_create_users.down.sql

DROP TRIGGER IF EXISTS set_updated_at ON users;
DROP INDEX IF EXISTS idx_users_family_id;
DROP INDEX IF EXISTS idx_users_email;
DROP TABLE IF EXISTS users;
