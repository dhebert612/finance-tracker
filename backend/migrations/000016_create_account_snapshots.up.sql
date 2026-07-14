-- 000016_create_account_snapshots.up.sql

CREATE TABLE account_snapshots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id          UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    snapshot_date       DATE NOT NULL,
    balance             NUMERIC(12,2) NOT NULL,
    contributions_ytd   NUMERIC(12,2),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_account_snapshots UNIQUE (account_id, snapshot_date)
);

CREATE INDEX idx_account_snapshots_account_id ON account_snapshots(account_id, snapshot_date DESC);
