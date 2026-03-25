// src/lib/games/worldcup/options.js
import { WORLD_CUP_ROUNDS, WORLD_CUP_ROUND_LABELS, WORLD_CUP_POINTS } from '$lib/scoring/worldCup.js';

// Manual list. Swap later if you want a seed-sync.
// Keep ids stable. These can be whatever you want (iso3, short codes, etc).
const MANUAL_TEAMS = [
  { id: 'arg', name: 'Argentina' },
  { id: 'bra', name: 'Brazil' },
  { id: 'fra', name: 'France' },
  { id: 'eng', name: 'England' },
  { id: 'spa', name: 'Spain' },
  { id: 'ger', name: 'Germany' },
  { id: 'por', name: 'Portugal' },
  { id: 'ned', name: 'Netherlands' },
  { id: 'ita', name: 'Italy' },
  { id: 'uru', name: 'Uruguay' }
];

export async function getOptions() {
  return {
    provider: 'manual',
    cacheKey: 'worldcup:teams:manual:v1',
    options: {
      teams: MANUAL_TEAMS,
      rounds: WORLD_CUP_ROUNDS,
      roundLabels: WORLD_CUP_ROUND_LABELS,
      pointsByRound: WORLD_CUP_POINTS
    },
    mode: 'manual',
    note: 'Manual World Cup team list. One pick per round. No re-use. Lose once and you’re eliminated.'
  };
}
