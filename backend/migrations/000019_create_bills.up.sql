-- 000019_create_bills.up.sql

CREATE TABLE bills (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    amount          NUMERIC(12,2) NOT NULL,
    frequency       bill_frequency_enum NOT NULL DEFAULT 'monthly',
    due_day         INT,
    category        TEXT,
    auto_pay_match  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_bills_user_id ON bills(user_id);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON bills
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
