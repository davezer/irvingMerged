
import { getHomepageStats, getManagers, getStandings, getDraftOverview, getHistoryModules } from '$lib/server/league';

export async function load() {
  return {
    stats: getHomepageStats(),
    standings: getStandings().slice(0, 8),
    managers: getManagers(),
    draft: getDraftOverview(),
    modules: getHistoryModules()
  };
}
