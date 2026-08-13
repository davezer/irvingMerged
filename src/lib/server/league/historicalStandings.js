import {
  buildRosterIdentityMap
} from '$lib/server/league/identity.js';

import {
  getSleeperMatchupsForWeek
} from '$lib/server/league/sleeperClient.js';

import {
  chunkPairs
} from '$lib/server/league/matchupAnalytics.js';

function numberValue(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function matchupScore(entry) {
  return numberValue(
    entry?.custom_points ??
    entry?.points ??
    0
  );
}

function recordPct(wins, losses, ties) {
  const games =
    wins +
    losses +
    ties;

  if (!games) {
    return 0;
  }

  return (
    wins +
    ties * 0.5
  ) / games;
}

function recordLabel({
  wins = 0,
  losses = 0,
  ties = 0
} = {}) {
  return ties
    ? `${wins}-${losses}-${ties}`
    : `${wins}-${losses}`;
}

function medianScore(scores = []) {
  const sorted =
    [...scores]
      .map(Number)
      .filter(Number.isFinite)
      .sort(
        (a, b) =>
          a - b
      );

  if (!sorted.length) {
    return null;
  }

  const middle =
    Math.floor(
      sorted.length / 2
    );

  if (
    sorted.length % 2 === 1
  ) {
    return sorted[middle];
  }

  return (
    sorted[middle - 1] +
    sorted[middle]
  ) / 2;
}

function createRows({
  rosters = [],
  users = []
} = {}) {
  const identityMap =
    buildRosterIdentityMap({
      rosters,
      users
    });

  const rows =
    new Map();

  for (const roster of rosters) {
    const rosterId =
      Number(
        roster.roster_id
      );

    const identity =
      identityMap.get(
        rosterId
      );

    rows.set(
      rosterId,
      {
        rosterId,

        ownerId:
          roster?.owner_id
            ? String(
                roster.owner_id
              )
            : null,

        teamName:
          identity?.teamName ||
          `Roster ${rosterId}`,

        managerName:
          identity?.managerName ||
          'Unknown Manager',

        managerSlug:
          identity?.managerSlug ||
          null,

        teamPhoto:
          identity?.teamPhoto ||
          null,

        wins: 0,
        losses: 0,
        ties: 0,

        h2hWins: 0,
        h2hLosses: 0,
        h2hTies: 0,

        topHalfWins: 0,
        topHalfLosses: 0,
        topHalfTies: 0,

        pointsFor: 0,
        pointsAgainst: 0
      }
    );
  }

  return rows;
}

function standingsSnapshot(
  rows
) {
  const result =
    [...rows.values()]
      .map((row) => {
        const pct =
          recordPct(
            row.wins,
            row.losses,
            row.ties
          );

        return {
          ...row,

          pointsFor:
            Number(
              row.pointsFor
                .toFixed(2)
            ),

          pointsAgainst:
            Number(
              row.pointsAgainst
                .toFixed(2)
            ),

          pointDiff:
            Number(
              (
                row.pointsFor -
                row.pointsAgainst
              ).toFixed(2)
            ),

          gamesPlayed:
            row.wins +
            row.losses +
            row.ties,

          pct,

          recordLabel:
            recordLabel(row)
        };
      })
      .sort(
        (a, b) =>
          (
            b.wins -
            a.wins
          ) ||
          (
            b.pct -
            a.pct
          ) ||
          (
            b.pointsFor -
            a.pointsFor
          ) ||
          (
            a.pointsAgainst -
            b.pointsAgainst
          ) ||
          a.teamName.localeCompare(
            b.teamName
          )
      );

  return result.map(
    (row, index) => ({
      ...row,
      rank:
        index + 1
    })
  );
}

function weeklyResultObject(
  row
) {
  return {
    rosterId:
      row.rosterId,

    teamName:
      row.teamName,

    managerName:
      row.managerName,

    managerSlug:
      row.managerSlug,

    score: null,

    h2hResult: null,
    topHalfResult: null,

    wins: 0,
    losses: 0,
    ties: 0,

    recordLabel:
      '0-0'
  };
}

function addWin(
  standing,
  weekly,
  bucket
) {
  standing.wins += 1;
  weekly.wins += 1;

  if (bucket === 'h2h') {
    standing.h2hWins += 1;
    weekly.h2hResult =
      'W';
  }

  if (
    bucket ===
    'topHalf'
  ) {
    standing.topHalfWins += 1;
    weekly.topHalfResult =
      'W';
  }
}

function addLoss(
  standing,
  weekly,
  bucket
) {
  standing.losses += 1;
  weekly.losses += 1;

  if (bucket === 'h2h') {
    standing.h2hLosses += 1;
    weekly.h2hResult =
      'L';
  }

  if (
    bucket ===
    'topHalf'
  ) {
    standing.topHalfLosses += 1;
    weekly.topHalfResult =
      'L';
  }
}

function addTie(
  standing,
  weekly,
  bucket
) {
  standing.ties += 1;
  weekly.ties += 1;

  if (bucket === 'h2h') {
    standing.h2hTies += 1;
    weekly.h2hResult =
      'T';
  }

  if (
    bucket ===
    'topHalf'
  ) {
    standing.topHalfTies += 1;
    weekly.topHalfResult =
      'T';
  }
}

function applyWeek({
  rows,
  rawMatchups,
  week
}) {
  const weekly =
    new Map();

  for (
    const row of
    rows.values()
  ) {
    weekly.set(
      row.rosterId,
      weeklyResultObject(
        row
      )
    );
  }

  const validEntries =
    (
      rawMatchups ||
      []
    ).filter(
      (entry) =>
        rows.has(
          Number(
            entry.roster_id
          )
        )
    );

  /*
   * First: add each team's
   * weekly fantasy points.
   */
  for (
    const entry of
    validEntries
  ) {
    const rosterId =
      Number(
        entry.roster_id
      );

    const standing =
      rows.get(
        rosterId
      );

    const weekRow =
      weekly.get(
        rosterId
      );

    const score =
      matchupScore(
        entry
      );

    standing.pointsFor +=
      score;

    weekRow.score =
      Number(
        score.toFixed(2)
      );
  }

  /*
   * H2H RESULT
   */
  const groups =
    chunkPairs(
      validEntries
    );

  for (
    const group of
    groups
  ) {
    if (
      group.teams.length <
      2
    ) {
      continue;
    }

    const left =
      group.teams[0];

    const right =
      group.teams[1];

    const leftRosterId =
      Number(
        left.roster_id
      );

    const rightRosterId =
      Number(
        right.roster_id
      );

    const leftStanding =
      rows.get(
        leftRosterId
      );

    const rightStanding =
      rows.get(
        rightRosterId
      );

    const leftWeekly =
      weekly.get(
        leftRosterId
      );

    const rightWeekly =
      weekly.get(
        rightRosterId
      );

    if (
      !leftStanding ||
      !rightStanding ||
      !leftWeekly ||
      !rightWeekly
    ) {
      continue;
    }

    const leftScore =
      matchupScore(
        left
      );

    const rightScore =
      matchupScore(
        right
      );

    leftStanding.pointsAgainst +=
      rightScore;

    rightStanding.pointsAgainst +=
      leftScore;

    if (
      leftScore >
      rightScore
    ) {
      addWin(
        leftStanding,
        leftWeekly,
        'h2h'
      );

      addLoss(
        rightStanding,
        rightWeekly,
        'h2h'
      );
    } else if (
      rightScore >
      leftScore
    ) {
      addWin(
        rightStanding,
        rightWeekly,
        'h2h'
      );

      addLoss(
        leftStanding,
        leftWeekly,
        'h2h'
      );
    } else {
      addTie(
        leftStanding,
        leftWeekly,
        'h2h'
      );

      addTie(
        rightStanding,
        rightWeekly,
        'h2h'
      );
    }
  }

  /*
   * TOP-HALF / MEDIAN RESULT
   *
   * With 14 teams:
   *   7 above median = win
   *   7 below median = loss
   *
   * An exact median tie is
   * recorded as a tie.
   */
  const scores =
    validEntries.map(
      (entry) =>
        matchupScore(
          entry
        )
    );

  const median =
    medianScore(
      scores
    );

  if (
    median !== null
  ) {
    for (
      const entry of
      validEntries
    ) {
      const rosterId =
        Number(
          entry.roster_id
        );

      const standing =
        rows.get(
          rosterId
        );

      const weekRow =
        weekly.get(
          rosterId
        );

      if (
        !standing ||
        !weekRow
      ) {
        continue;
      }

      const score =
        matchupScore(
          entry
        );

      if (
        score >
        median
      ) {
        addWin(
          standing,
          weekRow,
          'topHalf'
        );
      } else if (
        score <
        median
      ) {
        addLoss(
          standing,
          weekRow,
          'topHalf'
        );
      } else {
        addTie(
          standing,
          weekRow,
          'topHalf'
        );
      }
    }
  }

  const weeklyResults =
    [...weekly.values()]
      .map((row) => ({
        ...row,

        recordLabel:
          recordLabel(
            row
          )
      }))
      .sort(
        (a, b) =>
          (
            b.score ?? 0
          ) -
          (
            a.score ?? 0
          )
      );

  return {
    week,

    median:
      median === null
        ? null
        : Number(
            median.toFixed(2)
          ),

    results:
      weeklyResults
  };
}

function buildMovement({
  beforeWeek,
  afterWeek,
  selectedWeekResults
}) {
  const beforeByRoster =
    new Map(
      beforeWeek.map(
        (row) => [
          row.rosterId,
          row
        ]
      )
    );

  const weekByRoster =
    new Map(
      selectedWeekResults.map(
        (row) => [
          row.rosterId,
          row
        ]
      )
    );

  return afterWeek
    .map(
      (after) => {
        const before =
          beforeByRoster.get(
            after.rosterId
          );

        const week =
          weekByRoster.get(
            after.rosterId
          );

        const beforeRank =
          before?.rank ??
          null;

        const afterRank =
          after.rank;

        const change =
          beforeRank === null
            ? 0
            : beforeRank -
              afterRank;

        return {
          rosterId:
            after.rosterId,

          teamName:
            after.teamName,

          managerName:
            after.managerName,

          managerSlug:
            after.managerSlug,

          beforeRank,

          afterRank,

          change,

          direction:
            change > 0
              ? 'up'
              : change < 0
                ? 'down'
                : 'same',

          beforeRecord:
            before?.recordLabel ||
            '0-0',

          afterRecord:
            after.recordLabel,

          weekRecord:
            week?.recordLabel ||
            '0-0',

          h2hResult:
            week?.h2hResult ||
            null,

          topHalfResult:
            week?.topHalfResult ||
            null,

          weekScore:
            week?.score ??
            null,

          pointsFor:
            after.pointsFor,

          pointsAgainst:
            after.pointsAgainst
        };
      }
    )
    .sort(
      (a, b) =>
        a.afterRank -
        b.afterRank
    );
}

export async function buildHistoricalStandings({
  leagueId,
  rosters = [],
  users = [],
  throughWeek,
  selectedWeekMatchups = null
} = {}) {
  const finalWeek =
    Number(
      throughWeek
    );

  if (
    !leagueId ||
    !Number.isInteger(
      finalWeek
    ) ||
    finalWeek < 1
  ) {
    return {
      beforeWeek: [],
      afterWeek: [],
      movement: [],
      selectedWeekResults: [],
      selectedWeekMedian: null,
      weeksProcessed: 0
    };
  }

  const rows =
    createRows({
      rosters,
      users
    });

  const weekNumbers =
    Array.from(
      {
        length:
          finalWeek
      },
      (_, index) =>
        index + 1
    );

  const matchupWeeks =
    await Promise.all(
      weekNumbers.map(
        async (week) => {
          if (
            week ===
              finalWeek &&
            Array.isArray(
              selectedWeekMatchups
            )
          ) {
            return {
              week,
              matchups:
                selectedWeekMatchups
            };
          }

          const matchups =
            await getSleeperMatchupsForWeek(
              leagueId,
              week
            );

          return {
            week,
            matchups
          };
        }
      )
    );

  let beforeWeek =
    [];

  let selectedWeekData = {
    week:
      finalWeek,

    median:
      null,

    results:
      []
  };

  for (
    const weekData of
    matchupWeeks
  ) {
    if (
      weekData.week ===
      finalWeek
    ) {
      beforeWeek =
        standingsSnapshot(
          rows
        );
    }

    const applied =
      applyWeek({
        rows,
        rawMatchups:
          weekData.matchups,
        week:
          weekData.week
      });

    if (
      weekData.week ===
      finalWeek
    ) {
      selectedWeekData =
        applied;
    }
  }

  const afterWeek =
    standingsSnapshot(
      rows
    );

  const movement =
    buildMovement({
      beforeWeek,
      afterWeek,
      selectedWeekResults:
        selectedWeekData.results
    });

  return {
    beforeWeek,

    afterWeek,

    movement,

    selectedWeekResults:
      selectedWeekData.results,

    selectedWeekMedian:
      selectedWeekData.median,

    weeksProcessed:
      matchupWeeks.length
  };
}