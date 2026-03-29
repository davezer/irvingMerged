import { resolveLeagueContext } from '$lib/server/league/context.js';
import { buildRosterIdentityMap } from '$lib/server/league/identity.js';
import { resolvePlayersByIds } from '$lib/server/league/players.js';
import { getSleeperRosters, getSleeperUsers } from '$lib/server/league/sleeperClient.js';

function numberValue(value) {
  return Number(value || 0);
}

export async function load({ url, platform }) {
  const context = await resolveLeagueContext({ url, env: platform?.env, allWeeksByDefault: false });
  const [users, rosters] = await Promise.all([
    getSleeperUsers(context.leagueId),
    getSleeperRosters(context.leagueId)
  ]);

  const rosterIdentityMap = buildRosterIdentityMap({ rosters, users });
  const playerIds = rosters.flatMap((roster) => [...(roster.starters || []), ...(roster.players || [])]);
  const playersById = await resolvePlayersByIds(playerIds);

  const rows = rosters.map((roster) => {
    const identity = rosterIdentityMap.get(Number(roster.roster_id));
    const starters = (roster.starters || []).map((playerId) => playersById.get(String(playerId))).filter(Boolean);
    const bench = (roster.players || [])
      .filter((playerId) => !(roster.starters || []).includes(playerId))
      .map((playerId) => playersById.get(String(playerId)))
      .filter(Boolean);
    const settings = roster.settings || {};

    return {
      rosterId: Number(roster.roster_id),
      ownerId: roster.owner_id ? String(roster.owner_id) : null,
      managerName: identity?.managerName || 'Unknown Manager',
      teamName: identity?.teamName || `Roster ${roster.roster_id}`,
      teamPhoto: identity?.teamPhoto || null,
      managerSlug: identity?.managerSlug || null,
      initials: identity?.initials || '?',
      wins: numberValue(settings.wins),
      losses: numberValue(settings.losses),
      ties: numberValue(settings.ties),
      pointsFor: Number(`${settings.fpts || 0}.${settings.fpts_decimal || 0}`),
      pointsAgainst: Number(`${settings.fpts_against || 0}.${settings.fpts_against_decimal || 0}`),
      waiverBudgetUsed: numberValue(settings.waiver_budget_used || settings.waiver_budget_spent),
      starterCount: starters.length,
      playerCount: (roster.players || []).length,
      starters,
      benchCount: bench.length,
      metadata: roster.metadata || {}
    };
  }).sort((a, b) => (b.wins - a.wins) || (b.pointsFor - a.pointsFor) || a.teamName.localeCompare(b.teamName));

  return {
    season: context.season,
    leagueId: context.leagueId,
    leagueName: context.league?.name || 'League Rosters',
    rosters: rows,
    hasData: rows.length > 0,
    source: 'Sleeper API + runtime cache'
  };
}
