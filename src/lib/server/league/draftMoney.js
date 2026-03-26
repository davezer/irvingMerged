export function buildDraftEconomy(draftPicks = []) {
  const byManager = new Map();

  for (const pick of draftPicks) {
    const managerId = String(pick.manager_id || '');
    if (!managerId) continue;

    if (!byManager.has(managerId)) {
      byManager.set(managerId, {
        manager_id: managerId,
        totalSpent: 0,
        totalPicks: 0,
        keeperCount: 0,
        averagePrice: 0,
        maxPrice: 0,
        minPrice: null
      });
    }

    const row = byManager.get(managerId);
    const amount = Number(pick.amount || 0);
    row.totalSpent += amount;
    row.totalPicks += 1;
    row.keeperCount += Number(pick.is_keeper || 0) ? 1 : 0;
    row.maxPrice = Math.max(row.maxPrice, amount);
    row.minPrice = row.minPrice == null ? amount : Math.min(row.minPrice, amount);
  }

  for (const row of byManager.values()) {
    row.averagePrice = row.totalPicks ? Number((row.totalSpent / row.totalPicks).toFixed(2)) : 0;
  }

  return [...byManager.values()].sort((a, b) => b.totalSpent - a.totalSpent);
}

export function buildDraftBudgetLedger({ season, economyRows = [], startingBudget = 200 }) {
  return economyRows.map((row) => ({
    season,
    manager_id: row.manager_id,
    starting_budget: startingBudget,
    spent_budget: row.totalSpent,
    remaining_budget: startingBudget - row.totalSpent,
    keeper_commitment: row.keeperCount,
    max_purchase: row.maxPrice,
    average_purchase: row.averagePrice
  }));
}
