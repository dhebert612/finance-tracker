-- 000009_create_paychecks.up.sql

CREATE TABLE paychecks (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    income_source_id UUID NOT NULL REFERENCES income_sources(id) ON DELETE RESTRICT,
    pay_date         DATE NOT NULL,
    gross_amount     NUMERIC(12,2) NOT NULL,
    net_amount       NUMERIC(12,2) NOT NULL,
    note             TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_paychecks_user_id ON paychecks(user_id);
CREATE INDEX idx_paychecks_pay_date ON paychecks(pay_date DESC);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON paychecks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
