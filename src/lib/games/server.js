// src/lib/games/server.js
import { error, fail } from '@sveltejs/kit';
import { saveEntry as saveDaytonaEntry } from '$lib/games/daytona/server.js';
import { saveEntry as saveMadnessEntry } from '$lib/games/madness/server.js';
import { saveEntry as saveMastersEntry } from '$lib/games/masters/server.js';
import { saveEntry as saveDerbyEntry } from '$lib/games/kentucky-derby/server.js';
import { saveEntry as saveWorldCupEntry } from '$lib/games/worldcup/server.js';

const SAVE_BY_TYPE = {
  daytona: saveDaytonaEntry,
  madness: saveMadnessEntry,
  masters: saveMastersEntry,
  derby: saveDerbyEntry,
  worldcup: saveWorldCupEntry
};

function isEventLocked(event, nowSec) {
  const manualLock = Number(event?.manual_lock ?? 0) === 1;
  const manualUnlock = Number(event?.manual_unlock ?? 0) === 1;

  if (manualLock) return true;
  if (manualUnlock) return false;

  const lockAt = Number(event?.lock_at ?? 0);
  if (!lockAt) return false;

  return nowSec >= lockAt;
}

export async function saveEntryForEvent({ request, params, platform, locals }) {
  const db = platform?.env?.DB;
  if (!db) throw error(500, 'Database not available');
  if (!locals.user) throw error(401, 'Not authenticated');

  const slug = params.slug;

  const event = await db
    .prepare(
      `SELECT id, lock_at, type,
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
  if (locked) return fail(403, { message: 'Event is locked. Entries can’t be edited.' });

  const handler = SAVE_BY_TYPE[event.type];
  if (!handler) return fail(400, { message: 'Unsupported event type for entry submission.' });

  const form = await request.formData();

  // ✅ canonical user id
  const userId = locals.user.id;

  return handler({
    db,
    event,
    userId,
    form,
    now,
    locked
  });
}
