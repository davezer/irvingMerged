import { getStandings, getLeaguePulse } from '$lib/server/league';

export const load = async () => ({
  standings: getStandings(),
  pulse: getLeaguePulse()
});
