-- ============================================================
-- 0030_weekly_recaps.sql
--
-- Stores Irving Weekly AI recap drafts and published snapshots.
--
-- Draft and published content are stored separately so an admin
-- can regenerate/edit a draft without changing the live article.
-- ============================================================

CREATE TABLE IF NOT EXISTS weekly_recaps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  season INTEGER NOT NULL,

  week INTEGER NOT NULL
    CHECK (
      week >= 1
      AND week <= 18
    ),

  league_id TEXT NOT NULL,

  -- ----------------------------------------------------------
  -- CURRENT DRAFT
  -- ----------------------------------------------------------

  draft_title TEXT,
  draft_subtitle TEXT,

  draft_recap_json TEXT,
  draft_packet_json TEXT,
  draft_ai_meta_json TEXT,

  draft_generated_at INTEGER,
  draft_generated_by TEXT,

  -- ----------------------------------------------------------
  -- PUBLISHED SNAPSHOT
  -- ----------------------------------------------------------

  published_title TEXT,
  published_subtitle TEXT,

  published_recap_json TEXT,
  published_packet_json TEXT,
  published_ai_meta_json TEXT,

  published_at INTEGER,
  published_by TEXT,

  -- ----------------------------------------------------------

  created_at INTEGER NOT NULL
    DEFAULT (unixepoch()),

  updated_at INTEGER NOT NULL
    DEFAULT (unixepoch()),

  UNIQUE (
    season,
    week
  )
);


CREATE INDEX IF NOT EXISTS
idx_weekly_recaps_published
ON weekly_recaps (
  published_at DESC
)
WHERE published_recap_json IS NOT NULL;


CREATE INDEX IF NOT EXISTS
idx_weekly_recaps_season_week
ON weekly_recaps (
  season DESC,
  week DESC
);