import { getTransactionsView } from '$lib/server/league/ui';

export async function load({ platform }) {
  const db = platform?.env?.DB;
  return await getTransactionsView(db);
}
