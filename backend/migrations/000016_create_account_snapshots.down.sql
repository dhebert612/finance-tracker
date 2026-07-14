-- 000016_create_account_snapshots.down.sql

DROP INDEX IF EXISTS idx_account_snapshots_account_id;
DROP TABLE IF EXISTS account_snapshots;
