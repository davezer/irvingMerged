function round(value) {
  return Number(Number(value || 0).toFixed(2));
}

function average(values = []) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function median(values = []) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stdev(values = []) {
  if (!values.length) return 0;
  const avg = average(values);
  const variance = values.reduce((sum, value) => sum + ((value - avg) ** 2), 0) / values.length;
  return Math.sqrt(variance);
}

function normalizeSlot(slot = '') {
  return String(slot || '').toUpperCase();
}

function activeRosterSlots(rosterPositions = []) {
  return (rosterPositions || []).map(normalizeSlot).filter((slot) => !['BN', 'BENCH', 'IR', 'RESERVE', 'TAXI'].includes(slot));
}

function slotEligiblePositions(slot) {
  switch (normalizeSlot(slot)) {
    case 'QB': return ['QB'];
    case 'RB': return ['RB'];
    case 'WR': return ['WR'];
    case 'TE': return ['TE'];
    case 'K': return ['K'];
    case 'DEF':
    case 'DST': return ['DEF'];
    case 'FLEX':
    case 'W/R/T':
    case 'WRRB_FLEX': return ['WR', 'RB', 'TE'];
    case 'REC_FLEX':
    case 'WRTE_FLEX': return ['WR', 'TE'];
    case 'SUPER_FLEX':
    case 'OP':
    case 'Q/W/R/T': return ['QB', 'WR', 'RB', 'TE'];
    default: return [normalizeSlot(slot)].filter(Boolean);
  }
}

function toPointsMap(side = {}) {
  if (side?.players_points && typeof side.players_points === 'object') return side.players_points;
  if (side?.starters_points && typeof side.starters_points === 'object') return side.starters_points;
  return {};
}

function scoreForId(pointsMap = {}, playerId) {
  const value = Number(pointsMap?.[String(playerId)] ?? pointsMap?.[playerId] ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function eligibleForSlot(player, slot) {
  const allowed = slotEligiblePositions(slot);
  const fantasyPositions = Array.isArray(player?.fantasyPositions) ? player.fantasyPositions : [player?.position].filter(Boolean);
  return fantasyPositions.some((pos) => allowed.includes(String(pos).toUpperCase()));
}

function slotWeight(slot) {
  const allowed = slotEligiblePositions(slot);
  return allowed.length;
}

function optimizeSlotValidLineup({ slotLabels = [], playerPool = [], pointsMap = {} } = {}) {
  const slots = [...slotLabels].sort((a, b) => slotWeight(a) - slotWeight(b));
  const candidates = (playerPool || []).map((player) => ({
    ...player,
    score: scoreForId(pointsMap, player.id)
  }));

  const memo = new Map();

  function solve(slotIndex, usedMask) {
    const key = `${slotIndex}|${usedMask}`;
    if (memo.has(key)) return memo.get(key);
    if (slotIndex >= slots.length) {
      const result = { total: 0, picks: [] };
      memo.set(key, result);
      return result;
    }

    const slot = slots[slotIndex];
    let best = solve(slotIndex + 1, usedMask);
    best = { total: best.total, picks: [...best.picks] };

    for (let idx = 0; idx < candidates.length; idx += 1) {
      if (usedMask & (1 << idx)) continue;
      const player = candidates[idx];
      if (!eligibleForSlot(player, slot)) continue;
      const next = solve(slotIndex + 1, usedMask | (1 << idx));
      const total = player.score + next.total;
      if (total > best.total) {
        best = {
          total,
          picks: [{ slot, player }, ...next.picks]
        };
      }
    }

    memo.set(key, best);
    return best;
  }

  return solve(0, 0);
}

export function buildSingleWeekLineupSnapshot({ week = 0, side = null, roster = null, league = null, playersById = new Map() } = {}) {
  if (!side) return null;

  const pointsMap = toPointsMap(side);
  const starters = Array.isArray(side.starters) ? side.starters.filter(Boolean).map(String) : [];
  const rosterPlayers = Array.isArray(side.players) && side.players.length ? side.players.filter(Boolean).map(String) : (roster?.players || []).filter(Boolean).map(String);
  const slotLabels = activeRosterSlots(league?.roster_positions || []).slice(0, starters.length || undefined);
  const actualScore = Number(side.custom_points ?? side.points ?? starters.reduce((sum, playerId) => sum + scoreForId(pointsMap, playerId), 0) ?? 0);
  const playerPool = rosterPlayers.map((playerId) => playersById.get(String(playerId)) || {
    id: String(playerId),
    name: `Player ${playerId}`,
    shortName: `#${playerId}`,
    position: null,
    fantasyPositions: []
  });

  const optimizer = optimizeSlotValidLineup({
    slotLabels: slotLabels.length ? slotLabels : starters.map(() => 'FLEX'),
    playerPool,
    pointsMap
  });

  const optimalScore = round(optimizer.total);
  const actualStarterSet = new Set(starters.map(String));
  const optimalIds = optimizer.picks.map((pick) => String(pick.player.id));
  const chosenActualCount = optimalIds.filter((id) => actualStarterSet.has(id)).length;
  const topBenchCandidates = optimizer.picks
    .filter((pick) => !actualStarterSet.has(String(pick.player.id)))
    .map((pick) => ({
      slot: pick.slot,
      playerId: String(pick.player.id),
      score: round(scoreForId(pointsMap, pick.player.id)),
      player: pick.player
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return {
    week: Number(week || 0),
    actualScore: round(actualScore),
    optimalScore,
    benchPoints: round(Math.max(0, optimalScore - actualScore)),
    lineupIQ: optimalScore > 0 ? round((actualScore / optimalScore) * 100) : 100,
    hitRate: optimizer.picks.length ? round((chosenActualCount / optimizer.picks.length) * 100) : 100,
    starterCount: starters.length,
    optimalSlots: optimizer.picks.map((pick) => ({
      slot: pick.slot,
      player: pick.player,
      score: round(scoreForId(pointsMap, pick.player.id))
    })),
    actualStarterScores: starters.map((playerId) => ({
      playerId: String(playerId),
      player: playersById.get(String(playerId)) || null,
      score: round(scoreForId(pointsMap, playerId))
    })),
    topBenchCandidates
  };
}

export function buildWeeklyLineupSnapshots(matchupWeeks = [], rosterId, options = {}) {
  const snapshots = [];

  for (const bucket of matchupWeeks || []) {
    const side = (bucket.items || []).find((entry) => Number(entry.roster_id) === Number(rosterId));
    if (!side) continue;
    const snapshot = buildSingleWeekLineupSnapshot({
      week: bucket.week,
      side,
      roster: options.roster || null,
      league: options.league || null,
      playersById: options.playersById || new Map()
    });
    if (snapshot) snapshots.push(snapshot);
  }

  return snapshots.sort((a, b) => a.week - b.week);
}

export function summarizeLineupAnalytics(snapshots = []) {
  if (!snapshots.length) {
    return {
      averageLineupIQ: 0,
      averageHitRate: 0,
      averageBenchPoints: 0,
      bestWeek: null,
      worstWeek: null,
      lineupVolatility: 0,
      totalBenchPoints: 0,
      totalWeeks: 0
    };
  }

  const actualScores = snapshots.map((row) => row.actualScore);
  const lineupIQs = snapshots.map((row) => row.lineupIQ);
  const benchPoints = snapshots.map((row) => row.benchPoints);

  return {
    averageLineupIQ: round(average(lineupIQs)),
    medianLineupIQ: round(median(lineupIQs)),
    averageHitRate: round(average(snapshots.map((row) => row.hitRate))),
    averageBenchPoints: round(average(benchPoints)),
    totalBenchPoints: round(benchPoints.reduce((sum, value) => sum + value, 0)),
    bestWeek: [...snapshots].sort((a, b) => b.lineupIQ - a.lineupIQ || a.benchPoints - b.benchPoints)[0] || null,
    worstWeek: [...snapshots].sort((a, b) => a.lineupIQ - b.lineupIQ || b.benchPoints - a.benchPoints)[0] || null,
    lineupVolatility: round(stdev(actualScores)),
    totalWeeks: snapshots.length
  };
}
