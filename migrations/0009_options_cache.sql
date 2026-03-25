CREATE TABLE IF NOT EXISTS options_cache (
  event_id TEXT NOT NULL,
  provider TEXT NOT NULL,              -- 'nascar'
  cache_key TEXT NOT NULL,             -- e.g. 'drivers:cup:2026'
  payload_json TEXT NOT NULL,          -- normalized list [{id,name,...}]
  fetched_at INTEGER NOT NULL,         -- unix seconds
  PRIMARY KEY (event_id, provider, cache_key)
);

CREATE INDEX IF NOT EXISTS idx_options_cache_event ON options_cache(event_id);
