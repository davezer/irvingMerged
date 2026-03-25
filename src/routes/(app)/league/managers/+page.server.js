import { getManagers, getStandings, getManagerAwards } from '$lib/server/league';

export const load = async () => ({
  managers: getManagers(),
  standings: getStandings(),
  awards: getManagerAwards()
});
