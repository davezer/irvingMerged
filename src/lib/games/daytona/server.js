// src/lib/games/daytona/server.js
import { fail } from '@sveltejs/kit';
import { upsertEntryForUser } from '$lib/server/db/entries.js';

export function needsOptions() {
  return true;
}

export async function saveEntry({ db, event, userId, form, now, locked }) {
  if (locked) return fail(403, { message: 'Event is locked. Entries can’t be edited.' });

  // ---- Top 10 IDs ----
  let top10Ids;
  try {
    top10Ids = JSON.parse(String(form.get('top10Ids') || '[]')).map(String);
  } catch {
    return fail(400, { message: 'Invalid top10 payload.' });
  }

  top10Ids = top10Ids.filter(Boolean).slice(0, 10);
  const uniq = new Set(top10Ids);
  if (top10Ids.length !== 10 || uniq.size !== 10) {
    return fail(400, { message: 'You must pick exactly 10 unique drivers.' });
  }

  // ---- Top 10 Snapshot (optional) ----
  let top10Snapshot = null;
  const top10SnapshotRaw = form.get('top10Snapshot');

  if (typeof top10SnapshotRaw === 'string' && top10SnapshotRaw.trim()) {
    try {
      const parsed = JSON.parse(top10SnapshotRaw);
      if (!Array.isArray(parsed)) throw new Error('snapshot not array');

      const normalized = parsed
        .slice(0, 10)
        .map((x) => ({
          id: x?.id != null ? String(x.id) : '',
          name: x?.name != null && String(x.name).trim() ? String(x.name).trim() : null,
          carNumber:
            x?.carNumber != null && String(x.carNumber).trim() ? String(x.carNumber).trim() : null
        }))
        .filter((x) => x.id);

      // Reorder to match ids (best effort)
      const map = new Map(normalized.map((x) => [String(x.id), x]));
      top10Snapshot = top10Ids.map((id) => map.get(String(id)) || { id, name: null, carNumber: null });
    } catch {
      top10Snapshot = null;
    }
  }

  // ---- Chaos Car (required) + snapshot ----
  const chaosCarIdRaw = form.get('chaosCarId');
  const chaosCarId =
    typeof chaosCarIdRaw === 'string' && chaosCarIdRaw.trim() ? chaosCarIdRaw.trim() : null;

  if (!chaosCarId) return fail(400, { message: 'You must choose a Chaos Car.' });
  if (top10Ids.includes(chaosCarId)) {
    return fail(400, { message: 'Chaos car can’t be one of your Top 10 picks.' });
  }

  const chaosCarNameRaw = form.get('chaosCarName');
  const chaosCarNumberRaw = form.get('chaosCarNumber');

  const chaosCarName =
    typeof chaosCarNameRaw === 'string' && chaosCarNameRaw.trim() ? chaosCarNameRaw.trim() : '';
  const chaosCarNumber =
    typeof chaosCarNumberRaw === 'string' && chaosCarNumberRaw.trim()
      ? chaosCarNumberRaw.trim()
      : '';

  const chaosCarSnapshot = {
    id: chaosCarId,
    name: chaosCarName || null,
    carNumber: chaosCarNumber || null
  };

  const payload = { top10Ids, top10Snapshot, chaosCarId, chaosCarSnapshot };

  await upsertEntryForUser({
    db,
    eventId: event.id,
    userId,
    payload,
    now
  });

  return { success: true };
}
