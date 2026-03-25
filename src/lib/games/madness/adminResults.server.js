// src/lib/games/madness/adminResults.server.js
import { fail } from '@sveltejs/kit';
import { getResultsForEvent } from '$lib/server/db/results.js';
import { loadEntriesWithScores } from '$lib/games/adminResults.server.js';
import { mergeResultsPayload } from '$lib/games/adminResults.server.js';
import { fetchSeedsFromProvider, parseSeedsJson } from '$lib/games/madness/seeds.js';

const STAGE_KEYS = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'];

function normalizeTeamSnap(x) {
  return {
    id: x?.id != null ? String(x.id) : '',
    name: x?.name ? String(x.name) : null,
    abbrev: x?.abbrev ? String(x.abbrev) : null,
    logo: x?.logo ? String(x.logo) : null
  };
}

export async function load({ db, event }) {
  const results = await getResultsForEvent(db, event.id);
  const entries = await loadEntriesWithScores({ db, eventId: event.id });

  // Derive pickedTeams unique across entries
  const teamMap = new Map();

  for (const e of entries) {
    const ids = (e?.payload?.teamIds || []).map(String);
    const snaps = Array.isArray(e?.payload?.teamSnapshots) ? e.payload.teamSnapshots : [];

    const snapById = new Map(
      snaps
        .map(normalizeTeamSnap)
        .filter((s) => s.id)
        .map((s) => [s.id, s])
    );

    for (const id of ids) {
      if (!id) continue;
      const snap = snapById.get(id) || { id, name: null, abbrev: null, logo: null };
      if (!teamMap.has(id)) teamMap.set(id, snap);
    }
  }

  const pickedTeams = [...teamMap.values()].sort((a, b) =>
    (a.name || a.id).localeCompare(b.name || b.id)
  );

  return {
    event,
    results,
    entries,
    pickedTeams
  };
}

/**
 * Publish Madness official results for scoring.
 *
 * This reads from the already-saved live payload so admin seed edits / win
 * toggles / eliminations / manual stage changes can update immediately,
 * while Publish acts as the official recompute checkpoint.
 */
export async function publish({ db, event }) {
  const currentResults = await getResultsForEvent(db, event.id);
  const currentPayload =
    currentResults?.payload && typeof currentResults.payload === 'object'
      ? currentResults.payload
      : {};

  const seedsByTeamId = { ...(currentPayload.seedsByTeamId || {}) };
  const winsByTeamId = { ...(currentPayload.winsByTeamId || {}) };
  const eliminatedByTeamId = { ...(currentPayload.eliminatedByTeamId || {}) };
  const currentStage = String(currentPayload.currentStage || '').trim().toLowerCase();

  const pickedIds = new Set();

  const entries = await loadEntriesWithScores({ db, eventId: event.id });
  for (const e of entries) {
    for (const id of e?.payload?.teamIds || []) {
      const tid = String(id || '').trim();
      if (tid) pickedIds.add(tid);
    }
  }

  if (!pickedIds.size) {
    return fail(400, { ok: false, error: 'No picked teams found for this event.' });
  }

  for (const id of pickedIds) {
    const seed = Number(seedsByTeamId[id]);
    if (!Number.isFinite(seed) || seed < 1 || seed > 16) {
      return fail(400, {
        ok: false,
        error: `Missing/invalid seed for team ${id} (must be 1–16 before publishing).`
      });
    }
  }

  const cleanedWinsByTeamId = {};
  for (const id of pickedIds) {
    const src = winsByTeamId[id] && typeof winsByTeamId[id] === 'object' ? winsByTeamId[id] : {};
    cleanedWinsByTeamId[id] = {
      r1: Boolean(src.r1),
      r2: Boolean(src.r2),
      r3: Boolean(src.r3),
      r4: Boolean(src.r4),
      r5: Boolean(src.r5),
      r6: Boolean(src.r6)
    };
  }

  const cleanedSeedsByTeamId = {};
  for (const id of pickedIds) {
    cleanedSeedsByTeamId[id] = Number(seedsByTeamId[id]);
  }

  const cleanedEliminatedByTeamId = {};
  for (const [teamId, v] of Object.entries(eliminatedByTeamId)) {
    if (pickedIds.has(String(teamId)) && v) {
      cleanedEliminatedByTeamId[String(teamId)] = true;
    }
  }

  const now = Math.floor(Date.now() / 1000);

  await mergeResultsPayload({
    db,
    eventId: event.id,
    now,
    setPublishedAt: true,
    patch: {
      seedsByTeamId: cleanedSeedsByTeamId,
      winsByTeamId: cleanedWinsByTeamId,
      eliminatedByTeamId: cleanedEliminatedByTeamId,
      currentStage: STAGE_KEYS.includes(currentStage) ? currentStage : 'r1',
      publishedAt: now
    }
  });

  return { ok: true };
}

export async function syncSeeds({ db, event, form, fetchImpl }) {
  const seedsJson = (form.get('seedsJson') || '').toString().trim();

  let seeds = null; // rich: { [teamId]: { seed, region } }
  let source = 'provider';
  let note = '';

  if (seedsJson) {
    seeds = parseSeedsJson(seedsJson);
    source = 'manual';
    if (!seeds) return fail(400, { ok: false, error: 'Invalid seeds JSON.' });
  } else {
    const fetched = await fetchSeedsFromProvider({ fetchImpl, event });
    seeds = fetched.seeds || {};
    source = fetched.source || 'provider';
    note = fetched.note || '';
  }

  // numeric map used by admin + RoundTracker + scoring
  const seedsByTeamId = {};
  for (const [teamId, v] of Object.entries(seeds || {})) {
    const seedNum = Number(v?.seed ?? v);
    if (Number.isFinite(seedNum) && seedNum > 0) seedsByTeamId[String(teamId)] = seedNum;
  }

  const now = Math.floor(Date.now() / 1000);

  await mergeResultsPayload({
    db,
    eventId: event.id,
    now,
    patch: {
      seeds,
      seedsByTeamId,
      syncedAt: now,
      source,
      syncNote: note || null
    }
  });

  return { ok: true, seedCount: Object.keys(seedsByTeamId).length, source };
}

export async function setSeed({ db, event, form }) {
  const teamId = String(form.get('teamId') || '').trim();
  const seedRaw = String(form.get('seed') || '').trim();

  if (!teamId) return fail(400, { ok: false, error: 'Missing teamId.' });

  const seed = Number(seedRaw);
  if (!Number.isFinite(seed) || seed < 1 || seed > 16) {
    return fail(400, { ok: false, error: 'Invalid seed.' });
  }

  const currentResults = await getResultsForEvent(db, event.id);
  const currentPayload =
    currentResults?.payload && typeof currentResults.payload === 'object'
      ? currentResults.payload
      : {};

  const seedsByTeamId = { ...(currentPayload.seedsByTeamId || {}) };
  seedsByTeamId[teamId] = seed;

  const now = Math.floor(Date.now() / 1000);

  await mergeResultsPayload({
    db,
    eventId: event.id,
    now,
    patch: {
      seedsByTeamId
    }
  });

  return { ok: true, teamId, seed };
}

export async function setWinState({ db, event, form }) {
  const teamId = String(form.get('teamId') || '').trim();
  const round = String(form.get('round') || '').trim();
  const checked = String(form.get('checked') || '').trim() === 'true';

  if (!teamId) return fail(400, { ok: false, error: 'Missing teamId.' });

  if (!STAGE_KEYS.includes(round)) {
    return fail(400, { ok: false, error: 'Invalid round.' });
  }

  const currentResults = await getResultsForEvent(db, event.id);
  const currentPayload =
    currentResults?.payload && typeof currentResults.payload === 'object'
      ? currentResults.payload
      : {};

  const winsByTeamId = { ...(currentPayload.winsByTeamId || {}) };
  const teamWins =
    winsByTeamId[teamId] && typeof winsByTeamId[teamId] === 'object'
      ? { ...winsByTeamId[teamId] }
      : {};

  if (checked) teamWins[round] = true;
  else delete teamWins[round];

  const hasAnyWins = STAGE_KEYS.some((r) => Boolean(teamWins[r]));
  if (hasAnyWins) winsByTeamId[teamId] = teamWins;
  else delete winsByTeamId[teamId];

  const now = Math.floor(Date.now() / 1000);

  await mergeResultsPayload({
    db,
    eventId: event.id,
    now,
    patch: {
      winsByTeamId
    }
  });

  return { ok: true, teamId, round, checked };
}

export async function setCurrentStage({ db, event, form }) {
  const stage = String(form.get('stage') || '').trim().toLowerCase();

  if (!STAGE_KEYS.includes(stage)) {
    return fail(400, { ok: false, error: 'Invalid stage.' });
  }

  const now = Math.floor(Date.now() / 1000);

  await mergeResultsPayload({
    db,
    eventId: event.id,
    now,
    patch: {
      currentStage: stage
    }
  });

  return { ok: true, stage };
}

export async function toggleEliminated({ db, event, form }) {
  const teamId = String(form.get('teamId') || '').trim();
  if (!teamId) return fail(400, { ok: false, error: 'Missing teamId.' });

  const currentResults = await getResultsForEvent(db, event.id);
  const currentPayload =
    currentResults?.payload && typeof currentResults.payload === 'object'
      ? currentResults.payload
      : {};

  const eliminatedByTeamId = { ...(currentPayload.eliminatedByTeamId || {}) };

  eliminatedByTeamId[teamId] = true;

  const now = Math.floor(Date.now() / 1000);

  await mergeResultsPayload({
    db,
    eventId: event.id,
    now,
    patch: {
      eliminatedByTeamId
    }
  });

  return { ok: true, teamId, status: 'out' };
}
