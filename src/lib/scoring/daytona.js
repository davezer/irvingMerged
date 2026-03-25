// src/lib/scoring/daytona.js

export const TOP10_POINTS_BY_POS = [250, 100, 50, 25, 25, 10, 10, 10, 10, 10];

// Chaos penalty table (same shape as your PDF)
export const CHAOS_PENALTY_BY_POS = [250, 100, 50, 50, 50, 50, 50, 50, 50, 50];

export function scoreDaytonaEntry({ entryPayload, resultsPayload }) {
  const official = resultsPayload?.officialTop10Ids?.map(String) || [];
  const picks = entryPayload?.top10Ids?.map(String) || [];
  const chaosPick = entryPayload?.chaosCarId ? String(entryPayload.chaosCarId) : null;

  if (official.length !== 10 || picks.length !== 10) {
    return {
      score_total: 0,
      breakdown: {
        totals: { exact: 0, inTop10: 0, chaos: 0, bonus: 0 },
        exactHits: [],
        chaos: { inTop10: false, finishPos: null, penalty: 0 },
        podiumExacta: false,
        notes: ["Invalid official results or entry payload (need 10 ids each)."]
      }
    };
  }

  let exact = 0;
  const exactHits = [];
  for (let i = 0; i < 10; i++) {
    if (String(picks[i]) === String(official[i])) {
      const pts = TOP10_POINTS_BY_POS[i] || 0;
      exact += pts;
      exactHits.push({ pos: i + 1, driverId: picks[i], points: pts });
    }
  }

  const podiumExacta =
    String(picks[0]) === String(official[0]) &&
    String(picks[1]) === String(official[1]) &&
    String(picks[2]) === String(official[2]);

  const bonus = podiumExacta ? 500 : 0;

  let chaosPenalty = 0;
  let chaosFinishPos = null;

  if (chaosPick) {
    const idx = official.findIndex((id) => String(id) === chaosPick);
    if (idx !== -1) {
      chaosFinishPos = idx + 1;
      chaosPenalty = CHAOS_PENALTY_BY_POS[idx] || 0;
    }
  }

  const chaosTotal = chaosPenalty ? -chaosPenalty : 0;
  const score_total = exact + bonus + chaosTotal;

  return {
    score_total,
    breakdown: {
      totals: { exact, inTop10: 0, chaos: chaosTotal, bonus },
      exactHits,
      chaos: {
        inTop10: chaosFinishPos != null,
        finishPos: chaosFinishPos,
        penalty: chaosPenalty
      },
      podiumExacta
    }
  };
}
