-- migrations/0008_update_event_times_2026.sql
-- NOTE: Times are Unix epoch seconds (UTC).

UPDATE events
SET
  start_at = 1771178400,
  lock_at  = 1771178400
WHERE slug = 'daytona-500';

UPDATE events
SET
  start_at = 1773763200,
  lock_at  = 1773763200
WHERE slug = 'march-madness';

UPDATE events
SET
  start_at = 1775743200,
  lock_at  = 1775743200
WHERE slug = 'the-masters';

UPDATE events
SET
  start_at = 1777759200,
  lock_at  = 1777759200
WHERE slug = 'kentucky-derby';

UPDATE events
SET
  start_at = 1781208000,
  lock_at  = 1781208000
WHERE slug = 'world-cup';
