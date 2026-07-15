-- 000024_add_due_month_to_bills.down.sql

ALTER TABLE bills
    DROP COLUMN IF EXISTS due_month;
