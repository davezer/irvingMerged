PRAGMA foreign_keys = ON;

-- Snapshot of the historical Google Sheet that powered /league/parlay.
-- New Discord submissions remain in parlay_picks; legacy rows live here
-- exactly as they appeared in the old source.
CREATE TABLE IF NOT EXISTS parlay_legacy_picks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_row_index INTEGER NOT NULL UNIQUE,
  team TEXT NOT NULL,
  date TEXT,
  season INTEGER,
  bet TEXT NOT NULL,
  result TEXT NOT NULL,
  category TEXT NOT NULL,
  raw_json TEXT,
  imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_parlay_legacy_season
ON parlay_legacy_picks(season, source_row_index);

CREATE INDEX IF NOT EXISTS idx_parlay_legacy_team
ON parlay_legacy_picks(team);

CREATE TABLE IF NOT EXISTS parlay_legacy_import_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  source_url TEXT,
  source_rows INTEGER NOT NULL DEFAULT 0,
  imported_rows INTEGER NOT NULL DEFAULT 0,
  last_imported_at TEXT,
  last_error TEXT
);

INSERT OR IGNORE INTO parlay_legacy_import_state (id)
VALUES (1);
