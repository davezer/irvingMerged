-- migrations/0016_results_published_at.sql
-- Adds a unified "published" flag on events so admin UI + unpublish can key off it.

ALTER TABLE events ADD COLUMN results_published_at INTEGER;
CREATE INDEX IF NOT EXISTS idx_events_results_published_at ON events(results_published_at);
