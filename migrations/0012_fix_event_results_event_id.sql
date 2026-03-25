-- migrations/0012_fix_event_results_event_id.sql

-- 1) Rename old table
ALTER TABLE event_results RENAME TO event_results_old;

-- 2) Recreate table with correct types
CREATE TABLE event_results (
  event_id TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  published_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- 3) Try to copy existing data.
-- If event_id values were numeric before, they carry over.
-- If you had none (likely), this is harmless.
INSERT INTO event_results (event_id, payload_json, published_at, updated_at)
SELECT CAST(event_id AS TEXT), payload_json, published_at, updated_at
FROM event_results_old;

-- 4) Drop old table
DROP TABLE event_results_old;
