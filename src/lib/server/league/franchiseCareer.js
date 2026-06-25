import { resolveRuntimeEnv } from '$lib/server/env.js';
import { buildRosterIdentityMap, slugify } from '$lib/server/league/identity.js';
import { buildStandingsRows } from '$lib/server/league/standings.js';
import { getDefaultWeeksForSeason } from '$lib/server/league/season.js';
import {
  getLeagueHistory,
  getSleeperLeague,
  getSleeperMatchupsForWeek,
  getSleeperRosters,
  getSleeperUsers
} from '$lib/server/league/sleeperClient.js';

function numberValue(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function recordPct(wins, losses, ties) {
  const games = numberValue(wins) + numberValue(losses) + numberValue(ties);
  return games ? Number(((numberValue(wins) + numberValue(ties) * 0.5) / games).toFixed(3)) : 0;
}

function recordLabel({ wins = 0, losses = 0, ties = 0 } = {}) {
  return `${wins}-${losses}${ties ? `-${ties}` : ''}`;
}

function parseLeagueIds(value) {
  return String(value || '')
    .split(/[\s,|]+/)
    .map((id) => id.trim())
    .filter(Boolean);
}

function parseLegacyTitleYears(profile = {}) {
  const raw = profile?.championship?.years;
  if (!raw) return [];
  return String(raw)
    .split(/[,|/]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

async function safeArray(label, task) {
  try {
    const value = await task();
    return Array.isArray(value) ? value : [];
  } catch (err) {
    console.warn(`[franchiseCareer] ${label} failed`, err?.message || err);
    return [];
  }
}

async function safeLeague(leagueId) {
  try {
    return await getSleeperLeague(leagueId);
  } catch (err) {
    console.warn(`[franchiseCareer] league ${leagueId} failed`, err?.message || err);
    return null;
  }
}

function resolveStandingForProfile(standings = [], profile = {}) {
  return standings.find((row) => String(row.ownerId || '') === String(profile.managerID))
    || standings.find((row) => String(row.slug || '') === slugify(profile.teamName || profile.name))
    || null;
}

function resolveRosterForProfile(rosters = [], profile = {}) {
  return rosters.find((row) => String(row.owner_id || '') === String(profile.managerID)) || null;
}

function isCompletedHistoricalSeason({ season, currentSeason, league }) {
  const selected = Number(season);
  const current = Number(currentSeason);
  const status = String(league?.status || '').toLowerCase();
  return selected < current || status === 'complete' || status === 'completed' || status === 'closed';
}

function weeksForLeague({ league, currentSeason, currentWeek }) {
  const season = Number(league?.season || 0);
  const weeks = getDefaultWeeksForSeason(season);
  if (isCompletedHistoricalSeason({ season, currentSeason, league })) return weeks;
  const maxWeek = Math.max(1, Math.min(18, Number(currentWeek || 1)));
  return weeks.filter((week) => week <= maxWeek);
}

async function resolveCareerLeagues({ rootLeagueId, env } = {}) {
  const runtimeEnv = resolveRuntimeEnv(env);
  const explicitIds = parseLeagueIds(runtimeEnv?.SLEEPER_ALL_TIME_LEAGUE_IDS || runtimeEnv?.SLEEPER_LEAGUE_IDS);
  const byId = new Map();

  const addLeague = async (leagueId) => {
    if (!leagueId || byId.has(String(leagueId))) return;
    const league = await safeLeague(leagueId);
    if (league?.league_id) byId.set(String(league.league_id), league);
  };

  await Promise.all(explicitIds.map(addLeague));

  if (rootLeagueId) {
    const chained = await safeArray(`league history ${rootLeagueId}`, () => getLeagueHistory(rootLeagueId));
    for (const league of chained) {
      if (league?.league_id) byId.set(String(league.league_id), league);
    }
  }

  return [...byId.values()].sort((a, b) => Number(b.season || 0) - Number(a.season || 0));
}

async function buildSeasonRow({ league, profile, currentSeason, currentWeek }) {
  const [users, rosters] = await Promise.all([
    safeArray(`users ${league.league_id}`, () => getSleeperUsers(league.league_id)),
    safeArray(`rosters ${league.league_id}`, () => getSleeperRosters(league.league_id))
  ]);

  if (!rosters.length) return null;

  const standings = buildStandingsRows({ rosters, users });
  const standing = resolveStandingForProfile(standings, profile);
  const roster = resolveRosterForProfile(rosters, profile);
  const rosterId = roster ? Number(roster.roster_id) : null;
  const rosterIdentityMap = buildRosterIdentityMap({ rosters, users });
  const weeks = rosterId ? weeksForLeague({ league, currentSeason, currentWeek }) : [];

  const weekBuckets = await Promise.all(weeks.map(async (week) => ({
    week,
    items: await safeArray(`matchups ${league.league_id} week ${week}`, () => getSleeperMatchupsForWeek(league.league_id, week))
  })));

  const games = weekBuckets.map((bucket) => {
    const side = (bucket.items || []).find((item) => Number(item.roster_id) === Number(rosterId));
    if (!side) return null;
    const opponent = (bucket.items || []).find((item) => item.matchup_id === side.matchup_id && Number(item.roster_id) !== Number(rosterId));
    const opponentIdentity = opponent ? rosterIdentityMap.get(Number(opponent.roster_id)) : null;
    const score = Number(side.custom_points ?? side.points ?? 0);
    const oppScore = Number(opponent?.custom_points ?? opponent?.points ?? 0);
    const isBye = !opponent || !side.matchup_id;
    const result = isBye ? 'Bye' : score === oppScore ? 'Tie' : score > oppScore ? 'Win' : 'Loss';

    return {
      season: Number(league.season),
      leagueId: String(league.league_id),
      week: bucket.week,
      score,
      oppScore,
      result,
      margin: Number((score - oppScore).toFixed(2)),
      opponentRosterId: opponent ? Number(opponent.roster_id) : null,
      opponentTeam: opponentIdentity?.teamName || (opponent ? `Roster ${opponent.roster_id}` : 'Bye'),
      opponentSlug: opponentIdentity?.managerSlug || null
    };
  }).filter(Boolean);
const completed = isCompletedHistoricalSeason({
  season: league.season,
  currentSeason,
  league
});
  return standing ? {
    season: Number(league.season),
    leagueId: String(league.league_id),
    leagueName: league.name || `Season ${league.season}`,
    rank: standing.rank,
    recordLabel: standing.recordLabel,
    wins: numberValue(standing.wins),
    losses: numberValue(standing.losses),
    ties: numberValue(standing.ties),
    gamesPlayed: numberValue(standing.wins) + numberValue(standing.losses) + numberValue(standing.ties),
    pct: recordPct(standing.wins, standing.losses, standing.ties),
    points: numberValue(standing.points),
    pointsAgainst: numberValue(standing.pointsAgainst),
    pointDiff: numberValue(standing.pointDiff),
    weeksSampled: weeks.length,
    games,
    isCurrentSeason: Number(league.season) === Number(currentSeason),
    completed,
    champion: completed && Number(standing.rank) === 1,
    source: 'Sleeper roster settings + weekly matchup ledger'
  } : null;
}

function summarizeGames(games = []) {
  const decided = games.filter((game) => ['Win', 'Loss', 'Tie'].includes(game.result));
  const wins = decided.filter((game) => game.result === 'Win').length;
  const losses = decided.filter((game) => game.result === 'Loss').length;
  const ties = decided.filter((game) => game.result === 'Tie').length;
  const pointsFor = games.reduce((sum, game) => sum + numberValue(game.score), 0);
  const pointsAgainst = games.reduce((sum, game) => sum + numberValue(game.oppScore), 0);
  const bestScore = games.length ? [...games].sort((a, b) => b.score - a.score)[0] : null;
  const worstScore = games.length ? [...games].sort((a, b) => a.score - b.score)[0] : null;
  const biggestWin = decided.filter((game) => game.result === 'Win').sort((a, b) => b.margin - a.margin)[0] || null;
  const worstLoss = decided.filter((game) => game.result === 'Loss').sort((a, b) => a.margin - b.margin)[0] || null;

  return {
    recordLabel: recordLabel({ wins, losses, ties }),
    wins,
    losses,
    ties,
    gamesPlayed: wins + losses + ties,
    pct: recordPct(wins, losses, ties),
    pointsFor: Number(pointsFor.toFixed(2)),
    pointsAgainst: Number(pointsAgainst.toFixed(2)),
    pointDiff: Number((pointsFor - pointsAgainst).toFixed(2)),
    averageFor: games.length ? Number((pointsFor / games.length).toFixed(2)) : 0,
    averageAgainst: games.length ? Number((pointsAgainst / games.length).toFixed(2)) : 0,
    bestScore,
    worstScore,
    biggestWin,
    worstLoss
  };
}

function summarizeOfficialRecord(seasons = []) {
  const wins = seasons.reduce((sum, season) => sum + numberValue(season.wins), 0);
  const losses = seasons.reduce((sum, season) => sum + numberValue(season.losses), 0);
  const ties = seasons.reduce((sum, season) => sum + numberValue(season.ties), 0);
  const pointsFor = seasons.reduce((sum, season) => sum + numberValue(season.points), 0);
  const pointsAgainst = seasons.reduce((sum, season) => sum + numberValue(season.pointsAgainst), 0);
  const ranked = seasons.filter((season) => Number.isFinite(Number(season.rank)));
  const averageFinish = ranked.length
    ? ranked.reduce((sum, season) => sum + numberValue(season.rank), 0) / ranked.length
    : null;

  return {
    recordLabel: recordLabel({ wins, losses, ties }),
    wins,
    losses,
    ties,
    gamesPlayed: wins + losses + ties,
    pct: recordPct(wins, losses, ties),
    pointsFor: Number(pointsFor.toFixed(2)),
    pointsAgainst: Number(pointsAgainst.toFixed(2)),
    pointDiff: Number((pointsFor - pointsAgainst).toFixed(2)),
    averagePointsFor: seasons.length ? Number((pointsFor / seasons.length).toFixed(2)) : 0,
    averagePointsAgainst: seasons.length ? Number((pointsAgainst / seasons.length).toFixed(2)) : 0,
    seasons: seasons.length,
    bestFinish: ranked.length ? Math.min(...ranked.map((season) => Number(season.rank))) : null,
    averageFinish: averageFinish == null ? null : Number(averageFinish.toFixed(2))
  };
}

export async function getFranchiseCareerBundle({ rootLeagueId, env, profile, currentSeason, currentWeek } = {}) {
  const legacyTitleYears = parseLegacyTitleYears(profile);
  const leagues = await resolveCareerLeagues({ rootLeagueId, env });
  const seasons = (await Promise.all(leagues.map((league) => buildSeasonRow({
    league,
    profile,
    currentSeason,
    currentWeek
  })))).filter(Boolean).sort((a, b) => b.season - a.season);
  const allGames = seasons.flatMap((season) => season.games || []).sort((a, b) => b.season - a.season || b.week - a.week);
  const official = summarizeOfficialRecord(seasons);
  const h2h = summarizeGames(allGames);
  const sleeperTitleYears = seasons
  .filter((season) => season.champion)
  .map((season) => String(season.season));

  const titleYears = [...new Set([...legacyTitleYears, ...sleeperTitleYears])]
  .sort((a, b) => Number(a) - Number(b));

  return {
    seasons,
    games: allGames,
    recentGames: allGames.slice(0, 8),
    official,
    h2h,
    legacyTitles: legacyTitleYears.length,
    legacyTitleYears,
    legacyLeague: profile?.championship?.league || null,
    sleeperTitles: sleeperTitleYears.length,
    sleeperTitleYears,
    totalTitles: titleYears.length,
    titleYears,
    source: 'All linked Sleeper seasons via league history. Pre-Sleeper titles come from legacyInfo.js.'
  };
}
