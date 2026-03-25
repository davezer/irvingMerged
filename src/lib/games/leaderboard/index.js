// src/lib/games/leaderboard/index.js

import DaytonaBreakdown from '$lib/games/daytona/LeaderboardBreakdown.svelte';
import MadnessBreakdown from '$lib/games/madness/LeaderboardBreakdown.svelte';
import MastersBreakdown from '$lib/games/masters/LeaderboardBreakdown.svelte';
import DerbyBreakdown from '$lib/games/kentucky-derby/LeaderboardBreakdown.svelte';
import WorldCupBreakdown from '$lib/games/worldcup/LeaderboardBreakdown.svelte';

// Optional: a very small fallback

const BY_TYPE = {
  daytona: DaytonaBreakdown,
  madness: MadnessBreakdown,
  masters: MastersBreakdown,
  derby: DerbyBreakdown,
  worldcup: WorldCupBreakdown
};

export function getLeaderboardBreakdownComponent(type) {
  return BY_TYPE[type] || null;
}
