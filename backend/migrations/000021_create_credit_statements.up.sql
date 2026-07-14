-- 000021_create_credit_statements.up.sql

CREATE TABLE credit_statements (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id          UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    statement_date      DATE NOT NULL,
    due_date            DATE NOT NULL,
    closing_balance     NUMERIC(12,2) NOT NULL,
    minimum_payment     NUMERIC(12,2),
    pdf_path            TEXT,
    ai_analyzed_at      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_credit_statements UNIQUE (account_id, statement_date)
);

CREATE INDEX idx_credit_statements_account_id ON credit_statements(account_id, due_date DESC);
