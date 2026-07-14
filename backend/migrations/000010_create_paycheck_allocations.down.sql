-- 000010_create_paycheck_allocations.down.sql

DROP INDEX IF EXISTS idx_paycheck_allocations_paycheck_id;
DROP TABLE IF EXISTS paycheck_allocations;
