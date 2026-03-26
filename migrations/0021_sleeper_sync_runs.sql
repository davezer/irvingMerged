CREATE TABLE IF NOT EXISTS league_sync_runs (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ok',
  season INTEGER,
  week INTEGER,
  summary_json TEXT,
  error_text TEXT,
  created_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_league_sync_runs_source_created
  ON league_sync_runs(source, created_at);
