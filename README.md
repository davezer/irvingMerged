# Irving Lounge Merged Build

This zip is a merged foundation build that uses **Irving Collective** as the base repo and pulls key Irving League domains into the authenticated lounge shell.

## What is included

- Existing Irving Collective games, schedule, leaderboard, login, and admin structure
- New League HQ routes
- Standings route backed by Irving League export data
- Managers index and manager dossier pages
- Draft archive summary route
- News desk routes
- History wing route map
- Placeholder routes for rosters, matchups, constitution, resources, and league admin
- New D1 migration stub for managers / standings / posts
- League manager and award image assets copied into `static/`

## Important note

This is a **serious starting point**, not a claim that every legacy dependency from both apps has already been fully migrated to Cloudflare/D1. The route map, product shell, data direction, and premium visual system are now in place so the project can move fast from here.

## Run locally

```bash
npm install
npm run dev
```

## Next steps

1. Wire the new league domains to D1 tables instead of seed modules
2. Migrate Sleeper / Contentful / Supabase-dependent flows into importers and D1
3. Flesh out rosters, matchups, badges, awards, and rivalry pages
4. Add push notification plumbing
5. Fold the remaining Irving League assets from the 7z archives into the theme

---

# Irving Collective — Offseason Lounge 🥃

A premium, lounge-themed fantasy + gambling-adjacent mini-league hub where GMs pick, sweat, and talk reckless (respectfully).
Built on **SvelteKit + Cloudflare Workers + D1**, with an admin suite for locks, publishing official results, and recomputing scoring.

> Velvet-rope access. Picks. Points. Prestige.

---

## ✨ Features

### Player-facing
- **Events hub**: upcoming + active games, lock times, and status pills
- **Game pages per event type** (Daytona, Madness, Masters, Derby, World Cup, etc.)
- **Entry saving + validation** (client UX + server actions)
- **Rules modal per game** (consistent “Rules” UX across all games)
- **Leaderboard** with scoring breakdown support (where implemented)

### Admin suite
- **Admin → Events** management UI
- **Lock overrides** per event:
  - Auto / Manual Lock / Manual Unlock
- **Publish results + recompute scores**
- **Unpublish results** (clears computed scores for that event, entries remain)
- **Seed sync** where relevant (game-specific)
- **Event-type handlers** via a shared admin results controller pattern

---

## 🧱 Tech Stack

- **SvelteKit** (App router + server actions)
- **Cloudflare Workers** (deployment/runtime)
- **Cloudflare D1** (SQLite-backed DB)
- **Wrangler** (local dev + migrations)
- A very intentional **dark lounge UI** (gold accents, glass blur, soft shadows)

---

Getting Started
1) Install
npm install
2) Local dev (Workers + D1)
npm run dev


🧠 Roadmap Ideas (aka “Next Drinks”)
Admin “Delete/Deactivate user” (soft-delete) + orphan cleanup safeguards

Global reusable “Confirm Danger” modal for destructive actions

Enhanced leaderboard: click player → expand per-event score breakdown

Per-game rules editing in admin (stored in DB)

Audit log for admin actions (publish/unpublish/locks)