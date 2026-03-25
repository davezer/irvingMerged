-- migrations/0005_seed_events.sql
-- NOTE: lock_at/start_at are UTC unix seconds.
-- Replace with real values later; these are safe placeholders so the UI works now.

INSERT OR IGNORE INTO events (id, slug, name, type, start_at, lock_at)
VALUES
  ('e_daytona', 'daytona-500', 'Daytona 500', 'daytona', NULL, 1760000000),
  ('e_masters', 'the-masters', 'The Masters', 'masters', NULL, 1760000000),
  ('e_derby', 'kentucky-derby', 'Kentucky Derby', 'derby', NULL, 1760000000),
  ('e_madness', 'march-madness', 'March Madness', 'madness', NULL, 1760000000),
  ('e_worldcup', 'world-cup', 'World Cup', 'worldcup', NULL, 1760000000);
