function byManager(rows, key = 'manager_id') {
  return rows.reduce((acc, row) => {
    const id = String(row?.[key] || '');
    if (!id) return acc;
    acc[id] ||= [];
    acc[id].push(row);
    return acc;
  }, {});
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + Number(v || 0), 0) / values.length;
}

export const BADGE_DEFINITIONS = [
  {
    key: 'war_chest',
    title: 'War Chest',
    icon: 'chip-stack',
    tone: 'gold',
    description: 'Top draft spender of the season.',
    scorer: ({ draftEconomyByManager }) => {
      const rows = [...draftEconomyByManager].sort((a, b) => b.totalSpent - a.totalSpent);
      return rows[0] ? [{ managerId: rows[0].manager_id, score: rows[0].totalSpent }] : [];
    }
  },
  {
    key: 'value_hunter',
    title: 'Value Hunter',
    icon: 'target',
    tone: 'emerald',
    description: 'Highest average wins per draft dollar.',
    scorer: ({ draftEconomyByManager, standingsByManager }) => {
      return draftEconomyByManager
        .filter((row) => Number(row.totalSpent) > 0)
        .map((row) => ({
          managerId: row.manager_id,
          score: Number((Number(standingsByManager.get(row.manager_id)?.wins || 0) / Number(row.totalSpent || 1)).toFixed(4))
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 1);
    }
  },
  {
    key: 'top_dog',
    title: 'Top Dog',
    icon: 'crown',
    tone: 'crimson',
    description: 'Best regular season record.',
    scorer: ({ standings }) => {
      const rows = [...standings].sort((a, b) => (b.wins - a.wins) || (b.points_for - a.points_for));
      return rows[0] ? [{ managerId: rows[0].manager_id, score: rows[0].wins }] : [];
    }
  },
  {
    key: 'heavyweight',
    title: 'Heavyweight',
    icon: 'hammer',
    tone: 'bronze',
    description: 'Highest average weekly score.',
    scorer: ({ matchups }) => {
      const grouped = Object.entries(byManager(matchups));
      return grouped
        .map(([managerId, rows]) => ({ managerId, score: Number(average(rows.map((r) => r.points)).toFixed(2)) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 1);
    }
  }
];

export function buildBadgeAwards({ season, standings, matchups, draftEconomyByManager }) {
  const standingsByManager = new Map(standings.map((row) => [String(row.manager_id), row]));
  const awards = [];

  for (const badge of BADGE_DEFINITIONS) {
    const winners = badge.scorer({
      season,
      standings,
      matchups,
      draftEconomyByManager,
      standingsByManager
    });

    for (const winner of winners) {
      awards.push({
        season,
        badge_key: badge.key,
        manager_id: winner.managerId,
        reason: badge.description,
        score: Number(winner.score || 0),
        metadata_json: JSON.stringify({ title: badge.title, icon: badge.icon, tone: badge.tone })
      });
    }
  }

  return awards;
}
