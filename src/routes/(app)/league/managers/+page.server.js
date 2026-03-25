import { getManagers } from '$lib/server/league';
export const load = async () => ({ managers: getManagers() });
