import { parseSeasonParam, parseWeeksParam } from '$lib/server/league/season.js';
import { buildRosterIdentityMap } from '$lib/server/league/identity.js';
import { getSleeperLeagueBundle, resolvePlayersByIds } from '$lib/server/league/sleeperCache.js';

function normalizeDraftPick(pick, rosterMap) {
  const owner = rosterMap.get(Number(pick?.owner_id)) || null;
  const previousOwner = rosterMap.get(Number(pick?.previous_owner_id)) || null;
  const original = rosterMap.get(Number(pick?.roster_id)) || null;

  return {
    season: pick?.season || null,
    round: pick?.round || null,
    ownerTeamName: owner?.teamName || `Roster ${pick?.owner_id ?? '—'}`,
    previousOwnerTeamName: previousOwner?.teamName || `Roster ${pick?.previous_owner_id ?? '—'}`,
    originalTeamName: original?.teamName || `Roster ${pick?.roster_id ?? '—'}`
  };
}

export async function load({ url, platform }) {
  const season = parseSeasonParam(url.searchParams.get('season'));
  const weeks = parseWeeksParam(url.searchParams.get('weeks'), season);
  const explicitLeagueId = String(url.searchParams.get('leagueId') || '').trim() || null;

  try {
    const { leagueId, rosters, users, transactions } = await getSleeperLeagueBundle({
      env: platform?.env,
      season,
      weeks,
      urlLeagueId: explicitLeagueId
    });

    const rosterMap = buildRosterIdentityMap({ rosters, users });
    const addIds = transactions.flatMap((txn) => Object.keys(txn?.adds || {}));
    const dropIds = transactions.flatMap((txn) => Object.keys(txn?.drops || {}));
    const playerMap = await resolvePlayersByIds([...addIds, ...dropIds]);

    const enrichedTransactions = transactions
      .map((txn) => {
        const addEntries = Object.entries(txn?.adds || {}).map(([playerId, rosterId]) => ({
          player: playerMap.get(String(playerId)) || null,
          rosterId: Number(rosterId),
          teamName: rosterMap.get(Number(rosterId))?.teamName || `Roster ${rosterId}`
        }));

        const dropEntries = Object.entries(txn?.drops || {}).map(([playerId, rosterId]) => ({
          player: playerMap.get(String(playerId)) || null,
          rosterId: Number(rosterId),
          teamName: rosterMap.get(Number(rosterId))?.teamName || `Roster ${rosterId}`
        }));

        const draftPicks = (txn?.draft_picks || []).map((pick) => normalizeDraftPick(pick, rosterMap));
        const faabMoves = Object.entries(txn?.waiver_budget || {}).map(([rosterId, amount]) => ({
          rosterId: Number(rosterId),
          teamName: rosterMap.get(Number(rosterId))?.teamName || `Roster ${rosterId}`,
          amount: Number(amount || 0)
        }));

        const summaryBits = [];
        if (addEntries.length) summaryBits.push(`${addEntries.length} add${addEntries.length === 1 ? '' : 's'}`);
        if (dropEntries.length) summaryBits.push(`${dropEntries.length} drop${dropEntries.length === 1 ? '' : 's'}`);
        if (draftPicks.length) summaryBits.push(`${draftPicks.length} pick move${draftPicks.length === 1 ? '' : 's'}`);
        if (faabMoves.length) summaryBits.push(`${faabMoves.length} FAAB change${faabMoves.length === 1 ? '' : 's'}`);

        return {
          id: String(txn.transaction_id),
          type: txn.type || 'move',
          status: txn.status || 'complete',
          createdAt: txn.created ? Math.floor(Number(txn.created) / 1000) : null,
          addEntries,
          dropEntries,
          draftPicks,
          faabMoves,
          summaryLine: summaryBits.join(' • ') || 'Transaction record'
        };
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return {
      season,
      leagueId,
      weeks,
      transactions: enrichedTransactions,
      hasData: enrichedTransactions.length > 0,
      source: 'sleeper-cache'
    };
  } catch (error) {
    return {
      season,
      leagueId: explicitLeagueId,
      weeks,
      transactions: [],
      hasData: false,
      error: error?.message || 'Failed to load Sleeper transactions.',
      source: 'sleeper-cache'
    };
  }
}
