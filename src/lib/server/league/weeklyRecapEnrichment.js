function round2(value) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? Number(number.toFixed(2))
    : null;
}

function compactIdentity(
  identity
) {
  if (!identity) {
    return null;
  }

  return {
    managerId:
      identity.managerId ||
      identity.ownerId ||
      null,

    managerName:
      identity.managerName ||
      null,

    teamName:
      identity.teamName ||
      null,

    managerSlug:
      identity.managerSlug ||
      null
  };
}

function findManagerIdentity(
  rosterIdentityMap,
  managerId
) {
  if (
    managerId == null
  ) {
    return null;
  }

  const wanted =
    String(managerId);

  for (
    const identity of
    rosterIdentityMap.values()
  ) {
    if (
      String(
        identity.managerId ||
        ''
      ) === wanted ||
      String(
        identity.ownerId ||
        ''
      ) === wanted
    ) {
      return identity;
    }
  }

  return null;
}

export function enrichTradesWithCapitalReviews({
  trades = [],
  reviews = [],
  rosterIdentityMap =
    new Map()
} = {}) {
  const reviewByTransaction =
    new Map(
      reviews.map(
        (review) => [
          String(
            review.transactionId
          ),
          review
        ]
      )
    );

  return trades.map(
    (trade) => {
      const review =
        reviewByTransaction.get(
          String(trade.id)
        );

      const capital =
        review?.capital ||
        null;

      const fromIdentity =
        capital
          ? findManagerIdentity(
              rosterIdentityMap,
              capital.fromManagerId
            )
          : null;

      const toIdentity =
        capital
          ? findManagerIdentity(
              rosterIdentityMap,
              capital.toManagerId
            )
          : null;

      return {
        ...trade,

        draftCapitalReview: {
          status:
            review?.reviewStatus ||
            'pending',

          reviewedAt:
            review?.reviewedAt ??
            null,

          note:
            review?.reviewNote ||
            null,

          transferId:
            review?.transferId ||
            null,

          capital:
            capital
              ? {
                  futuresYear:
                    capital.futuresYear,

                  amount:
                    round2(
                      capital.amount
                    ),

                  amountCents:
                    Number(
                      capital.amountCents ||
                      0
                    ),

                  fromManagerId:
                    capital.fromManagerId,

                  toManagerId:
                    capital.toManagerId,

                  from:
                    compactIdentity(
                      fromIdentity
                    ),

                  to:
                    compactIdentity(
                      toIdentity
                    ),

                  transactionDate:
                    capital.transactionDate ||
                    null,

                  note:
                    capital.note ||
                    null
                }
              : null
        }
      };
    }
  );
}

function compactMovement(
  row
) {
  if (!row) {
    return null;
  }

  return {
    rosterId:
      row.rosterId,

    teamName:
      row.teamName,

    managerName:
      row.managerName,

    beforeRank:
      row.beforeRank,

    afterRank:
      row.afterRank,

    change:
      row.change,

    beforeRecord:
      row.beforeRecord,

    weekRecord:
      row.weekRecord,

    afterRecord:
      row.afterRecord,

    weekScore:
      row.weekScore
  };
}

function getBiggestClimber(
  movement = []
) {
  return (
    [...movement]
      .filter(
        (row) =>
          Number(row.change) > 0
      )
      .sort(
        (a, b) =>
          Number(b.change) -
          Number(a.change)
      )[0] ||
    null
  );
}

function getBiggestFaller(
  movement = []
) {
  return (
    [...movement]
      .filter(
        (row) =>
          Number(row.change) < 0
      )
      .sort(
        (a, b) =>
          Number(a.change) -
          Number(b.change)
      )[0] ||
    null
  );
}

function flattenFaab(
  waivers = []
) {
  const rows = [];

  for (
    const transaction of
    waivers
  ) {
    for (
      const faab of
      transaction.faab || []
    ) {
      const addedPlayers =
        (
          transaction.adds ||
          []
        ).flatMap(
          (group) =>
            group.players ||
            []
        );

      rows.push({
        transactionId:
          transaction.id,

        teamName:
          faab.teamName,

        managerName:
          faab.managerName,

        rosterId:
          faab.rosterId,

        amount:
          Number(
            faab.amount || 0
          ),

        players:
          addedPlayers.map(
            (player) => ({
              id:
                player.id,

              name:
                player.name,

              position:
                player.position,

              nflTeam:
                player.nflTeam
            })
          )
      });
    }
  }

  return rows;
}

function findBenchExplosion(
  matchups = []
) {
  const candidates = [];

  for (
    const matchup of
    matchups
  ) {
    for (
      const side of [
        matchup.left,
        matchup.right
      ]
    ) {
      if (!side) {
        continue;
      }

      for (
        const player of
        side.bench || []
      ) {
        const score =
          Number(
            player.fantasyPoints
          );

        if (
          !Number.isFinite(
            score
          )
        ) {
          continue;
        }

        candidates.push({
          rosterId:
            side.rosterId,

          teamName:
            side.teamName,

          managerName:
            side.managerName,

          player: {
            id:
              player.id,

            name:
              player.name,

            position:
              player.position,

            nflTeam:
              player.nflTeam,

            fantasyPoints:
              round2(score)
          }
        });
      }
    }
  }

  return (
    candidates.sort(
      (a, b) =>
        b.player.fantasyPoints -
        a.player.fantasyPoints
    )[0] ||
    null
  );
}

function compactBadgeCandidate(
  candidate
) {
  return {
    badgeKey:
      candidate.badgeKey,

    badgeTitle:
      candidate.badgeTitle,

    badgeIcon:
      candidate.badgeIcon,

    managerId:
      candidate.managerId,

    managerName:
      candidate.managerName,

    teamName:
      candidate.teamName,

    score:
      candidate.score,

    opponentName:
      candidate.opponentName,

    opponentTeamName:
      candidate.opponentTeamName,

    opponentScore:
      candidate.opponentScore,

    margin:
      candidate.margin,

    matchupId:
      candidate.matchupId,

    reason:
      candidate.reason,

    alreadyAwarded:
      Boolean(
        candidate.alreadyAwarded
      ),

    metadata:
      candidate.metadata ||
      {}
  };
}

export function buildWeeklyStoryFacts({
  matchups = [],
  highlights = null,
  standings = null,
  transactions = null,
  badgePreview = null
} = {}) {
  const movement =
    standings?.movement ||
    [];

  const waivers =
    transactions?.waivers ||
    [];

  const faabRows =
    flattenFaab(
      waivers
    );

  const biggestFaabSpend =
    [...faabRows]
      .sort(
        (a, b) =>
          b.amount -
          a.amount
      )[0] ||
    null;

  const badgeCandidates =
    (
      badgePreview?.candidates ||
      []
    ).map(
      compactBadgeCandidate
    );

  const badgesByKey =
    Object.fromEntries(
      [
        'bde',
        'suck',
        'ides',
        'hbk',
        'zerohour',
        'byebye',
        'captain'
      ].map(
        (key) => [
          key,
          badgeCandidates.filter(
            (candidate) =>
              candidate.badgeKey ===
              key
          )
        ]
      )
    );

  return {
    standings: {
      biggestClimber:
        compactMovement(
          getBiggestClimber(
            movement
          )
        ),

      biggestFaller:
        compactMovement(
          getBiggestFaller(
            movement
          )
        )
    },

    scoring: {
      highestScore:
        highlights
          ?.highestScoreTeam
          ? {
              teamName:
                highlights
                  .highestScoreTeam
                  .teamName,

              managerName:
                highlights
                  .highestScoreTeam
                  .managerName,

              score:
                highlights
                  .highestScoreTeam
                  .score
            }
          : null,

      lowestScore:
        highlights
          ?.lowestScoreTeam
          ? {
              teamName:
                highlights
                  .lowestScoreTeam
                  .teamName,

              managerName:
                highlights
                  .lowestScoreTeam
                  .managerName,

              score:
                highlights
                  .lowestScoreTeam
                  .score
            }
          : null,

      highestScoringLoser:
        highlights
          ?.highestScoringLoser
          ? {
              teamName:
                highlights
                  .highestScoringLoser
                  .teamName,

              managerName:
                highlights
                  .highestScoringLoser
                  .managerName,

              score:
                highlights
                  .highestScoringLoser
                  .score
            }
          : null,

      benchExplosion:
        findBenchExplosion(
          matchups
        )
    },

    faab: {
      totalSpent:
        round2(
          faabRows.reduce(
            (total, row) =>
              total +
              row.amount,
            0
          )
        ),

      winningClaims:
        faabRows.length,

      biggestSpend:
        biggestFaabSpend
    },

    weeklyAwards: {
      all:
        badgeCandidates,

      highestScore:
        badgesByKey.bde,

      lowestScore:
        badgesByKey.suck,

      highScoringLoser:
        badgesByKey.ides,

      heartbreak:
        badgesByKey.hbk,

      zeroHour:
        badgesByKey.zerohour,

      byeByeBye:
        badgesByKey.byebye,

      capnHindsight:
        badgesByKey.captain
    },

    warnings:
      badgePreview?.warnings ||
      []
  };
}