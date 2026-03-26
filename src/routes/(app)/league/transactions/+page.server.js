import { getLeagueTransactions } from '$lib/server/league/queries';

export async function load({ platform, url }) {
  const db = platform?.env?.DB;
  const limit = Number(url.searchParams.get('limit') || 100);

  if (!db) {
    return { transactions: [], hasData: false, error: 'DB binding missing.' };
  }

  const transactions = await getLeagueTransactions(db, { limit });
  return {
    transactions,
    hasData: transactions.length > 0
  };
}
