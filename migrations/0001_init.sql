-- migrations/0001_init.sql
-- baseline migration (can be empty if you want)
-- but it's better to create a tiny table so you know migrations are wired

CREATE TABLE IF NOT EXISTS _migrations_smoketest (
  id INTEGER PRIMARY KEY,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
