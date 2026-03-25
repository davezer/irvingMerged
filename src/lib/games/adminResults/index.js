// src/lib/games/adminResults/index.js
import DaytonaAdminResults from '$lib/games/daytona/AdminResults.svelte';
import MadnessAdminResults from '$lib/games/madness/AdminResults.svelte';
import MastersAdminResults from '$lib/games/masters/AdminResults.svelte';
import DerbyAdminResults from '$lib/games/kentucky-derby/AdminResults.svelte';
import WorldCupAdminResults from '$lib/games/worldcup/AdminResults.svelte';

export const ADMIN_RESULTS_BY_TYPE = {
  daytona: DaytonaAdminResults,
  madness: MadnessAdminResults,
  masters: MastersAdminResults,
  derby: DerbyAdminResults,
  worldcup: WorldCupAdminResults
};

export function getAdminResultsComponent(type) {
  return ADMIN_RESULTS_BY_TYPE[type] || null;
}
