-- add manual lock overrides
ALTER TABLE events ADD COLUMN manual_lock INTEGER NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN manual_unlock INTEGER NOT NULL DEFAULT 0;
