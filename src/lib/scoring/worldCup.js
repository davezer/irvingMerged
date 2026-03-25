// src/lib/scoring/worldCup.js

export const WORLD_CUP_ROUNDS = ['group', 'r32', 'r16', 'qf', 'sf', 'final'];

export const WORLD_CUP_ROUND_LABELS = {
  group: 'Survive Group Stage',
  r32: 'Round of 32',
  r16: 'Round of 16',
  qf: 'Quarterfinals',
  sf: 'Semifinals',
  final: 'Final'
};

export const WORLD_CUP_POINTS = {
  group: 50,
  r32: 100,
  r16: 100,
  qf: 250,
  sf: 300,
  final: 400
};

function asStr(v) {
  return v == null ? '' : String(v);
}

function uniq(arr) {
  const out = [];
  const seen = new Set();
  for (const x of arr || []) {
    const s = asStr(x);
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

/**
 * Results payload shape we use for World Cup:
 * {
 *   currentRound: 'group'|'r32'|'r16'|'qf'|'sf'|'final',
 *   rounds: {
 *     group: { advancedTeamIds: ['bra','fra',...], completedAt: 123 },
 *     r32:   { advancedTeamIds: [...], completedAt: 123 },
 *     ...
 *   }
 * }
 *
 * Entry payload shape:
 * {
 *   picksByRound: { group:'bra', r32:'fra', ... },
 *   eliminated: boolean,
 *   eliminatedRound: 'r16' | null,
 *   usedTeams: ['bra','fra',...]
 * }
 */
export function scoreWorldCupEntry({ entryPayload, resultsPayload, teamNameById = null }) {
  const picksByRound = (entryPayload && entryPayload.picksByRound && typeof entryPayload.picksByRound === 'object')
    ? entryPayload.picksByRound
    : {};

  const roundsPayload = (resultsPayload && resultsPayload.rounds && typeof resultsPayload.rounds === 'object')
    ? resultsPayload.rounds
    : {};

  let total = 0;
  let eliminated = false;
  let eliminatedRound = null;

  const usedTeams = [];
  const breakdownRounds = [];

  for (const round of WORLD_CUP_ROUNDS) {
    const pick = asStr(picksByRound[round]);
    if (!pick) {
      // no pick submitted for this round yet — stop timeline here
      break;
    }

    // No-reuse enforcement (defensive)
    if (usedTeams.includes(pick)) {
      eliminated = true;
      eliminatedRound = round;

      breakdownRounds.push({
        round,
        roundLabel: WORLD_CUP_ROUND_LABELS[round] || round,
        pickedTeamId: pick,
        pickedTeamName: teamNameById?.[pick] || null,
        status: 'invalid',
        reason: 'team reused',
        points: 0
      });
      break;
    }

    usedTeams.push(pick);

    const r = roundsPayload[round];
    const advancedIds = uniq(r?.advancedTeamIds || []);

    // If admin hasn't published this round yet, we cannot score it (or any later)
    if (!advancedIds.length) {
      breakdownRounds.push({
        round,
        roundLabel: WORLD_CUP_ROUND_LABELS[round] || round,
        pickedTeamId: pick,
        pickedTeamName: teamNameById?.[pick] || null,
        status: 'pending',
        points: 0
      });
      break;
    }

    const survived = advancedIds.includes(pick);

    if (!survived) {
      eliminated = true;
      eliminatedRound = round;

      breakdownRounds.push({
        round,
        roundLabel: WORLD_CUP_ROUND_LABELS[round] || round,
        pickedTeamId: pick,
        pickedTeamName: teamNameById?.[pick] || null,
        status: 'eliminated',
        points: 0
      });
      break;
    }

    const pts = WORLD_CUP_POINTS[round] || 0;
    total += pts;

    breakdownRounds.push({
      round,
      roundLabel: WORLD_CUP_ROUND_LABELS[round] || round,
      pickedTeamId: pick,
      pickedTeamName: teamNameById?.[pick] || null,
      status: 'advanced',
      points: pts
    });
  }

  return {
    score_total: total,
    breakdown: {
      type: 'worldcup',
      totals: { total },
      eliminated,
      eliminatedRound,
      usedTeams,
      rounds: breakdownRounds
    }
  };
}
