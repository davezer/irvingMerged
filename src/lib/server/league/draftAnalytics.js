function round(value) {
  return Number(Number(value || 0).toFixed(2));
}

function average(values = []) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function buildPositionBaselines(pickRows = []) {
  const map = new Map();
  for (const pick of pickRows) {
    const position = pick.player.position || 'UNK';
    if (!map.has(position)) map.set(position, []);
    map.get(position).push(Number(pick.amount || 0));
  }
  return new Map([...map.entries()].map(([position, values]) => [position, {
    average: round(average(values)),
    median: round(values.sort((a, b) => a - b)[Math.floor(values.length / 2)] || 0)
  }]));
}

export function buildValueBoard(pickRows = []) {
  const baselines = buildPositionBaselines(pickRows);
  const board = pickRows.map((pick) => {
    const position = pick.player.position || 'UNK';
    const baseline = baselines.get(position) || { average: 0, median: 0 };
    const delta = round(Number(pick.amount || 0) - baseline.average);
    return {
      ...pick,
      baselineAverage: baseline.average,
      valueDelta: delta
    };
  });

  return {
    bargains: [...board].sort((a, b) => a.valueDelta - b.valueDelta || b.amount - a.amount).slice(0, 12),
    premiumBuys: [...board].sort((a, b) => b.valueDelta - a.valueDelta || b.amount - a.amount).slice(0, 12)
  };
}

export function buildTeamSpendProfiles(teamBoards = []) {
  return teamBoards.map((team) => {
    const sorted = [...(team.samplePicks || []), ...(team.allPicks || [])].sort((a, b) => b.amount - a.amount);
    const allPicks = team.allPicks || sorted;
    const totalSpend = Number(team.spend || 0);
    const top3Spend = allPicks.slice(0, 3).reduce((sum, pick) => sum + Number(pick.amount || 0), 0);
    const concentration = totalSpend > 0 ? (top3Spend / totalSpend) * 100 : 0;
    return {
      teamName: team.teamName,
      managerName: team.managerName,
      teamPhoto: team.teamPhoto,
      totalSpend,
      picks: team.picks,
      starsAndScrubsIndex: round(concentration),
      averageSpend: round(team.averageSpend || 0)
    };
  }).sort((a, b) => b.starsAndScrubsIndex - a.starsAndScrubsIndex || b.totalSpend - a.totalSpend);
}

export function buildDraftDNA(teamBoards = []) {
  return teamBoards.map((team) => {
    const allPicks = team.allPicks || [];
    const underTen = allPicks.filter((pick) => Number(pick.amount || 0) < 10).length;
    const overThirty = allPicks.filter((pick) => Number(pick.amount || 0) >= 30).length;
    const labels = [];
    if (overThirty >= 3) labels.push('Star hunter');
    if (underTen >= Math.max(5, Math.floor(allPicks.length * 0.45))) labels.push('Depth shopper');
    if (!labels.length && Number(team.averageSpend || 0) >= 18) labels.push('Balanced spender');
    if (!labels.length) labels.push('Room opportunist');
    return {
      teamName: team.teamName,
      managerName: team.managerName,
      teamPhoto: team.teamPhoto,
      labels,
      underTen,
      overThirty,
      averageSpend: round(team.averageSpend || 0)
    };
  });
}
