-- 000023_add_pay_frequency_to_income_sources.up.sql

CREATE TYPE pay_frequency_enum AS ENUM (
    'weekly',
    'biweekly',
    'semi_monthly',
    'monthly'
);

ALTER TABLE income_sources
    ADD COLUMN pay_frequency pay_frequency_enum NOT NULL DEFAULT 'biweekly';
