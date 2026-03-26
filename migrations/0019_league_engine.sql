-- Sleeper + badges + draft economy domains for full Irving League implementation.
ALTER TABLE managers ADD COLUMN sleeper_user_id TEXT;
ALTER TABLE managers ADD COLUMN sleeper_roster_id INTEGER;
ALTER TABLE managers ADD COLUMN sleeper_avatar TEXT;
ALTER TABLE managers ADD COLUMN sleeper_username TEXT;
ALTER TABLE managers ADD COLUMN metadata_json TEXT;

ALTER TABLE standings_snapshots ADD COLUMN points_against REAL NOT NULL DEFAULT 0;
ALTER TABLE standings_snapshots ADD COLUMN streak_type TEXT;
ALTER TABLE standings_snapshots ADD COLUMN streak_value INTEGER NOT NULL DEFAULT 0;
ALTER TABLE standings_snapshots ADD COLUMN rank INTEGER;

CREATE TABLE IF NOT EXISTS roster_players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season TEXT NOT NULL,
  manager_id TEXT NOT NULL,
  sleeper_roster_id INTEGER,
  player_id TEXT NOT NULL,
  slot TEXT,
  lineup_order INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY,
  season TEXT NOT NULL,
  label TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT,
  draft_order_json TEXT,
  settings_json TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS draft_picks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  draft_id TEXT NOT NULL,
  season TEXT NOT NULL,
  pick_no INTEGER,
  round INTEGER,
  manager_id TEXT,
  player_id TEXT,
  amount REAL,
  is_keeper INTEGER NOT NULL DEFAULT 0,
  metadata_json TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS matchups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season TEXT NOT NULL,
  week INTEGER NOT NULL,
  matchup_id INTEGER,
  roster_id INTEGER,
  manager_id TEXT,
  starters_json TEXT,
  players_json TEXT,
  points REAL NOT NULL DEFAULT 0,
  custom_points REAL,
  metadata_json TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  season TEXT NOT NULL,
  week INTEGER,
  kind TEXT,
  status TEXT,
  creator_id TEXT,
  roster_ids_json TEXT,
  adds_json TEXT,
  drops_json TEXT,
  draft_picks_json TEXT,
  waiver_budget_json TEXT,
  metadata_json TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS badge_definitions (
  key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  icon TEXT,
  tone TEXT,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS manager_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season TEXT NOT NULL,
  badge_key TEXT NOT NULL,
  manager_id TEXT NOT NULL,
  reason TEXT,
  score REAL,
  metadata_json TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS draft_budget_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season TEXT NOT NULL,
  manager_id TEXT NOT NULL,
  starting_budget REAL NOT NULL DEFAULT 200,
  spent_budget REAL NOT NULL DEFAULT 0,
  remaining_budget REAL NOT NULL DEFAULT 200,
  keeper_commitment INTEGER NOT NULL DEFAULT 0,
  max_purchase REAL NOT NULL DEFAULT 0,
  average_purchase REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_roster_players_season_manager ON roster_players (season, manager_id);
CREATE INDEX IF NOT EXISTS idx_draft_picks_season_manager ON draft_picks (season, manager_id);
CREATE INDEX IF NOT EXISTS idx_matchups_season_week ON matchups (season, week);
CREATE INDEX IF NOT EXISTS idx_transactions_season_week ON transactions (season, week);
CREATE INDEX IF NOT EXISTS idx_manager_badges_season_manager ON manager_badges (season, manager_id);
CREATE INDEX IF NOT EXISTS idx_draft_budget_ledger_season_manager ON draft_budget_ledger (season, manager_id);

INSERT OR IGNORE INTO badge_definitions (key, title, icon, tone, description) VALUES
  ('war_chest', 'War Chest', 'chip-stack', 'gold', 'Top draft spender of the season.'),
  ('value_hunter', 'Value Hunter', 'target', 'emerald', 'Highest average wins per draft dollar.'),
  ('top_dog', 'Top Dog', 'crown', 'crimson', 'Best regular season record.'),
  ('heavyweight', 'Heavyweight', 'hammer', 'bronze', 'Highest average weekly score.');
