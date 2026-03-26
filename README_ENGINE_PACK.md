# Irving League Engine Pack

This pack is the first real backend-focused drop-in for the full Irving League migration.

## What it adds
- Sleeper ingestion service
- normalization helpers for managers, standings, rosters, draft picks, matchups, transactions
- badge engine with first-pass computed awards
- draft-money / auction-budget ledger calculator
- admin API routes to sync data and rebuild derived domains
- `0019_league_engine.sql` migration
- fixed admin league page that uses `+page.server.js`

## Drop-in steps
1. Unzip this at the root of your merged repo.
2. Let matching files overwrite.
3. Add these vars to your local/prod env:
   - `SLEEPER_LEAGUE_ID`
   - `SLEEPER_SEASON` (optional)
   - `SLEEPER_SPORT` (optional, defaults to `nfl`)
4. Run migrations:
   ```bash
   npm run db:migrate:local
   ```
5. Start Cloudflare local dev:
   ```bash
   npm run pages:dev
   ```

## Admin endpoints
- `POST /api/admin/league/sync-sleeper`
- `POST /api/admin/league/rebuild-badges`
- `POST /api/admin/league/recalc-draft-economy`

## Important note
This pack gives you the engine scaffolding and real data domains, but it does **not** magically reproduce every custom Irving League rule from the old codebase yet. It is the right foundation for finishing that migration inside Cloudflare/D1.
