-- migrations/0004_events.sql

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,               -- 'daytona' | 'masters' | 'derby' | 'madness' | 'worldcup'
  start_at INTEGER,                 -- unix seconds (UTC)
  lock_at INTEGER NOT NULL,         -- unix seconds (UTC)
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_events_lock_at ON events(lock_at);
