-- ============================================================
-- 0028_nfl_bye_weeks.sql
--
-- Canonical NFL bye-week schedule used by badge automation.
-- One row per team per season.
-- ============================================================

CREATE TABLE IF NOT EXISTS nfl_bye_weeks (
  season INTEGER NOT NULL,
  week INTEGER NOT NULL,
  team TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (season, team)
);

CREATE INDEX IF NOT EXISTS idx_nfl_bye_weeks_season_week
ON nfl_bye_weeks (season, week);

-- ============================================================
-- 2025
-- ============================================================

INSERT OR REPLACE INTO nfl_bye_weeks (season, week, team, updated_at) VALUES
(2025, 5, 'ATL', unixepoch()),
(2025, 5, 'CHI', unixepoch()),
(2025, 5, 'GB',  unixepoch()),
(2025, 5, 'PIT', unixepoch()),

(2025, 6, 'HOU', unixepoch()),
(2025, 6, 'MIN', unixepoch()),

(2025, 7, 'BAL', unixepoch()),
(2025, 7, 'BUF', unixepoch()),

(2025, 8, 'ARI', unixepoch()),
(2025, 8, 'DET', unixepoch()),
(2025, 8, 'JAX', unixepoch()),
(2025, 8, 'LV',  unixepoch()),
(2025, 8, 'LAR', unixepoch()),
(2025, 8, 'SEA', unixepoch()),

(2025, 9, 'CLE', unixepoch()),
(2025, 9, 'NYJ', unixepoch()),
(2025, 9, 'PHI', unixepoch()),
(2025, 9, 'TB',  unixepoch()),

(2025, 10, 'CIN', unixepoch()),
(2025, 10, 'DAL', unixepoch()),
(2025, 10, 'KC',  unixepoch()),
(2025, 10, 'TEN', unixepoch()),

(2025, 11, 'IND', unixepoch()),
(2025, 11, 'NO',  unixepoch()),

(2025, 12, 'DEN', unixepoch()),
(2025, 12, 'LAC', unixepoch()),
(2025, 12, 'MIA', unixepoch()),
(2025, 12, 'WAS', unixepoch()),

(2025, 14, 'CAR', unixepoch()),
(2025, 14, 'NE',  unixepoch()),
(2025, 14, 'NYG', unixepoch()),
(2025, 14, 'SF',  unixepoch());

-- ============================================================
-- 2026
-- ============================================================

INSERT OR REPLACE INTO nfl_bye_weeks (season, week, team, updated_at) VALUES
(2026, 5, 'CAR', unixepoch()),
(2026, 5, 'KC',  unixepoch()),

(2026, 6, 'CIN', unixepoch()),
(2026, 6, 'DET', unixepoch()),
(2026, 6, 'MIA', unixepoch()),
(2026, 6, 'MIN', unixepoch()),

(2026, 7, 'BUF', unixepoch()),
(2026, 7, 'JAX', unixepoch()),
(2026, 7, 'LAC', unixepoch()),
(2026, 7, 'WAS', unixepoch()),

(2026, 8, 'HOU', unixepoch()),
(2026, 8, 'NO',  unixepoch()),
(2026, 8, 'NYG', unixepoch()),
(2026, 8, 'SF',  unixepoch()),

(2026, 9, 'PIT', unixepoch()),
(2026, 9, 'TEN', unixepoch()),

(2026, 10, 'CHI', unixepoch()),
(2026, 10, 'DEN', unixepoch()),
(2026, 10, 'PHI', unixepoch()),
(2026, 10, 'TB',  unixepoch()),

(2026, 11, 'ATL', unixepoch()),
(2026, 11, 'CLE', unixepoch()),
(2026, 11, 'GB',  unixepoch()),
(2026, 11, 'LAR', unixepoch()),
(2026, 11, 'NE',  unixepoch()),
(2026, 11, 'SEA', unixepoch()),

(2026, 13, 'BAL', unixepoch()),
(2026, 13, 'IND', unixepoch()),
(2026, 13, 'LV',  unixepoch()),
(2026, 13, 'NYJ', unixepoch()),

(2026, 14, 'ARI', unixepoch()),
(2026, 14, 'DAL', unixepoch());