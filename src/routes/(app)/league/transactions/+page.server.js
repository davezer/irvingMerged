import { getTransactionsOverview } from '$lib/server/league';
export const load = async () => ({ tx: getTransactionsOverview() });
