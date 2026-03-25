// src/lib/games/worldcup/server.js
import { fail } from '@sveltejs/kit';
import { upsertEntryForUser, getEntryForUser } from '$lib/server/db/entries.js';
import { getResultsForEvent } from '$lib/server/db/results.js';
import { getOptions } from './options.js';
import { WORLD_CUP_ROUNDS } from '$lib/scoring/worldCup.js';

function asStr(v) {
  return v == null ? '' : String(v).trim();
}

function safeObj(v) {
  return v && typeof v === 'object' ? v : {};
}

export function needsOptions() {
  return true;
}

function getCurrentRound(resultsPayload) {
  const r = asStr(resultsPayload?.currentRound) || 'group';
  return WORLD_CUP_ROUNDS.includes(r) ? r : 'group';
}

export async function saveEntry({ db, event, userId, form, now, locked }) {
  if (locked) return fail(400, { message: 'This event is locked.' });

  const existing = await getEntryForUser({ db, eventId: event.id, userId });
  const existingPayload = safeObj(existing?.payload);

  if (existingPayload.eliminated) {
    return fail(400, { message: 'You have been eliminated and can’t submit further picks.' });
  }

  // Determine current round from results payload (admin controls it)
  const results = await getResultsForEvent(db, event.id);
  const resultsPayload = safeObj(results?.payload);

  const currentRound = getCurrentRound(resultsPayload);

  // Load teams list so we can validate IDs
  const opts = await getOptions({ db, event });
  const teams = safeObj(opts?.options)?.teams || [];
  const teamIds = new Set(teams.map((t) => asStr(t.id)).filter(Boolean));

  const pickedTeamId = asStr(form.get('teamId'));
  if (!pickedTeamId) return fail(400, { message: 'Pick a team.' });
  if (!teamIds.has(pickedTeamId)) return fail(400, { message: 'Invalid team selection.' });

  const picksByRound = safeObj(existingPayload.picksByRound);
  const usedTeams = Array.isArray(existingPayload.usedTeams) ? existingPayload.usedTeams.map(asStr) : [];

  // Enforce no re-use (unless user is editing same round pick before lock)
  const previousPickThisRound = asStr(picksByRound[currentRound]);
  const usedWithoutThisRound = usedTeams.filter((id) => id && id !== previousPickThisRound);

  if (usedWithoutThisRound.includes(pickedTeamId)) {
    return fail(400, { message: 'You already used that team in a previous round.' });
  }

  // Save / overwrite pick for current round
  picksByRound[currentRound] = pickedTeamId;

  // Recompute usedTeams from picksByRound in order
  const nextUsed = [];
  for (const r of WORLD_CUP_ROUNDS) {
    const id = asStr(picksByRound[r]);
    if (!id) break;
    if (!nextUsed.includes(id)) nextUsed.push(id);
  }

  const payload = {
    picksByRound,
    usedTeams: nextUsed,
    eliminated: false,
    eliminatedRound: existingPayload.eliminatedRound || null
  };

  await upsertEntryForUser({
    db,
    eventId: event.id,
    userId,
    payload,
    now
  });

  return { success: true };
}
