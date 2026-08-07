-- 0024_password_auth.sql
-- Adds human-password authentication while preserving login_code_hash as a
-- one-time legacy/recovery credential until each user converts.

ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN password_salt TEXT;
ALTER TABLE users ADD COLUMN password_iterations INTEGER;
ALTER TABLE users ADD COLUMN password_set_at INTEGER;
