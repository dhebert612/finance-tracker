-- 000015_create_virtual_goals.up.sql

CREATE TABLE virtual_goals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    target_amount   NUMERIC(12,2) NOT NULL,
    current_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
    icon            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_virtual_goals_account_id ON virtual_goals(account_id);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON virtual_goals
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
