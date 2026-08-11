-- Allow a revoked award to be re-awarded later while still
-- preventing duplicate active awards.

DROP INDEX IF EXISTS idx_manager_badges_dedupe;

CREATE UNIQUE INDEX IF NOT EXISTS idx_manager_badges_dedupe
ON manager_badges (dedupe_key)
WHERE dedupe_key IS NOT NULL
  AND revoked_at IS NULL;