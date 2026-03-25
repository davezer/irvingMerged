// src/lib/games/madness/server.js
import { fail } from '@sveltejs/kit';
import { upsertEntryForUser } from '$lib/server/db/entries.js';

export function needsOptions() {
  return true;
}

export async function saveEntry({ db, event, userId, form, now, locked }) {
  if (locked) return fail(403, { message: 'Event is locked. Entries can’t be edited.' });

  let teamIds = [];
  try {
    teamIds = JSON.parse(String(form.get('teamIds') || '[]')).map(String);
  } catch {
    return fail(400, { message: 'Invalid teamIds payload.' });
  }

  teamIds = teamIds.filter(Boolean).slice(0, 4);
  const uniq = new Set(teamIds);
  if (teamIds.length !== 4 || uniq.size !== 4) {
    return fail(400, { message: 'You must pick exactly 4 unique teams.' });
  }

  // Optional snapshots (best-effort)
  let teamSnapshots = null;
  const snapRaw = form.get('teamSnapshots');

  if (typeof snapRaw === 'string' && snapRaw.trim()) {
    try {
      const parsed = JSON.parse(snapRaw);
      if (Array.isArray(parsed)) {
        const map = new Map(
          parsed
            .map((x) => ({
              id: x?.id != null ? String(x.id) : '',
              name: x?.name ? String(x.name) : null,
              abbrev: x?.abbrev ? String(x.abbrev) : null,
              logo: x?.logo ? String(x.logo) : null,
              seed: x?.seed != null && Number.isFinite(Number(x.seed)) ? Number(x.seed) : null,
              region: x?.region ? String(x.region) : null
            }))
            .filter((x) => x.id)
            .map((x) => [x.id, x])
        );

        teamSnapshots = teamIds.map((id) => map.get(id) || { id, name: null, abbrev: null, logo: null, seed: null, region: null });
      }
    } catch {
      teamSnapshots = null;
    }
  }

  const payload = { teamIds, teamSnapshots };

  await upsertEntryForUser({
    db,
    eventId: event.id,
    userId,
    payload,
    now
  });

  return { success: true };
}
