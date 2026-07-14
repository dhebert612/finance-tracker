-- 000011_create_allocation_templates.down.sql

DROP TRIGGER IF EXISTS set_updated_at ON allocation_templates;
DROP INDEX IF EXISTS idx_allocation_templates_user_id;
DROP TABLE IF EXISTS allocation_templates;
