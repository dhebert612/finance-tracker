-- 000006_create_family_invites.down.sql

DROP INDEX IF EXISTS idx_family_invites_family_id;
DROP INDEX IF EXISTS idx_family_invites_token;
DROP TABLE IF EXISTS family_invites;
