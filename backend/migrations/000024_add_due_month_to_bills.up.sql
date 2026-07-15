-- 000024_add_due_month_to_bills.up.sql

ALTER TABLE bills
    ADD COLUMN due_month INT CHECK (due_month >= 1 AND due_month <= 12);
