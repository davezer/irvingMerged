import { getRivalryDeck } from '$lib/server/league/queries';

export async function load({ platform }) {
  const db = platform?.env?.DB;
  if (!db) return { rivalries: [] };

  return {
    rivalries: await getRivalryDeck(db)
  };
}
