import {
  resolveLeagueContext
} from '$lib/server/league/context.js';

import {
  buildRosterIdentityMap
} from '$lib/server/league/identity.js';

import {
  resolvePlayersByIds
} from '$lib/server/league/players.js';

import {
  getSleeperMatchupsForWeek,
  getSleeperRosters,
  getSleeperUsers
} from '$lib/server/league/sleeperClient.js';

import {
  getLiveTransactionsBundle
} from '$lib/server/league/transactionsLive.js';

import {
  buildRosterSettingsMap,
  buildWeekHighlights,
  chunkPairs,
  normalizeMatchupGroup
} from '$lib/server/league/matchupAnalytics.js';

import {
  buildHistoricalStandings
} from '$lib/server/league/historicalStandings.js';

import {
  buildWeeklyBadgePreview
} from '$lib/server/league/weeklyBadgeGenerator.js';

import {
  buildWeeklyStoryFacts
} from '$lib/server/league/weeklyRecapEnrichment.js';

import {
  buildWeeklyRecapLeagueMemory
} from '$lib/server/league/weeklyRecapLeagueMemory.js';


function compactPlayer(player) {
  if (!player) return null;

  return {
    id: String(player.id),
    name: player.name,
    position: player.position || null,
    nflTeam: player.team || null,
    fantasyPoints: player.fantasyPoints ?? null
  };
}


function compactSide(side) {
  if (!side) return null;

  return {
    rosterId: side.rosterId,
    teamName: side.teamName,
    managerName: side.managerName,
    managerSlug: side.managerSlug,
    score: side.score,

    starters:
      (side.starters || [])
        .map(compactPlayer)
        .filter(Boolean),

    bench:
      (side.bench || [])
        .map(compactPlayer)
        .filter(Boolean)
  };
}


function compactMatchup(matchup) {
  return {
    matchupId: matchup.matchupId,
    left: compactSide(matchup.left),
    right: compactSide(matchup.right),
    winnerRosterId: matchup.winner,
    winnerName: matchup.winnerName,
    margin: matchup.margin,
    totalScore: matchup.totalScore
  };
}


function compactTransactionPlayer(player) {
  return {
    id: String(player.id),
    name: player.name,
    position: player.position || null,
    nflTeam: player.team || null
  };
}


function compactTransactionGroup(group) {
  return {
    rosterId: group.rosterId,
    teamName: group.teamName,
    managerName: group.managerName,
    managerSlug: group.managerSlug,

    players:
      (group.players || [])
        .map(compactTransactionPlayer)
  };
}


function compactDraftCapitalReview(review) {
  if (!review) return null;

  return {
    status: review.status || 'unreviewed',
    reviewStatus: review.reviewStatus || null,
    source: review.source || null,
    matchMethod: review.matchMethod || null,
    transferId: review.transferId || null,
    reviewedAt: review.reviewedAt ?? null,
    note: review.note || null,

    capital:
      review.capital
        ? {
            futuresYear:
              review.capital.futuresYear,

            amount:
              Number(
                review.capital.amount ||
                0
              ),

            amountCents:
              Number(
                review.capital.amountCents ||
                0
              ),

            fromManagerId:
              review.capital.fromManagerId,

            toManagerId:
              review.capital.toManagerId,

            from:
              review.capital.from ||
              null,

            to:
              review.capital.to ||
              null,

            transactionDate:
              review.capital.transactionDate ||
              null,

            note:
              review.capital.note ||
              null
          }
        : null
  };
}


function compactTransaction(transaction) {
  return {
    id: transaction.id,
    week: transaction.week,
    type: transaction.type,
    status: transaction.status,
    createdAt: transaction.createdAt,
    summary: transaction.summaryLine,

    teams:
      (
        transaction.rosterCards ||
        []
      ).map((team) => ({
        rosterId:
          team.rosterId,

        managerId:
          team.managerId ||
          team.ownerId ||
          null,

        teamName:
          team.teamName,

        managerName:
          team.managerName,

        managerSlug:
          team.managerSlug
      })),

    adds:
      (
        transaction.addGroups ||
        []
      ).map(
        compactTransactionGroup
      ),

    drops:
      (
        transaction.dropGroups ||
        []
      ).map(
        compactTransactionGroup
      ),

    draftPicks:
      (
        transaction.draftPicks ||
        []
      ).map((pick) => ({
        id: pick.id,
        label: pick.label,
        currentOwner: pick.currentOwner,
        previousOwner: pick.previousOwner,
        lineage: pick.lineage
      })),

    faab:
      (
        transaction.faabRows ||
        []
      ).map((row) => ({
        rosterId: row.rosterId,
        teamName: row.teamName,
        managerName: row.managerName,
        amount: Number(row.amount || 0)
      })),

    draftCapitalReview:
      compactDraftCapitalReview(
        transaction.draftCapitalReview
      )
  };
}


function countPlayersInGroups(
  transactions,
  key
) {
  return transactions.reduce(
    (total, transaction) =>
      total +
      (
        transaction[key] ||
        []
      ).reduce(
        (groupTotal, group) =>
          groupTotal +
          (
            group.players ||
            []
          ).length,
        0
      ),
    0
  );
}


function sumFaab(transactions) {
  return transactions.reduce(
    (total, transaction) =>
      total +
      (
        transaction.faab ||
        []
      ).reduce(
        (rowTotal, row) =>
          rowTotal +
          Number(
            row.amount ||
            0
          ),
        0
      ),
    0
  );
}


function transactionUrlForWeek(
  url,
  week
) {
  const next =
    new URL(url);

  next.searchParams.set(
    'week',
    String(week)
  );

  next.searchParams.delete(
    'weeks'
  );

  next.searchParams.delete(
    'team'
  );

  next.searchParams.delete(
    'rosterId'
  );

  return next;
}


function completedTransactions(
  bundle
) {
  return (
    bundle?.transactions ||
    []
  )
    .filter(
      (transaction) =>
        String(
          transaction.status ||
          'complete'
        ).toLowerCase() ===
        'complete'
    )
    .map(
      compactTransaction
    );
}


function uniqueTransactions(
  transactions
) {
  const byId =
    new Map();

  for (
    const transaction of
    transactions ||
    []
  ) {
    byId.set(
      String(
        transaction.id
      ),
      transaction
    );
  }

  return [
    ...byId.values()
  ].sort(
    (a, b) =>
      Number(
        b.createdAt ||
        0
      ) -
      Number(
        a.createdAt ||
        0
      )
  );
}


export async function buildWeeklyRecapPacket({
  url,
  env
} = {}) {
  const db =
    env?.DB ||
    null;

  const enrichmentWarnings =
    [];

  const context =
    await resolveLeagueContext({
      url,
      env,
      allWeeksByDefault: false
    });

  const week =
    Number(
      context.selectedWeek
    );

  /*
   * Irving Weekly uses the league's actual editorial news cycle:
   *
   *   Wednesday waiver/free-agency open
   *       through
   *   the following week's games
   *
   * Sleeper attributes those Wednesday wire moves to the PREVIOUS
   * transaction round in this league. That is why they used to show
   * up one recap early.
   *
   * Only waiver/free-agent activity is shifted. Trades and other
   * transaction types keep the selected Sleeper week so the normal
   * Transactions page remains completely untouched.
   */
  const wireSleeperWeek =
    week > 1
      ? week - 1
      : week;

  const currentTransactionUrl =
    transactionUrlForWeek(
      url,
      week
    );

  const wireTransactionUrl =
    transactionUrlForWeek(
      url,
      wireSleeperWeek
    );

  const [
    users,
    rosters,
    rawMatchups,
    currentTransactionBundle,
    wireTransactionBundle
  ] =
    await Promise.all([
      getSleeperUsers(
        context.leagueId
      ),

      getSleeperRosters(
        context.leagueId
      ),

      getSleeperMatchupsForWeek(
        context.leagueId,
        week
      ),

      getLiveTransactionsBundle({
        url:
          currentTransactionUrl,

        env
      }),

      wireSleeperWeek ===
      week
        ? Promise.resolve(
            null
          )
        : getLiveTransactionsBundle({
            url:
              wireTransactionUrl,

            env
          })
    ]);

  const rosterIdentityMap =
    buildRosterIdentityMap({
      rosters,
      users
    });

  const rosterSettingsMap =
    buildRosterSettingsMap(
      rosters
    );

  const playerIds =
    rawMatchups.flatMap(
      (entry) => [
        ...(entry.starters || []),
        ...(entry.players || [])
      ]
    );

  const playersById =
    await resolvePlayersByIds(
      playerIds
    );

  const historicalStandings =
    await buildHistoricalStandings({
      leagueId:
        context.leagueId,

      rosters,

      users,

      throughWeek:
        week,

      selectedWeekMatchups:
        rawMatchups
    });

  const normalizedMatchups =
    chunkPairs(
      rawMatchups
    ).map(
      (group) =>
        normalizeMatchupGroup(
          group,
          rosterIdentityMap,
          rosterSettingsMap,
          playersById,
          {
            includeStarters:
              true
          }
        )
    );

  const matchups =
    normalizedMatchups
      .map(
        compactMatchup
      )
      .filter(
        (matchup) =>
          matchup.left &&
          matchup.right
      );

  const highlights =
    buildWeekHighlights(
      matchups
    );

  const currentCompleted =
    completedTransactions(
      currentTransactionBundle
    );

  const wireCompleted =
    wireTransactionBundle
      ? completedTransactions(
          wireTransactionBundle
        )
      : currentCompleted;

  /*
   * WAIVERS / FREE AGENTS:
   * Pull from the prior Sleeper transaction round for recap Weeks 2+.
   *
   * TRADES / COMMISH / OTHER:
   * Preserve the existing selected-week behavior.
   */
  const waivers =
    wireCompleted.filter(
      (transaction) =>
        transaction.type ===
        'waiver'
    );

  const freeAgents =
    wireCompleted.filter(
      (transaction) =>
        transaction.type ===
        'free_agent'
    );

  const trades =
    currentCompleted.filter(
      (transaction) =>
        transaction.type ===
        'trade'
    );

  const commissionerMoves =
    currentCompleted.filter(
      (transaction) =>
        transaction.type ===
        'commish'
    );

  const knownCurrentTypes =
    new Set([
      'waiver',
      'free_agent',
      'trade',
      'commish'
    ]);

  const otherTransactions =
    currentCompleted.filter(
      (transaction) =>
        !knownCurrentTypes.has(
          transaction.type
        )
    );

  const selectedTransactions =
    uniqueTransactions([
      ...waivers,
      ...freeAgents,
      ...trades,
      ...commissionerMoves,
      ...otherTransactions
    ]);

  let badgePreview =
    null;

  if (db) {
    try {
      badgePreview =
        await buildWeeklyBadgePreview({
          db,

          leagueId:
            context.leagueId,

          season:
            Number(
              context.season
            ),

          week
        });
    } catch (error) {
      console.warn(
        '[weekly-recap] Badge enrichment failed:',
        error
      );

      enrichmentWarnings.push(
        `Weekly badge enrichment failed: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`
      );
    }
  } else {
    enrichmentWarnings.push(
      'D1 binding unavailable; weekly badge enrichment was skipped.'
    );
  }

  for (
    const bundle of [
      currentTransactionBundle,
      wireTransactionBundle
    ]
  ) {
    enrichmentWarnings.push(
      ...(
        bundle
          ?.capitalWarnings ||
        []
      )
    );
  }

  const transactionPacket = {
    waivers,
    freeAgents,
    trades,
    commissionerMoves,
    other:
      otherTransactions,

    editorialWindow: {
      recapWeek:
        week,

      waiverAndFreeAgentSleeperWeek:
        wireSleeperWeek,

      tradeSleeperWeek:
        week,

      note:
        week > 1
          ? 'Waiver/free-agent activity is intentionally read from the previous Sleeper transaction round so Wednesday wire activity belongs to the upcoming matchup recap.'
          : 'Week 1 uses Sleeper Week 1 for all transaction types.'
    }
  };

  const standingsPacket = {
    beforeWeek:
      historicalStandings.beforeWeek,

    afterWeek:
      historicalStandings.afterWeek,

    movement:
      historicalStandings.movement,

    weeklyResults:
      historicalStandings.selectedWeekResults,

    medianScore:
      historicalStandings.selectedWeekMedian,

    weeksProcessed:
      historicalStandings.weeksProcessed
  };

  const storyFacts =
    buildWeeklyStoryFacts({
      matchups,
      highlights,

      standings:
        standingsPacket,

      transactions:
        transactionPacket,

      badgePreview
    });

  let beatWriterContext =
    null;

  try {
    beatWriterContext =
      await buildWeeklyRecapLeagueMemory({
        db,

        season:
          Number(
            context.season
          ),

        week,

        matchups
      });

    enrichmentWarnings.push(
      ...(
        beatWriterContext
          ?.warnings ||
        []
      )
    );
  } catch (error) {
    console.warn(
      '[weekly-recap] League memory enrichment failed:',
      error
    );

    enrichmentWarnings.push(
      `League memory enrichment failed: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`
    );
  }

  return {
    schemaVersion:
      2,

    generatedAt:
      new Date()
        .toISOString(),

    season:
      Number(
        context.season
      ),

    week,

    league: {
      id:
        context.leagueId,

      name:
        context.league?.name ||
        'Irving Championship League',

      beatWriterContext
    },

    summary: {
      matchupCount:
        matchups.length,

      teamCount:
        matchups.length * 2,

      transactionCount:
        selectedTransactions.length,

      waiverCount:
        waivers.length,

      freeAgentCount:
        freeAgents.length,

      tradeCount:
        trades.length,

      commissionerMoveCount:
        commissionerMoves.length,

      totalAdds:
        countPlayersInGroups(
          selectedTransactions,
          'adds'
        ),

      totalDrops:
        countPlayersInGroups(
          selectedTransactions,
          'drops'
        ),

      faabSpent:
        sumFaab(
          waivers
        )
    },

    highlights,

    standings:
      standingsPacket,

    storyFacts,

    matchups,

    transactions:
      transactionPacket,

    enrichment: {
      badgesAvailable:
        Boolean(
          badgePreview
        ),

      warnings:
        [
          ...new Set(
            enrichmentWarnings
          )
        ]
    },

    source:
      'Sleeper API + Irving league identity + Irving D1'
  };
}
