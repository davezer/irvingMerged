function formatStyle(profile) {
  if (!profile.tradeCount) return 'Quiet market';
  if (profile.tradeCount >= 5 && profile.uniquePartners >= 4) return 'Market maker';
  if (profile.tradeCount >= 4 && profile.pickDeals >= 2) return 'Future-chasing';
  if (profile.tradeCount >= 3 && profile.playerInCount > profile.playerOutCount) return 'Talent accumulator';
  if (profile.tradeCount >= 3 && profile.playerOutCount > profile.playerInCount) return 'Asset churner';
  return 'Selective dealer';
}

export function summarizeTradeProfile(transactionWeeks = [], rosterId, rosterIdentityMap = new Map(), playersById = new Map()) {
  const trades = [];
  const partnerCounts = new Map();
  const positionsIn = new Map();
  const positionsOut = new Map();

  for (const bucket of transactionWeeks || []) {
    for (const txn of bucket.items || []) {
      if (String(txn.type || '') !== 'trade') continue;
      const rosterIds = (txn.roster_ids || []).map((id) => Number(id));
      if (!rosterIds.includes(Number(rosterId))) continue;

      const partners = rosterIds
        .filter((id) => Number(id) !== Number(rosterId))
        .map((id) => rosterIdentityMap.get(Number(id))?.teamName || `Roster ${id}`);

      for (const name of partners) {
        partnerCounts.set(name, (partnerCounts.get(name) || 0) + 1);
      }

      const playersIn = Object.entries(txn.adds || {})
        .filter(([, id]) => Number(id) === Number(rosterId))
        .map(([playerId]) => playersById.get(String(playerId)) || null)
        .filter(Boolean);

      const playersOut = Object.entries(txn.drops || {})
        .filter(([, id]) => Number(id) === Number(rosterId))
        .map(([playerId]) => playersById.get(String(playerId)) || null)
        .filter(Boolean);

      for (const player of playersIn) {
        const key = String(player.position || 'UNK');
        positionsIn.set(key, (positionsIn.get(key) || 0) + 1);
      }
      for (const player of playersOut) {
        const key = String(player.position || 'UNK');
        positionsOut.set(key, (positionsOut.get(key) || 0) + 1);
      }

      trades.push({
        id: String(txn.transaction_id || `${bucket.week}-${trades.length}`),
        week: bucket.week,
        partners,
        playersIn,
        playersOut,
        pickCount: Array.isArray(txn.draft_picks) ? txn.draft_picks.length : 0,
        createdAt: Number(txn.status_updated || txn.created || 0) || null
      });
    }
  }

  const sortedPartners = [...partnerCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const profile = {
    tradeCount: trades.length,
    uniquePartners: sortedPartners.length,
    favoritePartner: sortedPartners[0]?.[0] || null,
    favoritePartnerCount: sortedPartners[0]?.[1] || 0,
    playerInCount: trades.reduce((sum, trade) => sum + trade.playersIn.length, 0),
    playerOutCount: trades.reduce((sum, trade) => sum + trade.playersOut.length, 0),
    pickDeals: trades.reduce((sum, trade) => sum + (trade.pickCount > 0 ? 1 : 0), 0),
    lastTradeAt: trades.reduce((latest, trade) => Math.max(latest, Number(trade.createdAt || 0)), 0) || null,
    positionTargets: [...positionsIn.entries()].sort((a, b) => b[1] - a[1]),
    positionExports: [...positionsOut.entries()].sort((a, b) => b[1] - a[1]),
    marketStyle: ''
  };

  profile.marketStyle = formatStyle(profile);

  return {
    ...profile,
    trades: trades.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)).slice(0, 8)
  };
}
