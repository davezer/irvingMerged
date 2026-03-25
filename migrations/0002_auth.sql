-- migrations/0002_auth.sql

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'gm', -- 'gm' | 'admin'
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- INVITE CODES (single-use)
CREATE TABLE IF NOT EXISTS invite_codes (
  code TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'gm', -- role granted to the user
  used_by_user_id TEXT,            -- set once redeemed
  used_at INTEGER,
  expires_at INTEGER,              -- nullable; unix epoch
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (used_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_used_by ON invite_codes(used_by_user_id);

-- SESSIONS
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,      -- unix epoch
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
