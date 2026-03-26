# Irving League UI Pass Pack

This drop-in pack adds visible Phase 3 league surfaces so the Sleeper/badges/draft-economy engine is no longer hidden behind admin endpoints.

## Included
- League rosters page
- League transactions page
- League rivalry page
- Upgraded manager dossier page sections for badges and draft economy
- Shared league UI components
- Server helpers that safely read from D1 and gracefully fall back to seed/demo content
- D1 migration stub for UI-facing league summary tables/views

## Apply
1. Unzip at the root of your merged repo.
2. Let files overwrite if prompted.
3. Run local migrations:
   npm run db:migrate:local
4. Start the app:
   npm run pages:dev

## Notes
- These files are intentionally defensive: if some D1 tables are not populated yet, the pages still render with empty states instead of exploding.
- The helpers expect the engine pack tables to exist, but they do not hard-fail if they are missing.
- This is a UI surfacing pack, not a final parity guarantee for every Irving League rule.

## Suggested next move
After applying this pack, wire your existing Sleeper sync and badge rebuild endpoints into buttons/actions in the league admin control room.
