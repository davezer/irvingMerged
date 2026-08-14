-- ============================================================
-- 0031_irving_weekly_posts.sql
--
-- Expands the existing generic posts table into the
-- publishing spine for The Irving Weekly.
-- ============================================================

ALTER TABLE posts
ADD COLUMN subtitle TEXT;

ALTER TABLE posts
ADD COLUMN post_type TEXT NOT NULL
DEFAULT 'feature';

ALTER TABLE posts
ADD COLUMN status TEXT NOT NULL
DEFAULT 'draft';

ALTER TABLE posts
ADD COLUMN author_name TEXT;

ALTER TABLE posts
ADD COLUMN author_user_id TEXT;

ALTER TABLE posts
ADD COLUMN source_type TEXT NOT NULL
DEFAULT 'manual';

ALTER TABLE posts
ADD COLUMN recap_season INTEGER;

ALTER TABLE posts
ADD COLUMN recap_week INTEGER;

ALTER TABLE posts
ADD COLUMN featured INTEGER NOT NULL
DEFAULT 0;

ALTER TABLE posts
ADD COLUMN updated_at INTEGER;


-- Existing posts that already had a publish date
-- should remain published.
UPDATE posts
SET
  status = CASE
    WHEN published_at IS NOT NULL
      AND TRIM(published_at) <> ''
      THEN 'published'
    ELSE 'draft'
  END,

  updated_at = COALESCE(
    created_at,
    unixepoch()
  );


-- Exactly one Irving Weekly post may point at a
-- particular AI weekly recap.
CREATE UNIQUE INDEX IF NOT EXISTS
idx_posts_weekly_recap_source
ON posts (
  recap_season,
  recap_week
)
WHERE source_type = 'weekly_recap';


CREATE INDEX IF NOT EXISTS
idx_posts_irving_weekly_status
ON posts (
  status,
  published_at DESC
);


CREATE INDEX IF NOT EXISTS
idx_posts_irving_weekly_updated
ON posts (
  updated_at DESC
);