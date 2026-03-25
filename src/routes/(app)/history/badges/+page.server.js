import { getBadgesBoard } from '$lib/server/league';
export const load = async () => ({ badges: getBadgesBoard() });
