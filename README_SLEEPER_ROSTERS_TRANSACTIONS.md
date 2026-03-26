# Irving League Sleeper Rosters + Transactions Pack

This pack replaces placeholder League surfaces with D1-backed roster and transaction pages,
adds a real Sleeper sync service, and creates a top-level `/rivalry` alias route so that
the 404 goes away.

## What this pack adds

- `src/lib/server/league/sleeper.js`
  - real Sleeper fetch helpers
  - D1 upsert logic for users, rosters, and transactions
- `src/lib/server/league/queries.js`
  - D1-backed roster and transaction queries for page loaders
- `src/routes/(app)/league/rosters/+page.server.js`
- `src/routes/(app)/league/rosters/+page.svelte`
- `src/routes/(app)/league/transactions/+page.server.js`
- `src/routes/(app)/league/transactions/+page.svelte`
- `src/routes/(app)/rivalry/+page.server.js`
- `src/routes/(app)/rivalry/+page.svelte`
- `src/routes/api/admin/league/sync-sleeper/+server.js`
  - upgraded route that can sync current rosters + transactions into D1
- `migrations/0021_sleeper_sync_runs.sql`
  - adds a simple sync run log table

## Env

Add this to your local env and Cloudflare env:

```bash
SLEEPER_LEAGUE_ID=YOUR_LEAGUE_ID
```

Optional:
```bash
SLEEPER_DEFAULT_SEASON=2026
SLEEPER_DEFAULT_WEEK=1
```

## Apply

1. Unzip this at the root of your merged repo.
2. Allow the files to overwrite matching files.
3. Run:

```bash
npm run db:migrate:local
npm run pages:dev
```

## First sync

While the app is running through Wrangler, you can trigger:

```bash
curl -X POST http://127.0.0.1:8788/api/admin/league/sync-sleeper
```

Or post JSON to control the sync target:

```json
{
  "season": 2026,
  "week": 4,
  "weeksBack": 6
}
```

## Notes

- The roster page is defensive. If the Sleeper tables are empty, it shows a guided empty state.
- The transactions page is also defensive and can render partial transaction records.
- `/rivalry` now exists as a top-level route alias and forwards to the League data layer.
- This pack focuses on current-state operational League pages, not full historical season reconstruction.
