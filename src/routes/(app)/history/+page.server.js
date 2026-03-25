import { getHistoryModules } from '$lib/server/league';
export const load = async () => ({ modules: getHistoryModules() });
