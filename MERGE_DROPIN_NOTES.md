# Irving Collective + Irving League Drop-In Build

This build uses `irvingMerged-main` as the base and turns it into the unified clubhouse app.

## What changed

- Rebuilt the authenticated app shell into a cleaner Irving Collective / League Lounge navigation system.
- Rebuilt `/` into a combined clubhouse dashboard with:
  - League HQ entry
  - Offseason games entry
  - live/optional D1 bankroll and leaderboard snapshot
  - upcoming event preview
  - current fantasy standings preview
  - manager dossier strip
  - news/history/resources links
- Restored newer Irving Collective game logic that was missing from the merged branch:
  - World Cup eliminated-team blocking and round advancement protections
  - newer World Cup admin results flow
  - Masters picks board support
  - Kentucky Derby odds/manual horse list UI
- Copied over the richer Irving League static asset set from the original league site.
- Moved accidental page routes out of `/api/admin/league/...` into real admin page routes:
  - `/admin/league/rivalry`
  - `/admin/league/managers/[slug]`
- Reworked global styling into a more modern “private clubhouse / command center” visual system.

## Build check

`npm run build` completes successfully.

Remaining warnings are non-blocking Svelte warnings from pre-existing components, mostly unused CSS and accessibility label warnings in admin/game UI files.

## Recommended next deployment steps

1. Replace your current merged project with this folder.
2. Run `npm install`.
3. Run `npm run build`.
4. Deploy to Cloudflare Pages/Vercel according to your current setup.
5. Confirm the D1 binding is still named `DB` in Cloudflare.
6. Confirm the app environment still includes any Sleeper override variables you use, especially `SLEEPER_LEAGUE_ID` if you override the fallback league ID.

## Suggested next feature pass

The biggest remaining high-value migration is bringing the original Irving League personality system fully into D1/admin:

- badges
- stains
- personas
- nomination flow
- years of service
- draft money / future budget panel
- richer rivalry notes

The front-end has space for those pieces now; the next phase is wiring them into durable admin-controlled data.
