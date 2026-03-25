// src/lib/games/masters/adminResults.server.js
import { fail } from '@sveltejs/kit';
import { getResultsForEvent } from '$lib/server/db/results.js';
import { loadEntriesWithScores, mergeResultsPayload } from '$lib/games/adminResults.server.js';
import { getOptions } from './options.js';

function buildGolferMap(golfers) {
  const m = new Map();
  for (const g of golfers || []) {
    const id = g?.id != null ? String(g.id) : '';
    if (!id) continue;

    m.set(id, {
      id,
      name: g?.name ? String(g.name) : id,
      country: g?.country ? String(g.country) : null
    });
  }
  return m;
}

function normalizeSnapshot(snap, fallbackId) {
  if (!snap || typeof snap !== 'object') return null;
  const id = snap?.id != null ? String(snap.id) : fallbackId ? String(fallbackId) : '';
  if (!id) return null;

  return {
    id,
    name: snap?.name ? String(snap.name) : null,
    country: snap?.country ? String(snap.country) : null
  };
}

function decorateEntry(e, golferMap) {
  const payload = e?.payload || {};
  const id = payload?.golferId != null ? String(payload.golferId) : '';

  // Prefer stored snapshot (sticky display even if options change)
  const snap = normalizeSnapshot(payload?.golferSnapshot, id);
  if (snap) return { ...e, pickDisplay: snap };

  // Fall back to options map
  if (id) {
    const opt = golferMap.get(id);
    if (opt) return { ...e, pickDisplay: opt };
    return { ...e, pickDisplay: { id, name: `Golfer ${id}`, country: null } };
  }

  return { ...e, pickDisplay: null };
}

export async function load({ db, event, fetchImpl }) {
  const results = await getResultsForEvent(db, event.id);

  // Standard options shape (provider/cacheKey/options/mode/note)
  const out = await getOptions({ db, event, fetchImpl });

  const golferOptions = Array.isArray(out?.options) ? out.options : [];
  const golferMap = buildGolferMap(golferOptions);

  const entries = await loadEntriesWithScores({ db, eventId: event.id });
  const entriesDecorated = entries.map((e) => decorateEntry(e, golferMap));

  return {
    event,
    results,
    entries: entriesDecorated,
    golferOptions,
    optionsMode: out?.mode || '',
    optionsNote: out?.note || '',
    provider: out?.provider || 'masters',
    cacheKey: out?.cacheKey || null
  };
}

export async function publish({ db, event, form }) {
  const winnerId = String(form.get('winnerId') || '').trim();
  if (!winnerId) return fail(400, { ok: false, error: 'Pick a winner.' });

  // Optional snapshot coming from the UI (recommended so the winner shows nicely even if options change)
  let winnerSnapshot = null;
  const snapRaw = form.get('winnerSnapshot');

  if (typeof snapRaw === 'string' && snapRaw.trim()) {
    try {
      const parsed = JSON.parse(snapRaw);
      winnerSnapshot =
        normalizeSnapshot(parsed, winnerId) || { id: winnerId, name: null, country: null };
    } catch {
      winnerSnapshot = { id: winnerId, name: null, country: null };
    }
  } else {
    winnerSnapshot = { id: winnerId, name: null, country: null };
  }

  const now = Math.floor(Date.now() / 1000);

  await mergeResultsPayload({
    db,
    eventId: event.id,
    now,
    patch: {
      winnerId,
      winnerSnapshot,
      publishedAt: now
    },
    // ✅ this sets results.published_at (used by admin events list "Published"/"Not published")
    setPublishedAt: true
  });

  return { ok: true };
}

// Optional admin helper if you want a stage selector (pre_r1, r1_live, r1_done, etc)
export async function saveStage({ db, event, form }) {
  const stage = String(form.get('stage') || '').trim() || 'pre_r1';
  const now = Math.floor(Date.now() / 1000);

  await mergeResultsPayload({
    db,
    eventId: event.id,
    now,
    patch: {
      stage,
      stageUpdatedAt: now
    }
  });

  return { ok: true };
}
