// src/lib/games/daytona/adminResults.server.js
import { fail } from '@sveltejs/kit';
import { getResultsForEvent, upsertResultsForEvent } from '$lib/server/db/results.js';
import { getDriverOptionsForEvent } from '$lib/server/nascar/getDriverOptions.js';
import { loadEntriesWithScores } from '$lib/games/adminResults.server.js';

function buildDriverMap(driverOptions) {
  const map = new Map();
  for (const o of driverOptions || []) {
    if (!o?.id) continue;
    map.set(String(o.id), {
      id: String(o.id),
      name: o?.name ? String(o.name) : String(o.id),
      carNumber: o?.carNumber != null && String(o.carNumber).trim() ? String(o.carNumber).trim() : ''
    });
  }
  return map;
}

function buildDaytonaEntryDisplay(entryPayload, driverMap) {
  const payload = entryPayload ?? {};

  const top10Snapshot = Array.isArray(payload.top10Snapshot) ? payload.top10Snapshot : [];
  const top10Ids = Array.isArray(payload.top10Ids) ? payload.top10Ids : [];

  const chaosSnap = payload.chaosCarSnapshot ?? null;
  const chaosId = payload.chaosCarId ?? null;

  const top10Display = Array.from({ length: 10 }, (_, i) => {
    const snap = top10Snapshot[i];
    if (snap?.id) {
      return {
        id: String(snap.id),
        name: snap?.name ? String(snap.name) : String(snap.id),
        carNumber: snap?.carNumber ? String(snap.carNumber) : ''
      };
    }

    const id = top10Ids[i] ?? null;
    if (!id) return null;

    const opt = driverMap.get(String(id));
    return opt
      ? { id: String(id), name: opt.name, carNumber: opt.carNumber || '' }
      : { id: String(id), name: `Driver ${id}`, carNumber: '' };
  }).filter(Boolean);

  let chaosDisplay = null;
  if (chaosSnap?.id) {
    chaosDisplay = {
      id: String(chaosSnap.id),
      name: chaosSnap?.name ? String(chaosSnap.name) : String(chaosSnap.id),
      carNumber: chaosSnap?.carNumber ? String(chaosSnap.carNumber) : ''
    };
  } else if (chaosId) {
    const opt = driverMap.get(String(chaosId));
    chaosDisplay = opt
      ? { id: String(chaosId), name: opt.name, carNumber: opt.carNumber || '' }
      : { id: String(chaosId), name: `Driver ${chaosId}`, carNumber: '' };
  }

  return { top10Display, chaosDisplay };
}

export async function load({ db, event, fetchImpl }) {
  const results = await getResultsForEvent(db, event.id);

  // ✅ pass fetchImpl through
  const opt = await getDriverOptionsForEvent({ event, fetchImpl });
  const driverOptions = opt.options || [];
  const optionsMode = opt.mode || '';
  const optionsNote = opt.note || '';

  const driverMap = buildDriverMap(driverOptions);

  const entries = await loadEntriesWithScores({ db, eventId: event.id });

  const entriesDecorated = entries.map((e) => {
    const { top10Display, chaosDisplay } = buildDaytonaEntryDisplay(e.payload, driverMap);
    return { ...e, top10Display, chaosDisplay };
  });

  return {
    event,
    results,
    entries: entriesDecorated,
    driverOptions,
    optionsMode,
    optionsNote
  };
}

export async function publish({ db, event, form }) {
  const top10 = [];
  for (let i = 1; i <= 10; i++) {
    const v = (form.get(`pos${i}`) || '').toString().trim();
    if (!v) return fail(400, { ok: false, error: `Missing position ${i}` });
    top10.push(v);
  }

  const uniq = new Set(top10);
  if (uniq.size !== 10) {
    return fail(400, { ok: false, error: 'Top 10 must be unique.' });
  }

  const payload = { officialTop10Ids: top10 };
  await upsertResultsForEvent(db, event.id, payload, { setPublishedAt: true });

  return { ok: true };
}
