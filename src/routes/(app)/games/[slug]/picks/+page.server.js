import { error } from '@sveltejs/kit';
import { getResultsForEvent } from '$lib/server/db/results.js';
import { loadEntriesWithScores } from '$lib/games/adminResults.server.js';
import { getOptions as getMastersOptions } from '$lib/games/masters/options.js';
import { getMastersLeaderboard } from '$lib/server/providers/masters.js';

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

function normalizeGolferSnapshot(s, fallbackId = '') {
  const id = String(s?.id ?? fallbackId ?? '');
  if (!id) return null;

  return {
    id,
    name: s?.name || id,
    country: s?.country ?? null
  };
}

function sortMadnessEntries(entries) {
  return [...entries].sort((a, b) => {
    const aScore = Number(a?.score?.score_total ?? 0);
    const bScore = Number(b?.score?.score_total ?? 0);

    if (bScore !== aScore) return bScore - aScore;

    return String(a?.display_name || '').localeCompare(String(b?.display_name || ''));
  });
}

function posRank(pos) {
  const s = String(pos || '').trim().toUpperCase();
  if (!s) return 9996;
  const cleaned = s.replace(/^T/, '');
  const n = Number.parseInt(cleaned, 10);
  if (Number.isFinite(n)) return n;
  if (s === 'CUT') return 9997;
  if (s === 'WD') return 9998;
  if (s === 'DQ') return 9999;
  return 9996;
}

function sortMastersEntries(entries) {
  return [...entries].sort((a, b) => {
    const aScore = Number(a?.score?.score_total ?? 0);
    const bScore = Number(b?.score?.score_total ?? 0);
    if (bScore !== aScore) return bScore - aScore;

    const aPos = posRank(a?.live?.position);
    const bPos = posRank(b?.live?.position);
    if (aPos !== bPos) return aPos - bPos;

    return String(a?.display_name || '').localeCompare(String(b?.display_name || ''));
  });
}

export async function load({ params, platform, locals, fetch }) {
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

  if (event.type !== 'madness' && event.type !== 'masters') {
    throw error(404, 'Picks board is only wired for March Madness and The Masters right now.');
  }

  const now = Math.floor(Date.now() / 1000);
  const locked = isEventLocked(event, now);

  const results = await getResultsForEvent(db, event.id);
  const rawEntries = await loadEntriesWithScores({ db, eventId: event.id });

  if (event.type === 'madness') {
    const entries = sortMadnessEntries(
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

  const optionsOut = await getMastersOptions({ db, event, fetchImpl: fetch });
  const golferOptions = Array.isArray(optionsOut?.options) ? optionsOut.options : [];
  const golferMap = new Map(
    golferOptions.map((g) => [String(g?.id ?? ''), {
      id: String(g?.id ?? ''),
      name: g?.name || String(g?.id ?? ''),
      country: g?.country || null
    }])
  );

  const liveOut = await getMastersLeaderboard({ db, event, fetchImpl: fetch });
  const leaderboardRows = Array.isArray(liveOut?.leaderboard) ? liveOut.leaderboard : [];
  const leaderboardById = new Map(leaderboardRows.map((row) => [String(row?.id ?? ''), row]));

  const entries = sortMastersEntries(
    rawEntries.map((entry) => {
      const golferId = String(entry?.payload?.golferId ?? '');
      const snap = normalizeGolferSnapshot(entry?.payload?.golferSnapshot, golferId);
      const pickDisplay = snap || golferMap.get(golferId) || (golferId ? { id: golferId, name: golferId, country: null } : null);
      const live = leaderboardById.get(golferId) || null;

      return {
        ...entry,
        pickDisplay,
        live
      };
    })
  );

  return {
    event,
    locked,
    results,
    entries,
    leaderboardRows,
    optionsMode: optionsOut?.mode || '',
    optionsNote: optionsOut?.note || '',
    liveMode: liveOut?.mode || '',
    liveNote: liveOut?.note || ''
  };
}
