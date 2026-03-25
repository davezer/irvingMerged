import { getStandings } from '$lib/server/league';
export const load = async () => ({ standings: getStandings() });
