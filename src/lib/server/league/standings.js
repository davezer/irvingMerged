import { resolveLeagueContext } from '$lib/server/league/context.js';
import { buildRosterIdentityMap } from '$lib/server/league/identity.js';
import { getSleeperRosters, getSleeperUsers } from '$lib/server/league/sleeperClient.js';

const rankLabels = ['Commissioner’s Circle', 'Velvet Rope', 'High Stakes', 'Chasing the Board'];

function numberValue(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function fixedFromSleeper(intPart, decimalPart) {
  const whole = numberValue(intPart);
  const decimal = String(decimalPart ?? '0').replace(/[^0-9]/g, '').slice(0, 2);
  return Number(`${whole}.${decimal || '0'}`);
}

function recordPct(wins, losses, ties) {
  const games = wins + losses + ties;
  return games > 0 ? ((wins + ties * 0.5) / games) : 0;
}

export function buildStandingsRows({ rosters = [], users = [] } = {}) {
  const rosterIdentityMap = buildRosterIdentityMap({ rosters, users });

  const rows = rosters.map((roster) => {
    const identity = rosterIdentityMap.get(Number(roster.roster_id));
    const settings = roster?.settings || {};
    const wins = numberValue(settings.wins);
    const losses = numberValue(settings.losses);
    const ties = numberValue(settings.ties);
    const gamesPlayed = wins + losses + ties;
    const points = fixedFromSleeper(settings.fpts, settings.fpts_decimal);
    const pointsAgainst = fixedFromSleeper(settings.fpts_against, settings.fpts_against_decimal);
    const waiverBudgetUsed = numberValue(settings.waiver_budget_used || settings.waiver_budget_spent);

    return {
      rosterId: Number(roster.roster_id),
      ownerId: roster?.owner_id ? String(roster.owner_id) : null,
      teamName: identity?.teamName || `Roster ${roster?.roster_id}`,
      managerName: identity?.managerName || 'Unknown Manager',
      teamPhoto: identity?.teamPhoto || null,
      initials: identity?.initials || '?',
      branded: Boolean(identity?.branded),
      slug: identity?.managerSlug || null,
      wins,
      losses,
      ties,
      gamesPlayed,
      pct: recordPct(wins, losses, ties),
      points,
      pointsAgainst,
      pointDiff: Number((points - pointsAgainst).toFixed(2)),
      streak: settings.streak || null,
      waiverBudgetUsed,
      starters: Array.isArray(roster?.starters) ? roster.starters : [],
      players: Array.isArray(roster?.players) ? roster.players : []
    };
  }).sort((a, b) => (
    (b.wins - a.wins)
    || (b.pct - a.pct)
    || (b.points - a.points)
    || (a.pointsAgainst - b.pointsAgainst)
    || a.teamName.localeCompare(b.teamName)
  ));

  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
    tier: rankLabels[index < 2 ? 0 : index < 6 ? 1 : index < 10 ? 2 : 3],
    pointsBehind: Number(((rows[0]?.points || 0) - row.points).toFixed(2)),
    recordLabel: `${row.wins}-${row.losses}${row.ties ? `-${row.ties}` : ''}`
  }));
}

export function buildLeaguePulse(standings = []) {
  const topSeed = standings[0] || null;
  const averagePoints = standings.length
    ? standings.reduce((sum, row) => sum + row.points, 0) / standings.length
    : 0;
  const closestRace = standings.length > 1
    ? [...standings].slice(0, 4).sort((a, b) => a.pointsBehind - b.pointsBehind)[1] || null
    : null;

  return {
    topSeed,
    averagePoints,
    closestRace,
    hottest: [...standings].sort((a, b) => b.pointDiff - a.pointDiff)[0] || null
  };
}

export async function getLiveStandingsBundle({ url, env } = {}) {
  const context = await resolveLeagueContext({ url, env, allWeeksByDefault: false });
  const [users, rosters] = await Promise.all([
    getSleeperUsers(context.leagueId),
    getSleeperRosters(context.leagueId)
  ]);

  const standings = buildStandingsRows({ rosters, users });

  return {
    ...context,
    standings,
    pulse: buildLeaguePulse(standings),
    hasData: standings.length > 0,
    source: 'Sleeper API + shared edge/runtime cache'
  };
}
