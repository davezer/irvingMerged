function numberValue(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function recordLabel(settings = {}) {
  const wins = numberValue(settings.wins);
  const losses = numberValue(settings.losses);
  const ties = numberValue(settings.ties);

  return `${wins}-${losses}${ties ? `-${ties}` : ''}`;
}

function fantasyPointsForPlayer(side, playerId) {
  const raw = side?.players_points?.[String(playerId)];
  const points = Number(raw);

  return Number.isFinite(points)
    ? Number(points.toFixed(2))
    : null;
}

export function chunkPairs(entries = []) {
  const grouped = new Map();

  for (const entry of entries) {
    const key = Number(entry.matchup_id || 0);

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }

    grouped.get(key).push(entry);
  }

  return [...grouped.entries()].map(([matchupId, teams]) => ({
    matchupId,
    teams
  }));
}

export function buildRosterSettingsMap(rosters = []) {
  return new Map(
    rosters.map((roster) => [
      Number(roster.roster_id),
      roster?.settings || {}
    ])
  );
}

export function normalizeMatchupGroup(
  group,
  rosterIdentityMap,
  rosterSettingsMap,
  playersById,
  { includeStarters = true } = {}
) {
  const normalizeSide = (side) => {
    if (!side) return null;

    const rosterId = Number(side.roster_id);
    const identity = rosterIdentityMap.get(rosterId);
    const settings = rosterSettingsMap.get(rosterId) || {};

    const starterIds = Array.isArray(side.starters)
      ? side.starters.map(String)
      : [];

    const allPlayerIds = Array.isArray(side.players)
      ? side.players.map(String)
      : [];

    const starterSet = new Set(starterIds);

    const normalizePlayer = (playerId) => {
      const player = playersById.get(String(playerId));

      if (!player) {
        return null;
      }

      return {
        ...player,
        fantasyPoints: fantasyPointsForPlayer(
          side,
          playerId
        )
      };
    };

    const starters = includeStarters
      ? starterIds
          .map(normalizePlayer)
          .filter(Boolean)
      : [];

    const bench = includeStarters
      ? allPlayerIds
          .filter(
            (playerId) =>
              !starterSet.has(
                String(playerId)
              )
          )
          .map(normalizePlayer)
          .filter(Boolean)
      : [];

    return {
      rosterId,

      teamName:
        identity?.teamName ||
        `Roster ${side.roster_id}`,

      managerName:
        identity?.managerName ||
        'Unknown Manager',

      teamPhoto:
  identity?.teamPhoto ||
  null,

teamChiclet:
  identity?.teamChiclet ||
  identity?.teamPhoto ||
  null,

initials:
  identity?.initials ||
  '?',

      managerSlug:
        identity?.managerSlug ||
        null,

      score: numberValue(
        side.custom_points ??
        side.points ??
        0
      ),

      recordLabel:
        recordLabel(settings),

      starters,

      bench
    };
  };

  const left =
    normalizeSide(group.teams[0]);

  const right =
    normalizeSide(group.teams[1]);

  const hasTwoSides =
    Boolean(left && right);

  const margin =
    hasTwoSides
      ? Number(
          Math.abs(
            left.score -
            right.score
          ).toFixed(2)
        )
      : null;

  const totalScore =
    hasTwoSides
      ? Number(
          (
            left.score +
            right.score
          ).toFixed(2)
        )
      : null;

  const winner =
    !hasTwoSides ||
    left.score === right.score
      ? null
      : left.score > right.score
        ? left.rosterId
        : right.rosterId;

  return {
    matchupId:
      group.matchupId,

    left,

    right,

    margin,

    totalScore,

    winner,

    winnerName:
      winner === left?.rosterId
        ? left.teamName
        : winner === right?.rosterId
          ? right.teamName
          : null
  };
}

export function buildWeekHighlights(matchups = []) {
  const played = matchups.filter(
    (matchup) =>
      matchup.left &&
      matchup.right
  );

  if (!played.length) {
    return null;
  }

  const highestCombined =
    [...played].sort(
      (a, b) =>
        (b.totalScore ?? 0) -
        (a.totalScore ?? 0)
    )[0] || null;

  const closestGame =
    [...played].sort(
      (a, b) =>
        (a.margin ?? 999) -
        (b.margin ?? 999)
    )[0] || null;

  const biggestBlowout =
    [...played].sort(
      (a, b) =>
        (b.margin ?? 0) -
        (a.margin ?? 0)
    )[0] || null;

  const teams =
    played.flatMap(
      (matchup) => [
        matchup.left,
        matchup.right
      ]
    );

  const highestScoreTeam =
    [...teams].sort(
      (a, b) =>
        b.score - a.score
    )[0] || null;

  const lowestScoreTeam =
    [...teams].sort(
      (a, b) =>
        a.score - b.score
    )[0] || null;

  const losers =
    played
      .map((matchup) => {
        if (
          matchup.left.score ===
          matchup.right.score
        ) {
          return null;
        }

        return matchup.left.score <
          matchup.right.score
          ? matchup.left
          : matchup.right;
      })
      .filter(Boolean);

  const highestScoringLoser =
    [...losers].sort(
      (a, b) =>
        b.score - a.score
    )[0] || null;

  return {
    highestCombined,
    closestGame,
    biggestBlowout,
    highestScoreTeam,
    lowestScoreTeam,
    highestScoringLoser
  };
}