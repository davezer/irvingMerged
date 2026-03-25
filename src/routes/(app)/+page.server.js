
import { getHomepageStats, getManagers, getStandings, getNewsPosts } from '$lib/server/league';

export async function load() {
  return {
    stats: getHomepageStats(),
    managers: getManagers().slice(0, 6),
    standings: getStandings().slice(0, 5),
    posts: getNewsPosts().slice(0, 3)
  };
}
