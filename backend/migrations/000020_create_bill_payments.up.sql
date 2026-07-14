-- 000020_create_bill_payments.up.sql

CREATE TABLE bill_payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id         UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    transaction_id  UUID REFERENCES transactions(id) ON DELETE SET NULL,
    paid_date       DATE NOT NULL,
    amount_paid     NUMERIC(12,2) NOT NULL,
    matched_by      match_source_enum NOT NULL DEFAULT 'manual',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bill_payments_bill_id ON bill_payments(bill_id);
