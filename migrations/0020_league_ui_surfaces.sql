-- Phase: League UI surfacing tables/views
-- Safe additive migration.

CREATE TABLE IF NOT EXISTS manager_financial_snapshots (
  id TEXT PRIMARY KEY,
  manager_id TEXT NOT NULL,
  season INTEGER NOT NULL,
  budget INTEGER NOT NULL DEFAULT 0,
  spent INTEGER NOT NULL DEFAULT 0,
  remaining INTEGER NOT NULL DEFAULT 0,
  dead_money INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_manager_financial_snapshots_manager_season
  ON manager_financial_snapshots(manager_id, season);

CREATE TABLE IF NOT EXISTS sleeper_users (
  sleeper_user_id TEXT PRIMARY KEY,
  display_name TEXT,
  avatar TEXT,
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sleeper_rosters (
  roster_id INTEGER PRIMARY KEY,
  owner_id TEXT,
  starters_json TEXT,
  players_json TEXT,
  settings_json TEXT,
  metadata_json TEXT,
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sleeper_transactions (
  transaction_id TEXT PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS rivals (
  manager_id TEXT NOT NULL,
  rival_manager_id TEXT NOT NULL,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  ties INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  PRIMARY KEY (manager_id, rival_manager_id)
);

CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE,
  name TEXT NOT NULL,
  tier TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS manager_badges (
  id TEXT PRIMARY KEY,
  manager_id TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  notes TEXT,
  awarded_at TEXT,
  created_at INTEGER NOT NULL DEFAULT 0
);