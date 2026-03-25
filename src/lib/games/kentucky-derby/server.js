// src/lib/games/kentucky-derby/server.js
import { fail } from '@sveltejs/kit';
import { upsertEntryForUser } from '$lib/server/db/entries.js';
import { getUserTotalPoints } from '$lib/server/db/points.server.js';

function safeInt(v) {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return null;
  return n;
}

export function needsOptions() {
  return true;
}

export async function saveEntry({ db, event, userId, form, now }) {
  const horseIdRaw = String(form.get('horseId') || '').trim();
  if (!horseIdRaw) return fail(400, { message: 'Pick a horse.' });

  const wager = safeInt(form.get('wager'));
  if (wager == null || wager < 0) {
    return fail(400, { message: 'Enter a valid wager (whole number, 0 or more).' });
  }

  const bankroll = await getUserTotalPoints(db, userId);
  if (wager > bankroll) {
    return fail(400, { message: `Wager exceeds bankroll (${bankroll}).` });
  }

  let horseSnapshot = null;
  const snapRaw = form.get('horseSnapshot');
  if (typeof snapRaw === 'string' && snapRaw.trim()) {
    try {
      const s = JSON.parse(snapRaw);
      horseSnapshot = {
        id: s?.id != null ? String(s.id) : horseIdRaw,
        name: s?.name ? String(s.name) : null
      };
    } catch {
      horseSnapshot = { id: horseIdRaw, name: null };
    }
  } else {
    horseSnapshot = { id: horseIdRaw, name: null };
  }

  const payload = { horseId: horseIdRaw, horseSnapshot, wager };

  await upsertEntryForUser({
    db,
    eventId: event.id,
    userId,
    payload,
    now
  });

  return { success: true };
}
