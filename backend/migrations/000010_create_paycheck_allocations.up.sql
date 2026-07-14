-- 000010_create_paycheck_allocations.up.sql

CREATE TABLE paycheck_allocations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paycheck_id     UUID NOT NULL REFERENCES paychecks(id) ON DELETE CASCADE,
    bucket_name     TEXT NOT NULL,
    split_type      split_type_enum NOT NULL,
    value           NUMERIC(12,2) NOT NULL,
    resolved_amount NUMERIC(12,2) NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_paycheck_allocations_paycheck_id ON paycheck_allocations(paycheck_id);
