-- 000001_create_enums.up.sql

CREATE TYPE family_role_enum AS ENUM (
    'admin',
    'member'
);

CREATE TYPE invite_status_enum AS ENUM (
    'pending',
    'accepted',
    'revoked',
    'expired'
);

CREATE TYPE income_type_enum AS ENUM (
    'employment',
    'freelance',
    'rental',
    'investment',
    'other'
);

CREATE TYPE split_type_enum AS ENUM (
    'percent',
    'fixed',
    'remainder'
);

CREATE TYPE account_type_enum AS ENUM (
    'chequing',
    'savings',
    'credit',
    'tfsa',
    'fhsa',
    'rrsp',
    'investment',
    'virtual'
);

CREATE TYPE account_role_enum AS ENUM (
    'owner',
    'member'
);

CREATE TYPE bank_status_enum AS ENUM (
    'active',
    'error',
    'disconnected'
);

CREATE TYPE txn_source_enum AS ENUM (
    'plaid',
    'manual',
    'pdf_import'
);

CREATE TYPE bill_frequency_enum AS ENUM (
    'weekly',
    'biweekly',
    'monthly',
    'yearly'
);

CREATE TYPE match_source_enum AS ENUM (
    'plaid_auto',
    'manual'
);