-- 000014_create_account_members.down.sql

DROP INDEX IF EXISTS idx_account_members_account_id;
DROP INDEX IF EXISTS idx_account_members_user_id;
DROP TABLE IF EXISTS account_members;
