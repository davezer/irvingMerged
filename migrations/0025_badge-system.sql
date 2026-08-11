-- ============================================================
-- 0025_badge_system.sql
--
-- Expands the existing Irving badge engine into the canonical
-- badge/award system used by:
--
--   History Wing
--   Manager dossiers
--   Admin badge control
--   Automatic weekly award generation
--
-- Existing tables:
--   badge_definitions
--   manager_badges
--
-- created originally in 0019_league_engine.sql
-- ============================================================


-- ============================================================
-- BADGE DEFINITIONS
-- ============================================================

ALTER TABLE badge_definitions
ADD COLUMN category TEXT NOT NULL DEFAULT 'other';

ALTER TABLE badge_definitions
ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE badge_definitions
ADD COLUMN scope TEXT NOT NULL DEFAULT 'season';

-- manual
-- automatic
-- derived
ALTER TABLE badge_definitions
ADD COLUMN award_mode TEXT NOT NULL DEFAULT 'manual';

ALTER TABLE badge_definitions
ADD COLUMN automation_key TEXT;

-- Can a manager earn this badge more than once?
ALTER TABLE badge_definitions
ADD COLUMN repeatable INTEGER NOT NULL DEFAULT 1;

ALTER TABLE badge_definitions
ADD COLUMN active INTEGER NOT NULL DEFAULT 1;

ALTER TABLE badge_definitions
ADD COLUMN updated_at INTEGER;


-- ============================================================
-- MANAGER BADGE AWARDS
-- ============================================================

-- Week is NULL for career / legacy awards.
ALTER TABLE manager_badges
ADD COLUMN week INTEGER;

-- Matchup context.
ALTER TABLE manager_badges
ADD COLUMN opponent_manager_id TEXT;

ALTER TABLE manager_badges
ADD COLUMN opponent_score REAL;

-- Stain nomination context.
ALTER TABLE manager_badges
ADD COLUMN nominated_by_manager_id TEXT;

-- manual
-- automatic
-- import
-- derived
ALTER TABLE manager_badges
ADD COLUMN source TEXT NOT NULL DEFAULT 'manual';

-- Used to prevent an automated award from being inserted twice.
ALTER TABLE manager_badges
ADD COLUMN dedupe_key TEXT;

-- We soft-revoke awards instead of deleting league history.
ALTER TABLE manager_badges
ADD COLUMN revoked_at INTEGER;

-- Admin/user ID responsible for committing the award.
ALTER TABLE manager_badges
ADD COLUMN awarded_by TEXT;

ALTER TABLE manager_badges
ADD COLUMN updated_at INTEGER;


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS
idx_badge_definitions_active_category
ON badge_definitions (
  active,
  category,
  sort_order
);

CREATE INDEX IF NOT EXISTS
idx_manager_badges_badge_season_week
ON manager_badges (
  badge_key,
  season,
  week
);

CREATE INDEX IF NOT EXISTS
idx_manager_badges_manager_badge
ON manager_badges (
  manager_id,
  badge_key
);

CREATE INDEX IF NOT EXISTS
idx_manager_badges_active
ON manager_badges (
  manager_id,
  season
)
WHERE revoked_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS
idx_manager_badges_dedupe
ON manager_badges (
  dedupe_key
)
WHERE dedupe_key IS NOT NULL;


-- ============================================================
-- RETIRE THE PLACEHOLDER BADGES FROM 0019
--
-- Do NOT delete them. Old records remain valid.
-- They simply stop appearing in the current Badge Cabinet.
-- ============================================================

UPDATE badge_definitions
SET
  active = 0,
  updated_at = unixepoch()
WHERE key IN (
  'war_chest',
  'value_hunter',
  'top_dog',
  'heavyweight'
);


-- ============================================================
-- PERSONAS
-- ============================================================

INSERT OR IGNORE INTO badge_definitions (
  key,
  title,
  icon,
  tone,
  description,
  category,
  sort_order,
  scope,
  award_mode,
  automation_key,
  repeatable,
  active,
  updated_at
)
VALUES
(
  'persona-the-flacco',
  'The Flacco',
  '/badges/The Flacco.png',
  'persona',
  'Steady and unflashy until it''s time to sling it deep and steal a week.',
  'personas',
  10,
  'career',
  'derived',
  NULL,
  0,
  1,
  unixepoch()
),
(
  'persona-the-kornacki',
  'The Kornacki',
  '/badges/The Kornacki.png',
  'persona',
  'Data first tactician. Charts, trends, and probability trees all the way.',
  'personas',
  20,
  'career',
  'derived',
  NULL,
  0,
  1,
  unixepoch()
),
(
  'persona-the-littlefinger',
  'The Littlefinger',
  '/badges/The Littlefinger.png',
  'persona',
  'The Schemer. Edges found in backchannels and fine print.',
  'personas',
  30,
  'career',
  'derived',
  NULL,
  0,
  1,
  unixepoch()
),
(
  'persona-the-wolf',
  'The Wolf',
  '/badges/The Wolf.png',
  'persona',
  'Max Chaos. Always pouncing on the possibilities.',
  'personas',
  40,
  'career',
  'derived',
  NULL,
  0,
  1,
  unixepoch()
);


-- ============================================================
-- WEEKLY HONORS
-- ============================================================

INSERT OR IGNORE INTO badge_definitions (
  key,
  title,
  icon,
  tone,
  description,
  category,
  sort_order,
  scope,
  award_mode,
  automation_key,
  repeatable,
  active,
  updated_at
)
VALUES
(
  'bde',
  'BDE',
  '/badges/bde.png',
  'weekly',
  'Awarded to the highest scoring team of the week.',
  'weekly',
  10,
  'season',
  'automatic',
  'highest_score',
  1,
  1,
  unixepoch()
),
(
  'hbk',
  'The HBK',
  '/badges/heartbreaker.png',
  'weekly',
  'You lost by 1.0 or less.',
  'weekly',
  20,
  'season',
  'automatic',
  'close_loss',
  1,
  1,
  unixepoch()
),
(
  'ides',
  'The Ides',
  '/badges/ides.png',
  'weekly',
  'Awarded for being the highest scoring loser of the week. You loser.',
  'weekly',
  30,
  'season',
  'automatic',
  'highest_scoring_loser',
  1,
  1,
  unixepoch()
);


-- ============================================================
-- LUCK
-- ============================================================

INSERT OR IGNORE INTO badge_definitions (
  key,
  title,
  icon,
  tone,
  description,
  category,
  sort_order,
  scope,
  award_mode,
  automation_key,
  repeatable,
  active,
  updated_at
)
VALUES
(
  'doyle',
  'The Doyle',
  '/badges/doyle.png',
  'luck',
  'Luckiest Week (includes Parlays)',
  'luck',
  10,
  'season',
  'automatic',
  'luckiest_week',
  1,
  1,
  unixepoch()
),
(
  'lowblow',
  'The Low Blow',
  '/badges/lowblow.png',
  'luck',
  'Unluckiest Week (includes Parlays)',
  'luck',
  20,
  'season',
  'automatic',
  'unluckiest_week',
  1,
  1,
  unixepoch()
);


-- ============================================================
-- STAINS
-- ============================================================

INSERT OR IGNORE INTO badge_definitions (
  key,
  title,
  icon,
  tone,
  description,
  category,
  sort_order,
  scope,
  award_mode,
  automation_key,
  repeatable,
  active,
  updated_at
)
VALUES
(
  'badbeat',
  'The Bad Beat',
  '/badges/stains.png',
  'stain',
  'GM explains why his Opponent''s victory is stain-worthy.',
  'stains',
  10,
  'season',
  'manual',
  NULL,
  1,
  1,
  unixepoch()
),
(
  'byebye',
  'The Bye Bye Bye',
  '/badges/stains.png',
  'stain',
  'You left a bye week player in your starting lineup.',
  'stains',
  20,
  'season',
  'automatic',
  'starter_on_bye',
  1,
  1,
  unixepoch()
),
(
  'captain',
  'The Cap''n Hindsight',
  '/badges/stains.png',
  'stain',
  'You left the game winning player on your bench.',
  'stains',
  30,
  'season',
  'automatic',
  'game_winner_on_bench',
  1,
  1,
  unixepoch()
),
(
  'suck',
  'The Sucko',
  '/badges/suck.png',
  'stain',
  'Awarded to the lowest scoring team of the week.',
  'stains',
  40,
  'season',
  'automatic',
  'lowest_score',
  1,
  1,
  unixepoch()
),
(
  'traderape',
  'The Trade Rape',
  '/badges/stains.png',
  'stain',
  'You transacted a TERRIBLE trade.',
  'stains',
  50,
  'season',
  'manual',
  NULL,
  1,
  1,
  unixepoch()
),
(
  'zerohour',
  'The Zero Hour',
  '/badges/stains.png',
  'stain',
  'You started a player who scored Zero Points.',
  'stains',
  60,
  'season',
  'automatic',
  'starter_zero',
  1,
  1,
  unixepoch()
);


-- ============================================================
-- YEARS OF SERVICE
-- ============================================================

INSERT OR IGNORE INTO badge_definitions (
  key,
  title,
  icon,
  tone,
  description,
  category,
  sort_order,
  scope,
  award_mode,
  automation_key,
  repeatable,
  active,
  updated_at
)
VALUES
(
  'years-10',
  '10 Years of Service',
  '/badges/Ten.png',
  'service',
  'Awarded to managers with at least 10 years of league service.',
  'yearly',
  10,
  'career',
  'derived',
  'years_service_10',
  0,
  1,
  unixepoch()
),
(
  'years-20',
  '20 Years of Service',
  '/badges/Twenty.png',
  'service',
  'Awarded to managers with at least 20 years of league service.',
  'yearly',
  20,
  'career',
  'derived',
  'years_service_20',
  0,
  1,
  unixepoch()
);


-- ============================================================
-- LEGACY CHAMPIONS
-- ============================================================

INSERT OR IGNORE INTO badge_definitions (
  key,
  title,
  icon,
  tone,
  description,
  category,
  sort_order,
  scope,
  award_mode,
  automation_key,
  repeatable,
  active,
  updated_at
)
VALUES
(
  'championship-dtsp-legacy',
  'DTSP Champion (Legacy)',
  '/badges/DTSP.png',
  'legacy',
  'Champion of DTSP — legacy honors recognized in Irving Champions League. Awarded prior to 2025.',
  'legacy',
  10,
  'legacy',
  'manual',
  NULL,
  1,
  1,
  unixepoch()
),
(
  'championship-irving-legacy',
  'Irving Champion (Legacy)',
  '/badges/Irving.png',
  'legacy',
  'Winner of the historic Irving League — merged into Irving Champions League. Awarded prior to 2025.',
  'legacy',
  20,
  'legacy',
  'manual',
  NULL,
  1,
  1,
  unixepoch()
);