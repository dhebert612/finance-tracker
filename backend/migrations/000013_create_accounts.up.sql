-- 000013_create_accounts.up.sql

CREATE TABLE accounts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    linked_bank_id      UUID REFERENCES linked_banks(id) ON DELETE SET NULL,
    plaid_account_id    TEXT UNIQUE,
    name                TEXT NOT NULL,
    type                account_type_enum NOT NULL,
    balance             NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_virtual          BOOLEAN NOT NULL DEFAULT false,
    is_joint            BOOLEAN NOT NULL DEFAULT false,
    contribution_limit  NUMERIC(12,2),
    contributed_ytd     NUMERIC(12,2),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_accounts_linked_bank_id ON accounts(linked_bank_id);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON accounts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
