-- migrations/0013_entry_scores_updated_at.sql
ALTER TABLE entry_scores ADD COLUMN updated_at TEXT NOT NULL
  DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'));
