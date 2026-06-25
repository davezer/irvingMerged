import { leagueID as FALLBACK_LEAGUE_ID } from '$lib/legacy/leagueInfo';
import { resolveRuntimeEnv } from '$lib/server/env.js';
import { getDefaultWeeksForSeason, parseSeasonParam, parseWeeksParam } from '$lib/server/league/season.js';
import { getLeagueHistory, getSleeperLeague, getSleeperNFLState } from '$lib/server/league/sleeperClient.js';

function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function getCurrentWeekFromState(state) {
  if (!state) return 1;
  const displayWeek = numberOrNull(state.display_week);
  const week = numberOrNull(state.week);
  return Math.max(1, displayWeek || week || 1);
}

function isCompletedHistoricalSeason({ season, currentSeason, league }) {
  const selected = Number(season);
  const current = Number(currentSeason);
  const status = String(league?.status || '').toLowerCase();

  return selected < current
    || status === 'complete'
    || status === 'completed'
    || status === 'closed';
}

function buildAvailableWeeks({ season, currentSeason, currentWeek, league }) {
  const hardMaxWeek = 18;
  const defaultWeeks = getDefaultWeeksForSeason(season);
  const completedHistoricalSeason = isCompletedHistoricalSeason({ season, currentSeason, league });
  const maxCompletedWeek = completedHistoricalSeason
    ? hardMaxWeek
    : Math.min(hardMaxWeek, Math.max(1, currentWeek));
  const availableWeeks = defaultWeeks.filter((week) => week <= maxCompletedWeek);
  const playoffStartWeek = Math.max(1, Math.min(hardMaxWeek, numberOrNull(league?.settings?.playoff_week_start) || 15));

  return {
    availableWeeks,
    playoffStartWeek,
    regularSeasonWeeks: availableWeeks.filter((week) => week < playoffStartWeek),
    playoffWeeks: availableWeeks.filter((week) => week >= playoffStartWeek)
  };
}

export async function resolveLeagueContext({ url, env, allWeeksByDefault = false } = {}) {
  const runtimeEnv = resolveRuntimeEnv(env);
  const explicitLeagueId = String(url?.searchParams?.get('leagueId') || '').trim() || null;
  const rootLeagueId = explicitLeagueId || String(runtimeEnv?.SLEEPER_LEAGUE_ID || FALLBACK_LEAGUE_ID || '').trim();
  if (!rootLeagueId) throw new Error('Missing Sleeper league id.');

  const [rootLeague, nflState] = await Promise.all([
    getSleeperLeague(rootLeagueId),
    getSleeperNFLState().catch(() => null)
  ]);

  const stateSeason = numberOrNull(nflState?.season);
  const fallbackSeason = parseSeasonParam(
    runtimeEnv?.SLEEPER_DEFAULT_SEASON || rootLeague?.season || stateSeason,
    stateSeason || new Date().getFullYear()
  );
  const season = parseSeasonParam(url?.searchParams?.get('season'), fallbackSeason);
  const overrideLeagueId = String(runtimeEnv?.[`SLEEPER_LEAGUE_ID_${season}`] || '').trim() || null;

  let league = null;
  let leagueId = explicitLeagueId || overrideLeagueId || null;

  if (leagueId) {
    league = await getSleeperLeague(leagueId);
  } else {
    const history = await getLeagueHistory(rootLeagueId);
    league = history.find((item) => Number(item.season) === Number(season)) || rootLeague;
    leagueId = String(league?.league_id || rootLeagueId);
  }

  const currentSeason = parseSeasonParam(stateSeason || rootLeague?.season, season);
  const currentWeek = Number(season) === Number(currentSeason) ? getCurrentWeekFromState(nflState) : 18;
  const weekMeta = buildAvailableWeeks({ season, currentSeason, currentWeek, league });
  const defaultWeek = weekMeta.availableWeeks.at(-1) || 1;
  const weeksValue = url?.searchParams?.get('weeks') || url?.searchParams?.get('week') || null;

  let weeks;
  if (weeksValue) {
    const parsed = parseWeeksParam(weeksValue, season);
    weeks = parsed.filter((week) => weekMeta.availableWeeks.includes(week));
  } else if (allWeeksByDefault) {
    weeks = [...weekMeta.availableWeeks];
  } else {
    weeks = [defaultWeek];
  }

  if (!weeks.length) weeks = [defaultWeek];

  return {
    season,
    rootLeagueId: String(rootLeagueId),
    leagueId: String(leagueId || rootLeagueId),
    league,
    currentSeason,
    currentWeek,
    weeks,
    selectedWeek: weeks[0],
    availableWeeks: weekMeta.availableWeeks,
    regularSeasonWeeks: weekMeta.regularSeasonWeeks,
    playoffWeeks: weekMeta.playoffWeeks,
    playoffStartWeek: weekMeta.playoffStartWeek,
    isCurrentSeason: Number(season) === Number(currentSeason)
  };
}
