// src/lib/scoring/march_madness.js

export const ROUND_MULT = {
  r1: 1,
  r2: 2,
  r3: 3,
  r4: 4,
  r5: 6,
  r6: 10
};

export function scoreMarchMadnessEntry({ entryPayload, resultsPayload }) {
  const teamIds = (entryPayload?.teamIds || []).map(String);
  const uniq = new Set(teamIds);

  if (teamIds.length !== 4 || uniq.size !== 4) {
    return {
      score_total: 0,
      breakdown: {
        totals: { total: 0 },
        notes: ['Invalid entry payload (need exactly 4 unique teamIds).']
      }
    };
  }

  const seedsByTeamId = resultsPayload?.seedsByTeamId || {};
  const winsByTeamId = resultsPayload?.winsByTeamId || {};

  let total = 0;
  const items = [];

  for (const teamId of teamIds) {
    const seed = Number(seedsByTeamId?.[teamId]);
    if (!Number.isFinite(seed) || seed <= 0) {
      items.push({ teamId, seed: null, points: 0, notes: ['Missing seed'] });
      continue;
    }

    const wins = winsByTeamId?.[teamId] || {};
    let pts = 0;

    for (const r of ['r1', 'r2', 'r3', 'r4', 'r5', 'r6']) {
      if (wins?.[r]) pts += seed * (ROUND_MULT[r] || 0);
    }

    total += pts;
    items.push({ teamId, seed, points: pts, wins });
  }

  return {
    score_total: total,
    breakdown: {
      totals: { total },
      items
    }
  };
}
