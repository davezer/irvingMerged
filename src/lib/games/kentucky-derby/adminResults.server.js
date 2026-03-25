// src/lib/games/kentucky-derby/adminResults.server.js
import { fail } from '@sveltejs/kit';
import { getResultsForEvent } from '$lib/server/db/results.js';
import { loadEntriesWithScores, mergeResultsPayload } from '$lib/games/adminResults.server.js';
import { getOptions } from './options.js';

function buildHorseMap(horses) {
  const m = new Map();
  for (const h of horses || []) {
    const id = h?.id != null ? `${h.id}` : '';
    if (!id) continue;
    m.set(id, { id, name: h?.name ? String(h.name) : id });
  }
  return m;
}

function normalizeSnapshot(snap, fallbackId) {
  if (!snap || typeof snap !== 'object') return null;
  const id = snap?.id != null ? `${snap.id}` : (fallbackId ? `${fallbackId}` : '');
  if (!id) return null;
  return {
    id,
    name: snap?.name ? String(snap.name) : null
  };
}

function decorateEntry(e, horseMap) {
  const payload = e?.payload || {};
  const id = payload?.horseId != null ? `${payload.horseId}` : '';
  const wager = payload?.wager != null ? Math.floor(Number(payload.wager)) : null;

  const snap = normalizeSnapshot(payload?.horseSnapshot, id);
  if (snap) return { ...e, pickDisplay: snap, wager };

  if (id) {
    const opt = horseMap.get(id);
    if (opt) return { ...e, pickDisplay: opt, wager };
    return { ...e, pickDisplay: { id, name: `Horse ${id}` }, wager };
  }

  return { ...e, pickDisplay: null, wager };
}

export async function load({ db, event, fetchImpl }) {
  const results = await getResultsForEvent(db, event.id);

  const out = await getOptions({ db, event, fetchImpl });
  const horseOptions = Array.isArray(out?.options) ? out.options : [];
  const horseMap = buildHorseMap(horseOptions);

  const entries = await loadEntriesWithScores({ db, eventId: event.id });
  const entriesDecorated = entries.map((e) => decorateEntry(e, horseMap));

  return {
    event,
    results,
    entries: entriesDecorated,
    horseOptions,
    optionsMode: out?.mode || '',
    optionsNote: out?.note || '',
    provider: out?.provider || 'manual',
    cacheKey: out?.cacheKey || null
  };
}

export async function publish({ db, event, form }) {
  const winnerHorseId = String(form.get('winnerHorseId') || '').trim();
  if (!winnerHorseId) return fail(400, { ok: false, error: 'Pick a winning horse.' });

  const payoutRaw = String(form.get('payout') || '').trim();
  const payout = Number(payoutRaw);
  if (!Number.isFinite(payout) || payout <= 0) {
    return fail(400, { ok: false, error: 'Enter a payout multiplier (e.g. 3.5).' });
  }

  let winnerSnapshot = null;
  const snapRaw = form.get('winnerSnapshot');
  if (typeof snapRaw === 'string' && snapRaw.trim()) {
    try {
      const parsed = JSON.parse(snapRaw);
      winnerSnapshot = normalizeSnapshot(parsed, winnerHorseId) || { id: winnerHorseId, name: null };
    } catch {
      winnerSnapshot = { id: winnerHorseId, name: null };
    }
  } else {
    winnerSnapshot = { id: winnerHorseId, name: null };
  }

  const now = Math.floor(Date.now() / 1000);

  await mergeResultsPayload({
    db,
    eventId: event.id,
    now,
    patch: {
      winnerHorseId,
      winnerSnapshot,
      payout,
      publishedAt: now
    },
    setPublishedAt: true
  });

  return { ok: true };
}
