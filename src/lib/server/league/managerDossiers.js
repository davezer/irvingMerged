import {
  getLegacyManagerBySlug,
  getLegacyManagerProfiles,
  buildRosterIdentityMap,
  slugify
} from '$lib/server/league/identity.js';
import { buildStandingsRows } from '$lib/server/league/standings.js';
import { resolveLeagueContext } from '$lib/server/league/context.js';
import { resolvePlayersByIds } from '$lib/server/league/players.js';
import { buildWeeklyLineupSnapshots, summarizeLineupAnalytics } from '$lib/server/league/lineupAnalytics.js';
import { summarizeTradeProfile } from '$lib/server/league/tradeAnalytics.js';
import {
  getLeagueHistory,
  getSleeperDraftPicks,
  getSleeperLeagueDrafts,
  getSleeperLeague,
  getSleeperMatchupsForWeek,
  getSleeperRosters,
  getSleeperTransactionsForWeek,
  getSleeperUsers
} from '$lib/server/league/sleeperClient.js';

function choosePrimaryDraft(drafts = []) {
  if (!drafts.length) return null;
  return drafts.find((draft) => draft.status === 'complete') || drafts[0];
}

function moneyValue(pick) {
  const raw = pick?.metadata?.amount ?? pick?.metadata?.bid_amount ?? pick?.auction_amount ?? pick?.amount;
  return Number(raw || 0);
}

function resolveRosterIdByManager(rosters = [], managerId) {
  const roster = rosters.find((row) => String(row.owner_id || '') === String(managerId));
  return roster ? Number(roster.roster_id) : null;
}

function resolveStandingForProfile(standings = [], profile) {
  return standings.find((row) => String(row.ownerId || '') === String(profile.managerID))
    || standings.find((row) => String(row.slug || '') === slugify(profile.teamName || profile.name))
    || null;
}

function fixedFromSleeper(intPart, decimalPart) {
  const whole = Number(intPart || 0);
  const decimal = String(decimalPart ?? '0').replace(/[^0-9]/g, '').slice(0, 2);
  return Number(`${whole}.${decimal || '0'}`);
}

function buildStarterCards(roster, playersById) {
  return (roster?.starters || []).slice(0, 12).map((playerId) => playersById.get(String(playerId))).filter(Boolean);
}

function buildRecentMoves(rawWeeks = [], rosterId, playersById, rosterIdentityMap) {
  const moves = [];
  for (const bucket of rawWeeks) {
    for (const txn of bucket.items || []) {
      const rosterIds = (txn.roster_ids || []).map((id) => Number(id));
      const adds = Object.entries(txn.adds || {}).filter(([, id]) => Number(id) === rosterId).map(([playerId]) => playersById.get(String(playerId))).filter(Boolean);
      const drops = Object.entries(txn.drops || {}).filter(([, id]) => Number(id) === rosterId).map(([playerId]) => playersById.get(String(playerId))).filter(Boolean);
      const involved = rosterIds.includes(rosterId) || adds.length || drops.length;
      if (!involved) continue;
      moves.push({
        id: String(txn.transaction_id || `${bucket.week}-${moves.length}`),
        week: bucket.week,
        type: String(txn.type || 'move').replaceAll('_', ' '),
        createdAt: txn.status_updated || txn.created || null,
        counterparties: rosterIds.filter((id) => id !== rosterId).map((id) => rosterIdentityMap.get(id)?.teamName || `Roster ${id}`),
        adds,
        drops,
        addCount: adds.length,
        dropCount: drops.length
      });
    }
  }
  return moves.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)).slice(0, 10);
}

function buildMoveProfile(rawWeeks = [], rosterId) {
  const weekCounts = new Map();
  const profile = { totalMoves: 0, trades: 0, waivers: 0, freeAgents: 0, adds: 0, drops: 0, mostActiveWeek: null, lastMoveAt: null };
  for (const bucket of rawWeeks) {
    let bucketCount = 0;
    for (const txn of bucket.items || []) {
      const rosterIds = (txn.roster_ids || []).map((id) => Number(id));
      const involved = rosterIds.includes(rosterId)
        || Object.values(txn.adds || {}).some((id) => Number(id) === rosterId)
        || Object.values(txn.drops || {}).some((id) => Number(id) === rosterId);
      if (!involved) continue;
      profile.totalMoves += 1;
      bucketCount += 1;
      profile.adds += Object.values(txn.adds || {}).filter((id) => Number(id) === rosterId).length;
      profile.drops += Object.values(txn.drops || {}).filter((id) => Number(id) === rosterId).length;
      const type = String(txn.type || 'move');
      if (type === 'trade') profile.trades += 1;
      else if (type === 'waiver') profile.waivers += 1;
      else if (type === 'free_agent') profile.freeAgents += 1;
      const stamp = Number(txn.status_updated || txn.created || 0);
      if (stamp && (!profile.lastMoveAt || stamp > profile.lastMoveAt)) profile.lastMoveAt = stamp;
    }
    if (bucketCount) weekCounts.set(bucket.week, bucketCount);
  }
  let mostActive = 0;
  for (const [week, count] of weekCounts.entries()) {
    if (count > mostActive) {
      mostActive = count;
      profile.mostActiveWeek = week;
    }
  }
  return profile;
}

function buildTopSpendCards(picks = [], playersById) {
  return picks.map((pick) => ({
    id: String(pick.pick_no || `${pick.round}-${pick.player_id}`),
    amount: moneyValue(pick),
    round: Number(pick.round || 0),
    player: playersById.get(String(pick.player_id)) || {
      id: String(pick.player_id || 'unknown'),
      name: pick.metadata?.name || 'Unknown player',
      shortName: pick.metadata?.last_name || pick.metadata?.name || 'Unknown',
      position: pick.metadata?.position || null,
      teamLabel: pick.metadata?.team || null,
      photoUrl: 'https://sleepercdn.com/images/v2/icons/player_default.webp'
    }
  })).sort((a, b) => b.amount - a.amount || a.round - b.round).slice(0, 6);
}

function buildRecentMatchups(rawMatchups = [], rosterId, rosterIdentityMap) {
  return rawMatchups.map((bucket) => {
    const side = (bucket.items || []).find((item) => Number(item.roster_id) === Number(rosterId));
    if (!side) return null;
    const opponent = (bucket.items || []).find((item) => item.matchup_id === side.matchup_id && Number(item.roster_id) !== Number(rosterId));
    const opponentIdentity = opponent ? rosterIdentityMap.get(Number(opponent.roster_id)) : null;
    const score = Number(side.custom_points ?? side.points ?? 0);
    const oppScore = Number(opponent?.custom_points ?? opponent?.points ?? 0);
    return {
      week: bucket.week,
      score,
      oppScore,
      opponentRosterId: opponent ? Number(opponent.roster_id) : null,
      opponentTeam: opponentIdentity?.teamName || (opponent ? `Roster ${opponent.roster_id}` : 'Bye'),
      opponentSlug: opponentIdentity?.managerSlug || null,
      result: !opponent ? 'Bye' : score === oppScore ? 'Tie' : score > oppScore ? 'Win' : 'Loss',
      margin: Number((score - oppScore).toFixed(2))
    };
  }).filter(Boolean).sort((a, b) => b.week - a.week).slice(0, 6);
}

function buildCurrentSeasonAnalytics(recentMatchups = [], standing) {
  const scores = recentMatchups.map((game) => game.score);
  if (!scores.length) {
    return { averageScore: 0, medianScore: 0, bestWeek: null, worstWeek: null, averageMargin: 0, scoreVolatility: 0, winRate: standing?.pct || 0 };
  }
  const sorted = [...scores].sort((a, b) => a - b);
  const avg = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
  const med = sorted.length % 2 ? sorted[Math.floor(sorted.length / 2)] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  const variance = sorted.reduce((sum, value) => sum + ((value - avg) ** 2), 0) / sorted.length;
  return {
    averageScore: Number(avg.toFixed(2)),
    medianScore: Number(med.toFixed(2)),
    bestWeek: [...recentMatchups].sort((a, b) => b.score - a.score)[0] || null,
    worstWeek: [...recentMatchups].sort((a, b) => a.score - b.score)[0] || null,
    averageMargin: Number((recentMatchups.reduce((sum, game) => sum + game.margin, 0) / recentMatchups.length).toFixed(2)),
    scoreVolatility: Number(Math.sqrt(variance).toFixed(2)),
    winRate: standing?.pct || 0
  };
}

async function buildSeasonHistory(rootLeagueId, profile) {
  const history = await getLeagueHistory(rootLeagueId);
  const seasons = await Promise.all(history.map(async (league) => {
    const [users, rosters] = await Promise.all([getSleeperUsers(league.league_id), getSleeperRosters(league.league_id)]);
    const standings = buildStandingsRows({ rosters, users });
    const standing = resolveStandingForProfile(standings, profile);
    return standing ? {
      season: Number(league.season),
      leagueId: String(league.league_id),
      rank: standing.rank,
      recordLabel: standing.recordLabel,
      wins: standing.wins,
      losses: standing.losses,
      ties: standing.ties,
      points: standing.points,
      pointsAgainst: standing.pointsAgainst,
      pointDiff: standing.pointDiff,
      champion: standing.rank === 1
    } : null;
  }));
  return seasons.filter(Boolean).sort((a, b) => b.season - a.season);
}

function buildCareerSummary(seasonHistory = []) {
  if (!seasonHistory.length) return { titles: 0, podiums: 0, seasons: 0, averageFinish: null, bestFinish: null, totalPoints: 0 };
  const titles = seasonHistory.filter((season) => season.rank === 1).length;
  const podiums = seasonHistory.filter((season) => season.rank <= 3).length;
  const totalPoints = seasonHistory.reduce((sum, season) => sum + Number(season.points || 0), 0);
  const averageFinish = seasonHistory.reduce((sum, season) => sum + Number(season.rank || 0), 0) / seasonHistory.length;
  return {
    titles,
    podiums,
    seasons: seasonHistory.length,
    averageFinish: Number(averageFinish.toFixed(2)),
    bestFinish: seasonHistory.reduce((best, season) => Math.min(best, Number(season.rank || 99)), 99),
    totalPoints: Number(totalPoints.toFixed(2))
  };
}

function buildWeeklyLinks(lineupWeeks = [], slug, season) {
  return [...lineupWeeks]
    .sort((a, b) => b.week - a.week)
    .slice(0, 6)
    .map((week) => ({
      week: week.week,
      href: `/league/teams/${slug}/weeks/${week.week}?season=${season}`,
      lineupIQ: week.lineupIQ,
      benchPoints: week.benchPoints,
      optimalScore: week.optimalScore
    }));
}

export async function getManagersIndexBundle({ url, env } = {}) {
  const context = await resolveLeagueContext({ url, env, allWeeksByDefault: false });
  const [users, rosters] = await Promise.all([getSleeperUsers(context.leagueId), getSleeperRosters(context.leagueId)]);
  const standings = buildStandingsRows({ rosters, users });
  const standingsByOwner = new Map(standings.map((row) => [String(row.ownerId || ''), row]));
  const rosterByOwner = new Map(rosters.map((roster) => [String(roster.owner_id || ''), roster]));
  const rosterIdentityMap = buildRosterIdentityMap({ rosters, users });
  const dossiers = getLegacyManagerProfiles().map((manager) => {
    const standing = standingsByOwner.get(String(manager.managerID)) || null;
    const roster = rosterByOwner.get(String(manager.managerID)) || null;
    const identity = roster ? rosterIdentityMap.get(Number(roster.roster_id)) : null;
    return {
      ...manager,
      standing,
      liveTeamName: standing?.teamName || identity?.teamName || manager.teamName,
      liveTeamPhoto: standing?.teamPhoto || identity?.teamPhoto || manager.photo,
      currentRecord: standing?.recordLabel || '—',
      currentRank: standing?.rank || null,
      currentPoints: standing?.points || 0,
      currentPointDiff: standing?.pointDiff || 0,
      starterCount: Array.isArray(roster?.starters) ? roster.starters.length : 0,
      playerCount: Array.isArray(roster?.players) ? roster.players.length : 0,
      quickLinks: {
        dossier: `/league/managers/${manager.slug}?season=${context.season}`,
        games: `/league/matchups?season=${context.season}&team=${manager.slug}`,
        moves: `/league/transactions?season=${context.season}&team=${manager.slug}`,
        franchise: `/league/teams/${manager.slug}?season=${context.season}`
      }
    };
  }).sort((a, b) => (a.currentRank || 99) - (b.currentRank || 99) || a.teamName.localeCompare(b.teamName));

  return { ...context, dossiers, hasData: dossiers.length > 0, source: 'Sleeper API + shared edge/runtime cache' };
}

export async function getManagerDossierBundle({ url, env, slug } = {}) {
  const profile = getLegacyManagerBySlug(slug);
  if (!profile) return null;

  const context = await resolveLeagueContext({ url, env, allWeeksByDefault: false });
  const [league, users, rosters] = await Promise.all([
    getSleeperLeague(context.leagueId),
    getSleeperUsers(context.leagueId),
    getSleeperRosters(context.leagueId)
  ]);
  const rosterIdentityMap = buildRosterIdentityMap({ rosters, users });
  const standings = buildStandingsRows({ rosters, users });
  const standing = resolveStandingForProfile(standings, profile);
  const roster = rosters.find((row) => String(row.owner_id || '') === String(profile.managerID)) || null;
  const rosterId = resolveRosterIdByManager(rosters, profile.managerID);

  const [drafts, transactionWeeks, matchupWeeks, seasonHistory] = await Promise.all([
    getSleeperLeagueDrafts(context.leagueId),
    Promise.all(context.availableWeeks.slice(-6).map(async (week) => ({ week, items: await getSleeperTransactionsForWeek(context.leagueId, week) }))),
    Promise.all(context.availableWeeks.slice(-8).map(async (week) => ({ week, items: await getSleeperMatchupsForWeek(context.leagueId, week) }))),
    buildSeasonHistory(context.rootLeagueId, profile)
  ]);

  const primaryDraft = choosePrimaryDraft(drafts);
  const draftPicks = primaryDraft ? await getSleeperDraftPicks(primaryDraft.draft_id) : [];
  const myDraftPicks = draftPicks.filter((pick) => String(pick.picked_by || pick.roster_id || '') === String(profile.managerID) || Number(pick.roster_id || 0) === Number(rosterId || 0));

  const playerIds = [
    ...(roster?.starters || []),
    ...(roster?.players || []),
    ...transactionWeeks.flatMap((bucket) => bucket.items.flatMap((txn) => [...Object.keys(txn?.adds || {}), ...Object.keys(txn?.drops || {})])),
    ...myDraftPicks.map((pick) => pick.player_id)
  ];
  const playersById = await resolvePlayersByIds(playerIds);

  const starters = buildStarterCards(roster, playersById);
  const recentMoves = rosterId ? buildRecentMoves(transactionWeeks, rosterId, playersById, rosterIdentityMap) : [];
  const recentMatchups = rosterId ? buildRecentMatchups(matchupWeeks, rosterId, rosterIdentityMap) : [];
  const seasonAnalytics = buildCurrentSeasonAnalytics(recentMatchups, standing);
  const lineupWeeks = rosterId ? buildWeeklyLineupSnapshots(matchupWeeks, rosterId, { roster, league, playersById }) : [];
  const lineupAnalytics = summarizeLineupAnalytics(lineupWeeks);
  const career = buildCareerSummary(seasonHistory);
  const moveProfile = buildMoveProfile(transactionWeeks, rosterId);
  const tradeProfile = summarizeTradeProfile(transactionWeeks, rosterId, rosterIdentityMap, playersById);

  const dossierStats = [
    { label: 'Current rank', value: standing?.rank ? `#${standing.rank}` : '—' },
    { label: 'Record', value: standing?.recordLabel || '—' },
    { label: 'Points for', value: (standing?.points || fixedFromSleeper(roster?.settings?.fpts, roster?.settings?.fpts_decimal)).toFixed(2) },
    { label: 'Career titles', value: String(career.titles || 0) }
  ];

  const analyticsCards = [
    { label: 'Avg lineup IQ', value: `${lineupAnalytics.averageLineupIQ.toFixed(1)}%`, hint: 'Slot-valid estimate using the league roster positions from Sleeper.' },
    { label: 'Start/sit hit rate', value: `${lineupAnalytics.averageHitRate.toFixed(1)}%`, hint: 'How often the legal optimal lineup overlaps with the actual starters.' },
    { label: 'Bench points lost', value: `${lineupAnalytics.totalBenchPoints.toFixed(2)}`, hint: 'Total legal swing left on the bench across the sampled weeks.' },
    { label: 'Trade style', value: tradeProfile.marketStyle, hint: tradeProfile.tradeCount ? `${tradeProfile.tradeCount} trade${tradeProfile.tradeCount === 1 ? '' : 's'} • favorite partner ${tradeProfile.favoritePartner || '—'}` : 'No live trade tape yet.' }
  ];

  return {
    ...context,
    manager: {
      ...profile,
      slug,
      photo: standing?.teamPhoto || profile.photo,
      liveTeamName: standing?.teamName || profile.teamName,
      recordLabel: standing?.recordLabel || '—',
      currentRank: standing?.rank || null,
      pointsFor: standing?.points || fixedFromSleeper(roster?.settings?.fpts, roster?.settings?.fpts_decimal),
      pointsAgainst: standing?.pointsAgainst || fixedFromSleeper(roster?.settings?.fpts_against, roster?.settings?.fpts_against_decimal),
      currentPointDiff: standing?.pointDiff || 0,
      waiverBudgetUsed: Number(roster?.settings?.waiver_budget_used || roster?.settings?.waiver_budget_spent || 0)
    },
    dossierStats,
    analyticsCards,
    seasonAnalytics,
    lineupAnalytics,
    starters,
    lineupWeeks,
    topSpend: buildTopSpendCards(myDraftPicks, playersById),
    recentMoves,
    recentMatchups,
    moveProfile,
    tradeProfile,
    seasonHistory,
    career,
    weeklyLinks: buildWeeklyLinks(lineupWeeks, slug, context.season),
    quickLinks: {
      moves: `/league/transactions?season=${context.season}&team=${slug}`,
      games: `/league/matchups?season=${context.season}&team=${slug}`,
      standings: `/league/standings?season=${context.season}`,
      drafts: `/league/drafts?season=${context.season}`,
      franchise: `/league/teams/${slug}?season=${context.season}`
    },
    futureMetrics: [
      'Close-loss swing points by week',
      'Opponent-adjusted lineup pressure',
      'Trade value gained vs future market baseline',
      'Bench leverage in one-score matchup weeks',
      'Weekly risk profile and boom/bust classification'
    ],
    source: 'Sleeper API + shared edge/runtime cache'
  };
}
