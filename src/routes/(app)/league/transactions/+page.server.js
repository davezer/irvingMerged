import { getLiveTransactionsBundle } from '$lib/server/league/transactionsLive.js';
import { buildRosterIdentityMap } from '$lib/server/league/identity.js';
import { getSleeperRosters, getSleeperUsers } from '$lib/server/league/sleeperClient.js';

export async function load({ url, platform }) {
  const env = platform?.env;
  const bundle = await getLiveTransactionsBundle({ url, env });

  let teamOptions = [];

  try {
    const [users, rosters] = await Promise.all([
      getSleeperUsers(bundle.leagueId),
      getSleeperRosters(bundle.leagueId)
    ]);

    const rosterIdentityMap = buildRosterIdentityMap({ rosters, users });

    teamOptions = [...rosterIdentityMap.values()]
      .map((team) => ({
        rosterId: team.rosterId,
        teamName: team.teamName,
        managerName: team.managerName,
        teamPhoto: team.teamPhoto,
        initials: team.initials,
        managerSlug: team.managerSlug
      }))
      .sort((a, b) => a.teamName.localeCompare(b.teamName));
  } catch (error) {
    console.warn('[transactions] Could not build team filter options:', error);
  }

  return {
    ...bundle,
    teamOptions
  };
}
