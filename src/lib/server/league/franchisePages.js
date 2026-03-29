import { error } from '@sveltejs/kit';
import { getLegacyManagerBySlug } from '$lib/server/league/identity.js';
import { getManagersIndexBundle, getManagerDossierBundle } from '$lib/server/league/managerDossiers.js';
import { resolveLeagueContext } from '$lib/server/league/context.js';
import { buildRosterIdentityMap } from '$lib/server/league/identity.js';
import { resolvePlayersByIds } from '$lib/server/league/players.js';
import { buildSingleWeekLineupSnapshot } from '$lib/server/league/lineupAnalytics.js';
import { getSleeperLeague, getSleeperMatchupsForWeek, getSleeperRosters, getSleeperUsers } from '$lib/server/league/sleeperClient.js';

export async function getTeamsIndexBundle({ url, env } = {}) {
  const base = await getManagersIndexBundle({ url, env });
  const cards = base.dossiers.map((row) => ({
    slug: row.slug,
    teamName: row.liveTeamName,
    teamPhoto: row.liveTeamPhoto,
    managerName: row.name,
    bio: row.bio,
    currentRank: row.currentRank,
    currentRecord: row.currentRecord,
    currentPoints: row.currentPoints,
    currentPointDiff: row.currentPointDiff,
    quickLinks: {
      team: `/league/teams/${row.slug}?season=${base.season}`,
      dossier: row.quickLinks.dossier,
      games: row.quickLinks.games,
      moves: row.quickLinks.moves,
      drafts: `/league/drafts?season=${base.season}`
    }
  }));

  return {
    ...base,
    cards,
    source: 'Sleeper API + shared edge/runtime cache'
  };
}

export async function getTeamDetailBundle({ url, env, slug } = {}) {
  const profile = getLegacyManagerBySlug(slug);
  if (!profile) throw error(404, 'Team not found');
  const dossier = await getManagerDossierBundle({ url, env, slug });
  if (!dossier) throw error(404, 'Team not found');

  return {
    ...dossier,
    franchise: {
      slug,
      teamName: dossier.manager.liveTeamName,
      teamPhoto: dossier.manager.photo,
      managerName: dossier.manager.name,
      bio: dossier.manager.bio,
      currentRank: dossier.manager.currentRank,
      recordLabel: dossier.manager.recordLabel,
      pointsFor: dossier.manager.pointsFor,
      pointsAgainst: dossier.manager.pointsAgainst,
      pointDiff: dossier.manager.currentPointDiff,
      favoriteTeam: dossier.manager.favoriteTeam,
      philosophy: dossier.manager.philosophy,
      preferredContact: dossier.manager.preferredContact,
      championship: dossier.manager.championship
    },
    sections: {
      dossier: `/league/managers/${slug}?season=${dossier.season}`,
      moves: `/league/transactions?season=${dossier.season}&team=${slug}`,
      games: `/league/matchups?season=${dossier.season}&team=${slug}`,
      drafts: `/league/drafts?season=${dossier.season}`,
      standings: `/league/standings?season=${dossier.season}`
    },
    source: dossier.source
  };
}

export async function getTeamWeeklyBundle({ url, env, slug, week } = {}) {
  const profile = getLegacyManagerBySlug(slug);
  if (!profile) throw error(404, 'Team not found');

  const dossier = await getManagerDossierBundle({ url, env, slug });
  if (!dossier) throw error(404, 'Team not found');

  const context = await resolveLeagueContext({ url, env, allWeeksByDefault: false });
  const selectedWeek = Number(week || context.selectedWeek || 1);
  const [league, users, rosters, matchups] = await Promise.all([
    getSleeperLeague(context.leagueId),
    getSleeperUsers(context.leagueId),
    getSleeperRosters(context.leagueId),
    getSleeperMatchupsForWeek(context.leagueId, selectedWeek)
  ]);

  const roster = rosters.find((row) => String(row.owner_id || '') === String(profile.managerID)) || null;
  const rosterId = Number(roster?.roster_id || 0) || null;
  if (!rosterId) throw error(404, 'Team roster not found');

  const rosterIdentityMap = buildRosterIdentityMap({ rosters, users });
  const side = (matchups || []).find((item) => Number(item.roster_id) === rosterId) || null;
  const opponent = side ? (matchups || []).find((item) => item.matchup_id === side.matchup_id && Number(item.roster_id) !== rosterId) : null;

  const playerIds = [
    ...(side?.players || []),
    ...(side?.starters || []),
    ...(opponent?.players || []),
    ...(opponent?.starters || [])
  ];
  const playersById = await resolvePlayersByIds(playerIds);
  const lineupSnapshot = buildSingleWeekLineupSnapshot({ week: selectedWeek, side, roster, league, playersById });

  const opponentIdentity = opponent ? rosterIdentityMap.get(Number(opponent.roster_id)) : null;
  const previousWeek = context.availableWeeks.filter((value) => value < selectedWeek).at(-1) || null;
  const nextWeek = context.availableWeeks.find((value) => value > selectedWeek) || null;

  return {
    ...dossier,
    week: selectedWeek,
    previousWeek,
    nextWeek,
    lineupSnapshot,
    opponent: opponent ? {
      rosterId: Number(opponent.roster_id),
      matchupId: Number(opponent.matchup_id),
      score: Number(opponent.custom_points ?? opponent.points ?? 0),
      teamName: opponentIdentity?.teamName || `Roster ${opponent.roster_id}`,
      teamPhoto: opponentIdentity?.teamPhoto || null,
      managerSlug: opponentIdentity?.managerSlug || null,
      managerName: opponentIdentity?.managerName || 'Unknown Manager'
    } : null,
    actualScore: Number(side?.custom_points ?? side?.points ?? 0),
    sections: {
      team: `/league/teams/${slug}?season=${context.season}`,
      dossier: `/league/managers/${slug}?season=${context.season}`,
      moves: `/league/transactions?season=${context.season}&team=${slug}`,
      games: `/league/matchups?season=${context.season}&team=${slug}`
    }
  };
}
