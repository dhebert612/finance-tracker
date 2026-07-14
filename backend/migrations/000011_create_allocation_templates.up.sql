-- 000011_create_allocation_templates.up.sql

CREATE TABLE allocation_templates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    rules       JSONB NOT NULL DEFAULT '[]',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_allocation_templates_user_id ON allocation_templates(user_id);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON allocation_templates
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
