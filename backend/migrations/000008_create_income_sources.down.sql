-- 000008_create_income_sources.down.sql

DROP TRIGGER IF EXISTS set_updated_at ON income_sources;
DROP INDEX IF EXISTS idx_income_sources_user_id;
DROP TABLE IF EXISTS income_sources;
