import { getLeagueRosters } from '$lib/server/league/queries';

export async function load({ platform }) {
  const db = platform?.env?.DB;
  if (!db) {
    return { rosters: [], hasData: false, error: 'DB binding missing.' };
  }

  const rosters = await getLeagueRosters(db);
  return {
    rosters,
    hasData: rosters.length > 0
  };
}
