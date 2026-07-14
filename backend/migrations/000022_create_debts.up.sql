-- 000022_create_debts.up.sql

CREATE TABLE debts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    principal         NUMERIC(12,2) NOT NULL,
    interest_rate     NUMERIC(5,4) NOT NULL,
    monthly_payment   NUMERIC(12,2) NOT NULL,
    start_date        DATE NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_debts_user_id ON debts(user_id);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON debts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
