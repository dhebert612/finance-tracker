-- 000005_create_families_fk.up.sql

ALTER TABLE families
    ADD CONSTRAINT fk_families_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT;
