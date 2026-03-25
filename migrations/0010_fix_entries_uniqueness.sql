-- 1) Keep only the most recently updated row per (event_id, user_id)
DELETE FROM entries
WHERE id NOT IN (
  SELECT e.id
  FROM entries e
  JOIN (
    SELECT event_id, user_id, MAX(updated_at) AS max_updated
    FROM entries
    GROUP BY event_id, user_id
  ) latest
  ON latest.event_id = e.event_id
  AND latest.user_id = e.user_id
  AND latest.max_updated = e.updated_at
);

-- 2) Add a unique index (works even if table was created earlier)
CREATE UNIQUE INDEX IF NOT EXISTS idx_entries_event_user_unique
ON entries(event_id, user_id);
