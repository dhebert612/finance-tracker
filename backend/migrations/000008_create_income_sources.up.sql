-- 000008_create_income_sources.up.sql

CREATE TABLE income_sources (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    type        income_type_enum NOT NULL DEFAULT 'employment',
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_income_sources_user_id ON income_sources(user_id);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON income_sources
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
