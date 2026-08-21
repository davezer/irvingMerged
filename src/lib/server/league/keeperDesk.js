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
const KEEPER_ACQUISITION_DEADLINE_WEEK = 11;

const TRANSACTION_WEEKS = Array.from({ length: 19 }, (_, index) => index);

// League rule: the FINAL keeper price always rounds UP to the next whole auction dollar.
// Example: $13.20 => $14, $15.80 => $16.
const ROUND_KEEPER_COST_UP_TO_WHOLE_DOLLAR = true;

function numberValue(value, fallback = 0) {
	const number = Number(value);
	return Number.isFinite(number) ? number : fallback;
}

function moneyValue(pick) {
	const raw =
		pick?.metadata?.amount ??
		pick?.metadata?.bid_amount ??
		pick?.auction_amount ??
		pick?.amount;

	return numberValue(raw, 0);
}

function roundMoney(value) {
	const amount = numberValue(value, 0);
	return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function roundKeeperCost(value) {
	const amount = numberValue(value, 0);

	if (ROUND_KEEPER_COST_UP_TO_WHOLE_DOLLAR) {
		return Math.ceil(amount - Number.EPSILON);
	}

	return roundMoney(amount);
}

function choosePrimaryDraft(drafts = []) {
	if (!drafts.length) return null;

	return drafts.find((draft) => draft.status === 'complete') || drafts[0];
}

function transactionTimestamp(txn) {
	return numberValue(
		txn?.status_updated ??
			txn?.created ??
			txn?.updated,
		0
	);
}

function waiverBid(txn) {
	return numberValue(
		txn?.settings?.waiver_bid ??
			txn?.waiver_bid ??
			txn?.metadata?.waiver_bid,
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

async function getTransactionsForLeague(
	leagueId
) {
	if (!leagueId) {
		return [];
	}

	const buckets =
		await Promise.all(
			TRANSACTION_WEEKS.map(
				async (week) => {
					const rows =
						await getSleeperTransactionsForWeek(
							leagueId,
							week
						).catch(
							() => []
						);

					return (
						rows || []
					).map(
						(txn) => ({
							...txn,
							__leagueWeek:
								week
						})
					);
				}
			)
		);

	return buckets.flat();
}

function buildDraftPriceMap({
	sourceDraft,
	sourceIdentityMap
}) {
	const map = new Map();

	for (const pick of sourceDraft?.picks || []) {
		const playerId = String(pick?.player_id || '');

		if (!playerId) continue;

		const roster = sourceIdentityMap.get(
			Number(pick.roster_id)
		);

		const rawPrice = moneyValue(pick);

		map.set(playerId, {
			rawPrice,
			type: pick?.is_keeper
				? 'keeper'
				: 'draft',
			season: Number(sourceDraft?.season || 0),
			rosterId: Number(pick?.roster_id || 0),
			ownerId: pick?.picked_by
				? String(pick.picked_by)
				: roster?.ownerId || null,
			teamName: roster?.teamName || null,
			managerSlug: roster?.managerSlug || null,
			exact: true,
			draftPick: pick
		});
	}

	return map;
}

function applyTransactionPrices({
	priceMap,
	ownershipMap,
	transactions,
	sourceIdentityMap,
	sourceSeason
}) {
	// Keeper base price is determined by the player's LAST priced acquisition event.
	//
	// Start with the season's draft price, then walk transactions chronologically.
	//
	// A later waiver/free-agent add replaces the draft/keeper price.
	//
	// Trades transfer both the current price and keeper tenure,
	// so they update ownership only.

	const ordered = [...transactions].sort(
		(a, b) =>
			transactionTimestamp(a) -
			transactionTimestamp(b)
	);

	for (const txn of ordered) {
		const status = String(
			txn?.status || ''
		).toLowerCase();

		// Sleeper can return failed/pending waiver claims
		// in the weekly transaction feed.
		//
		// Those records may still contain `adds` and
		// `settings.waiver_bid`, so allowing them through
		// can overwrite the winning waiver price with
		// a losing bid.
		//
		// Keeper pricing must only use acquisitions
		// that actually completed.

		if (
			status &&
			status !== 'complete'
		) {
			continue;
		}

		const type = String(
			txn?.type || ''
		).toLowerCase();

		const adds = txn?.adds || {};

		for (
			const [playerIdRaw, rosterIdRaw]
			of Object.entries(adds)
		) {
			const playerId = String(playerIdRaw);
			const rosterId = Number(rosterIdRaw);

			const roster =
				sourceIdentityMap.get(rosterId);

			const createdAt =
				transactionTimestamp(txn);

			const acquisitionWeek =
				Number(txn?.__leagueWeek ?? -1);

			ownershipMap.set(playerId, {
				type,
				rosterId,
				ownerId:
					roster?.ownerId || null,
				teamName:
					roster?.teamName || null,
				managerSlug:
					roster?.managerSlug || null,
				createdAt,
				acquisitionWeek
			});

			if (type === 'waiver') {
				priceMap.set(playerId, {
					rawPrice: waiverBid(txn),
					type: 'waiver',
					season: sourceSeason,
					acquisitionWeek,
					rosterId,
					ownerId:
						roster?.ownerId || null,
					teamName:
						roster?.teamName || null,
					managerSlug:
						roster?.managerSlug || null,
					exact: true,
					createdAt,
					transactionId:
						txn?.transaction_id || null,
					transactionStatus:
						txn?.status || null
				});
			} else if (type === 'free_agent') {
				priceMap.set(playerId, {
					rawPrice: MIN_KEEPER_BASE,
					type: 'free_agent',
					season: sourceSeason,
					acquisitionWeek,
					rosterId,
					ownerId:
						roster?.ownerId || null,
					teamName:
						roster?.teamName || null,
					managerSlug:
						roster?.managerSlug || null,
					exact: true,
					createdAt,
					transactionId:
						txn?.transaction_id || null,
					transactionStatus:
						txn?.status || null
				});
			}

			// IMPORTANT:
			//
			// Trade adds do not replace the acquisition price.
			//
			// Example:
			// drafted for $40
			// -> traded
			// -> still $40 base
			//
			// Example:
			// drafted for $40
			// -> dropped
			// -> waiver claim for $20
			// -> traded
			// -> $20 base
		}
	}
}

function findOlderDraftPrice(
	playerId,
	draftHistory,
	sourceSeason
) {
	const snapshots = [...draftHistory]
		.filter(
			(entry) =>
				Number(entry.season) <
				Number(sourceSeason)
		)
		.sort(
			(a, b) =>
				b.season - a.season
		);

	for (const snapshot of snapshots) {
		const pick = (
			snapshot.picks || []
		).find(
			(row) =>
				String(row?.player_id || '') ===
				String(playerId)
		);

		if (!pick) continue;

		const amount = moneyValue(pick);

		if (amount > 0) {
			return {
				rawPrice: amount,
				type: 'historical',
				season: snapshot.season,
				rosterId: Number(
					pick?.roster_id || 0
				),
				ownerId: pick?.picked_by
					? String(pick.picked_by)
					: null,
				teamName: null,
				managerSlug: null,
				exact: false,
				draftPick: pick
			};
		}
	}

	return null;
}

function countKeeperStreak({
	playerId,
	draftHistory,
	sourceSeason
}) {
	let streak = 0;
	const history = [];

	const snapshots = [...draftHistory]
		.filter(
			(entry) =>
				Number(entry.season) <=
				Number(sourceSeason)
		)
		.sort(
			(a, b) =>
				b.season - a.season
		);

	for (const snapshot of snapshots) {
		const pick = (
			snapshot.picks || []
		).find(
			(row) =>
				String(row?.player_id || '') ===
				String(playerId)
		);

		// No draft appearance in a season
		// breaks a consecutive keeper run.
		if (!pick) break;

		// A normal auction-draft appearance
		// resets the keeper clock.
		//
		// Keeper tenure follows the player
		// through trades/franchise changes.
		if (!pick?.is_keeper) break;

		streak += 1;

		history.push({
			season: snapshot.season,
			amount: moneyValue(pick),
			taxPct:
				streak *
				TAX_STEP_PCT
		});
	}

	return {
		streak,
		history
	};
}

function buildCandidate({
	player,
	roster,
	price,
	ownership,
	draftHistory,
	sourceSeason,
	targetSeason,
	simulateKeeper = false
}) {
	const inheritedPrice =
		price ||
		findOlderDraftPrice(
			player.id,
			draftHistory,
			sourceSeason
		);

	const acquisitionWeek =
		inheritedPrice?.acquisitionWeek != null &&
		Number(
			inheritedPrice.acquisitionWeek
		) >= 0
			? Number(
					inheritedPrice.acquisitionWeek
				)
			: null;

	const acquisitionType =
		inheritedPrice?.type ||
		'minimum';

	const isWaiverOrFreeAgent =
		acquisitionType === 'waiver' ||
		acquisitionType === 'free_agent';

	const acquiredAfterKeeperDeadline =
		isWaiverOrFreeAgent &&
		acquisitionWeek !== null &&
		acquisitionWeek >
			KEEPER_ACQUISITION_DEADLINE_WEEK;

	const keeperEligible =
		!acquiredAfterKeeperDeadline;

	let keeperIneligibleReason = null;

	if (acquiredAfterKeeperDeadline) {
		keeperIneligibleReason =
			acquisitionType === 'waiver'
				? `Waiver claim completed in Week ${acquisitionWeek}, after the Week ${KEEPER_ACQUISITION_DEADLINE_WEEK} keeper deadline.`
				: `Free-agent add completed in Week ${acquisitionWeek}, after the Week ${KEEPER_ACQUISITION_DEADLINE_WEEK} keeper deadline.`;
	}

	let rawPreviousPrice =
		inheritedPrice
			? numberValue(
					inheritedPrice.rawPrice,
					0
				)
			: MIN_KEEPER_BASE;

	let floorBase = Math.max(
		MIN_KEEPER_BASE,
		rawPreviousPrice
	);

	const realKeeperRun =
		countKeeperStreak({
			playerId: player.id,
			draftHistory,
			sourceSeason
		});

	let keeperStreak =
		realKeeperRun.streak;

	let keeperHistory = [
		...realKeeperRun.history
	];

	let effectivePriceOrigin =
		inheritedPrice?.type ||
		'minimum';

	let effectivePriceOriginSeason =
		inheritedPrice?.season ||
		sourceSeason;

	/*
	 * DEV SIMULATION
	 *
	 * Pretend this player was kept
	 * during sourceSeason.
	 *
	 * Example:
	 *
	 * 2025 base = $41
	 * 2026 keeper #1 =
	 * ceil($41 × 1.10) = $46
	 *
	 * That $46 then becomes the base
	 * when calculating the hypothetical
	 * 2027 keeper #2 price.
	 *
	 * Ineligible players are NOT allowed
	 * to be simulated as keepers.
	 */

	const shouldSimulateKeeper =
		simulateKeeper &&
		keeperEligible;

	if (shouldSimulateKeeper) {
		const simulatedKeeperTaxPct =
			TAX_STEP_PCT *
			(keeperStreak + 1);

		const simulatedKeeperTaxAmount =
			roundMoney(
				floorBase *
					(
						simulatedKeeperTaxPct /
						100
					)
			);

		const simulatedKeeperPrice =
			roundKeeperCost(
				floorBase +
					simulatedKeeperTaxAmount
			);

		keeperStreak += 1;

		keeperHistory = [
			{
				season: sourceSeason,
				amount:
					simulatedKeeperPrice,
				taxPct:
					simulatedKeeperTaxPct,
				simulated: true
			},
			...keeperHistory
		];

		rawPreviousPrice =
			simulatedKeeperPrice;

		floorBase =
			simulatedKeeperPrice;

		effectivePriceOrigin =
			'keeper';

		effectivePriceOriginSeason =
			sourceSeason;
	}

	/*
	 * Calculate the NEXT keeper selection.
	 */

	const taxPct =
		TAX_STEP_PCT *
		(keeperStreak + 1);

	const taxAmount =
		roundMoney(
			floorBase *
				(taxPct / 100)
		);

	/*
	 * Keep the theoretical value available
	 * for debugging, but an ineligible
	 * player has no actionable keeper price.
	 */

	const calculatedKeeperCost =
		roundKeeperCost(
			floorBase +
				taxAmount
		);

	const keeperCost =
		keeperEligible
			? calculatedKeeperCost
			: null;

	const currentMove =
		ownership || null;

	const movedByTrade =
		currentMove?.type === 'trade';

	const ownerChanged =
		inheritedPrice?.ownerId &&
		roster.ownerId
			? String(
					inheritedPrice.ownerId
				) !==
				String(
					roster.ownerId
				)
			: false;

	return {
		id: String(player.id),

		name: player.name,
		shortName: player.shortName,

		position:
			player.position || '—',

		nflTeam:
			player.team || null,

		nflTeamLabel:
			player.teamLabel ||
			player.team ||
			'FA',

		photoUrl:
			player.photoUrl,

		rosterId:
			roster.rosterId,

		ownerId:
			roster.ownerId,

		teamName:
  roster.teamName,

teamPhoto:
  roster.teamPhoto,

teamChiclet:
  roster.teamChiclet ||
  roster.teamPhoto ||
  null,

managerName:
  roster.managerName,

		managerSlug:
			roster.managerSlug,

		initials:
			roster.initials,

		sourceSeason,
		targetSeason,

		previousPrice:
			roundMoney(
				rawPreviousPrice
			),

		floorBase:
			roundMoney(
				floorBase
			),

		floorApplied:
			rawPreviousPrice <
			MIN_KEEPER_BASE,

		priceOrigin:
			effectivePriceOrigin,

		priceOriginLabel:
			shouldSimulateKeeper
				? 'Simulated keeper price'
				: priceOriginLabel(
						effectivePriceOrigin
					),

		priceOriginSeason:
			effectivePriceOriginSeason,

		lastAcquisitionPrice:
			roundMoney(
				rawPreviousPrice
			),

		lastAcquisitionType:
			inheritedPrice?.type ||
			'minimum',

		lastAcquisitionLabel:
			priceOriginLabel(
				inheritedPrice?.type ||
					'minimum'
			),

		lastAcquisitionTransactionId:
			inheritedPrice?.transactionId ||
			null,

		lastAcquisitionTransactionStatus:
			inheritedPrice?.transactionStatus ||
			null,

		lastAcquisitionAt:
			inheritedPrice?.createdAt ||
			null,

		priceExact:
			Boolean(
				inheritedPrice?.exact
			),

		movedByTrade:
			Boolean(
				movedByTrade ||
					ownerChanged
			),

		keeperStreak,

		keeperHistory,

		keeperSelectionNumber:
			keeperStreak + 1,

		taxPct,

		taxAmount,

		keeperCost,

		calculatedKeeperCost,

		keeperEligible,

		keeperIneligibleReason,

		acquisitionWeek,

		acquiredAfterKeeperDeadline,

		firstKeeperSelection:
			keeperStreak === 0,

		simulatedKeeper:
			shouldSimulateKeeper
	};
}

function sortPlayers(rows = []) {
	const positionOrder = {
		QB: 1,
		RB: 2,
		WR: 3,
		TE: 4,
		K: 5,
		DEF: 6,
		DST: 6
	};

	return [...rows].sort(
		(a, b) => {
			const aPos =
				positionOrder[
					a.position
				] || 99;

			const bPos =
				positionOrder[
					b.position
				] || 99;

			if (aPos !== bPos) {
				return aPos - bPos;
			}

			/*
			 * Within a position,
			 * show keeper-eligible
			 * players first.
			 */

			if (
				a.keeperEligible !==
				b.keeperEligible
			) {
				return a.keeperEligible
					? -1
					: 1;
			}

			const aCost =
				a.keeperCost ??
				Number.POSITIVE_INFINITY;

			const bCost =
				b.keeperCost ??
				Number.POSITIVE_INFINITY;

			return (
				aCost -
					bCost ||
				a.name.localeCompare(
					b.name
				)
			);
		}
	);
}

export async function getKeeperDeskBundle({
	url,
	env
} = {}) {
	const simulateNextSeason =
		url.searchParams.get(
			'simulateNext'
		) === '1';

	const simulateKeeperQuery =
		url.searchParams
			.get('simulateKeeper')
			?.trim()
			.toLowerCase() ||
		null;

	/*
	 * Resolve the actual season
	 * requested by the URL first.
	 */

	const liveContext =
		await resolveLeagueContext({
			url,
			env,
			allWeeksByDefault: false
		});

	const liveSeason =
		Number(
			liveContext.season
		);

	/*
	 * NORMAL:
	 *
	 * target = 2026
	 * source = 2025
	 *
	 *
	 * SIMULATION:
	 *
	 * live league = 2026
	 * target = 2027
	 * source = 2026
	 *
	 *
	 * This lets us calculate
	 * next year's keeper costs
	 * without needing a real
	 * 2027 Sleeper league or
	 * touching the database.
	 */

	const targetSeason =
		simulateNextSeason
			? liveSeason + 1
			: liveSeason;

	const sourceSeason =
		targetSeason - 1;

	const targetContext =
		liveContext;

	let sourceContext;

	if (simulateNextSeason) {
		/*
		 * Current league becomes
		 * the source for the
		 * hypothetical next season.
		 */

		sourceContext =
			liveContext;
	} else {
		const sourceUrl =
			new URL(url);

		sourceUrl.searchParams.delete(
			'simulateNext'
		);

		sourceUrl.searchParams.delete(
			'simulateKeeper'
		);

		sourceUrl.searchParams.set(
			'season',
			String(sourceSeason)
		);

		sourceContext =
			await resolveLeagueContext({
				url: sourceUrl,
				env,
				allWeeksByDefault: false
			});
	}

	const history =
		await getLeagueHistory(
			targetContext.rootLeagueId
		);

	const seasonsInHistory = [
		...new Set(
			history
				.map(
					(league) =>
						Number(
							league?.season ||
								0
						)
				)
				.filter(Boolean)
		)
	];

	const availableSeasons = [
		...new Set([
			targetSeason,
			...seasonsInHistory.map(
				(season) =>
					season + 1
			)
		])
	].sort(
		(a, b) =>
			b - a
	);

	let targetUsers = [];
	let targetRosters = [];

	let sourceUsers = [];
	let sourceRosters = [];

	let sourceDrafts = [];

	let sourceTransactionsByWeek = [];

	if (simulateNextSeason) {
		/*
		 * We don't have a 2027 league yet.
		 *
		 * So use the current 2026 league
		 * as both:
		 *
		 * - keeper-history source
		 * - hypothetical future roster source
		 */

		[
			sourceUsers,
			sourceRosters,
			sourceDrafts,
			sourceTransactionsByWeek
		] = await Promise.all([
			getSleeperUsers(
				sourceContext.leagueId
			),

			getSleeperRosters(
				sourceContext.leagueId
			),

			getSleeperLeagueDrafts(
				sourceContext.leagueId
			),

			Promise.all(
				TRANSACTION_WEEKS.map(
					async (week) => {
						const rows =
							await getSleeperTransactionsForWeek(
								sourceContext.leagueId,
								week
							).catch(
								() => []
							);

						/*
						 * IMPORTANT:
						 *
						 * Sleeper returns transactions
						 * by week endpoint, but the
						 * transaction object itself
						 * doesn't reliably tell our
						 * keeper engine which weekly
						 * endpoint produced it.
						 *
						 * Preserve that here.
						 */

						return (
							rows || []
						).map(
							(txn) => ({
								...txn,
								__leagueWeek:
									week
							})
						);
					}
				)
			)
		]);

		targetUsers =
			sourceUsers;

		targetRosters =
			sourceRosters;
	} else {
		[
			targetUsers,
			targetRosters,
			sourceUsers,
			sourceRosters,
			sourceDrafts,
			sourceTransactionsByWeek
		] = await Promise.all([
			getSleeperUsers(
				targetContext.leagueId
			).catch(
				() => []
			),

			getSleeperRosters(
				targetContext.leagueId
			).catch(
				() => []
			),

			getSleeperUsers(
				sourceContext.leagueId
			),

			getSleeperRosters(
				sourceContext.leagueId
			),

			getSleeperLeagueDrafts(
				sourceContext.leagueId
			),

			Promise.all(
				TRANSACTION_WEEKS.map(
					async (week) => {
						const rows =
							await getSleeperTransactionsForWeek(
								sourceContext.leagueId,
								week
							).catch(
								() => []
							);

						/*
						 * IMPORTANT:
						 *
						 * This MUST also happen
						 * in the normal/live branch.
						 *
						 * Without __leagueWeek here,
						 * a December FA add looks like:
						 *
						 * acquisitionWeek: null
						 *
						 * which causes the keeper
						 * deadline check to incorrectly
						 * consider the player eligible.
						 */

						return (
							rows || []
						).map(
							(txn) => ({
								...txn,
								__leagueWeek:
									week
							})
						);
					}
				)
			)
		]);
	}

	const sourceDraftMeta =
		choosePrimaryDraft(
			sourceDrafts
		);

	const sourceDraftPicks =
		sourceDraftMeta?.draft_id
			? await getSleeperDraftPicks(
					sourceDraftMeta.draft_id
				)
			: [];

	/*
	 * For an upcoming season,
	 * Sleeper's target-season rosters
	 * are the best source because
	 * offseason trades can change
	 * keeper rights.
	 *
	 * Fall back to the previous
	 * season's final rosters.
	 */

	const targetHasPlayers =
		!simulateNextSeason &&
		(
			targetRosters || []
		).some(
			(roster) =>
				(
					roster?.players ||
					[]
				).length > 0
		);

	const candidateRostersRaw =
		simulateNextSeason
			? sourceRosters
			: targetHasPlayers
				? targetRosters
				: sourceRosters;

	const candidateUsersRaw =
		simulateNextSeason
			? sourceUsers
			: targetHasPlayers
				? targetUsers
				: sourceUsers;

	const candidateSeasonSource =
		simulateNextSeason
			? sourceSeason
			: targetHasPlayers
				? targetSeason
				: sourceSeason;

	const candidateIdentityMap =
		buildRosterIdentityMap({
			rosters:
				candidateRostersRaw,
			users:
				candidateUsersRaw
		});

	const sourceIdentityMap =
		buildRosterIdentityMap({
			rosters:
				sourceRosters,
			users:
				sourceUsers
		});

	const draftHistory = (
		await Promise.all(
			history
				.filter(
					(league) =>
						Number(
							league?.season ||
								0
						) <=
						sourceSeason
				)
				.map(
					(league) =>
						getSeasonDraftSnapshot(
							league
						)
				)
		)
	).filter(Boolean);

	/*
	 * Ensure env season overrides
	 * are represented even when
	 * Sleeper's previous_league_id
	 * chain is incomplete.
	 */

	if (
		!draftHistory.some(
			(entry) =>
				Number(entry.season) ===
				sourceSeason
		)
	) {
		draftHistory.push({
			season:
				sourceSeason,

			leagueId:
				sourceContext.leagueId,

			draft:
				sourceDraftMeta,

			picks:
				sourceDraftPicks ||
				[]
		});
	}

	const sourceDraft = {
		season:
			sourceSeason,

		leagueId:
			sourceContext.leagueId,

		draft:
			sourceDraftMeta,

		picks:
			sourceDraftPicks ||
			[]
	};

	/*
 * ============================================================
 * KEEPER PRICE STATE
 *
 * The source season's completed draft normally establishes
 * the starting price state for that season.
 *
 * BUT:
 *
 * If we're projecting from a season whose draft has not
 * happened yet, we must carry forward the LAST REAL PRICED
 * ACQUISITION from the previous season.
 *
 * Example:
 *
 * 2025:
 *   Jayden Daniels drafted for $41
 *   later claimed on waivers for $33
 *
 * 2026 draft has not happened yet.
 *
 * A 2027 projection must inherit $33, not fall backwards
 * to the old $41 draft price.
 * ============================================================
 */

let priceMap =
	new Map();


const sourceDraftComplete =
	String(
		sourceDraftMeta?.status ||
			''
	).toLowerCase() ===
	'complete';


/*
 * If the source-season draft has not happened yet,
 * reconstruct the previous season's ENDING price state.
 */
if (!sourceDraftComplete) {
	const previousSeason =
		sourceSeason - 1;


	const previousSnapshot =
		draftHistory.find(
			(entry) =>
				Number(
					entry.season
				) ===
				Number(
					previousSeason
				)
		);


	if (
		previousSnapshot?.leagueId
	) {
		const previousDraftPrices =
			buildDraftPriceMap({
				sourceDraft:
					previousSnapshot,

				/*
				 * We only need historical PRICE state here.
				 * Current ownership is resolved separately
				 * from the source-season rosters/trades.
				 */
				sourceIdentityMap:
					new Map()
			});


		const previousTransactions =
			await getTransactionsForLeague(
				previousSnapshot.leagueId
			);


		applyTransactionPrices({
			priceMap:
				previousDraftPrices,

			ownershipMap:
				new Map(),

			transactions:
				previousTransactions,

			sourceIdentityMap:
				new Map(),

			sourceSeason:
				previousSeason
		});


		/*
		 * This map now represents the real ending
		 * price state of the previous season.
		 *
		 * Draft → waiver → FA, etc.
		 */
		priceMap =
			new Map(
				previousDraftPrices
			);
	}
}


/*
 * Overlay whatever actually exists in the source-season
 * draft.
 *
 * Once the draft is complete, these prices naturally become
 * authoritative and replace the carried-forward prices.
 */
const sourceDraftPrices =
	buildDraftPriceMap({
		sourceDraft,
		sourceIdentityMap
	});


for (
	const [
		playerId,
		price
	] of sourceDraftPrices
) {
	priceMap.set(
		playerId,
		price
	);
}


/*
 * Finally walk source-season transactions chronologically.
 *
 * Waivers/free agents replace the current price.
 * Trades transfer ownership but preserve price.
 */
const ownershipMap =
	new Map();


const sourceTransactions =
	sourceTransactionsByWeek.flat();


applyTransactionPrices({
	priceMap,
	ownershipMap,
	transactions:
		sourceTransactions,
	sourceIdentityMap,
	sourceSeason
});

	const playerIds =
		candidateRostersRaw.flatMap(
			(roster) =>
				roster?.players ||
				[]
		);

	const playersById =
		await resolvePlayersByIds(
			playerIds
		);

	const teams =
		candidateRostersRaw
			.map(
				(rawRoster) => {
					const rosterId =
						Number(
							rawRoster?.roster_id ||
								0
						);

					const identity =
						candidateIdentityMap.get(
							rosterId
						) || {};

					const roster = {
						rosterId,

						ownerId:
							rawRoster?.owner_id
								? String(
										rawRoster.owner_id
									)
								: identity.ownerId ||
									null,

						managerName:
							identity.managerName ||
							'Unknown Manager',

						teamName:
							identity.teamName ||
							`Roster ${rosterId}`,

						teamPhoto:
  identity.teamPhoto ||
  null,

teamChiclet:
  identity.teamChiclet ||
  identity.teamPhoto ||
  null,

managerSlug:
  identity.managerSlug ||
  null,

						initials:
							identity.initials ||
							'?'
					};

					const players =
						sortPlayers(
							(
								rawRoster?.players ||
								[]
							)
								.map(
									(
										playerId
									) =>
										playersById.get(
											String(
												playerId
											)
										)
								)
								.filter(
									Boolean
								)
								.map(
									(
										player
									) => {
										const simulateThisKeeper =
											Boolean(
												simulateNextSeason &&
													simulateKeeperQuery &&
													(
														String(
															player.id
														).toLowerCase() ===
															simulateKeeperQuery ||
														String(
															player.name ||
																''
														).toLowerCase() ===
															simulateKeeperQuery
													)
											);

										return buildCandidate({
											player,

											roster,

											price:
												priceMap.get(
													String(
														player.id
													)
												) ||
												null,

											ownership:
												ownershipMap.get(
													String(
														player.id
													)
												) ||
												null,

											draftHistory,

											sourceSeason,

											targetSeason,

											simulateKeeper:
												simulateThisKeeper
										});
									}
								)
						);

					const eligiblePlayers =
						players.filter(
							(player) =>
								player.keeperEligible
						);

					return {
						...roster,

						playerCount:
							players.length,

						eligiblePlayerCount:
							eligiblePlayers.length,

						players,

						/*
						 * The "2 cheapest" list
						 * must NEVER include
						 * players who cannot
						 * legally be kept.
						 */

						cheapest: [
							...eligiblePlayers
						]
							.sort(
								(a, b) =>
									a.keeperCost -
										b.keeperCost ||
									a.name.localeCompare(
										b.name
									)
							)
							.slice(
								0,
								MAX_KEEPERS
							),

						/*
						 * Average cost should
						 * also only reflect
						 * keeper-eligible players.
						 */

						averageKeeperCost:
							eligiblePlayers.length
								? roundMoney(
										eligiblePlayers.reduce(
											(
												sum,
												player
											) =>
												sum +
												player.keeperCost,
											0
										) /
											eligiblePlayers.length
									)
								: 0
					};
				}
			)
			.filter(
				(team) =>
					team.players.length >
					0
			)
			.sort(
				(a, b) =>
					a.teamName.localeCompare(
						b.teamName
					)
			);

	const candidates =
		teams.flatMap(
			(team) =>
				team.players
		);

	const exactPriceCount =
		candidates.filter(
			(player) =>
				player.priceExact
		).length;

	const estimatedPriceCount =
		candidates.length -
		exactPriceCount;

	const returningKeeperCount =
		candidates.filter(
			(player) =>
				player.keeperStreak >
				0
		).length;

	const ineligibleKeeperCount =
		candidates.filter(
			(player) =>
				!player.keeperEligible
		).length;

	return {
		season:
			targetSeason,

		targetSeason,

		sourceSeason,

		simulation: {
			enabled:
				simulateNextSeason,

			sourceSeason,

			targetSeason
		},

		candidateSeasonSource,

		availableSeasons,

		leagueName:
			targetContext.league?.name ||
			sourceContext.league?.name ||
			'Irving Championship League',

		teams,

		candidates,

		hasData:
			candidates.length > 0,

		stats: {
			teamCount:
				teams.length,

			candidateCount:
				candidates.length,

			exactPriceCount,

			estimatedPriceCount,

			returningKeeperCount,

			ineligibleKeeperCount
		},

		rules: {
			maxKeepers:
				MAX_KEEPERS,

			minimumBase:
				MIN_KEEPER_BASE,

			taxStepPct:
				TAX_STEP_PCT,

			roundUpToWholeDollar:
				ROUND_KEEPER_COST_UP_TO_WHOLE_DOLLAR,

			acquisitionDeadlineWeek:
				KEEPER_ACQUISITION_DEADLINE_WEEK
		},

		source:
			'Sleeper draft history + last acquisition event + roster ownership + transaction history'
	};
}