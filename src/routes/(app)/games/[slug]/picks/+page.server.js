import { error } from '@sveltejs/kit';
import { getResultsForEvent } from '$lib/server/db/results.js';
import { loadEntriesWithScores } from '$lib/games/adminResults.server.js';

function isEventLocked(event, nowSec) {
  const manualLock = Number(event?.manual_lock ?? 0) === 1;
  const manualUnlock = Number(event?.manual_unlock ?? 0) === 1;

  if (manualLock) return true;
  if (manualUnlock) return false;

  const lockAt = Number(event?.lock_at ?? 0);
  if (!lockAt) return false;

  return nowSec >= lockAt;
}

function normalizeTeamFromSnapshot(s) {
  const id = String(s?.id ?? '');
  return {
    id,
    name: s?.name || id,
    abbr: s?.abbrev ?? s?.abbr ?? '',
    logoUrl: s?.logo ?? s?.logoUrl ?? '',
    seed: s?.seed ?? null,
    region: s?.region ?? null
  };
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    const aScore = Number(a?.score?.score_total ?? 0);
    const bScore = Number(b?.score?.score_total ?? 0);

    if (bScore !== aScore) return bScore - aScore;

    return String(a?.display_name || '').localeCompare(String(b?.display_name || ''));
  });
}

export async function load({ params, platform, locals }) {
  const db = platform?.env?.DB;
  if (!db) throw error(500, 'Database not available');
  if (!locals.user) throw error(401, 'Not authenticated');

  const slug = params.slug;

  const event = await db
    .prepare(
      `SELECT id, slug, name, type, start_at, lock_at,
              COALESCE(manual_lock, 0) AS manual_lock,
              COALESCE(manual_unlock, 0) AS manual_unlock
       FROM events
       WHERE slug = ?
       LIMIT 1`
    )
    .bind(slug)
    .first();

  if (!event) throw error(404, 'Event not found');

  if (event.type !== 'madness') {
    throw error(404, 'Picks board is only wired for March Madness right now.');
  }

  const now = Math.floor(Date.now() / 1000);
  const locked = isEventLocked(event, now);

  const results = await getResultsForEvent(db, event.id);
  const rawEntries = await loadEntriesWithScores({ db, eventId: event.id });

  const entries = sortEntries(
    rawEntries.map((entry) => {
      const snaps = Array.isArray(entry?.payload?.teamSnapshots)
        ? entry.payload.teamSnapshots
        : [];

      const selectedTeams = snaps
        .map(normalizeTeamFromSnapshot)
        .filter((t) => t.id)
        .slice(0, 4);

      return {
        ...entry,
        selectedTeams
      };
    })
  );

  return {
    event,
    locked,
    results,
    entries
  };
}