-- migrations/0006_user_login_code.sql

ALTER TABLE users ADD COLUMN username TEXT;
ALTER TABLE users ADD COLUMN login_code_hash TEXT;

-- Backfill username for existing users (optional; safe dev default)
-- This will set username to "user_<first8>" if missing.
UPDATE users
SET username = 'user_' || substr(id, 1, 8)
WHERE username IS NULL;

-- Make username unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username);
