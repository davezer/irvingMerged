CREATE TABLE IF NOT EXISTS results (
  event_id TEXT PRIMARY KEY,
  payload_json TEXT,
  published_at TEXT,
  updated_at INTEGER
);