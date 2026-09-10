PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS parlay_weeks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season INTEGER NOT NULL,
  week INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','locked','placed','graded')),
  opens_at TEXT,
  locks_at TEXT,
  combined_odds TEXT,
  wager_amount REAL,
  potential_payout REAL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (season, week)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_parlay_weeks_one_open
ON parlay_weeks(status)
WHERE status = 'open';

CREATE TABLE IF NOT EXISTS discord_manager_links (
  discord_user_id TEXT PRIMARY KEY,
  manager_id TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  team_name TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_discord_manager_links_manager
ON discord_manager_links(manager_id)
WHERE active = 1;

CREATE TABLE IF NOT EXISTS parlay_picks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season INTEGER NOT NULL,
  week INTEGER NOT NULL,
  parlay_week_id INTEGER,
  manager_id TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  team_name TEXT,
  discord_user_id TEXT NOT NULL,
  discord_username TEXT NOT NULL,
  discord_display_name TEXT,
  sport TEXT NOT NULL,
  subject TEXT NOT NULL,
  subject_normalized TEXT NOT NULL,
  bet_type TEXT NOT NULL,
  market TEXT,
  market_normalized TEXT NOT NULL DEFAULT '',
  direction TEXT,
  original_line REAL,
  current_line REAL,
  original_odds INTEGER NOT NULL,
  current_odds INTEGER NOT NULL,
  sportsbook TEXT NOT NULL DEFAULT 'Hard Rock',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','voided','replaced')),
  locked INTEGER NOT NULL DEFAULT 0,
  result TEXT NOT NULL DEFAULT 'PENDING' CHECK (result IN ('PENDING','WIN','LOSS','PUSH')),
  discord_message_id TEXT,
  replaced_by_pick_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parlay_week_id) REFERENCES parlay_weeks(id),
  FOREIGN KEY (replaced_by_pick_id) REFERENCES parlay_picks(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_parlay_one_active_pick_per_manager_week
ON parlay_picks(season, week, manager_id)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_parlay_picks_week
ON parlay_picks(season, week, status);

CREATE INDEX IF NOT EXISTS idx_parlay_picks_duplicate
ON parlay_picks(season, week, subject_normalized, bet_type, market_normalized, direction, status);

CREATE TABLE IF NOT EXISTS parlay_pick_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pick_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pick_id) REFERENCES parlay_picks(id)
);

CREATE INDEX IF NOT EXISTS idx_parlay_pick_history_pick
ON parlay_pick_history(pick_id, created_at DESC);
