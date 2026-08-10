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

const MAX_PLAYER_HISTORY_SEASONS = 2;

const FULL_TRANSACTION_WEEKS =
	Array.from(
		{ length: 18 },
		(_, index) =>
			index + 1
	);
const TRANSACTION_BATCH_SIZE = 3;

const LEDGER_CACHE_MS =
	10 * 60 * 1000;

const leagueLedgerCache =
	new Map();



function numberValue(
	value,
	fallback = 0
) {
	const number =
		Number(value);

	return Number.isFinite(number)
		? number
		: fallback;
}


function moneyValue(pick) {
	const raw =
		pick?.metadata?.amount ??
		pick?.metadata?.bid_amount ??
		pick?.auction_amount ??
		pick?.amount;

	const amount =
		Number(raw);

	return Number.isFinite(amount)
		? amount
		: null;
}


function waiverBid(txn) {
	const raw =
		txn?.settings?.waiver_bid ??
		txn?.waiver_bid ??
		txn?.metadata?.waiver_bid;

	const amount =
		Number(raw);

	return Number.isFinite(amount)
		? amount
		: null;
}


function transactionTimestamp(txn) {
	return numberValue(
		txn?.status_updated ??
			txn?.created ??
			txn?.updated,
		0
	);
}


function choosePrimaryDraft(
	drafts = []
) {
	if (!drafts.length) {
		return null;
	}

	return (
		drafts.find(
			(draft) =>
				draft?.status ===
				'complete'
		) ||
		drafts[0]
	);
}


function identityCard(
	identity,
	rosterId = null
) {
	if (
		!identity &&
		rosterId == null
	) {
		return null;
	}

	return {
		rosterId:
			rosterId == null
				? null
				: Number(
						rosterId
					),

		teamName:
			identity?.teamName ||
			(
				rosterId != null
					? `Roster ${rosterId}`
					: null
			),

		managerName:
			identity?.managerName ||
			null,

		managerSlug:
			identity?.managerSlug ||
			null,

		teamPhoto:
			identity?.teamPhoto ||
			null,

		initials:
			identity?.initials ||
			null,

		ownerId:
			identity?.ownerId ||
			null
	};
}


function shortPlayerName(
	player,
	playerId
) {
	if (player?.shortName) {
		return player.shortName;
	}

	if (player?.name) {
		const parts =
			String(player.name)
				.trim()
				.split(/\s+/)
				.filter(Boolean);

		if (parts.length > 1) {
			return `${parts[0][0]}. ${parts
				.slice(1)
				.join(' ')}`;
		}

		return player.name;
	}

	return String(playerId);
}


function pickLabel(pick) {
	const season =
		pick?.season
			? String(
					pick.season
				)
			: 'Future';

	const round =
		Number(
			pick?.round || 0
		);

	return round > 0
		? `${season} R${round}`
		: `${season} pick`;
}


function uniqueLeagues(
	leagues = []
) {
	const seen =
		new Set();

	const output = [];

	for (const league of leagues) {
		const leagueId =
			String(
				league?.league_id ||
					''
			);

		const season =
			Number(
				league?.season ||
					0
			);

		if (!leagueId) {
			continue;
		}

		const key =
			`${leagueId}:${season}`;

		if (seen.has(key)) {
			continue;
		}

		seen.add(key);
		output.push(league);
	}

	return output;
}

async function loadTransactionWeeks(
	leagueId,
	weeks = []
) {
	const output = [];

	const uniqueWeeks =
		[
			...new Set(
				weeks
					.map(Number)
					.filter(
						(week) =>
							Number.isInteger(
								week
							) &&
							week >= 1 &&
							week <= 18
					)
			)
		].sort(
			(a, b) =>
				a - b
		);

	for (
		let index = 0;
		index < uniqueWeeks.length;
		index += TRANSACTION_BATCH_SIZE
	) {
		const batchWeeks =
			uniqueWeeks.slice(
				index,
				index +
					TRANSACTION_BATCH_SIZE
			);

		const batch =
			await Promise.all(
				batchWeeks.map(
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

		output.push(
			...batch.flat()
		);
	}

	return output;
}

async function loadLeagueSeason(
	league,
	{
		transactionWeeks =
			FULL_TRANSACTION_WEEKS
	} = {}
) {
	const leagueId =
		String(
			league?.league_id ||
				''
		);

	const season =
		Number(
			league?.season ||
				0
		);

	if (!leagueId) {
		return null;
	}


	/*
	 * First get the relatively cheap
	 * season-level resources.
	 *
	 * Transaction requests are deliberately
	 * handled separately and throttled.
	 */
	const [
		users,
		rosters,
		drafts
	] = await Promise.all([
		getSleeperUsers(
			leagueId
		).catch(
			() => []
		),

		getSleeperRosters(
			leagueId
		).catch(
			() => []
		),

		getSleeperLeagueDrafts(
			leagueId
		).catch(
			() => []
		)
	]);


	const identityMap =
		buildRosterIdentityMap({
			rosters,
			users
		});


	const draft =
		choosePrimaryDraft(
			drafts
		);


	/*
	 * Draft picks + transaction batches are
	 * sequential here intentionally.
	 *
	 * We're optimizing for Worker reliability,
	 * not shaving 100ms off a modal.
	 */
	const picks =
		draft?.draft_id
			? await getSleeperDraftPicks(
					draft.draft_id
				).catch(
					() => []
				)
			: [];


	const transactions =
		await loadTransactionWeeks(
			leagueId,
			transactionWeeks
		);


	return {
		season,

		leagueId,

		league,

		users,

		rosters,

		identityMap,

		draft,

		picks:
			Array.isArray(
				picks
			)
				? picks
				: [],

		transactions
	};
}


function buildCurrentRoster(
	playerId,
	seasonData
) {
	if (!seasonData) {
		return {
			rostered: false,
			teamName: null,
			managerName: null,
			rosterId: null,
			season: null
		};
	}


	const roster =
		(
			seasonData.rosters ||
			[]
		).find(
			(row) =>
				(
					row?.players ||
					[]
				).some(
					(id) =>
						String(id) ===
						String(
							playerId
						)
				)
		);


	if (!roster) {
		return {
			rostered: false,
			teamName: null,
			managerName: null,
			rosterId: null,
			season:
				seasonData.season
		};
	}


	const rosterId =
		Number(
			roster?.roster_id ||
				0
		);


	const identity =
		seasonData.identityMap.get(
			rosterId
		) || {};


	return {
		rostered: true,

		rosterId,

		season:
			seasonData.season,

		teamName:
			identity.teamName ||
			`Roster ${rosterId}`,

		managerName:
			identity.managerName ||
			null,

		managerSlug:
			identity.managerSlug ||
			null,

		teamPhoto:
			identity.teamPhoto ||
			null,

		initials:
			identity.initials ||
			null,

		ownerId:
			roster?.owner_id
				? String(
						roster.owner_id
					)
				: identity.ownerId ||
					null
	};
}


function tradeSourceRosterId({
	txn,
	playerId,
	destinationRosterId
}) {
	const directDrop =
		txn?.drops?.[
			playerId
		];


	if (directDrop != null) {
		return Number(
			directDrop
		);
	}


	const rosterIds =
		(
			txn?.roster_ids ||
			[]
		)
			.map(Number)
			.filter(
				Number.isFinite
			);


	/*
	 * Two-team trade fallback:
	 * if Sleeper didn't include the
	 * player's old roster in drops,
	 * the other participant is the
	 * source franchise.
	 */
	if (rosterIds.length === 2) {
		return (
			rosterIds.find(
				(id) =>
					id !==
					Number(
						destinationRosterId
					)
			) ??
			null
		);
	}


	return null;
}


function collectRelevantPlayerIds(
	playerId,
	seasons
) {
	const ids =
		new Set([
			String(
				playerId
			)
		]);


	for (
		const seasonData
		of seasons
	) {
		for (
			const txn
			of seasonData.transactions ||
			[]
		) {
			const adds =
				txn?.adds ||
				{};

			const drops =
				txn?.drops ||
				{};


			const touchesPlayer =
				Object.prototype.hasOwnProperty.call(
					adds,
					playerId
				) ||
				Object.prototype.hasOwnProperty.call(
					drops,
					playerId
				);


			if (!touchesPlayer) {
				continue;
			}


			for (
				const id
				of Object.keys(
					adds
				)
			) {
				ids.add(
					String(id)
				);
			}


			for (
				const id
				of Object.keys(
					drops
				)
			) {
				ids.add(
					String(id)
				);
			}
		}
	}


	return [...ids];
}


function buildTradeAssets({
	txn,
	playerId,
	destinationRosterId,
	playersById
}) {
	const assets = [];

	const seenPlayers =
		new Set();


	for (
		const [
			otherPlayerIdRaw,
			toRosterIdRaw
		]
		of Object.entries(
			txn?.adds ||
			{}
		)
	) {
		const otherPlayerId =
			String(
				otherPlayerIdRaw
			);


		if (
			otherPlayerId ===
			String(
				playerId
			)
		) {
			continue;
		}


		if (
			seenPlayers.has(
				otherPlayerId
			)
		) {
			continue;
		}


		seenPlayers.add(
			otherPlayerId
		);


		const player =
			playersById.get(
				otherPlayerId
			);


		const direction =
			Number(
				toRosterIdRaw
			) ===
			Number(
				destinationRosterId
			)
				? 'in'
				: 'out';


		assets.push({
			kind: 'player',

			direction,

			playerId:
				otherPlayerId,

			name:
				player?.name ||
				otherPlayerId,

			shortName:
				shortPlayerName(
					player,
					otherPlayerId
				),

			position:
				player?.position ||
				null,

			nflTeamLabel:
				player?.teamLabel ||
				player?.team ||
				null
		});
	}


	for (
		const pick
		of txn?.draft_picks ||
		[]
	) {
		const ownerId =
			Number(
				pick?.owner_id
			);

		const previousOwnerId =
			Number(
				pick?.previous_owner_id
			);


		let direction = null;


		if (
			ownerId ===
			Number(
				destinationRosterId
			)
		) {
			direction = 'in';
		} else if (
			previousOwnerId ===
			Number(
				destinationRosterId
			)
		) {
			direction = 'out';
		}


		if (!direction) {
			continue;
		}


		assets.push({
			kind: 'pick',

			direction,

			label:
				pickLabel(
					pick
				),

			season:
				pick?.season
					? Number(
							pick.season
						)
					: null,

			round:
				pick?.round
					? Number(
							pick.round
						)
					: null
		});
	}


	return assets;
}


function buildHistoryEvents(
	playerId,
	seasons,
	playersById
) {
	const events = [];


	for (
		const seasonData
		of seasons
	) {
		const season =
			seasonData.season;


		/*
		 * DRAFT / KEEPER EVENTS
		 */
		for (
			const pick
			of seasonData.picks ||
			[]
		) {
			if (
				String(
					pick?.player_id ||
						''
				) !==
				String(
					playerId
				)
			) {
				continue;
			}


			const rosterId =
				Number(
					pick?.roster_id ||
						0
				);


			const identity =
				seasonData.identityMap.get(
					rosterId
				) || {};


			const isKeeper =
				Boolean(
					pick?.is_keeper
				);


			events.push({
				id:
					`draft:${seasonData.leagueId}:${pick?.pick_no ?? playerId}`,

				type:
					isKeeper
						? 'keeper'
						: 'draft',

				label:
					isKeeper
						? 'KEPT'
						: 'DRAFTED',

				season,

				week: null,

				timestamp:
					numberValue(
						seasonData.draft?.start_time ??
							seasonData.draft?.created,
						0
					),

				team:
					identityCard(
						identity,
						rosterId
					),

				amount:
					moneyValue(
						pick
					),

				faab: false,

				toTeam: null,

				fromTeam: null,

				assets: []
			});
		}


		/*
		 * TRANSACTIONS
		 */
		for (
			const txn
			of seasonData.transactions ||
			[]
		) {
			const status =
				String(
					txn?.status ||
						''
				).toLowerCase();


			if (
				status &&
				status !==
					'complete'
			) {
				continue;
			}


			const type =
				String(
					txn?.type ||
						''
				).toLowerCase();


			const adds =
				txn?.adds ||
				{};

			const drops =
				txn?.drops ||
				{};


			const hasAdd =
				Object.prototype.hasOwnProperty.call(
					adds,
					playerId
				);


			const hasDrop =
				Object.prototype.hasOwnProperty.call(
					drops,
					playerId
				);


			if (
				!hasAdd &&
				!hasDrop
			) {
				continue;
			}


			const timestamp =
				transactionTimestamp(
					txn
				);


			const week =
				Number(
					txn?.leg ??
						txn?.__leagueWeek ??
						0
				) ||
				null;


			/*
			 * TRADE
			 */
			if (
				type ===
				'trade'
			) {
				const destinationRosterId =
					hasAdd
						? Number(
								adds[
									playerId
								]
							)
						: null;


				const sourceRosterId =
					destinationRosterId !=
					null
						? tradeSourceRosterId({
								txn,

								playerId:
									String(
										playerId
									),

								destinationRosterId
							})
						: hasDrop
							? Number(
									drops[
										playerId
									]
								)
							: null;


				const toIdentity =
					destinationRosterId !=
					null
						? seasonData.identityMap.get(
								destinationRosterId
							) ||
							{}
						: null;


				const fromIdentity =
					sourceRosterId !=
					null
						? seasonData.identityMap.get(
								sourceRosterId
							) ||
							{}
						: null;


				events.push({
					id:
						`txn:${txn?.transaction_id || `${season}:${timestamp}:trade`}:trade`,

					type:
						'trade',

					label:
						'TRADED',

					season,

					week,

					timestamp,

					team: null,

					amount: null,

					faab: false,

					toTeam:
						identityCard(
							toIdentity,
							destinationRosterId
						),

					fromTeam:
						identityCard(
							fromIdentity,
							sourceRosterId
						),

					assets:
						destinationRosterId !=
						null
							? buildTradeAssets({
									txn,

									playerId,

									destinationRosterId,

									playersById
								})
							: []
				});


				continue;
			}


			/*
			 * WAIVER / FREE AGENT ADD
			 */
			if (hasAdd) {
				const rosterId =
					Number(
						adds[
							playerId
						]
					);


				const identity =
					seasonData.identityMap.get(
						rosterId
					) || {};


				const isWaiver =
					type ===
					'waiver';


				events.push({
					id:
						`txn:${txn?.transaction_id || `${season}:${timestamp}:add`}:add`,

					type:
						isWaiver
							? 'waiver'
							: 'free_agent',

					label:
						isWaiver
							? 'WAIVER CLAIM'
							: 'ADDED',

					season,

					week,

					timestamp,

					team:
						identityCard(
							identity,
							rosterId
						),

					amount:
						isWaiver
							? waiverBid(
									txn
								)
							: null,

					faab:
						isWaiver,

					toTeam: null,

					fromTeam: null,

					assets: []
				});
			}


			/*
			 * DROP
			 */
			if (hasDrop) {
				const rosterId =
					Number(
						drops[
							playerId
						]
					);


				const identity =
					seasonData.identityMap.get(
						rosterId
					) || {};


				events.push({
					id:
						`txn:${txn?.transaction_id || `${season}:${timestamp}:drop`}:drop`,

					type:
						'drop',

					label:
						'DROPPED',

					season,

					week,

					timestamp,

					team:
						identityCard(
							identity,
							rosterId
						),

					amount: null,

					faab: false,

					toTeam: null,

					fromTeam: null,

					assets: []
				});
			}
		}
	}


	/*
	 * Prevent duplicate events if a
	 * league happens to appear twice
	 * in the history chain.
	 */
	const deduped =
		new Map();


	for (
		const event
		of events
	) {
		if (
			!deduped.has(
				event.id
			)
		) {
			deduped.set(
				event.id,
				event
			);
		}
	}


	return [
		...deduped.values()
	].sort(
		(a, b) => {
			const timeDiff =
				numberValue(
					b.timestamp,
					0
				) -
				numberValue(
					a.timestamp,
					0
				);


			if (timeDiff) {
				return timeDiff;
			}


			return (
				Number(
					b.season ||
						0
				) -
				Number(
					a.season ||
						0
				)
			);
		}
	);
}


async function buildLeagueLedger({
	url,
	env
}) {
	/*
	 * Player stats can change season in the modal.
	 *
	 * Irving ownership should always resolve
	 * against the actual current league, so strip
	 * page-level filters first.
	 */
	const contextUrl =
		new URL(url);


	contextUrl.searchParams.delete(
		'season'
	);

	contextUrl.searchParams.delete(
		'week'
	);

	contextUrl.searchParams.delete(
		'weeks'
	);

	contextUrl.searchParams.delete(
		'team'
	);

	contextUrl.searchParams.delete(
		'rosterId'
	);


	const currentContext =
		await resolveLeagueContext({
			url:
				contextUrl,

			env,

			allWeeksByDefault:
				false
		});


	const cacheKey =
		`${currentContext.rootLeagueId || currentContext.leagueId}:${currentContext.leagueId}`;


	const cached =
		leagueLedgerCache.get(
			cacheKey
		);


	if (
		cached &&
		Date.now() -
			cached.cachedAt <
			LEDGER_CACHE_MS
	) {
		return cached.value;
	}


	const history =
		await getLeagueHistory(
			currentContext.rootLeagueId
		).catch(
			() => []
		);


	/*
	 * Sort newest first.
	 *
	 * Player File only needs the current and
	 * previous ICL seasons. This keeps a cold
	 * Cloudflare invocation safely below the
	 * external subrequest ceiling.
	 */
	const allLeagues =
		uniqueLeagues([
			...(history || []),
			currentContext.league
		])
			.sort(
				(a, b) =>
					Number(
						b?.season ||
							0
					) -
					Number(
						a?.season ||
							0
					)
			);


	const ledgerLeagues =
		allLeagues.slice(
			0,
			MAX_PLAYER_HISTORY_SEASONS
		);


	/*
	 * Current season only needs transaction
	 * weeks that could actually have happened.
	 *
	 * Historical season gets the full Week
	 * 1–18 ledger.
	 */
	const currentWeek =
		Math.max(
			1,
			Math.min(
				18,
				Number(
					currentContext.selectedWeek ||
						1
				)
			)
		);


	const currentTransactionWeeks =
		Array.from(
			{
				length:
					currentWeek
			},
			(_, index) =>
				index + 1
		);


	const seasons = [];


	/*
	 * IMPORTANT:
	 *
	 * Do this SEQUENTIALLY.
	 *
	 * The old code Promise.all()'d every season,
	 * which meant each season could launch its
	 * own transaction requests simultaneously.
	 */
	for (
		const league
		of ledgerLeagues
	) {
		const isCurrentLeague =
			String(
				league?.league_id ||
					''
			) ===
			String(
				currentContext.leagueId
			);


		const seasonData =
			await loadLeagueSeason(
				league,
				{
					transactionWeeks:
						isCurrentLeague
							? currentTransactionWeeks
							: FULL_TRANSACTION_WEEKS
				}
			);


		if (seasonData) {
			seasons.push(
				seasonData
			);
		}
	}


	seasons.sort(
		(a, b) =>
			Number(
				a.season ||
					0
			) -
			Number(
				b.season ||
					0
			)
	);


	let currentSeasonData =
		seasons.find(
			(row) =>
				String(
					row.leagueId
				) ===
					String(
						currentContext.leagueId
					) &&
				Number(
					row.season
				) ===
					Number(
						currentContext.season
					)
		);


	/*
	 * This should almost always exist because
	 * currentContext.league was added above,
	 * but keep the fallback defensive.
	 */
	if (!currentSeasonData) {
		currentSeasonData =
			await loadLeagueSeason(
				currentContext.league,
				{
					transactionWeeks:
						currentTransactionWeeks
				}
			);


		if (currentSeasonData) {
			seasons.push(
				currentSeasonData
			);
		}
	}


	const value = {
		currentContext,

		currentSeasonData,

		seasons,

		historyLimited:
			allLeagues.length >
			ledgerLeagues.length,

		availableLeagueSeasons:
			allLeagues
				.map(
					(league) =>
						Number(
							league?.season ||
								0
						)
				)
				.filter(Boolean)
	};


	leagueLedgerCache.set(
		cacheKey,
		{
			cachedAt:
				Date.now(),

			value
		}
	);


	return value;
}


export async function getPlayerLeagueHistory({
	playerId,
	url,
	env
} = {}) {
	const cleanPlayerId =
		String(
			playerId ||
				''
		).trim();


	if (!cleanPlayerId) {
		throw new Error(
			'playerId is required'
		);
	}


	const ledger =
		await buildLeagueLedger({
			url,
			env
		});


	/*
	 * Resolve the target player plus
	 * anyone else included in one of
	 * their trades so the modal can
	 * show:
	 *
	 * + C. Skattebo
	 * - T. McMillan
	 */
	const relevantIds =
		collectRelevantPlayerIds(
			cleanPlayerId,
			ledger.seasons
		);


	const playersById =
		await resolvePlayersByIds(
			relevantIds
		);


	return {
	available: true,

	historyLimited:
		Boolean(
			ledger.historyLimited
		),

	currentRoster:
		buildCurrentRoster(
			cleanPlayerId,
			ledger.currentSeasonData
		),

	history:
		buildHistoryEvents(
			cleanPlayerId,
			ledger.seasons,
			playersById
		),

	historySeasons: [
		...new Set(
			ledger.seasons
				.map(
					(row) =>
						Number(
							row.season
						)
				)
				.filter(Boolean)
		)
	].sort(
		(a, b) =>
			b - a
	)
};
}