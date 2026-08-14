import {
	getLegacyManagerProfiles
} from '$lib/server/league/identity.js';

import {
	getDraftCapitalLedger
} from '$lib/server/league/draftCapitalRepository.js';

function parseJson(
	value,
	fallback
) {
	if (
		value === null ||
		value === undefined ||
		value === ''
	) {
		return fallback;
	}

	if (
		typeof value === 'object'
	) {
		return value;
	}

	try {
		return JSON.parse(
			value
		);
	} catch {
		return fallback;
	}
}


function pairKey(
	leagueId,
	season
) {
	return `${String(leagueId)}:${Number(season)}`;
}


function rosterKey(
	leagueId,
	season,
	rosterId
) {
	return `${pairKey(
		leagueId,
		season
	)}:${Number(rosterId)}`;
}


function transactionCompleted(
	status
) {
	const value =
		String(
			status ||
			''
		)
			.trim()
			.toLowerCase();

	/*
	 * Imported historical transactions may
	 * not have a status at all.
	 */
	if (!value) {
		return true;
	}

	return (
		value === 'complete' ||
		value === 'completed'
	);
}


function buildMarketStyle(
	profile
) {
	if (
		!profile.tradeCount
	) {
		return 'Quiet market';
	}

	if (
		profile.tradeCount >= 12 &&
		profile.uniquePartners >= 6
	) {
		return 'Market maker';
	}

	if (
		profile.tradeCount >= 8 &&
		profile.pickDeals >= 4
	) {
		return 'Future-chasing';
	}

	if (
		profile.tradeCount >= 6 &&
		profile.playerInCount >
			profile.playerOutCount
	) {
		return 'Talent accumulator';
	}

	if (
		profile.tradeCount >= 6 &&
		profile.playerOutCount >
			profile.playerInCount
	) {
		return 'Asset churner';
	}

	return 'Selective dealer';
}


function emptyHistory() {
	return {
		hasData:
			false,

		seasons:
			[],

		recentMoves:
			[],

		moveProfile: {
			totalMoves:
				0,

			trades:
				0,

			waivers:
				0,

			freeAgents:
				0,

			adds:
				0,

			drops:
				0,

			seasonsTracked:
				0,

			firstSeason:
				null,

			lastSeason:
				null,

			lastMoveAt:
				null
		},

		tradeProfile: {
	tradeCount:
		0,

	uniquePartners:
		0,

	favoritePartner:
		null,

	favoritePartnerCount:
		0,

	playerInCount:
		0,

	playerOutCount:
		0,

	pickDeals:
		0,

	lastTradeAt:
		null,

	marketStyle:
		'Quiet market',

	draftCapitalSent:
		0,

	draftCapitalAcquired:
		0,

	draftCapitalNet:
		0,

	draftCapitalTransfers:
		0
}
	};
}


export async function getFranchiseTransactionHistory({
	db,
	profile
} = {}) {
	if (
		!db ||
		!profile?.managerID
	) {
		return emptyHistory();
	}

	/*
	 * ============================================================
	 * FIND EVERY HISTORICAL ROSTER OWNED BY THIS MANAGER
	 * ============================================================
	 */

	const managerRostersResult =
		await db
			.prepare(`
				SELECT
					league_id,
					season,
					roster_id,
					owner_id

				FROM sleeper_rosters_seasonal

				WHERE owner_id = ?

				ORDER BY season DESC
			`)
			.bind(
				String(
					profile.managerID
				)
			)
			.all();

	const managerRosters =
		managerRostersResult.results ||
		[];

	if (!managerRosters.length) {
		return emptyHistory();
	}

	const seasonRosterMap =
		new Map();

	const pairMap =
		new Map();

	for (
		const roster of managerRosters
	) {
		const leagueId =
			String(
				roster.league_id
			);

		const season =
			Number(
				roster.season
			);

		const rosterId =
			Number(
				roster.roster_id
			);

		seasonRosterMap.set(
			pairKey(
				leagueId,
				season
			),
			rosterId
		);

		pairMap.set(
			pairKey(
				leagueId,
				season
			),
			{
				leagueId,
				season
			}
		);
	}

	const pairs =
		[
			...pairMap.values()
		];

	const pairWhere =
		pairs
			.map(
				() =>
					'(league_id = ? AND season = ?)'
			)
			.join(
				' OR '
			);

	const pairBindings =
		pairs.flatMap(
			(pair) => [
				pair.leagueId,
				pair.season
			]
		);

	/*
	 * ============================================================
	 * LOAD ALL TRANSACTIONS + ROSTER IDENTITIES
	 * ============================================================
	 */

	const [
	transactionResult,
	rosterResult,
	capitalLedger
] =
	await Promise.all([
			db
				.prepare(`
					SELECT
						league_id,
						season,
						round,
						transaction_id,
						type,
						status,
						roster_ids_json,
						adds_json,
						drops_json,
						draft_picks_json,
						waiver_budget_json,
						created_at

					FROM sleeper_transactions_seasonal

					WHERE
						${pairWhere}

					ORDER BY
						created_at DESC
				`)
				.bind(
					...pairBindings
				)
				.all(),

			db
				.prepare(`
					SELECT
						league_id,
						season,
						roster_id,
						owner_id,
						metadata_json

					FROM sleeper_rosters_seasonal

					WHERE
						${pairWhere}
				`)
				.bind(
					...pairBindings
				)
				.all()
		]);

	const transactions =
		transactionResult.results ||
		[];

	const historicalRosters =
		rosterResult.results ||
		[];

    getDraftCapitalLedger(
	db,
	{
		managerId:
			String(
				profile.managerID
			),

		limit:
			1000
	}
)

	/*
	 * ============================================================
	 * IDENTITY MAP
	 * ============================================================
	 */

	const rosterOwnerMap =
		new Map();

	for (
		const roster of historicalRosters
	) {
		rosterOwnerMap.set(
			rosterKey(
				roster.league_id,
				roster.season,
				roster.roster_id
			),
			String(
				roster.owner_id ||
				''
			)
		);
	}

	const managerProfiles =
		getLegacyManagerProfiles();

	const profileByOwner =
		new Map(
			managerProfiles.map(
				(manager) => [
					String(
						manager.managerID
					),
					manager
				]
			)
		);

	function teamNameForRoster(
		leagueId,
		season,
		rosterId
	) {
		const ownerId =
			rosterOwnerMap.get(
				rosterKey(
					leagueId,
					season,
					rosterId
				)
			);

		const manager =
			ownerId
				? profileByOwner.get(
						String(
							ownerId
						)
					)
				: null;

		return (
			manager?.teamName ||
			manager?.name ||
			`Roster ${rosterId}`
		);
	}

	/*
	 * ============================================================
	 * BUILD CAREER TRANSACTION LEDGER
	 * ============================================================
	 */

	const moves =
		[];

	const partnerCounts =
		new Map();

	const seasonsWithMoves =
		new Set();

	let tradePlayerInCount =
		0;

	let tradePlayerOutCount =
		0;

	let pickDeals =
		0;

	for (
		const transaction of transactions
	) {
		if (
			!transactionCompleted(
				transaction.status
			)
		) {
			continue;
		}

		const leagueId =
			String(
				transaction.league_id
			);

		const season =
			Number(
				transaction.season
			);

		const myRosterId =
			seasonRosterMap.get(
				pairKey(
					leagueId,
					season
				)
			);

		if (!myRosterId) {
			continue;
		}

		const rosterIds =
			parseJson(
				transaction
					.roster_ids_json,
				[]
			)
				.map(
					Number
				)
				.filter(
					Number.isFinite
				);

		const adds =
			parseJson(
				transaction.adds_json,
				{}
			);

		const drops =
			parseJson(
				transaction.drops_json,
				{}
			);

		const draftPicks =
			parseJson(
				transaction
					.draft_picks_json,
				[]
			);

		const addCount =
			Object.values(
				adds
			).filter(
				(rosterId) =>
					Number(
						rosterId
					) ===
					Number(
						myRosterId
					)
			).length;

		const dropCount =
			Object.values(
				drops
			).filter(
				(rosterId) =>
					Number(
						rosterId
					) ===
					Number(
						myRosterId
					)
			).length;

		const involved =
			rosterIds.includes(
				Number(
					myRosterId
				)
			) ||
			addCount > 0 ||
			dropCount > 0;

		if (!involved) {
			continue;
		}

		const type =
			String(
				transaction.type ||
				'move'
			)
				.trim()
				.toLowerCase();

		const counterparties =
			[
				...new Set(
					rosterIds
						.filter(
							(rosterId) =>
								Number(
									rosterId
								) !==
								Number(
									myRosterId
								)
						)
						.map(
							(rosterId) =>
								teamNameForRoster(
									leagueId,
									season,
									rosterId
								)
						)
				)
			];

		if (
			type === 'trade'
		) {
			for (
				const name of counterparties
			) {
				partnerCounts.set(
					name,
					(
						partnerCounts.get(
							name
						) ||
						0
					) +
						1
				);
			}

			tradePlayerInCount +=
				addCount;

			tradePlayerOutCount +=
				dropCount;

			if (
				Array.isArray(
					draftPicks
				) &&
				draftPicks.length
			) {
				pickDeals +=
					1;
			}
		}

		seasonsWithMoves.add(
			season
		);

		moves.push({
			id:
				String(
					transaction
						.transaction_id
				),

			season,

			week:
				Number(
					transaction.round ||
					0
				),

			type:
				type.replaceAll(
					'_',
					' '
				),

			rawType:
				type,

			createdAt:
				Number(
					transaction
						.created_at ||
					0
				) ||
				null,

			counterparties,

			addCount,

			dropCount
		});
	}

	moves.sort(
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

    /*
 * ============================================================
 * CAREER DRAFT CAPITAL
 *
 * Draft capital lives in its own authoritative ledger,
 * separate from Sleeper's transaction history.
 *
 * Negative ledger side = sent.
 * Positive ledger side = acquired.
 * ============================================================
 */
/*
 * ============================================================
 * CAREER DRAFT CAPITAL
 *
 * Use the authoritative draft-capital ledger directly.
 *
 * Negative trade row = capital sent.
 * Positive trade row = capital acquired.
 * ============================================================
 */

const capitalTradeRows =
	(
		capitalLedger ||
		[]
	).filter(
		(row) =>
			row.entryType ===
			'trade'
	);


const draftCapitalSent =
	capitalTradeRows.reduce(
		(sum, row) => {
			const cents =
				Number(
					row.amountCents ||
					0
				);

			return cents < 0
				? sum +
						Math.abs(
							cents
						) /
							100
				: sum;
		},
		0
	);


const draftCapitalAcquired =
	capitalTradeRows.reduce(
		(sum, row) => {
			const cents =
				Number(
					row.amountCents ||
					0
				);

			return cents > 0
				? sum +
						cents /
							100
				: sum;
		},
		0
	);


const draftCapitalNet =
	draftCapitalAcquired -
	draftCapitalSent;


const draftCapitalTransfers =
	capitalTradeRows.length;

	const tradeCount =
		moves.filter(
			(move) =>
				move.rawType ===
				'trade'
		).length;

	const waiverCount =
		moves.filter(
			(move) =>
				move.rawType ===
				'waiver'
		).length;

	const freeAgentCount =
		moves.filter(
			(move) =>
				move.rawType ===
				'free_agent'
		).length;

	const totalAdds =
		moves.reduce(
			(sum, move) =>
				sum +
				Number(
					move.addCount ||
					0
				),
			0
		);

	const totalDrops =
		moves.reduce(
			(sum, move) =>
				sum +
				Number(
					move.dropCount ||
					0
				),
			0
		);

	const sortedPartners =
		[
			...partnerCounts.entries()
		].sort(
			(a, b) =>
				b[1] -
					a[1] ||
				a[0].localeCompare(
					b[0]
				)
		);

	const seasons =
		[
			...seasonsWithMoves
		].sort(
			(a, b) =>
				b -
				a
		);

	const tradeProfile = {
	tradeCount,

	uniquePartners:
		sortedPartners.length,

	favoritePartner:
		sortedPartners[0]
			?.[0] ||
		null,

	favoritePartnerCount:
		sortedPartners[0]
			?.[1] ||
		0,

	playerInCount:
		tradePlayerInCount,

	playerOutCount:
		tradePlayerOutCount,

	pickDeals,

	lastTradeAt:
		moves.find(
			(move) =>
				move.rawType ===
				'trade'
		)?.createdAt ||
		null,

	marketStyle:
		'',

	draftCapitalSent,

	draftCapitalAcquired,

	draftCapitalNet,

	draftCapitalTransfers
};

	tradeProfile.marketStyle =
		buildMarketStyle(
			tradeProfile
		);

	const moveProfile = {
		totalMoves:
			moves.length,

		trades:
			tradeCount,

		waivers:
			waiverCount,

		freeAgents:
			freeAgentCount,

		adds:
			totalAdds,

		drops:
			totalDrops,

		seasonsTracked:
			seasons.length,

		firstSeason:
			seasons.length
				? Math.min(
						...seasons
					)
				: null,

		lastSeason:
			seasons.length
				? Math.max(
						...seasons
					)
				: null,

		lastMoveAt:
			moves[0]
				?.createdAt ||
			null
	};

	return {
		hasData:
			moves.length >
			0,

		seasons,

		moveProfile,

		tradeProfile,

		/*
		 * Keep this available for a future
		 * all-time transaction tape.
		 */
		recentMoves:
			moves.slice(
				0,
				25
			)
	};
}