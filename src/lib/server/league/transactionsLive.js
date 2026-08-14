import { resolveLeagueContext } from '$lib/server/league/context.js';
import { buildRosterIdentityMap, resolveSelectedTeam } from '$lib/server/league/identity.js';
import { resolvePlayersByIds } from '$lib/server/league/players.js';
import { getSleeperRosters, getSleeperTransactionsForWeek, getSleeperUsers } from '$lib/server/league/sleeperClient.js';
import { getDraftCapitalTradeReviews, getDraftCapitalTransfers } from '$lib/server/league/draftCapitalRepository.js';

function formatType(type) {
  return String(type || 'move').replaceAll('_', ' ');
}

function resolveRoster(rosterIdentityMap, rosterId) {
  return rosterIdentityMap.get(Number(rosterId)) || {
    rosterId: Number(rosterId),
    teamName: `Roster ${rosterId}`,
    managerName: 'Unknown Manager',
    teamPhoto: null,
    initials: '?',
    managerSlug: null,
    ownerId: null
  };
}

function buildPlayerRef(playersById, playerId) {
  return playersById.get(String(playerId)) || {
    id: String(playerId),
    name: `Player ${playerId}`,
    shortName: `#${playerId}`,
    position: null,
    team: null,
    teamLabel: null,
    photoUrl: `https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg`
  };
}

function groupEntriesByRoster(objectMap, playersById, rosterIdentityMap, kind = 'add') {
  const buckets = new Map();

  for (const [playerId, rosterId] of Object.entries(objectMap || {})) {
    const roster = resolveRoster(rosterIdentityMap, rosterId);
    const key = String(roster.rosterId);
    if (!buckets.has(key)) {
      buckets.set(key, {
        rosterId: roster.rosterId,
        teamName: roster.teamName,
        managerName: roster.managerName,
        teamPhoto: roster.teamPhoto,
        initials: roster.initials,
        managerSlug: roster.managerSlug,
        kind,
        players: []
      });
    }
    buckets.get(key).players.push(buildPlayerRef(playersById, playerId));
  }

  return [...buckets.values()].sort((a, b) => a.teamName.localeCompare(b.teamName));
}

function buildDraftPickRows(draftPicks = [], rosterIdentityMap) {
  return (draftPicks || []).map((pick, index) => {
    const owner = resolveRoster(rosterIdentityMap, pick.owner_id || pick.roster_id || pick.previous_owner_id);
    const previous = resolveRoster(rosterIdentityMap, pick.previous_owner_id || pick.roster_id || pick.owner_id);
    return {
      id: `${pick.season || ''}-${pick.round || ''}-${pick.owner_id || ''}-${index}`,
      label: `${pick.season || 'Future'} Round ${pick.round || '—'}`,
      currentOwner: owner.teamName,
      currentOwnerSlug: owner.managerSlug,
      previousOwner: previous.teamName,
      previousOwnerSlug: previous.managerSlug,
      lineage: previous.teamName === owner.teamName ? owner.teamName : `${previous.teamName} → ${owner.teamName}`
    };
  });
}

function buildFaabRows(raw = {}, rosterIdentityMap) {
  if (String(raw?.type || '').toLowerCase() !== 'waiver') {
    return [];
  }

  const bid = Number(raw?.settings?.waiver_bid);

  if (!Number.isFinite(bid)) {
    return [];
  }

  const rosterCandidates = [
    ...Object.values(raw?.adds || {}),
    ...(raw?.roster_ids || [])
  ]
    .map(Number)
    .filter(Number.isFinite);

  const rosterId = rosterCandidates[0];

  if (!Number.isFinite(rosterId)) {
    return [];
  }

  return [
    {
      ...resolveRoster(rosterIdentityMap, rosterId),
      amount: bid
    }
  ];
}

function summarizeTransaction(txn) {
  if (txn.type === 'trade') {
    const clubs = txn.rosterCards.map((row) => row.teamName).filter(Boolean);
    return clubs.length >= 2 ? `${clubs.join(' ↔ ')}` : 'Trade wire';
  }
  if (txn.type === 'waiver') {
    return txn.addGroups[0] ? `${txn.addGroups[0].teamName} made a waiver move` : 'Waiver move';
  }
  if (txn.type === 'free_agent') {
    return txn.addGroups[0] ? `${txn.addGroups[0].teamName} hit free agency` : 'Free-agent move';
  }
  if (txn.type === 'commish') {
    return 'Commissioner action';
  }
  return formatType(txn.type);
}

function involvesRoster(raw, rosterId) {
  const wanted = Number(rosterId);
  if (!Number.isFinite(wanted)) return true;
  const rosterIds = (raw.roster_ids || []).map((id) => Number(id));
  if (rosterIds.includes(wanted)) return true;
  if (Object.values(raw.adds || {}).some((id) => Number(id) === wanted)) return true;
  if (Object.values(raw.drops || {}).some((id) => Number(id) === wanted)) return true;
  if (Object.keys(raw.settings?.waiver_budget || raw.waiver_budget || {}).some((id) => Number(id) === wanted)) return true;
  return false;
}

function identityManagerId(identity) {
  return String(
    identity?.managerId ||
    identity?.ownerId ||
    ''
  ).trim();
}

function findManagerIdentity(
  rosterIdentityMap,
  managerId
) {
  const wanted =
    String(
      managerId ||
      ''
    ).trim();

  if (!wanted) {
    return null;
  }

  for (
    const identity of
    rosterIdentityMap.values()
  ) {
    if (
      identityManagerId(
        identity
      ) === wanted
    ) {
      return identity;
    }
  }

  return null;
}

function capitalParty(
  rosterIdentityMap,
  managerId
) {
  const identity =
    findManagerIdentity(
      rosterIdentityMap,
      managerId
    );

  return {
    managerId:
      String(
        managerId ||
        ''
      ),

    managerName:
      identity?.managerName ||
      null,

    teamName:
      identity?.teamName ||
      null,

    managerSlug:
      identity?.managerSlug ||
      null
  };
}

function normalizeCapitalTransfer(
  capital,
  rosterIdentityMap
) {
  if (!capital) {
    return null;
  }

  return {
    futuresYear:
      Number(
        capital.futuresYear
      ),

    amountCents:
      Number(
        capital.amountCents ||
        0
      ),

    amount:
      Number(
        capital.amount ||
        (
          Number(
            capital.amountCents ||
            0
          ) / 100
        )
      ),

    fromManagerId:
      String(
        capital.fromManagerId ||
        ''
      ),

    toManagerId:
      String(
        capital.toManagerId ||
        ''
      ),

    from:
      capitalParty(
        rosterIdentityMap,
        capital.fromManagerId
      ),

    to:
      capitalParty(
        rosterIdentityMap,
        capital.toManagerId
      ),

    transactionDate:
      capital.transactionDate ||
      null,

    note:
      capital.note ||
      null
  };
}

function epochMilliseconds(
  value
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return null;
  }

  return number < 1_000_000_000_000
    ? number * 1000
    : number;
}

function dateOnlyMilliseconds(
  value
) {
  const match =
    String(
      value ||
      ''
    ).match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

  if (!match) {
    return null;
  }

  return Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );
}

function datesAreClose(
  transactionDate,
  createdAt
) {
  const ledgerDate =
    dateOnlyMilliseconds(
      transactionDate
    );

  const sleeperDate =
    epochMilliseconds(
      createdAt
    );

  if (
    ledgerDate == null ||
    sleeperDate == null
  ) {
    return false;
  }

  const sleeper =
    new Date(
      sleeperDate
    );

  const sleeperDay =
    Date.UTC(
      sleeper.getUTCFullYear(),
      sleeper.getUTCMonth(),
      sleeper.getUTCDate()
    );

  /*
   * Allow one calendar day either
   * direction for timezone boundaries.
   */
  return (
    Math.abs(
      ledgerDate -
      sleeperDay
    ) <=
    86_400_000
  );
}

function tradeManagerIds(
  rosterCards = []
) {
  return new Set(
    rosterCards
      .map(
        identityManagerId
      )
      .filter(
        Boolean
      )
  );
}

function legacyTransferMatchesTrade({
  transfer,
  rosterCards,
  createdAt,
  season
}) {
  if (
    transfer.sleeperTransactionId
  ) {
    return false;
  }

  /*
   * Only fuzzy-match imported
   * historical ledger data.
   */
  if (
    String(
      transfer.source ||
      ''
    ) !==
    'legacy_sheet'
  ) {
    return false;
  }

  if (
    transfer.leagueSeason != null &&
    Number(
      transfer.leagueSeason
    ) !==
    Number(
      season
    )
  ) {
    return false;
  }

  const managers =
    tradeManagerIds(
      rosterCards
    );

  if (
    !managers.has(
      String(
        transfer.fromManagerId
      )
    ) ||
    !managers.has(
      String(
        transfer.toManagerId
      )
    )
  ) {
    return false;
  }

  return datesAreClose(
    transfer.transactionDate,
    createdAt
  );
}

async function buildDraftCapitalContext({
  db,
  season,
  rosterIdentityMap
}) {
  const reviewByTransaction =
    new Map();

  const transferByTransaction =
    new Map();

  const legacyTransfers =
    [];

  const warnings =
    [];

  if (!db) {
    warnings.push(
      'D1 unavailable; draft-capital enrichment was skipped.'
    );

    return {
      reviewByTransaction,
      transferByTransaction,
      legacyTransfers,
      warnings
    };
  }

  const [
    reviewsResult,
    transfersResult
  ] =
    await Promise.allSettled([
      getDraftCapitalTradeReviews(
        db,
        {
          season
        }
      ),

      getDraftCapitalTransfers(
        db
      )
    ]);

  if (
    reviewsResult.status ===
    'fulfilled'
  ) {
    for (
      const review of
      reviewsResult.value
    ) {
      reviewByTransaction.set(
        String(
          review.transactionId
        ),
        {
          status:
            review.reviewStatus ||
            'pending',

          reviewStatus:
            review.reviewStatus ||
            'pending',

          transferId:
            review.transferId ||
            null,

          reviewedAt:
            review.reviewedAt ??
            null,

          note:
            review.reviewNote ||
            null,

          source:
            'trade_review',

          matchMethod:
            'sleeper_transaction_id',

          capital:
            normalizeCapitalTransfer(
              review.capital,
              rosterIdentityMap
            )
        }
      );
    }
  } else {
    console.warn(
      '[transactions] Could not load draft-capital reviews:',
      reviewsResult.reason
    );

    warnings.push(
      'Draft-capital trade reviews could not be loaded.'
    );
  }

  if (
    transfersResult.status ===
    'fulfilled'
  ) {
    for (
      const transfer of
      transfersResult.value
    ) {
      const transactionId =
        String(
          transfer.sleeperTransactionId ||
          ''
        ).trim();

      if (transactionId) {
        transferByTransaction.set(
          transactionId,
          transfer
        );
      } else {
        legacyTransfers.push(
          transfer
        );
      }
    }
  } else {
    console.warn(
      '[transactions] Could not load draft-capital transfers:',
      transfersResult.reason
    );

    warnings.push(
      'Draft-capital ledger transfers could not be loaded.'
    );
  }

  return {
    reviewByTransaction,
    transferByTransaction,
    legacyTransfers,
    warnings
  };
}

function resolveTradeCapital({
  transactionId,
  rosterCards,
  createdAt,
  season,
  capitalContext,
  rosterIdentityMap
}) {
  const review =
    capitalContext
      .reviewByTransaction
      .get(
        transactionId
      ) ||
    null;

  /*
   * Ideal case:
   * reviewed trade already carries
   * its active capital transfer.
   */
  if (
    review?.capital
  ) {
    return review;
  }

  /*
   * Second-best:
   * active ledger transfer is directly
   * linked by Sleeper transaction ID.
   */
  const linkedTransfer =
    capitalContext
      .transferByTransaction
      .get(
        transactionId
      ) ||
    null;

  if (linkedTransfer) {
    return {
      status:
        review?.status ||
        'linked',

      reviewStatus:
        review?.reviewStatus ||
        null,

      transferId:
        linkedTransfer.transferId ||
        review?.transferId ||
        null,

      reviewedAt:
        review?.reviewedAt ??
        null,

      note:
        review?.note ||
        null,

      source:
        'ledger',

      matchMethod:
        'sleeper_transaction_id',

      capital:
        normalizeCapitalTransfer(
          linkedTransfer,
          rosterIdentityMap
        )
    };
  }

  /*
   * Historical import fallback.
   *
   * Only attach if there is exactly
   * ONE legacy transfer matching the
   * same managers and transaction date.
   */
  const legacyMatches =
    capitalContext
      .legacyTransfers
      .filter(
        (transfer) =>
          legacyTransferMatchesTrade({
            transfer,
            rosterCards,
            createdAt,
            season
          })
      );

  if (
    legacyMatches.length === 1
  ) {
    const transfer =
      legacyMatches[0];

    return {
      status:
        'legacy_linked',

      reviewStatus:
        review?.reviewStatus ||
        null,

      transferId:
        transfer.transferId ||
        null,

      reviewedAt:
        review?.reviewedAt ??
        null,

      note:
        review?.note ||
        null,

      source:
        'legacy_sheet',

      matchMethod:
        'managers_and_date',

      capital:
        normalizeCapitalTransfer(
          transfer,
          rosterIdentityMap
        )
    };
  }

  /*
   * More than one possible legacy
   * match = DO NOT GUESS.
   */
  if (
    legacyMatches.length > 1
  ) {
    return {
      status:
        'ambiguous',

      reviewStatus:
        review?.reviewStatus ||
        null,

      transferId:
        null,

      reviewedAt:
        review?.reviewedAt ??
        null,

      note:
        'Multiple historical draft-capital transfers could match this trade.',

      source:
        'legacy_sheet',

      matchMethod:
        'ambiguous',

      capital:
        null
    };
  }

  /*
   * Explicit commissioner review saying
   * no capital is different from simply
   * not having a linkage.
   */
  if (
    review?.status ===
    'no_capital'
  ) {
    return review;
  }

  return {
    status:
      review?.status ||
      'unreviewed',

    reviewStatus:
      review?.reviewStatus ||
      null,

    transferId:
      review?.transferId ||
      null,

    reviewedAt:
      review?.reviewedAt ??
      null,

    note:
      review?.note ||
      null,

    source:
      review?.source ||
      null,

    matchMethod:
      review?.matchMethod ||
      null,

    capital:
      null
  };
}

function buildTransactionView(
  raw,
  week,
  playersById,
  rosterIdentityMap,
  {
    season,
    capitalContext
  } = {}
) {
  const transactionId =
  String(
    raw.transaction_id ||
    `${week}-${raw.type || 'move'}-${Math.random().toString(36).slice(2, 8)}`
  );
  const rosterCards =
  (raw.roster_ids || [])
    .map(
      (rosterId) =>
        resolveRoster(
          rosterIdentityMap,
          rosterId
        )
    );
  const addGroups =
  groupEntriesByRoster(
    raw.adds || {},
    playersById,
    rosterIdentityMap,
    'add'
  );
  const dropGroups =
  groupEntriesByRoster(
    raw.drops || {},
    playersById,
    rosterIdentityMap,
    'drop'
  );
  const draftPicks =
  buildDraftPickRows(
    raw.draft_picks || [],
    rosterIdentityMap
  );
  /*
 * KEEP your currently working
 * FAAB implementation here.
 */
const faabRows =
  buildFaabRows(
    raw,
    rosterIdentityMap
  );

const createdAt =
  raw.status_updated ||
  raw.created ||
  raw.updated ||
  null;

const draftCapitalReview =
  String(
    raw.type ||
    ''
  ).toLowerCase() ===
  'trade'
    ? resolveTradeCapital({
        transactionId,
        rosterCards,
        createdAt,
        season,
        capitalContext,
        rosterIdentityMap
      })
    : null;

  const item = {
  id:
    transactionId,

  week,

  type:
    String(
      raw.type ||
      'move'
    ),

  typeLabel:
    formatType(
      raw.type
    ),

  status:
    String(
      raw.status ||
      'complete'
    ),

  createdAt,

  rosterCards,

  addGroups,

  dropGroups,

  draftPicks,

  faabRows,

  draftCapitalReview
};

  return {
    ...item,
    summaryLine: summarizeTransaction(item),
    counts: {
      adds: addGroups.reduce((sum, row) => sum + row.players.length, 0),
      drops: dropGroups.reduce((sum, row) => sum + row.players.length, 0),
      picks: draftPicks.length,
      faab: faabRows.length
    }
  };
}

export async function getLiveTransactionsBundle({ url, env } = {}) {
  const context = await resolveLeagueContext({ url, env, allWeeksByDefault: true });
  const [users, rosters] = await Promise.all([
    getSleeperUsers(context.leagueId),
    getSleeperRosters(context.leagueId)
  ]);
  const rosterIdentityMap = buildRosterIdentityMap({ rosters, users });
  const capitalContext =
  await buildDraftCapitalContext({
    db:
      env?.DB,

    season:
      Number(
        context.season
      ),

    rosterIdentityMap
  });
  const selectedTeam = resolveSelectedTeam({
    teamParam: url?.searchParams?.get('team') || null,
    rosterIdParam: url?.searchParams?.get('rosterId') || null,
    rosters,
    users
  });

  const weekPairs = await Promise.all(context.weeks.map(async (week) => [
    week,
    await getSleeperTransactionsForWeek(context.leagueId, week)
  ]));

  const filteredRawByWeek = weekPairs.map(([week, items]) => [
    week,
    selectedTeam
      ? (items || []).filter((txn) => involvesRoster(txn, selectedTeam.rosterId))
      : (items || [])
  ]);

  const allRawTransactions = filteredRawByWeek.flatMap(([, items]) => items || []);
  const playerIds = allRawTransactions.flatMap((txn) => [
    ...Object.keys(txn?.adds || {}),
    ...Object.keys(txn?.drops || {})
  ]);
  const playersById = await resolvePlayersByIds(playerIds);

  const weeks = filteredRawByWeek
    .map(([week, items]) => ({
      week,
      items:
  (items || [])
    .map(
      (txn) =>
        buildTransactionView(
          txn,
          week,
          playersById,
          rosterIdentityMap,
          {
            season:
              Number(
                context.season
              ),

            capitalContext
          }
        )
    )
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    }))
    .filter((week) => week.items.length > 0)
    .sort((a, b) => b.week - a.week);

  const transactions = weeks.flatMap((week) => week.items);

  return {
    ...context,
    selectedWeeks: context.weeks,
    weeks,
    transactions,
    filterTeam: selectedTeam,
    hasData: transactions.length > 0,
    source:
    env?.DB
      ? 'Sleeper API + Irving D1 draft-capital ledger'
      : 'Sleeper API + shared edge/runtime cache'
  };
}
