-- migrations/0007_entries.sql
CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  submitted_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_entries_event_id ON entries(event_id);
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);
