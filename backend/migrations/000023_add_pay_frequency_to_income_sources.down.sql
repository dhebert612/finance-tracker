-- 000023_add_pay_frequency_to_income_sources.down.sql

ALTER TABLE income_sources
    DROP COLUMN IF EXISTS pay_frequency;

DROP TYPE IF EXISTS pay_frequency_enum;
