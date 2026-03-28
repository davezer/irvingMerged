-- League data spine hardening
-- Adds truly season-aware Sleeper storage without destroying legacy tables.

CREATE TABLE IF NOT EXISTS sleeper_rosters_seasonal (
  id TEXT PRIMARY KEY,
  league_id TEXT NOT NULL,
  season INTEGER NOT NULL,
  roster_id INTEGER NOT NULL,
  owner_id TEXT,
  starters_json TEXT,
  players_json TEXT,
  settings_json TEXT,
  metadata_json TEXT,
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sleeper_rosters_seasonal_unique
  ON sleeper_rosters_seasonal(league_id, season, roster_id);

CREATE INDEX IF NOT EXISTS idx_sleeper_rosters_seasonal_owner
  ON sleeper_rosters_seasonal(season, owner_id);

CREATE TABLE IF NOT EXISTS sleeper_transactions_seasonal (
  id TEXT PRIMARY KEY,
  league_id TEXT NOT NULL,
  season INTEGER NOT NULL,
  round INTEGER,
  transaction_id TEXT NOT NULL,
  type TEXT,
  status TEXT,
  roster_ids_json TEXT,
  adds_json TEXT,
  drops_json TEXT,
  draft_picks_json TEXT,
  waiver_budget_json TEXT,
  created_at INTEGER,
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sleeper_transactions_seasonal_unique
  ON sleeper_transactions_seasonal(league_id, season, transaction_id);

CREATE INDEX IF NOT EXISTS idx_sleeper_transactions_seasonal_round
  ON sleeper_transactions_seasonal(season, round, created_at);

INSERT OR IGNORE INTO sleeper_rosters_seasonal (
  id,
  league_id,
  season,
  roster_id,
  owner_id,
  starters_json,
  players_json,
  settings_json,
  metadata_json,
  updated_at
)
SELECT
  COALESCE(league_id, 'legacy') || ':' || COALESCE(CAST(season AS TEXT), '0') || ':' || CAST(roster_id AS TEXT),
  COALESCE(league_id, 'legacy'),
  COALESCE(season, 0),
  roster_id,
  owner_id,
  starters_json,
  players_json,
  settings_json,
  metadata_json,
  COALESCE(updated_at, 0)
FROM sleeper_rosters
WHERE roster_id IS NOT NULL;

INSERT OR IGNORE INTO sleeper_transactions_seasonal (
  id,
  league_id,
  season,
  round,
  transaction_id,
  type,
  status,
  roster_ids_json,
  adds_json,
  drops_json,
  draft_picks_json,
  waiver_budget_json,
  created_at,
  updated_at
)
SELECT
  COALESCE(league_id, 'legacy') || ':' || COALESCE(CAST(season AS TEXT), '0') || ':' || transaction_id,
  COALESCE(league_id, 'legacy'),
  COALESCE(season, 0),
  round,
  transaction_id,
  type,
  status,
  roster_ids_json,
  adds_json,
  drops_json,
  draft_picks_json,
  waiver_budget_json,
  created_at,
  COALESCE(updated_at, 0)
FROM sleeper_transactions
WHERE transaction_id IS NOT NULL;
