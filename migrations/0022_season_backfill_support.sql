-- Season-aware backfill support

ALTER TABLE sleeper_rosters ADD COLUMN season INTEGER;
ALTER TABLE sleeper_rosters ADD COLUMN league_id TEXT;

ALTER TABLE sleeper_transactions ADD COLUMN season INTEGER;
ALTER TABLE sleeper_transactions ADD COLUMN league_id TEXT;
ALTER TABLE sleeper_transactions ADD COLUMN round INTEGER;

-- league_sync_runs already exists from 0021, so extend it instead of recreating it
ALTER TABLE league_sync_runs ADD COLUMN league_id TEXT;
ALTER TABLE league_sync_runs ADD COLUMN mode TEXT DEFAULT 'sync';

CREATE INDEX IF NOT EXISTS idx_sleeper_rosters_season
  ON sleeper_rosters(season, owner_id);

CREATE INDEX IF NOT EXISTS idx_sleeper_transactions_season
  ON sleeper_transactions(season, round);

CREATE INDEX IF NOT EXISTS idx_league_sync_runs_season
  ON league_sync_runs(season, mode);