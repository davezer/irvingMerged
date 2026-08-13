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
  getDraftCapitalTradeReviews
} from '$lib/server/league/draftCapitalRepository.js';

import {
  buildWeeklyStoryFacts,
  enrichTradesWithCapitalReviews
} from '$lib/server/league/weeklyRecapEnrichment.js';

function compactPlayer(player) {
  if (!player) {
    return null;
  }

  return {
    id:
      String(player.id),

    name:
      player.name,

    position:
      player.position ||
      null,

    nflTeam:
      player.team ||
      null,

    fantasyPoints:
      player.fantasyPoints ??
      null
  };
}

function compactSide(side) {
  if (!side) {
    return null;
  }

  return {
    rosterId:
      side.rosterId,

    teamName:
      side.teamName,

    managerName:
      side.managerName,

    managerSlug:
      side.managerSlug,

    score:
      side.score,

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
    matchupId:
      matchup.matchupId,

    left:
      compactSide(
        matchup.left
      ),

    right:
      compactSide(
        matchup.right
      ),

    winnerRosterId:
      matchup.winner,

    winnerName:
      matchup.winnerName,

    margin:
      matchup.margin,

    totalScore:
      matchup.totalScore
  };
}

function compactTransactionPlayer(
  player
) {
  return {
    id:
      String(player.id),

    name:
      player.name,

    position:
      player.position ||
      null,

    nflTeam:
      player.team ||
      null
  };
}

function compactTransactionGroup(
  group
) {
  return {
    rosterId:
      group.rosterId,

    teamName:
      group.teamName,

    managerName:
      group.managerName,

    managerSlug:
      group.managerSlug,

    players:
      (group.players || [])
        .map(
          compactTransactionPlayer
        )
  };
}

function compactTransaction(
  transaction
) {
  return {
    id:
      transaction.id,

    week:
      transaction.week,

    type:
      transaction.type,

    status:
      transaction.status,

    createdAt:
      transaction.createdAt,

    summary:
      transaction.summaryLine,

    teams:
      (
        transaction.rosterCards ||
        []
      ).map((team) => ({
        rosterId:
          team.rosterId,

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
        id:
          pick.id,

        label:
          pick.label,

        currentOwner:
          pick.currentOwner,

        previousOwner:
          pick.previousOwner,

        lineage:
          pick.lineage
      })),

    faab:
      (
        transaction.faabRows ||
        []
      ).map((row) => ({
        rosterId:
          row.rosterId,

        teamName:
          row.teamName,

        managerName:
          row.managerName,

        amount:
          Number(
            row.amount || 0
          )
      }))
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

function sumFaab(
  transactions
) {
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
            row.amount || 0
          ),
        0
      ),
    0
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

  const [
    users,
    rosters,
    rawMatchups,
    transactionBundle
  ] = await Promise.all([
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
      url,
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

  const completedTransactions =
    (
      transactionBundle
        .transactions ||
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

  const waivers =
    completedTransactions.filter(
      (transaction) =>
        transaction.type ===
        'waiver'
    );

  const freeAgents =
    completedTransactions.filter(
      (transaction) =>
        transaction.type ===
        'free_agent'
    );

  const trades =
    completedTransactions.filter(
      (transaction) =>
        transaction.type ===
        'trade'
    );

  const commissionerMoves =
    completedTransactions.filter(
      (transaction) =>
        transaction.type ===
        'commish'
    );

      let badgePreview =
    null;

  let tradeReviews =
    [];

  if (db) {
    const [
      badgeResult,
      tradeReviewResult
    ] =
      await Promise.allSettled([
        buildWeeklyBadgePreview({
          db,

          leagueId:
            context.leagueId,

          season:
            Number(
              context.season
            ),

          week
        }),

        getDraftCapitalTradeReviews(
          db,
          {
            season:
              Number(
                context.season
              )
          }
        )
      ]);

    if (
      badgeResult.status ===
      'fulfilled'
    ) {
      badgePreview =
        badgeResult.value;
    } else {
      console.warn(
        '[weekly-recap] Badge enrichment failed:',
        badgeResult.reason
      );

      enrichmentWarnings.push(
        `Weekly badge enrichment failed: ${
          badgeResult.reason instanceof Error
            ? badgeResult.reason.message
            : String(
                badgeResult.reason
              )
        }`
      );
    }

    if (
      tradeReviewResult.status ===
      'fulfilled'
    ) {
      tradeReviews =
        tradeReviewResult.value;
    } else {
      console.warn(
        '[weekly-recap] Trade review enrichment failed:',
        tradeReviewResult.reason
      );

      enrichmentWarnings.push(
        `Trade review enrichment failed: ${
          tradeReviewResult.reason instanceof Error
            ? tradeReviewResult.reason.message
            : String(
                tradeReviewResult.reason
              )
        }`
      );
    }
  } else {
    enrichmentWarnings.push(
      'D1 binding unavailable; weekly badge and draft-capital enrichment were skipped.'
    );
  }

    const enrichedTrades =
    enrichTradesWithCapitalReviews({
      trades,

      reviews:
        tradeReviews,

      rosterIdentityMap
    });

  const knownTypes =
    new Set([
      'waiver',
      'free_agent',
      'trade',
      'commish'
    ]);

  const otherTransactions =
    completedTransactions.filter(
      (transaction) =>
        !knownTypes.has(
          transaction.type
        )
    );

      const transactionPacket = {
    waivers,
    freeAgents,

    trades:
      enrichedTrades,

    commissionerMoves,

    other:
      otherTransactions
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

  return {
    schemaVersion:
      1,

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
        'Irving Champions League'
    },

    summary: {
      matchupCount:
        matchups.length,

      teamCount:
        matchups.length * 2,

      transactionCount:
        completedTransactions.length,

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
          completedTransactions,
          'adds'
        ),

      totalDrops:
        countPlayersInGroups(
          completedTransactions,
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

      tradeReviewsLoaded:
        tradeReviews.length,

      warnings:
        enrichmentWarnings
    },

    source:
      'Sleeper API + Irving league identity + Irving D1'
  };
}