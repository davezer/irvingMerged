import { resolveLeagueContext } from '$lib/server/league/context.js';
import { buildRosterIdentityMap, resolveSelectedTeam } from '$lib/server/league/identity.js';
import { resolvePlayersByIds } from '$lib/server/league/players.js';
import { getSleeperRosters, getSleeperTransactionsForWeek, getSleeperUsers } from '$lib/server/league/sleeperClient.js';

function formatType(type) {
  return String(type || 'move').replaceAll('_', ' ');
}

function resolveRoster(rosterIdentityMap, rosterId) {
  return rosterIdentityMap.get(Number(rosterId)) || {
    rosterId: Number(rosterId),
    teamName: `Roster ${rosterId}`,
    managerName: 'Unknown Manager',
    teamPhoto: null,
    initials: '?',
    managerSlug: null,
    ownerId: null
  };
}

function buildPlayerRef(playersById, playerId) {
  return playersById.get(String(playerId)) || {
    id: String(playerId),
    name: `Player ${playerId}`,
    shortName: `#${playerId}`,
    position: null,
    team: null,
    teamLabel: null,
    photoUrl: `https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg`
  };
}

function groupEntriesByRoster(objectMap, playersById, rosterIdentityMap, kind = 'add') {
  const buckets = new Map();

  for (const [playerId, rosterId] of Object.entries(objectMap || {})) {
    const roster = resolveRoster(rosterIdentityMap, rosterId);
    const key = String(roster.rosterId);
    if (!buckets.has(key)) {
      buckets.set(key, {
        rosterId: roster.rosterId,
        teamName: roster.teamName,
        managerName: roster.managerName,
        teamPhoto: roster.teamPhoto,
        initials: roster.initials,
        managerSlug: roster.managerSlug,
        kind,
        players: []
      });
    }
    buckets.get(key).players.push(buildPlayerRef(playersById, playerId));
  }

  return [...buckets.values()].sort((a, b) => a.teamName.localeCompare(b.teamName));
}

function buildDraftPickRows(draftPicks = [], rosterIdentityMap) {
  return (draftPicks || []).map((pick, index) => {
    const owner = resolveRoster(rosterIdentityMap, pick.owner_id || pick.roster_id || pick.previous_owner_id);
    const previous = resolveRoster(rosterIdentityMap, pick.previous_owner_id || pick.roster_id || pick.owner_id);
    return {
      id: `${pick.season || ''}-${pick.round || ''}-${pick.owner_id || ''}-${index}`,
      label: `${pick.season || 'Future'} Round ${pick.round || '—'}`,
      currentOwner: owner.teamName,
      currentOwnerSlug: owner.managerSlug,
      previousOwner: previous.teamName,
      previousOwnerSlug: previous.managerSlug,
      lineage: previous.teamName === owner.teamName ? owner.teamName : `${previous.teamName} → ${owner.teamName}`
    };
  });
}

function buildFaabRows(waiverBudget = {}, rosterIdentityMap) {
  return Object.entries(waiverBudget || {}).map(([rosterId, amount]) => ({
    ...resolveRoster(rosterIdentityMap, rosterId),
    amount: Number(amount || 0)
  })).sort((a, b) => b.amount - a.amount || a.teamName.localeCompare(b.teamName));
}

function summarizeTransaction(txn) {
  if (txn.type === 'trade') {
    const clubs = txn.rosterCards.map((row) => row.teamName).filter(Boolean);
    return clubs.length >= 2 ? `${clubs.join(' ↔ ')}` : 'Trade wire';
  }
  if (txn.type === 'waiver') {
    return txn.addGroups[0] ? `${txn.addGroups[0].teamName} made a waiver move` : 'Waiver move';
  }
  if (txn.type === 'free_agent') {
    return txn.addGroups[0] ? `${txn.addGroups[0].teamName} hit free agency` : 'Free-agent move';
  }
  if (txn.type === 'commish') {
    return 'Commissioner action';
  }
  return formatType(txn.type);
}

function involvesRoster(raw, rosterId) {
  const wanted = Number(rosterId);
  if (!Number.isFinite(wanted)) return true;
  const rosterIds = (raw.roster_ids || []).map((id) => Number(id));
  if (rosterIds.includes(wanted)) return true;
  if (Object.values(raw.adds || {}).some((id) => Number(id) === wanted)) return true;
  if (Object.values(raw.drops || {}).some((id) => Number(id) === wanted)) return true;
  if (Object.keys(raw.settings?.waiver_budget || raw.waiver_budget || {}).some((id) => Number(id) === wanted)) return true;
  return false;
}

function buildTransactionView(raw, week, playersById, rosterIdentityMap) {
  const rosterCards = (raw.roster_ids || []).map((rosterId) => resolveRoster(rosterIdentityMap, rosterId));
  const addGroups = groupEntriesByRoster(raw.adds || {}, playersById, rosterIdentityMap, 'add');
  const dropGroups = groupEntriesByRoster(raw.drops || {}, playersById, rosterIdentityMap, 'drop');
  const draftPicks = buildDraftPickRows(raw.draft_picks || [], rosterIdentityMap);
  const faabRows = buildFaabRows(raw.settings?.waiver_budget || raw.waiver_budget || {}, rosterIdentityMap);

  const item = {
    id: String(raw.transaction_id || `${week}-${raw.type || 'move'}-${Math.random().toString(36).slice(2, 8)}`),
    week,
    type: String(raw.type || 'move'),
    typeLabel: formatType(raw.type),
    status: String(raw.status || 'complete'),
    createdAt: raw.status_updated || raw.created || raw.updated || null,
    rosterCards,
    addGroups,
    dropGroups,
    draftPicks,
    faabRows
  };

  return {
    ...item,
    summaryLine: summarizeTransaction(item),
    counts: {
      adds: addGroups.reduce((sum, row) => sum + row.players.length, 0),
      drops: dropGroups.reduce((sum, row) => sum + row.players.length, 0),
      picks: draftPicks.length,
      faab: faabRows.length
    }
  };
}

export async function getLiveTransactionsBundle({ url, env } = {}) {
  const context = await resolveLeagueContext({ url, env, allWeeksByDefault: true });
  const [users, rosters] = await Promise.all([
    getSleeperUsers(context.leagueId),
    getSleeperRosters(context.leagueId)
  ]);
  const rosterIdentityMap = buildRosterIdentityMap({ rosters, users });
  const selectedTeam = resolveSelectedTeam({
    teamParam: url?.searchParams?.get('team') || null,
    rosterIdParam: url?.searchParams?.get('rosterId') || null,
    rosters,
    users
  });

  const weekPairs = await Promise.all(context.weeks.map(async (week) => [
    week,
    await getSleeperTransactionsForWeek(context.leagueId, week)
  ]));

  const filteredRawByWeek = weekPairs.map(([week, items]) => [
    week,
    selectedTeam
      ? (items || []).filter((txn) => involvesRoster(txn, selectedTeam.rosterId))
      : (items || [])
  ]);

  const allRawTransactions = filteredRawByWeek.flatMap(([, items]) => items || []);
  const playerIds = allRawTransactions.flatMap((txn) => [
    ...Object.keys(txn?.adds || {}),
    ...Object.keys(txn?.drops || {})
  ]);
  const playersById = await resolvePlayersByIds(playerIds);

  const weeks = filteredRawByWeek
    .map(([week, items]) => ({
      week,
      items: (items || []).map((txn) => buildTransactionView(txn, week, playersById, rosterIdentityMap))
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    }))
    .filter((week) => week.items.length > 0)
    .sort((a, b) => b.week - a.week);

  const transactions = weeks.flatMap((week) => week.items);

  return {
    ...context,
    selectedWeeks: context.weeks,
    weeks,
    transactions,
    filterTeam: selectedTeam,
    hasData: transactions.length > 0,
    source: 'Sleeper API + shared edge/runtime cache'
  };
}
