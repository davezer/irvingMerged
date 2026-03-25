-- Event results (official outcome per event)
CREATE TABLE IF NOT EXISTS event_results (
  event_id INTEGER PRIMARY KEY,
  payload_json TEXT NOT NULL,
  published_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Computed scores per entry (event + user)
CREATE TABLE IF NOT EXISTS entry_scores (
  event_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  score_total INTEGER NOT NULL DEFAULT 0,
  breakdown_json TEXT,
  computed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (event_id, user_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
