-- 000017_create_transaction_categories.down.sql

DROP INDEX IF EXISTS idx_transaction_categories_family_id;
DROP TABLE IF EXISTS transaction_categories;
