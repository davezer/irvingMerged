import { getManagerAwards } from '$lib/server/league';
export const load = async () => ({ awards: getManagerAwards() });
