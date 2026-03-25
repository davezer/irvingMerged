import { getRivalries } from '$lib/server/league';
export const load = async () => ({ rivalries: getRivalries() });
