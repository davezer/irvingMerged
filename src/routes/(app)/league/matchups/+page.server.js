import { resolveLeagueContext } from '$lib/server/league/context.js';
import { buildRosterIdentityMap, resolveSelectedTeam } from '$lib/server/league/identity.js';
import { resolvePlayersByIds } from '$lib/server/league/players.js';
import { getSleeperMatchupsForWeek, getSleeperRosters, getSleeperUsers } from '$lib/server/league/sleeperClient.js';
import {
  buildRosterSettingsMap,
  buildWeekHighlights,
  chunkPairs,
  normalizeMatchupGroup
} from '$lib/server/league/matchupAnalytics.js';

function buildRivalryCards(historyWeeks = [], rosterIdentityMap, selectedRosterId = null) {
  const rivalryMap = new Map();

  for (const week of historyWeeks) {
    for (const matchup of week.matchups) {
      if (!matchup.left || !matchup.right) continue;
      if (selectedRosterId && matchup.left.rosterId !== selectedRosterId && matchup.right.rosterId !== selectedRosterId) continue;
      const ids = [matchup.left.rosterId, matchup.right.rosterId].sort((a, b) => a - b);
      const key = ids.join(':');
      if (!rivalryMap.has(key)) {
        const leftIdentity = rosterIdentityMap.get(ids[0]);
        const rightIdentity = rosterIdentityMap.get(ids[1]);
        rivalryMap.set(key, {
          key,
          leftRosterId: ids[0],
          rightRosterId: ids[1],
          leftTeamName: leftIdentity?.teamName || `Roster ${ids[0]}`,
          rightTeamName: rightIdentity?.teamName || `Roster ${ids[1]}`,
          leftSlug: leftIdentity?.managerSlug || null,
          rightSlug: rightIdentity?.managerSlug || null,
          leftWins: 0,
          rightWins: 0,
          meetings: 0,
          closestMargin: null,
          lastWeek: null,
          totalMargin: 0
        });
      }

      const card = rivalryMap.get(key);
      card.meetings += 1;
      card.lastWeek = week.week;
      if (matchup.winner === card.leftRosterId) card.leftWins += 1;
      if (matchup.winner === card.rightRosterId) card.rightWins += 1;
      if (matchup.margin !== null) {
        card.totalMargin += matchup.margin;
        card.closestMargin = card.closestMargin === null ? matchup.margin : Math.min(card.closestMargin, matchup.margin);
      }
    }
  }

  return [...rivalryMap.values()]
    .map((card) => ({
      ...card,
      averageMargin: card.meetings ? Number((card.totalMargin / card.meetings).toFixed(2)) : 0,
      leader: card.leftWins === card.rightWins
        ? 'Even'
        : (card.leftWins > card.rightWins ? card.leftTeamName : card.rightTeamName)
    }))
    .sort((a, b) => (b.meetings - a.meetings) || (a.averageMargin - b.averageMargin) || a.leftTeamName.localeCompare(b.leftTeamName))
    .slice(0, 6);
}


function matchupsForSelectedTeam(matchups = [], selectedRosterId = null) {
  if (!selectedRosterId) return matchups;
  return matchups.filter((matchup) => matchup.left?.rosterId === selectedRosterId || matchup.right?.rosterId === selectedRosterId);
}

export async function load({ url, platform }) {
  const context = await resolveLeagueContext({ url, env: platform?.env, allWeeksByDefault: false });
  const [users, rosters] = await Promise.all([
    getSleeperUsers(context.leagueId),
    getSleeperRosters(context.leagueId)
  ]);

  const rosterIdentityMap = buildRosterIdentityMap({ rosters, users });
  const rosterSettingsMap = buildRosterSettingsMap(rosters);
  const filterTeam = resolveSelectedTeam({
    teamParam: url.searchParams.get('team') || null,
    rosterIdParam: url.searchParams.get('rosterId') || null,
    rosters,
    users
  });

  const historyWeeks = context.availableWeeks.filter((week) => week <= context.selectedWeek);
  const bracketWeeks = context.playoffWeeks.slice(0, 3);
  const weeksToFetch = [...new Set([context.selectedWeek, ...historyWeeks, ...bracketWeeks])];
  const fetched = await Promise.all(weeksToFetch.map(async (week) => [week, await getSleeperMatchupsForWeek(context.leagueId, week)]));
  const rawByWeek = new Map(fetched);

  const selectedRaw = rawByWeek.get(context.selectedWeek) || [];
  const selectedPlayerIds = selectedRaw.flatMap(
  (entry) => [
    ...(entry.starters || []),
    ...(entry.players || [])
  ]
);
  const playersById = await resolvePlayersByIds(selectedPlayerIds);

  const selectedWeekMatchups = chunkPairs(selectedRaw)
    .map((group) => normalizeMatchupGroup(group, rosterIdentityMap, rosterSettingsMap, playersById, { includeStarters: true }));

  const selectedWeek = {
    week: context.selectedWeek,
    matchups: matchupsForSelectedTeam(selectedWeekMatchups, filterTeam?.rosterId || null)
  };

  const history = historyWeeks.map((week) => ({
    week,
    matchups: matchupsForSelectedTeam(
      chunkPairs(rawByWeek.get(week) || []).map((group) => normalizeMatchupGroup(group, rosterIdentityMap, rosterSettingsMap, new Map(), { includeStarters: false })),
      filterTeam?.rosterId || null
    )
  }));

  const playoffBoard = bracketWeeks
    .map((week) => ({
      week,
      games: matchupsForSelectedTeam(
        chunkPairs(rawByWeek.get(week) || [])
          .map((group) => normalizeMatchupGroup(group, rosterIdentityMap, rosterSettingsMap, new Map(), { includeStarters: false }))
          .filter((game) => game.left && game.right),
        filterTeam?.rosterId || null
      )
    }))
    .filter((week) => week.games.length > 0);

  return {
    season: context.season,
    leagueId: context.leagueId,
    selectedWeek: context.selectedWeek,
    availableWeeks: context.availableWeeks,
    previousWeek: context.availableWeeks.filter((week) => week < context.selectedWeek).at(-1) || null,
    nextWeek: context.availableWeeks.find((week) => week > context.selectedWeek) || null,
    week: selectedWeek,
    filterTeam,
    highlights: buildWeekHighlights(selectedWeek.matchups),
    rivalryCards: buildRivalryCards(history, rosterIdentityMap, filterTeam?.rosterId || null),
    playoffBoard,
    hasData: selectedWeek.matchups.length > 0,
    source: 'Sleeper API + shared edge/runtime cache'
  };
}
