// src/lib/scoring/derby.js

function safeName(v) {
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s : null;
}

export function scoreDerbyEntry({ entryPayload, resultsPayload }) {
  const winnerHorseId =
    resultsPayload?.winnerHorseId != null ? String(resultsPayload.winnerHorseId) : null;

  const payout = Number(resultsPayload?.payout);

  const pickedId = entryPayload?.horseId != null ? String(entryPayload.horseId) : null;
  const wager = Math.floor(Number(entryPayload?.wager ?? 0));

  // ✅ Names (optional but used for nicer leaderboard chips)
  // pickedName can come from the saved entry snapshot
  const pickedName = safeName(entryPayload?.horseSnapshot?.name);

  // winnerHorseName should be saved in results payload at publish time
  const winnerHorseName =
    safeName(resultsPayload?.winnerHorseName) ||
    safeName(resultsPayload?.winner?.name) ||
    null;

  if (!winnerHorseId || !Number.isFinite(payout) || payout <= 0) {
    return {
      score_total: 0,
      breakdown: {
        totals: { total: 0 },
        notes: ['No winner/payout published yet.']
      }
    };
  }

  if (!pickedId) {
    return {
      score_total: 0,
      breakdown: {
        totals: { total: 0 },
        notes: ['No pick.']
      }
    };
  }

  if (!Number.isFinite(wager) || wager < 0) {
    return {
      score_total: 0,
      breakdown: {
        totals: { total: 0 },
        notes: ['Invalid wager.']
      }
    };
  }

  const hit = pickedId === winnerHorseId;
  const delta = hit ? wager * payout : -wager;
  const score_total = delta;

  return {
    score_total,
    breakdown: {
      totals: { total: score_total },

      pickedId,
      pickedName,

      winnerHorseId,
      winnerHorseName,

      wager,
      payout,
      hit,
      delta
    }
  };
}
