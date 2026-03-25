import { getDraftOverview } from '$lib/server/league';
export const load = async () => ({ draft: getDraftOverview() });
