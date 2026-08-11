-- ============================================================
-- 0029_draft_capital_ledger.sql
--
-- Permanent Irving draft-capital ledger.
--
-- Money is stored in integer cents:
--   $20.00  =  2000
--  -$20.00  = -2000
--
-- The ledger is append-only. Corrections are handled by
-- voiding entries rather than deleting financial history.
-- ============================================================


CREATE TABLE IF NOT EXISTS draft_capital_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- The auction/draft year this capital belongs to.
  futures_year INTEGER NOT NULL,

  -- Irving/Sleeper manager ID.
  manager_id TEXT NOT NULL,

  -- Signed integer cents.
  -- Positive = capital received.
  -- Negative = capital spent/sent.
  amount_cents INTEGER NOT NULL,

  -- opening_balance
  -- annual_funding
  -- auction_spend
  -- trade
  -- keeper_signing
  -- keeper_tax
  -- cap_penalty
  -- manual_adjustment
  entry_type TEXT NOT NULL,

  -- Optional human date: YYYY-MM-DD.
  transaction_date TEXT,

  -- NFL fantasy season/week where the event occurred.
  league_season INTEGER,
  league_week INTEGER,

  -- Sleeper trade link, when applicable.
  sleeper_transaction_id TEXT,

  -- Shared by both sides of a transfer.
  transfer_id TEXT,

  -- Other Irving manager in a transfer.
  counterparty_manager_id TEXT,

  note TEXT,

  metadata_json TEXT,

  -- import
  -- manual
  -- sleeper_trade
  source TEXT NOT NULL DEFAULT 'manual',

  created_by TEXT,

  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),

  -- Financial history is never physically deleted.
  voided_at INTEGER,
  voided_by TEXT,

  -- Optional idempotency protection.
  dedupe_key TEXT
);


CREATE INDEX IF NOT EXISTS idx_draft_capital_year_manager
ON draft_capital_entries (
  futures_year,
  manager_id
);


CREATE INDEX IF NOT EXISTS idx_draft_capital_transfer
ON draft_capital_entries (
  transfer_id
);


CREATE INDEX IF NOT EXISTS idx_draft_capital_sleeper_txn
ON draft_capital_entries (
  sleeper_transaction_id
);


CREATE INDEX IF NOT EXISTS idx_draft_capital_created
ON draft_capital_entries (
  created_at DESC
);


CREATE UNIQUE INDEX IF NOT EXISTS idx_draft_capital_dedupe
ON draft_capital_entries (
  dedupe_key
)
WHERE
  dedupe_key IS NOT NULL
  AND voided_at IS NULL;


-- ============================================================
-- Sleeper trade review state
--
-- Needed because a trade can contain:
--
--   capital attached
--   OR
--   no capital at all
--
-- We need to remember that an admin reviewed either case.
-- ============================================================

CREATE TABLE IF NOT EXISTS draft_capital_trade_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  season INTEGER NOT NULL,
  week INTEGER,

  sleeper_transaction_id TEXT NOT NULL,

  -- pending / no_capital / posted
  review_status TEXT NOT NULL DEFAULT 'pending',

  transfer_id TEXT,

  note TEXT,

  reviewed_by TEXT,
  reviewed_at INTEGER,

  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),

  UNIQUE (
    season,
    sleeper_transaction_id
  )
);


CREATE INDEX IF NOT EXISTS idx_draft_trade_reviews_status
ON draft_capital_trade_reviews (
  season,
  review_status
);