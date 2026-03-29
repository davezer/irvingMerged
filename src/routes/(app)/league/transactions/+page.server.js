import { getLiveTransactionsBundle } from '$lib/server/league/transactionsLive.js';

export async function load({ url, platform }) {
  return getLiveTransactionsBundle({ url, env: platform?.env });
}
