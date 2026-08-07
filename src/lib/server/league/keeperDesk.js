import { resolveLeagueContext } from '$lib/server/league/context.js';
import { buildRosterIdentityMap } from '$lib/server/league/identity.js';
import { resolvePlayersByIds } from '$lib/server/league/players.js';
import {
  getLeagueHistory,
  getSleeperDraftPicks,
  getSleeperLeagueDrafts,
  getSleeperRosters,
  getSleeperTransactionsForWeek,
  getSleeperUsers
} from '$lib/server/league/sleeperClient.js';

const MIN_KEEPER_BASE = 10;
const MAX_KEEPERS = 2;
const TAX_STEP_PCT = 10;
const TRANSACTION_WEEKS = Array.from({ length: 19 }, (_, index) => index); // 0-18

// League rule: the FINAL keeper price always rounds UP to the next whole auction dollar.
// Example: $13.20 => $14, $15.80 => $16.
const ROUND_KEEPER_COST_UP_TO_WHOLE_DOLLAR = true;

function numberValue(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function moneyValue(pick) {
  const raw = pick?.metadata?.amount ?? pick?.metadata?.bid_amount ?? pick?.auction_amount ?? pick?.amount;
  return numberValue(raw, 0);
}

function roundMoney(value) {
  const amount = numberValue(value, 0);
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function roundKeeperCost(value) {
  const amount = numberValue(value, 0);
  if (ROUND_KEEPER_COST_UP_TO_WHOLE_DOLLAR) return Math.ceil(amount - Number.EPSILON);
  return roundMoney(amount);
}

function choosePrimaryDraft(drafts = []) {
  if (!drafts.length) return null;
  return drafts.find((draft) => draft.status === 'complete') || drafts[0];
}

function transactionTimestamp(txn) {
  return numberValue(txn?.status_updated ?? txn?.created ?? txn?.updated, 0);
}

function waiverBid(txn) {
  return numberValue(
    txn?.settings?.waiver_bid ?? txn?.waiver_bid ?? txn?.metadata?.waiver_bid,
    0
  );
}

function priceOriginLabel(type) {
  if (type === 'keeper') return 'Keeper draft price';
  if (type === 'draft') return 'Auction draft price';
  if (type === 'waiver') return 'Last waiver claim price';
  if (type === 'free_agent') return 'Last free-agent add';
  if (type === 'historical') return 'Inherited historical price';
  return 'Minimum keeper floor';
}

async function getSeasonDraftSnapshot(league) {
  if (!league?.league_id) return null;

  const drafts = await getSleeperLeagueDrafts(league.league_id);
  const draft = choosePrimaryDraft(drafts);
  if (!draft?.draft_id) {
    return {
      season: Number(league.season || 0),
      leagueId: String(league.league_id),
      draft: null,
      picks: []
    };
  }

  const picks = await getSleeperDraftPicks(draft.draft_id);
  return {
    season: Number(league.season || 0),
    leagueId: String(league.league_id),
    draft,
    picks: Array.isArray(picks) ? picks : []
  };
}

function buildDraftPriceMap({ sourceDraft, sourceIdentityMap }) {
  const map = new Map();

  for (const pick of sourceDraft?.picks || []) {
    const playerId = String(pick?.player_id || '');
    if (!playerId) continue;

    const roster = sourceIdentityMap.get(Number(pick.roster_id));
    const rawPrice = moneyValue(pick);

    map.set(playerId, {
      rawPrice,
      type: pick?.is_keeper ? 'keeper' : 'draft',
      season: Number(sourceDraft?.season || 0),
      rosterId: Number(pick?.roster_id || 0),
      ownerId: pick?.picked_by ? String(pick.picked_by) : roster?.ownerId || null,
      teamName: roster?.teamName || null,
      managerSlug: roster?.managerSlug || null,
      exact: true,
      draftPick: pick
    });
  }

  return map;
}

function applyTransactionPrices({ priceMap, ownershipMap, transactions, sourceIdentityMap, sourceSeason }) {
  // Keeper base price is determined by the player's LAST priced acquisition event.
  // Start with the season's draft price, then walk transactions chronologically.
  // A later waiver/free-agent add replaces the draft/keeper price.
  // Trades transfer both the current price and keeper tenure, so they update ownership only.
  const ordered = [...transactions].sort((a, b) => transactionTimestamp(a) - transactionTimestamp(b));

  for (const txn of ordered) {
    const status = String(txn?.status || '').toLowerCase();

    // Sleeper can return failed/pending waiver claims in the weekly transaction feed.
    // Those records may still contain `adds` and `settings.waiver_bid`, so allowing
    // them through can overwrite the winning waiver price with a losing bid.
    // Keeper pricing must only use acquisitions that actually completed.
    if (status && status !== 'complete') continue;

    const type = String(txn?.type || '').toLowerCase();
    const adds = txn?.adds || {};

    for (const [playerIdRaw, rosterIdRaw] of Object.entries(adds)) {
      const playerId = String(playerIdRaw);
      const rosterId = Number(rosterIdRaw);
      const roster = sourceIdentityMap.get(rosterId);
      const createdAt = transactionTimestamp(txn);

      ownershipMap.set(playerId, {
        type,
        rosterId,
        ownerId: roster?.ownerId || null,
        teamName: roster?.teamName || null,
        managerSlug: roster?.managerSlug || null,
        createdAt
      });

      if (type === 'waiver') {
        priceMap.set(playerId, {
          rawPrice: waiverBid(txn),
          type: 'waiver',
          season: sourceSeason,
          rosterId,
          ownerId: roster?.ownerId || null,
          teamName: roster?.teamName || null,
          managerSlug: roster?.managerSlug || null,
          exact: true,
          createdAt,
          transactionId: txn?.transaction_id || null,
          transactionStatus: txn?.status || null
        });
      } else if (type === 'free_agent') {
        priceMap.set(playerId, {
          rawPrice: MIN_KEEPER_BASE,
          type: 'free_agent',
          season: sourceSeason,
          rosterId,
          ownerId: roster?.ownerId || null,
          teamName: roster?.teamName || null,
          managerSlug: roster?.managerSlug || null,
          exact: true,
          createdAt,
          transactionId: txn?.transaction_id || null,
          transactionStatus: txn?.status || null
        });
      }
      // IMPORTANT: trade adds do not replace the acquisition price.
      // Example: drafted for $40 -> traded -> still $40 base.
      // Example: drafted for $40 -> dropped -> waiver claim for $20 -> traded -> $20 base.
    }
  }
}
function findOlderDraftPrice(playerId, draftHistory, sourceSeason) {
  const snapshots = [...draftHistory]
    .filter((entry) => Number(entry.season) < Number(sourceSeason))
    .sort((a, b) => b.season - a.season);

  for (const snapshot of snapshots) {
    const pick = (snapshot.picks || []).find((row) => String(row?.player_id || '') === String(playerId));
    if (!pick) continue;

    const amount = moneyValue(pick);
    if (amount > 0) {
      return {
        rawPrice: amount,
        type: 'historical',
        season: snapshot.season,
        rosterId: Number(pick?.roster_id || 0),
        ownerId: pick?.picked_by ? String(pick.picked_by) : null,
        teamName: null,
        managerSlug: null,
        exact: false,
        draftPick: pick
      };
    }
  }

  return null;
}

function countKeeperStreak({ playerId, draftHistory, sourceSeason }) {
  let streak = 0;
  const history = [];

  const snapshots = [...draftHistory]
    .filter((entry) => Number(entry.season) <= Number(sourceSeason))
    .sort((a, b) => b.season - a.season);

  for (const snapshot of snapshots) {
    const pick = (snapshot.picks || []).find((row) => String(row?.player_id || '') === String(playerId));

    // No draft appearance in a season breaks a consecutive keeper run.
    if (!pick) break;
    // A normal auction-draft appearance resets the keeper clock.
    // Keeper tenure follows the player through trades/franchise changes.
    if (!pick?.is_keeper) break;

    streak += 1;
    history.push({
      season: snapshot.season,
      amount: moneyValue(pick),
      taxPct: streak * TAX_STEP_PCT
    });
  }

  return { streak, history };
}

function buildCandidate({
  player,
  roster,
  price,
  ownership,
  draftHistory,
  sourceSeason,
  targetSeason
}) {
  const inheritedPrice = price || findOlderDraftPrice(player.id, draftHistory, sourceSeason);
  const rawPreviousPrice = inheritedPrice ? numberValue(inheritedPrice.rawPrice, 0) : MIN_KEEPER_BASE;
  const floorBase = Math.max(MIN_KEEPER_BASE, rawPreviousPrice);

  const keeperRun = countKeeperStreak({
    playerId: player.id,
    draftHistory,
    sourceSeason
  });

  const taxPct = TAX_STEP_PCT * (keeperRun.streak + 1);
  const taxAmount = roundMoney(floorBase * (taxPct / 100));
  const keeperCost = roundKeeperCost(floorBase + taxAmount);
  const currentMove = ownership || null;
  const movedByTrade = currentMove?.type === 'trade';
  const ownerChanged = inheritedPrice?.ownerId && roster.ownerId
    ? String(inheritedPrice.ownerId) !== String(roster.ownerId)
    : false;

  return {
    id: String(player.id),
    name: player.name,
    shortName: player.shortName,
    position: player.position || '—',
    nflTeam: player.team || null,
    nflTeamLabel: player.teamLabel || player.team || 'FA',
    photoUrl: player.photoUrl,
    rosterId: roster.rosterId,
    ownerId: roster.ownerId,
    teamName: roster.teamName,
    teamPhoto: roster.teamPhoto,
    managerName: roster.managerName,
    managerSlug: roster.managerSlug,
    initials: roster.initials,
    sourceSeason,
    targetSeason,
    previousPrice: roundMoney(rawPreviousPrice),
    floorBase: roundMoney(floorBase),
    floorApplied: rawPreviousPrice < MIN_KEEPER_BASE,
    priceOrigin: inheritedPrice?.type || 'minimum',
    priceOriginLabel: priceOriginLabel(inheritedPrice?.type || 'minimum'),
    priceOriginSeason: inheritedPrice?.season || sourceSeason,
    lastAcquisitionPrice: roundMoney(rawPreviousPrice),
    lastAcquisitionType: inheritedPrice?.type || 'minimum',
    lastAcquisitionLabel: priceOriginLabel(inheritedPrice?.type || 'minimum'),
    lastAcquisitionTransactionId: inheritedPrice?.transactionId || null,
    lastAcquisitionTransactionStatus: inheritedPrice?.transactionStatus || null,
    lastAcquisitionAt: inheritedPrice?.createdAt || null,
    priceExact: Boolean(inheritedPrice?.exact),
    movedByTrade: Boolean(movedByTrade || ownerChanged),
    keeperStreak: keeperRun.streak,
    keeperHistory: keeperRun.history,
    keeperSelectionNumber: keeperRun.streak + 1,
    taxPct,
    taxAmount,
    keeperCost,
    firstKeeperSelection: keeperRun.streak === 0
  };
}

function sortPlayers(rows = []) {
  const positionOrder = { QB: 1, RB: 2, WR: 3, TE: 4, K: 5, DEF: 6, DST: 6 };
  return [...rows].sort((a, b) => {
    const aPos = positionOrder[a.position] || 99;
    const bPos = positionOrder[b.position] || 99;
    return aPos - bPos || a.keeperCost - b.keeperCost || a.name.localeCompare(b.name);
  });
}

export async function getKeeperDeskBundle({ url, env } = {}) {
  const targetContext = await resolveLeagueContext({ url, env, allWeeksByDefault: false });
  const targetSeason = Number(targetContext.season);
  const sourceSeason = targetSeason - 1;

  const sourceUrl = new URL(url);
  sourceUrl.searchParams.set('season', String(sourceSeason));
  const sourceContext = await resolveLeagueContext({ url: sourceUrl, env, allWeeksByDefault: false });

  const history = await getLeagueHistory(targetContext.rootLeagueId);
  const seasonsInHistory = [...new Set(history.map((league) => Number(league?.season || 0)).filter(Boolean))];
  const availableSeasons = [...new Set([
    targetSeason,
    ...seasonsInHistory.map((season) => season + 1)
  ])].sort((a, b) => b - a);

  const [targetUsers, targetRosters, sourceUsers, sourceRosters, sourceDrafts, sourceTransactionsByWeek] = await Promise.all([
    getSleeperUsers(targetContext.leagueId).catch(() => []),
    getSleeperRosters(targetContext.leagueId).catch(() => []),
    getSleeperUsers(sourceContext.leagueId),
    getSleeperRosters(sourceContext.leagueId),
    getSleeperLeagueDrafts(sourceContext.leagueId),
    Promise.all(
      TRANSACTION_WEEKS.map(async (week) => {
        const rows = await getSleeperTransactionsForWeek(sourceContext.leagueId, week).catch(() => []);
        return rows || [];
      })
    )
  ]);

  const sourceDraftMeta = choosePrimaryDraft(sourceDrafts);
  const sourceDraftPicks = sourceDraftMeta?.draft_id
    ? await getSleeperDraftPicks(sourceDraftMeta.draft_id)
    : [];

  // For an upcoming season, Sleeper's target-season rosters are the best source because
  // offseason trades can change keeper rights. Fall back to the previous season's final rosters.
  const targetHasPlayers = (targetRosters || []).some((roster) => (roster?.players || []).length > 0);
  const candidateRostersRaw = targetHasPlayers ? targetRosters : sourceRosters;
  const candidateUsersRaw = targetHasPlayers ? targetUsers : sourceUsers;
  const candidateSeasonSource = targetHasPlayers ? targetSeason : sourceSeason;

  const candidateIdentityMap = buildRosterIdentityMap({ rosters: candidateRostersRaw, users: candidateUsersRaw });
  const sourceIdentityMap = buildRosterIdentityMap({ rosters: sourceRosters, users: sourceUsers });

  const draftHistory = (await Promise.all(
    history
      .filter((league) => Number(league?.season || 0) <= sourceSeason)
      .map((league) => getSeasonDraftSnapshot(league))
  )).filter(Boolean);

  // Ensure env season overrides are represented even when Sleeper's previous_league_id chain is incomplete.
  if (!draftHistory.some((entry) => Number(entry.season) === sourceSeason)) {
    draftHistory.push({
      season: sourceSeason,
      leagueId: sourceContext.leagueId,
      draft: sourceDraftMeta,
      picks: sourceDraftPicks || []
    });
  }

  const sourceDraft = {
    season: sourceSeason,
    leagueId: sourceContext.leagueId,
    draft: sourceDraftMeta,
    picks: sourceDraftPicks || []
  };

  const priceMap = buildDraftPriceMap({ sourceDraft, sourceIdentityMap });
  const ownershipMap = new Map();
  const sourceTransactions = sourceTransactionsByWeek.flat();

  applyTransactionPrices({
    priceMap,
    ownershipMap,
    transactions: sourceTransactions,
    sourceIdentityMap,
    sourceSeason
  });

  const playerIds = candidateRostersRaw.flatMap((roster) => roster?.players || []);
  const playersById = await resolvePlayersByIds(playerIds);

  const teams = candidateRostersRaw
    .map((rawRoster) => {
      const rosterId = Number(rawRoster?.roster_id || 0);
      const identity = candidateIdentityMap.get(rosterId) || {};
      const roster = {
        rosterId,
        ownerId: rawRoster?.owner_id ? String(rawRoster.owner_id) : identity.ownerId || null,
        managerName: identity.managerName || 'Unknown Manager',
        teamName: identity.teamName || `Roster ${rosterId}`,
        teamPhoto: identity.teamPhoto || null,
        managerSlug: identity.managerSlug || null,
        initials: identity.initials || '?'
      };

      const players = sortPlayers(
        (rawRoster?.players || [])
          .map((playerId) => playersById.get(String(playerId)))
          .filter(Boolean)
          .map((player) => buildCandidate({
            player,
            roster,
            price: priceMap.get(String(player.id)) || null,
            ownership: ownershipMap.get(String(player.id)) || null,
            draftHistory,
            sourceSeason,
            targetSeason
          }))
      );

      return {
        ...roster,
        playerCount: players.length,
        players,
        cheapest: [...players].sort((a, b) => a.keeperCost - b.keeperCost || a.name.localeCompare(b.name)).slice(0, MAX_KEEPERS),
        averageKeeperCost: players.length
          ? roundMoney(players.reduce((sum, player) => sum + player.keeperCost, 0) / players.length)
          : 0
      };
    })
    .filter((team) => team.players.length > 0)
    .sort((a, b) => a.teamName.localeCompare(b.teamName));

  const candidates = teams.flatMap((team) => team.players);
  const exactPriceCount = candidates.filter((player) => player.priceExact).length;
  const estimatedPriceCount = candidates.length - exactPriceCount;
  const returningKeeperCount = candidates.filter((player) => player.keeperStreak > 0).length;

  return {
    season: targetSeason,
    targetSeason,
    sourceSeason,
    candidateSeasonSource,
    availableSeasons,
    leagueName: targetContext.league?.name || sourceContext.league?.name || 'Irving Champions League',
    teams,
    candidates,
    hasData: candidates.length > 0,
    stats: {
      teamCount: teams.length,
      candidateCount: candidates.length,
      exactPriceCount,
      estimatedPriceCount,
      returningKeeperCount
    },
    rules: {
      maxKeepers: MAX_KEEPERS,
      minimumBase: MIN_KEEPER_BASE,
      taxStepPct: TAX_STEP_PCT,
      roundUpToWholeDollar: ROUND_KEEPER_COST_UP_TO_WHOLE_DOLLAR
    },
    source: 'Sleeper draft history + last acquisition event + roster ownership + transaction history'
  };
}
