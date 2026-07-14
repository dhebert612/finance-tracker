-- 000012_create_linked_banks.up.sql

CREATE TABLE linked_banks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_name    TEXT NOT NULL,
    plaid_item_id       TEXT UNIQUE,
    plaid_access_token  TEXT,
    status              bank_status_enum NOT NULL DEFAULT 'active',
    last_synced_at      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_linked_banks_user_id ON linked_banks(user_id);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON linked_banks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
