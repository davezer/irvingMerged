// src/lib/games/worldcup/server.js
import { fail } from '@sveltejs/kit';
import { upsertEntryForUser, getEntryForUser } from '$lib/server/db/entries.js';
import { getResultsForEvent } from '$lib/server/db/results.js';
import { getOptions } from './options.js';
import { WORLD_CUP_ROUNDS, WORLD_CUP_ROUND_LABELS } from '$lib/scoring/worldCup.js';

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

function previousRoundKey(round) {
  const idx = WORLD_CUP_ROUNDS.indexOf(asStr(round));
  if (idx <= 0) return null;
  return WORLD_CUP_ROUNDS[idx - 1];
}

function getAliveTeamIdsForRound(resultsPayload, round) {
  const previousRound = previousRoundKey(round);
  if (!previousRound) return null;

  const roundsPayload = safeObj(resultsPayload?.rounds);
  const previousAdvancedIds = Array.isArray(roundsPayload?.[previousRound]?.advancedTeamIds)
    ? roundsPayload[previousRound].advancedTeamIds.map(asStr).filter(Boolean)
    : [];

  return new Set(previousAdvancedIds);
}


function getRunStatus({ picksByRound, resultsPayload, currentRound, teamNameById }) {
  const currentIdx = WORLD_CUP_ROUNDS.indexOf(asStr(currentRound));
  if (currentIdx <= 0) {
    return { eliminated: false, eliminatedRound: null, message: '' };
  }

  const roundsPayload = safeObj(resultsPayload?.rounds);
  const used = [];

  for (const round of WORLD_CUP_ROUNDS.slice(0, currentIdx)) {
    const advancedIds = Array.isArray(roundsPayload?.[round]?.advancedTeamIds)
      ? roundsPayload[round].advancedTeamIds.map(asStr).filter(Boolean)
      : [];

    // If the previous round has not been published yet, do not eliminate yet.
    // The user picker will show that previous results are needed first.
    if (!advancedIds.length) {
      return { eliminated: false, eliminatedRound: null, message: '' };
    }

    const pick = asStr(safeObj(picksByRound)[round]);
    const label = WORLD_CUP_ROUND_LABELS[round] || round;

    if (!pick) {
      return {
        eliminated: true,
        eliminatedRound: round,
        message: `No pick was submitted for ${label}. Your run is over for this World Cup.`
      };
    }

    const pickName = teamNameById?.[pick] || pick;

    if (used.includes(pick)) {
      return {
        eliminated: true,
        eliminatedRound: round,
        message: `${pickName} was already used before ${label}. Your run is over for this World Cup.`
      };
    }

    used.push(pick);

    if (!advancedIds.includes(pick)) {
      return {
        eliminated: true,
        eliminatedRound: round,
        message: `${pickName} did not survive ${label}. Your run is over for this World Cup.`
      };
    }
  }

  return { eliminated: false, eliminatedRound: null, message: '' };
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
  const teamNameById = Object.fromEntries(
    teams.map((t) => [asStr(t.id), asStr(t.name) || asStr(t.id)]).filter(([id]) => id)
  );

  // Before letting a user make the next pick, verify their entire run is still alive.
  // Example: if their Group Stage team did not advance, they cannot submit a Round of 32 pick.
  const runStatus = getRunStatus({
    picksByRound: existingPayload.picksByRound,
    resultsPayload,
    currentRound,
    teamNameById
  });

  if (runStatus.eliminated) {
    return fail(400, { message: runStatus.message || 'You have been eliminated and can’t submit further picks.' });
  }

  const pickedTeamId = asStr(form.get('teamId'));
  if (!pickedTeamId) return fail(400, { message: 'Pick a team.' });
  if (!teamIds.has(pickedTeamId)) return fail(400, { message: 'Invalid team selection.' });

  // For knockout rounds, only teams that advanced from the previous round are eligible.
  // This mirrors the user picker and blocks hand-crafted POSTs for eliminated teams.
  const aliveTeamIds = getAliveTeamIdsForRound(resultsPayload, currentRound);
  if (aliveTeamIds && !aliveTeamIds.has(pickedTeamId)) {
    return fail(400, { message: 'That team has been eliminated and is not available for this round.' });
  }

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
