// src/lib/scoring/masters.js

export const MASTERS_STAGE_POINTS = {
  pre_r1: 1000, // before Round 1
  post_r1: 500, // after Round 1
  post_r2: 200, // after Round 2
  post_r3: 50   // after Round 3
};

// ✅ canonical key order (what you store)
export const MASTERS_STAGE_KEYS = ['pre_r1', 'post_r1', 'post_r2', 'post_r3'];

// ✅ display labels for UI
export const MASTERS_STAGE_LABELS = {
  pre_r1: 'Round 1',
  post_r1: 'Round 2',
  post_r2: 'Round 3',
  post_r3: 'Round 4'
};

export function scoreMastersEntry({ entryPayload, resultsPayload }) {
  const winnerId = resultsPayload?.winnerId != null ? String(resultsPayload.winnerId) : null;

  const pickedId = entryPayload?.golferId != null ? String(entryPayload.golferId) : null;
  const stage = entryPayload?.lockStage ? String(entryPayload.lockStage) : 'pre_r1';

  if (!winnerId) {
    return {
      score_total: 0,
      breakdown: {
        totals: { total: 0 },
        notes: ['No winner published yet.']
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

  const won = pickedId === winnerId;
  const pts = won ? (MASTERS_STAGE_POINTS[stage] ?? 0) : 0;

  return {
    score_total: pts,
    breakdown: {
      totals: { total: pts },
      winnerId,
      pickedId,
      lockStage: stage,
      won
    }
  };
}
