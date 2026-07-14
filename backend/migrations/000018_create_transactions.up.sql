-- 000018_create_transactions.up.sql

CREATE TABLE transactions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id              UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    plaid_transaction_id    TEXT UNIQUE,
    transaction_date        DATE NOT NULL,
    merchant_name           TEXT,
    amount                  NUMERIC(12,2) NOT NULL,
    currency                CHAR(3) NOT NULL DEFAULT 'CAD',
    category                TEXT,
    is_subscription         BOOLEAN NOT NULL DEFAULT false,
    source                  txn_source_enum NOT NULL DEFAULT 'manual',
    note                    TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ
);

CREATE INDEX idx_transactions_account_id ON transactions(account_id, transaction_date DESC);
CREATE INDEX idx_transactions_transaction_date ON transactions(transaction_date DESC);
CREATE INDEX idx_transactions_category ON transactions(category);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
