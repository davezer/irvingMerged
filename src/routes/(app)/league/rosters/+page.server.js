import { resolveLeagueContext } from '$lib/server/league/context.js';
import { buildRosterIdentityMap } from '$lib/server/league/identity.js';
import { resolvePlayersByIds } from '$lib/server/league/players.js';
import {
  getSleeperMatchupsForWeek,
  getSleeperRosters,
  getSleeperUsers
} from '$lib/server/league/sleeperClient.js';

const FALLBACK_STARTER_SLOTS = ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'K', 'DEF'];
const NON_STARTER_SLOTS = new Set(['BN', 'BE', 'BENCH', 'IR', 'TAXI']);

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function decimalStat(whole, decimal) {
  const left = Number(whole || 0);
  const right = Number(decimal || 0);
  return Number(`${left}.${right}`);
}

function uniqueIds(ids = []) {
  return [...new Set(ids.map((id) => String(id || '')).filter(Boolean))];
}

function normalizeSlot(slot) {
  return String(slot || '').toUpperCase();
}

function starterSlotsFromLeague(league = {}) {
  const positions = Array.isArray(league?.roster_positions) ? league.roster_positions : [];
  const starters = positions
    .map(normalizeSlot)
    .filter((slot) => slot && !NON_STARTER_SLOTS.has(slot));

  return starters.length ? starters : FALLBACK_STARTER_SLOTS;
}

function recordLabel(settings = {}) {
  const wins = numberValue(settings.wins);
  const losses = numberValue(settings.losses);
  const ties = numberValue(settings.ties);
  return `${wins}-${losses}${ties ? `-${ties}` : ''}`;
}

function hydratePlayer(playerId, playersById) {
  if (!playerId) return null;
  return playersById.get(String(playerId)) || null;
}

function buildRawRosterSource({ rosters = [], matchupEntries = [] }) {
  const byRosterId = new Map();

  for (const roster of rosters) {
    byRosterId.set(Number(roster.roster_id), {
      rosterId: Number(roster.roster_id),
      ownerId: roster.owner_id ? String(roster.owner_id) : null,
      starters: uniqueIds(roster.starters || []),
      players: uniqueIds(roster.players || []),
      reserve: uniqueIds([...(roster.reserve || []), ...(roster.taxi || [])]),
      settings: roster.settings || {},
      metadata: roster.metadata || {},
      source: 'current'
    });
  }

  for (const entry of matchupEntries) {
    const rosterId = Number(entry.roster_id);
    if (!rosterId) continue;

    const current = byRosterId.get(rosterId) || {
      rosterId,
      ownerId: null,
      settings: {},
      metadata: {}
    };

    byRosterId.set(rosterId, {
      ...current,
      starters: uniqueIds(entry.starters || []),
      players: uniqueIds(entry.players || []),
      reserve: uniqueIds(current.reserve || []),
      weeklyPoints: numberValue(entry.custom_points ?? entry.points ?? 0),
      matchupId: Number(entry.matchup_id || 0) || null,
      source: 'weekly'
    });
  }

  return [...byRosterId.values()];
}

function buildRosterCard({ raw, identity, starterSlots, playersById }) {
  const starterIds = uniqueIds(raw.starters || []);
  const playerIds = uniqueIds(raw.players || []);
  const reserveIds = uniqueIds(raw.reserve || []);
  const starterSet = new Set(starterIds);
  const reserveSet = new Set(reserveIds);
  const settings = raw.settings || {};

  const starters = starterSlots.map((slot, index) => ({
    slot,
    slotIndex: index,
    player: hydratePlayer(starterIds[index], playersById)
  }));

  const bench = playerIds
    .filter((id) => !starterSet.has(String(id)) && !reserveSet.has(String(id)))
    .map((id) => hydratePlayer(id, playersById))
    .filter(Boolean);

  const reserve = reserveIds
    .map((id) => hydratePlayer(id, playersById))
    .filter(Boolean);

  const pointsFor = decimalStat(settings.fpts, settings.fpts_decimal);
  const pointsAgainst = decimalStat(settings.fpts_against, settings.fpts_against_decimal);

  return {
    rosterId: Number(raw.rosterId),
    matchupId: raw.matchupId || null,
    source: raw.source || 'current',
    ownerId: raw.ownerId || null,
    managerName: identity?.managerName || 'Unknown Manager',
    teamName: identity?.teamName || `Roster ${raw.rosterId}`,
    teamPhoto: identity?.teamPhoto || null,
    managerSlug: identity?.managerSlug || null,
    initials: identity?.initials || '?',
    recordLabel: recordLabel(settings),
    pointsFor,
    pointsAgainst,
    weeklyPoints: raw.weeklyPoints ?? null,
    starterCount: starters.filter((slot) => slot.player).length,
    playerCount: playerIds.length,
    benchCount: bench.length,
    reserveCount: reserve.length,
    starters,
    bench,
    reserve
  };
}

function buildPositionSummary(rosters = []) {
  const counts = new Map();

  for (const roster of rosters) {
    const players = [
      ...roster.starters.map((item) => item.player).filter(Boolean),
      ...roster.bench,
      ...roster.reserve
    ];

    for (const player of players) {
      const position = player?.position || 'UNK';
      counts.set(position, (counts.get(position) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([position, count]) => ({ position, count }))
    .sort((a, b) => (b.count - a.count) || a.position.localeCompare(b.position));
}

function buildTeamOptions(rosters = []) {
  return rosters
    .map((roster) => ({
      rosterId: roster.rosterId,
      teamName: roster.teamName,
      managerName: roster.managerName,
      managerSlug: roster.managerSlug,
      teamPhoto: roster.teamPhoto,
      initials: roster.initials
    }))
    .sort((a, b) => a.teamName.localeCompare(b.teamName));
}

function filterRosters(rosters = [], teamParam = '') {
  const wanted = String(teamParam || '').trim().toLowerCase();
  if (!wanted) return rosters;

  return rosters.filter((roster) => {
    const probes = [
      roster.managerSlug,
      roster.teamName,
      roster.managerName,
      String(roster.rosterId)
    ].map((value) => String(value || '').toLowerCase());

    return probes.includes(wanted);
  });
}

export async function load({ url, platform }) {
  const context = await resolveLeagueContext({ url, env: platform?.env, allWeeksByDefault: false });
  const selectedWeek = Number(url.searchParams.get('week') || context.selectedWeek || 1);
  const teamParam = url.searchParams.get('team') || '';

  const [users, rosters, matchupEntries] = await Promise.all([
    getSleeperUsers(context.leagueId),
    getSleeperRosters(context.leagueId),
    getSleeperMatchupsForWeek(context.leagueId, selectedWeek).catch(() => [])
  ]);

  const rosterIdentityMap = buildRosterIdentityMap({ rosters, users });
  const hasWeeklySnapshot = Array.isArray(matchupEntries)
    && matchupEntries.some((entry) => Array.isArray(entry.players) && entry.players.length);

  const rawSources = buildRawRosterSource({
    rosters,
    matchupEntries: hasWeeklySnapshot ? matchupEntries : []
  });

  const allPlayerIds = rawSources.flatMap((raw) => [
    ...(raw.players || []),
    ...(raw.starters || []),
    ...(raw.reserve || [])
  ]);

  const playersById = await resolvePlayersByIds(allPlayerIds);
  const starterSlots = starterSlotsFromLeague(context.league);

  const builtRosters = rawSources
    .map((raw) => buildRosterCard({
      raw,
      identity: rosterIdentityMap.get(Number(raw.rosterId)),
      starterSlots,
      playersById
    }))
    .sort((a, b) => (a.rosterId - b.rosterId) || a.teamName.localeCompare(b.teamName));

  const visibleRosters = filterRosters(builtRosters, teamParam);

  return {
    season: context.season,
    leagueId: context.leagueId,
    leagueName: context.league?.name || 'Irving Champions League',
    selectedWeek,
    availableWeeks: context.availableWeeks,
    starterSlots,
    rosters: visibleRosters,
    allRosters: builtRosters,
    teamOptions: buildTeamOptions(builtRosters),
    filterTeam: teamParam || '',
    hasData: visibleRosters.length > 0,
    hasWeeklySnapshot,
    snapshotLabel: hasWeeklySnapshot ? `Week ${selectedWeek}` : 'Current Sleeper roster',
    source: hasWeeklySnapshot
      ? 'Sleeper weekly matchup snapshot + roster identity map'
      : 'Sleeper current rosters + roster identity map',
    summary: {
      teamCount: builtRosters.length,
      visibleTeamCount: visibleRosters.length,
      totalPlayers: builtRosters.reduce((total, roster) => total + roster.playerCount, 0),
      totalStarters: builtRosters.reduce((total, roster) => total + roster.starterCount, 0),
      positionSummary: buildPositionSummary(builtRosters).slice(0, 8)
    }
  };
}
