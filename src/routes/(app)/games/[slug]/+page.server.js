// src/routes/(app)/games/[slug]/+page.server.js
import { error } from '@sveltejs/kit';
import { getEntryForUser } from '$lib/server/db/entries.js';
import { saveEntryForEvent } from '$lib/games/server.js';
import { getResultsForEvent } from '$lib/server/db/results.js';

async function getUserTotalPoints(db, userId) {
  const row = await db
    .prepare(`SELECT COALESCE(SUM(score_total), 0) AS points FROM entry_scores WHERE user_id = ?`)
    .bind(String(userId))
    .first();

  return Number(row?.points ?? 0);
}

function isEventLocked(event, nowSec) {
  const manualLock = Number(event?.manual_lock ?? 0) === 1;
  const manualUnlock = Number(event?.manual_unlock ?? 0) === 1;

  if (manualLock) return true;
  if (manualUnlock) return false;

  const lockAt = Number(event?.lock_at ?? 0);
  if (!lockAt) return false;

  return nowSec >= lockAt;
}

export async function load({ params, platform, locals }) {
  const db = platform?.env?.DB;
  if (!db) throw error(500, 'Database not available');
  if (!locals.user) throw error(401, 'Not authenticated');

  const userId = locals.user.id;
  const bankroll = await getUserTotalPoints(db, userId);

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

  const now = Math.floor(Date.now() / 1000);
  const locked = isEventLocked(event, now);

  const entry = await getEntryForUser({ db, eventId: event.id, userId });
  const results = await getResultsForEvent(db, event.id);

  return { event, locked, entry, results, bankroll };
}

export const actions = {
  save: saveEntryForEvent
};
