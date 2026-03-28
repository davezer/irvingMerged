import { parseSeasonParam } from '$lib/server/league/season.js';
import { buildRosterIdentityMap } from '$lib/server/league/identity.js';
import { getSleeperLeagueBundle, resolvePlayersByIds } from '$lib/server/league/sleeperCache.js';

export async function load({ url, platform }) {
  const season = parseSeasonParam(url.searchParams.get('season'));
  const explicitLeagueId = String(url.searchParams.get('leagueId') || '').trim() || null;

  try {
    const { leagueId, rosters, users } = await getSleeperLeagueBundle({
      env: platform?.env,
      season,
      weeks: [],
      urlLeagueId: explicitLeagueId
    });

    const rosterMap = buildRosterIdentityMap({ rosters, users });
    const starterIds = rosters.flatMap((roster) => roster?.starters || []);
    const playerMap = await resolvePlayersByIds(starterIds);

    const enrichedRosters = rosters.map((roster) => {
      const rosterId = Number(roster.roster_id);
      const identity = rosterMap.get(rosterId) || {
        teamName: `Roster ${rosterId}`,
        teamPhoto: null,
        managerName: 'Unknown Manager',
        managerSlug: null,
        initials: '??'
      };

      const settings = roster?.settings || {};
      const starters = (roster?.starters || []).map((playerId) => playerMap.get(String(playerId)) || null).filter(Boolean);
      const players = roster?.players || [];

      return {
        rosterId,
        ownerId: roster?.owner_id ? String(roster.owner_id) : null,
        teamName: identity.teamName,
        displayName: identity.teamName,
        managerName: identity.managerName,
        avatarUrl: identity.teamPhoto,
        initials: identity.initials,
        managerSlug: identity.managerSlug,
        wins: Number(settings.wins || 0),
        losses: Number(settings.losses || 0),
        ties: Number(settings.ties || 0),
        starterCount: starters.length,
        playerCount: players.length,
        waiverBudgetUsed: Number(settings.waiver_budget_used || settings.waiver_budget_spent || 0),
        starters,
        season,
        leagueId
      };
    });

    return {
      season,
      leagueId,
      rosters: enrichedRosters,
      hasData: enrichedRosters.length > 0,
      source: 'sleeper-cache'
    };
  } catch (error) {
    return {
      season,
      leagueId: explicitLeagueId,
      rosters: [],
      hasData: false,
      error: error?.message || 'Failed to load Sleeper rosters.',
      source: 'sleeper-cache'
    };
  }
}
