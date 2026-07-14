-- 000005_create_families_fk.down.sql

ALTER TABLE families
    DROP CONSTRAINT IF EXISTS fk_families_created_by;
