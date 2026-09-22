import {
	managers
} from '$lib/legacy/leagueInfo.js';

import {
	getDraftCapitalRunningBalances
} from '$lib/server/league/draftCapitalRunningBalances.js';


/*
 * ============================================================
 * IRVING WEEKLY — LEAGUE MEMORY / BEAT SHEET
 *
 * Most of this file is AUTOMATIC. It mines the Irving D1 archive
 * for prior matchups, series history, recent form, archived
 * standings finishes, and recorded draft-capital trade behavior.
 *
 * TEAM_EDITORIAL_NOTES is intentionally the exception. Use it only
 * for factual cause/effect or league lore that the database cannot
 * prove on its own.
 * ============================================================
 */

const TEAM_EDITORIAL_NOTES = {
	'Dunedin Homers': [
		'The 2025 championship was an all-in title push. Dunedin spent aggressively to win the 2025 ICL championship, and the roster/resource squeeze that followed in 2026 was the bill for that successful run, not an unexplained collapse.'
	]
};


function cleanYears(
	value
) {
	return String(
		value ||
		''
	)
		.split(',')
		.map(
			(value) =>
				Number(
					String(
						value
					).trim()
				)
		)
		.filter(
			Number.isInteger
		)
		.sort(
			(a, b) =>
				a - b
		);
}


function championshipsFor(
	manager
) {
	const years =
		cleanYears(
			manager
				?.championship
				?.years
		);


	const defaultLeague =
		manager
			?.championship
			?.league ||
		null;


	const leagueByYear =
		manager
			?.championship
			?.leagueByYear ||
		{};


	return years.map(
		(year) => ({
			year,

			league:
				leagueByYear?.[
					year
				] ||
				defaultLeague ||
				null
		})
	);
}


function rivalryFor(
	manager
) {
	const rival =
		manager?.rival;


	if (!rival) {
		return null;
	}


	const index =
		Number(
			rival.link
		);


	const byIndex =
		Number.isInteger(
			index
		)
			? managers[
					index
				] ||
				null
			: null;


	const byName =
		!byIndex &&
		rival.name
			? managers.find(
					(candidate) =>
						String(
							candidate
								?.name ||
								''
						)
							.trim()
							.toLowerCase() ===
						String(
							rival.name
						)
							.trim()
							.toLowerCase()
				) ||
				null
			: null;


	const resolved =
		byIndex ||
		byName;


	return {
		managerName:
			resolved?.name ||
			rival.name ||
			null,

		teamName:
			resolved?.teamName ||
			null
	};
}


function roundNumber(
	value,
	digits = 2
) {
	const number =
		Number(
			value
		);


	if (
		!Number.isFinite(
			number
		)
	) {
		return null;
	}


	const factor =
		10 ** digits;


	return Math.round(
		(
			number +
			Number.EPSILON
		) *
			factor
	) /
	factor;
}


function median(
	values
) {
	const sorted =
		(values || [])
			.map(
				Number
			)
			.filter(
				Number.isFinite
			)
			.sort(
				(a, b) =>
					a - b
			);


	if (!sorted.length) {
		return null;
	}


	const middle =
		Math.floor(
			sorted.length /
				2
		);


	if (
		sorted.length %
			2
	) {
		return sorted[
			middle
		];
	}


	return (
		sorted[
			middle - 1
		] +
		sorted[
			middle
		]
	) /
	2;
}


function capitalRanks(
	rows
) {
	const sorted =
		[
			...(rows || [])
		]
			.filter(
				(row) =>
					Number.isFinite(
						Number(
							row
								?.balance
						)
					)
			)
			.sort(
				(a, b) =>
					Number(
						b.balance
					) -
					Number(
						a.balance
					)
			);


	const rankByManager =
		new Map();


	let lastBalance =
		null;

	let lastRank =
		0;


	sorted.forEach(
		(row, index) => {
			const balance =
				Number(
					row.balance
				);


			if (
				lastBalance ===
					null ||
				balance !==
					lastBalance
			) {
				lastRank =
					index + 1;

				lastBalance =
					balance;
			}


			rankByManager.set(
				String(
					row.managerId
				),
				lastRank
			);
		}
	);


	return {
		sorted,
		rankByManager
	};
}


function managerMaps() {
	const byId =
		new Map();

	const byTeam =
		new Map();

	const byName =
		new Map();


	for (
		const manager of
		managers
	) {
		byId.set(
			String(
				manager.managerID
			),
			manager
		);

		byTeam.set(
			String(
				manager.teamName ||
				''
			)
				.trim()
				.toLowerCase(),
			manager
		);

		byName.set(
			String(
				manager.name ||
				''
			)
				.trim()
				.toLowerCase(),
			manager
		);
	}


	return {
		byId,
		byTeam,
		byName
	};
}


function resolveManagerFromSide(
	side,
	maps
) {
	if (!side) {
		return null;
	}


	return (
		maps.byTeam.get(
			String(
				side.teamName ||
				''
			)
				.trim()
				.toLowerCase()
		) ||
		maps.byName.get(
			String(
				side.managerName ||
				''
			)
				.trim()
				.toLowerCase()
		) ||
		null
	);
}


async function loadArchivedMatchupRows({
	db,
	season,
	week
}) {
	if (!db) {
		return [];
	}


	const result =
		await db
			.prepare(`
				SELECT
					id,
					CAST(season AS INTEGER)
						AS season,
					week,
					matchup_id,
					manager_id,
					COALESCE(
						custom_points,
						points,
						0
					) AS score

				FROM matchups

				WHERE
					manager_id IS NOT NULL
					AND matchup_id IS NOT NULL
					AND (
						CAST(season AS INTEGER) < ?
						OR (
							CAST(season AS INTEGER) = ?
							AND week < ?
						)
					)

				ORDER BY
					CAST(season AS INTEGER) ASC,
					week ASC,
					matchup_id ASC,
					id DESC
			`)
			.bind(
				Number(
					season
				),
				Number(
					season
				),
				Number(
					week
				)
			)
			.all();


	return result.results ||
		[];
}


async function loadStandingsArchive({
	db,
	season
}) {
	if (!db) {
		return [];
	}


	const result =
		await db
			.prepare(`
				SELECT
					id,
					CAST(season AS INTEGER)
						AS season,
					manager_id,
					wins,
					losses,
					ties,
					points_for,
					points_against,
					rank,
					created_at

				FROM standings_snapshots

				WHERE
					CAST(season AS INTEGER) < ?

				ORDER BY
					CAST(season AS INTEGER) DESC,
					created_at DESC,
					id DESC
			`)
			.bind(
				Number(
					season
				)
			)
			.all();


	return result.results ||
		[];
}


async function loadCapitalTradeTotals(
	db
) {
	if (!db) {
		return [];
	}


	const result =
		await db
			.prepare(`
				SELECT
					manager_id,

					COALESCE(
						SUM(
							CASE
								WHEN amount_cents < 0
								THEN ABS(amount_cents)
								ELSE 0
							END
						),
						0
					) AS sent_cents,

					COALESCE(
						SUM(
							CASE
								WHEN amount_cents > 0
								THEN amount_cents
								ELSE 0
							END
						),
						0
					) AS acquired_cents,

					COUNT(*) AS movement_count,
					MIN(transaction_date) AS first_date,
					MAX(transaction_date) AS last_date

				FROM draft_capital_entries

				WHERE
					entry_type = 'trade'
					AND voided_at IS NULL

				GROUP BY
					manager_id
			`)
			.all();


	return result.results ||
		[];
}


function buildArchivedGames(
	rows
) {
	const groups =
		new Map();


	for (
		const row of
		rows ||
		[]
	) {
		const key =
			`${Number(row.season)}:${Number(row.week)}:${Number(row.matchup_id)}`;


		if (
			!groups.has(
				key
			)
		) {
			groups.set(
				key,
				new Map()
			);
		}


		const managerId =
			String(
				row.manager_id ||
				''
			);


		if (
			managerId &&
			!groups
				.get(key)
				.has(managerId)
		) {
			groups
				.get(key)
				.set(
					managerId,
					{
						managerId,

						score:
							roundNumber(
								row.score
							) ||
							0
					}
				);
		}
	}


	const games =
		[];


	for (
		const [
			key,
			managerMap
		] of groups
	) {
		const sides =
			[
				...managerMap.values()
			];


		if (
			sides.length !==
			2
		) {
			continue;
		}


		const [
			season,
			week,
			matchupId
		] =
			key
				.split(':')
				.map(
					Number
				);


		games.push({
			season,
			week,
			matchupId,
			sides
		});
	}


	return games.sort(
		(a, b) =>
			a.season -
				b.season ||
			a.week -
				b.week
	);
}


function resultForSide(
	game,
	managerId
) {
	const mine =
		game.sides.find(
			(side) =>
				side.managerId ===
				String(
					managerId
				)
		) ||
		null;


	const other =
		game.sides.find(
			(side) =>
				side.managerId !==
				String(
					managerId
				)
		) ||
		null;


	if (
		!mine ||
		!other
	) {
		return null;
	}


	const result =
		mine.score ===
		other.score
			? 'T'
			: mine.score >
				other.score
				? 'W'
				: 'L';


	return {
		season:
			game.season,

		week:
			game.week,

		result,

		score:
			mine.score,

		opponentScore:
			other.score,

		opponentManagerId:
			other.managerId,

		margin:
			roundNumber(
				mine.score -
				other.score
			)
	};
}


function currentStreak(
	results
) {
	if (
		!results?.length
	) {
		return null;
	}


	const latest =
		results[
			results.length - 1
		];


	let count =
		0;


	for (
		let index =
			results.length - 1;
		index >= 0;
		index -= 1
	) {
		if (
			results[index].result !==
			latest.result
		) {
			break;
		}

		count += 1;
	}


	return {
		result:
			latest.result,

		count,

		label:
			`${latest.result}${count}`
	};
}


function summarizeManagerHistory({
	manager,
	games,
	managerById,
	season
}) {
	const managerId =
		String(
			manager.managerID
		);


	const results =
		(games || [])
			.map(
				(game) =>
					resultForSide(
						game,
						managerId
					)
			)
			.filter(
				Boolean
			);


	const wins =
		results.filter(
			(result) =>
				result.result ===
				'W'
		).length;

	const losses =
		results.filter(
			(result) =>
				result.result ===
				'L'
		).length;

	const ties =
		results.filter(
			(result) =>
				result.result ===
				'T'
		).length;


	const pointsFor =
		results.reduce(
			(sum, result) =>
				sum +
				Number(
					result.score ||
					0
				),
			0
		);


	const pointsAgainst =
		results.reduce(
			(sum, result) =>
				sum +
				Number(
					result.opponentScore ||
					0
				),
			0
		);


	const scoredGames =
		results.filter(
			(result) =>
				Number.isFinite(
					Number(
						result.score
					)
				)
		);


	const high =
		scoredGames.length
			? [
					...scoredGames
				]
					.sort(
						(a, b) =>
							b.score -
							a.score
					)[0]
			: null;


	const low =
		scoredGames.length
			? [
					...scoredGames
				]
					.sort(
						(a, b) =>
							a.score -
							b.score
					)[0]
			: null;


	function resultView(
		result
	) {
		if (!result) {
			return null;
		}


		const opponent =
			managerById.get(
				String(
					result.opponentManagerId
				)
			) ||
			null;


		return {
			season:
				result.season,

			week:
				result.week,

			result:
				result.result,

			score:
				result.score,

			opponentScore:
				result.opponentScore,

			opponentTeam:
				opponent?.teamName ||
				null,

			margin:
				result.margin
		};
	}


	const currentSeasonResults =
		results.filter(
			(result) =>
				Number(
					result.season
				) ===
				Number(
					season
				)
		);


	return {
		headToHeadArchive: {
			games:
				results.length,

			wins,
			losses,
			ties,

			pointsFor:
				roundNumber(
					pointsFor
				),

			pointsAgainst:
				roundNumber(
					pointsAgainst
				),

			averageScore:
				results.length
					? roundNumber(
							pointsFor /
								results.length
						)
					: null,

			highScore:
				resultView(
					high
				),

			lowScore:
				resultView(
					low
				)
		},

		currentSeasonForm: {
			gamesBeforeThisWeek:
				currentSeasonResults.length,

			streak:
				currentStreak(
					currentSeasonResults
				),

			recentFive:
				currentSeasonResults
					.slice(-5)
					.map(
						resultView
					)
		}
	};
}


function latestStandingsByManager(
	rows
) {
	const latest =
		new Map();


	for (
		const row of
		rows ||
		[]
	) {
		const managerId =
			String(
				row.manager_id ||
				''
			);


		if (
			!managerId ||
			latest.has(
				managerId
			)
		) {
			continue;
		}


		latest.set(
			managerId,
			{
				season:
					Number(
						row.season
					),

				rank:
					row.rank ==
					null
						? null
						: Number(
								row.rank
							),

				wins:
					Number(
						row.wins ||
						0
					),

				losses:
					Number(
						row.losses ||
						0
					),

				ties:
					Number(
						row.ties ||
						0
					),

				pointsFor:
					roundNumber(
						row.points_for
					),

				pointsAgainst:
					roundNumber(
						row.points_against
					),

				source:
					'latest archived standings snapshot before the current season'
			}
		);
	}


	return latest;
}


function capitalTradeMap(
	rows
) {
	return new Map(
		(rows || [])
			.map(
				(row) => {
					const sent =
						Number(
							row.sent_cents ||
							0
						) /
						100;

					const acquired =
						Number(
							row.acquired_cents ||
							0
						) /
						100;


					return [
						String(
							row.manager_id
						),
						{
							sent:
								roundNumber(
									sent
								),

							acquired:
								roundNumber(
									acquired
								),

							net:
								roundNumber(
									acquired -
										sent
								),

							movementCount:
								Number(
									row.movement_count ||
									0
								),

							firstDate:
								row.first_date ||
								null,

							lastDate:
								row.last_date ||
								null,

							source:
								'recorded Irving draft-capital trade ledger'
						}
					];
				}
			)
	);
}


function seriesForMatchup({
	matchup,
	games,
	maps,
	teamMemoryById
}) {
	const leftManager =
		resolveManagerFromSide(
			matchup?.left,
			maps
		);

	const rightManager =
		resolveManagerFromSide(
			matchup?.right,
			maps
		);


	if (
		!leftManager ||
		!rightManager
	) {
		return null;
	}


	const leftId =
		String(
			leftManager.managerID
		);

	const rightId =
		String(
			rightManager.managerID
		);


	const meetings =
		(games || [])
			.filter(
				(game) => {
					const ids =
						new Set(
							game.sides.map(
								(side) =>
									side.managerId
							)
						);


					return (
						ids.has(
							leftId
						) &&
						ids.has(
							rightId
						)
					);
				}
			)
			.map(
				(game) => ({
					game,
					left:
						resultForSide(
							game,
							leftId
						)
				})
			)
			.filter(
				(row) =>
					row.left
			);


	const leftWins =
		meetings.filter(
			(row) =>
				row.left.result ===
				'W'
		).length;

	const rightWins =
		meetings.filter(
			(row) =>
				row.left.result ===
				'L'
		).length;

	const ties =
		meetings.filter(
			(row) =>
				row.left.result ===
				'T'
		).length;


	const last =
		meetings[
			meetings.length - 1
		] ||
		null;


	let streak =
		null;


	if (meetings.length) {
		const latestResult =
			meetings[
				meetings.length - 1
			]
				.left
				.result;


		let count =
			0;


		for (
			let index =
				meetings.length - 1;
			index >= 0;
			index -= 1
		) {
			if (
				meetings[index]
					.left
					.result !==
				latestResult
			) {
				break;
			}

			count += 1;
		}


		streak = {
			teamName:
				latestResult ===
				'W'
					? leftManager.teamName
					: latestResult ===
						'L'
						? rightManager.teamName
						: null,

			result:
				latestResult,

			count
		};
	}


	const leftMemory =
		teamMemoryById.get(
			leftId
		) ||
		null;

	const rightMemory =
		teamMemoryById.get(
			rightId
		) ||
		null;


	const declaredBy =
		[];


	if (
		leftMemory
			?.rival
			?.teamName ===
		rightManager.teamName
	) {
		declaredBy.push(
			leftManager.teamName
		);
	}


	if (
		rightMemory
			?.rival
			?.teamName ===
		leftManager.teamName
	) {
		declaredBy.push(
			rightManager.teamName
		);
	}


	return {
		matchupId:
			matchup.matchupId,

		leftTeam:
			leftManager.teamName,

		rightTeam:
			rightManager.teamName,

		meetings:
			meetings.length,

		leftWins,
		rightWins,
		ties,

		seriesLeader:
			leftWins ===
			rightWins
				? null
				: leftWins >
					rightWins
					? leftManager.teamName
					: rightManager.teamName,

		currentSeriesStreak:
			streak,

		lastMeeting:
			last
				? {
						season:
							last.game.season,

						week:
							last.game.week,

						leftScore:
							last.left.score,

						rightScore:
							last.left.opponentScore,

						winner:
							last.left.result ===
							'W'
								? leftManager.teamName
								: last.left.result ===
									'L'
									? rightManager.teamName
									: null
					}
				: null,

		recentMeetings:
			meetings
				.slice(-5)
				.map(
					(row) => ({
						season:
							row.game.season,

						week:
							row.game.week,

						leftScore:
							row.left.score,

						rightScore:
							row.left.opponentScore,

						winner:
							row.left.result ===
							'W'
								? leftManager.teamName
								: row.left.result ===
									'L'
									? rightManager.teamName
									: null
					})
				),

		declaredRivalry:
			declaredBy.length >
			0,

		declaredBy,

		combinedChampionships:
			Number(
				leftMemory
					?.championshipCount ||
				0
			) +
			Number(
				rightMemory
					?.championshipCount ||
				0
			)
	};
}


function archiveCoverage(
	games
) {
	if (!games?.length) {
		return null;
	}


	const seasons =
		games.map(
			(game) =>
				Number(
					game.season
				)
		);


	return {
		firstSeason:
			Math.min(
				...seasons
			),

		lastSeason:
			Math.max(
				...seasons
			),

		completedMatchups:
			games.length,

		source:
			'Irving D1 matchup archive'
	};
}


function storyHooks({
	season,
	teamMemory,
	matchupSeries,
	capitalSnapshot
}) {
	const hooks =
		[];


	/*
	 * Priority hooks are intentionally SHORT.
	 *
	 * They should identify the week's useful angles,
	 * not paste one franchise's entire editorial notebook
	 * at the top of the writer packet.
	 */
	for (
		const team of
		teamMemory
	) {
		if (
			team.defendingChampion
		) {
			const pieces = [
				`${team.teamName} are the defending ${Number(season) - 1} champion.`
			];


			if (
				team.draftCapital
			) {
				pieces.push(
					`Their ${team.draftCapital.year} auction-capital balance is $${team.draftCapital.balance}, ranked ${team.draftCapital.rank} of ${capitalSnapshot?.teamCount || teamMemory.length}.`
				);


				if (
					Number(
						team.draftCapital.gapToLeader
					) >
					0 &&
					capitalSnapshot
						?.leader
						?.teamName
				) {
					pieces.push(
						`They are $${team.draftCapital.gapToLeader} behind capital leader ${capitalSnapshot.leader.teamName}.`
					);
				}
			}


			hooks.push(
				pieces.join(
					' '
				)
			);
		}
	}


	for (
		const series of
		matchupSeries ||
		[]
	) {
		if (
			series.declaredRivalry
		) {
			const record =
				series.meetings
					? ` The available archive has the series ${series.leftTeam} ${series.leftWins}, ${series.rightTeam} ${series.rightWins}${series.ties ? `, with ${series.ties} tie${series.ties === 1 ? '' : 's'}` : ''}.`
					: '';


			hooks.push(
				`${series.leftTeam} vs. ${series.rightTeam} is a declared Irving rivalry matchup.${record}`
			);
		}


		if (
			series
				.currentSeriesStreak
				?.teamName &&
			Number(
				series
					.currentSeriesStreak
					.count
			) >=
			3
		) {
			hooks.push(
				`${series.currentSeriesStreak.teamName} entered this matchup on a ${series.currentSeriesStreak.count}-game head-to-head winning streak against ${series.currentSeriesStreak.teamName === series.leftTeam ? series.rightTeam : series.leftTeam} in the available archive.`
			);
		}
	}


	return [
		...new Set(
			hooks
		)
	];
}


function compactTeamLore(
	team
) {
	if (!team) {
		return null;
	}


	return {
		managerId:
			team.managerId,

		managerName:
			team.managerName,

		teamName:
			team.teamName,

		persona:
			team.persona ||
			null,

		philosophy:
			team.philosophy ||
			null,

		championships:
			team.championships ||
			[],

		defendingChampion:
			Boolean(
				team.defendingChampion
			),

		rival:
			team.rival ||
			null,

		currentSeasonForm:
			team.currentSeasonForm ||
			null,

		draftCapital:
			team.draftCapital ||
			null,

		editorialNotes:
			team.editorialNotes ||
			[]
	};
}


function buildMatchupLore({
	matchups,
	matchupSeries,
	teamMemory
}) {
	const teamByName =
		new Map(
			(teamMemory || [])
				.map(
					(team) => [
						String(
							team.teamName ||
							''
						),
						team
					]
				)
		);


	const seriesByMatchup =
		new Map(
			(matchupSeries || [])
				.map(
					(series) => [
						Number(
							series.matchupId
						),
						series
					]
				)
		);


	return (
		matchups ||
		[]
	)
		.map(
			(matchup) => {
				const leftTeam =
					teamByName.get(
						String(
							matchup
								?.left
								?.teamName ||
								''
						)
					) ||
					null;

				const rightTeam =
					teamByName.get(
						String(
							matchup
								?.right
								?.teamName ||
								''
						)
					) ||
					null;


				if (
					!leftTeam ||
					!rightTeam
				) {
					return null;
				}


				return {
					matchupId:
						matchup.matchupId,

					left:
						compactTeamLore(
							leftTeam
						),

					right:
						compactTeamLore(
							rightTeam
						),

					series:
						seriesByMatchup.get(
							Number(
								matchup.matchupId
							)
						) ||
						null
				};
			}
		)
		.filter(
			Boolean
		);
}


export async function buildWeeklyRecapLeagueMemory({
	db = null,
	season,
	week,
	matchups = []
} = {}) {
	const cleanSeason =
		Number(
			season
		);

	const cleanWeek =
		Number(
			week
		);


	const capitalYear =
		Number.isInteger(
			cleanSeason
		)
			? cleanSeason + 1
			: null;


	const warnings =
		[];


	let capitalRows =
		[];

	let archivedRows =
		[];

	let standingsRows =
		[];

	let capitalTradeRows =
		[];


	if (db) {
		const results =
			await Promise.allSettled([
				Number.isInteger(
					capitalYear
				)
					? getDraftCapitalRunningBalances(
							db,
							{
								year:
									capitalYear
							}
						)
					: Promise.resolve(
							[]
						),

				loadArchivedMatchupRows({
					db,
					season:
						cleanSeason,
					week:
						cleanWeek
				}),

				loadStandingsArchive({
					db,
					season:
						cleanSeason
				}),

				loadCapitalTradeTotals(
					db
				)
			]);


		[
			capitalRows,
			archivedRows,
			standingsRows,
			capitalTradeRows
		] =
			results.map(
				(result, index) => {
					if (
						result.status ===
						'fulfilled'
					) {
						return result.value ||
							[];
					}


					const labels = [
						'draft capital',
						'matchup archive',
						'standings archive',
						'capital trade history'
					];


					warnings.push(
						`League-memory ${labels[index]} lookup failed: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`
					);


					return [];
				}
			);
	} else {
		warnings.push(
			'D1 binding unavailable; automatic matchup history, archived finishes, and capital history were skipped.'
		);
	}


	const maps =
		managerMaps();

	const archivedGames =
		buildArchivedGames(
			archivedRows
		);

	const previousStandings =
		latestStandingsByManager(
			standingsRows
		);

	const capitalTrades =
		capitalTradeMap(
			capitalTradeRows
		);


	const capitalByManager =
		new Map(
			capitalRows.map(
				(row) => [
					String(
						row.managerId
					),
					row
				]
			)
		);


	const {
		sorted:
			sortedCapital,
		rankByManager
	} =
		capitalRanks(
			capitalRows
		);


	const leaderRow =
		sortedCapital[0] ||
		null;

	const trailerRow =
		sortedCapital[
			sortedCapital.length -
				1
		] ||
		null;


	const leagueMedian =
		median(
			capitalRows.map(
				(row) =>
					row.balance
			)
		);


	function capitalTeam(
		row
	) {
		if (!row) {
			return null;
		}


		const manager =
			maps.byId.get(
				String(
					row.managerId
				)
			) ||
			null;


		return {
			managerId:
				String(
					row.managerId
				),

			managerName:
				manager?.name ||
				null,

			teamName:
				manager?.teamName ||
				null,

			balance:
				roundNumber(
					row.balance
				)
		};
	}


	const capitalSnapshot =
		sortedCapital.length
			? {
					year:
						capitalYear,

					teamCount:
						sortedCapital.length,

					leader:
						capitalTeam(
							leaderRow
						),

					trailer:
						capitalTeam(
							trailerRow
						),

					median:
						roundNumber(
							leagueMedian
						),

					spread:
						leaderRow &&
						trailerRow
							? roundNumber(
									Number(
										leaderRow.balance
									) -
									Number(
										trailerRow.balance
									)
								)
							: null
				}
			: null;


	const teamMemory =
		managers.map(
			(manager) => {
				const managerId =
					String(
						manager.managerID
					);


				const titles =
					championshipsFor(
						manager
					);


				const capital =
					capitalByManager.get(
						managerId
					) ||
					null;


				const balance =
					capital
						? roundNumber(
								capital.balance
							)
						: null;


				const leaderBalance =
					leaderRow
						? roundNumber(
								leaderRow.balance
							)
						: null;


				const history =
					summarizeManagerHistory({
						manager,
						games:
							archivedGames,
						managerById:
							maps.byId,
						season:
							cleanSeason
					});


				return {
					managerId,

					managerName:
						manager.name,

					teamName:
						manager.teamName,

					fantasyStart:
						manager.fantasyStart ||
						null,

					yearsOfService:
						manager.yearsOfService ||
						null,

					persona:
						manager.persona ||
						null,

					philosophy:
						manager.philosophy ||
						null,

					championships:
						titles,

					championshipCount:
						titles.length,

					lastChampionshipYear:
						titles.length
							? titles[
									titles.length -
										1
								]
									.year
							: null,

					defendingChampion:
						titles.some(
							(title) =>
								Number(
									title.year
								) ===
								cleanSeason -
									1
						),

					rival:
						rivalryFor(
							manager
						),

					previousSeasonSnapshot:
						previousStandings.get(
							managerId
						) ||
						null,

					...history,

					draftCapital:
						capital
							? {
									year:
										capitalYear,

									balance,

									rank:
										rankByManager.get(
											managerId
										) ||
										null,

									gapToLeader:
										Number.isFinite(
											leaderBalance
										)
											? roundNumber(
													leaderBalance -
														balance
												)
											: null,

									differenceFromMedian:
										Number.isFinite(
											leagueMedian
										)
											? roundNumber(
													balance -
														leagueMedian
												)
											: null
								}
							: null,

					recordedDraftCapitalTrades:
						capitalTrades.get(
							managerId
						) ||
						null,

					editorialNotes:
						TEAM_EDITORIAL_NOTES[
							manager.teamName
						] ||
						[]
				};
			}
		);


	const teamMemoryById =
		new Map(
			teamMemory.map(
				(team) => [
					team.managerId,
					team
				]
			)
		);


	const matchupSeries =
		(matchups || [])
			.map(
				(matchup) =>
					seriesForMatchup({
						matchup,
						games:
							archivedGames,
						maps,
						teamMemoryById
					})
			)
			.filter(
				Boolean
			);


	const currentMatchupLore =
		buildMatchupLore({
			matchups,
			matchupSeries,
			teamMemory
		});


	return {
		purpose:
			'Authoritative institutional memory for the Irving Weekly writer. This is the historical beat sheet that explains why a current result matters. Use it selectively and naturally; do not dump it like trivia.',

		writerDirectives: [
			'Before writing EACH matchup, inspect currentMatchupLore for BOTH teams. Neither side should receive less consideration merely because the other team has a stronger priority hook.',
			'priorityStoryHooks are short week-level angles, not a complete list of what matters. Do not let one franchise dominate the article simply because it appears there.',
			'Treat automatic D1 history as descriptive evidence: prior meetings, scores, streaks, archived finishes, and recorded capital movement. Do not invent causation from those numbers.',
			'Editorial notes are commissioner-approved factual context and MAY establish cause/effect that raw database history cannot prove.',
			'Use one or two strong historical callbacks in a matchup when they genuinely improve the story. Do not force lore into every blurb.',
			'Across a normal article with useful lore, spread contextual callbacks among multiple relevant franchises or matchups instead of repeatedly returning to the same team.',
			'When describing head-to-head history, remember that the archive record is fantasy matchup wins/losses only. Do not confuse it with the league\'s two-decision weekly standings format.',
			'If archiveCoverage starts later than a manager\'s fantasy career, phrase records as being in the available archive rather than claiming they are lifetime records.',
			'Draft-capital balances are auction resources for the listed future capital year. They are not FAAB.',
			'Never invent a rivalry. A rivalry is factual only when declaredRivalry is true or a team\'s rival field names the opponent.',
			'Do not turn a persona or philosophy into a factual claim about motivation. They are flavor and identity only.'
		],

		leagueHistory: {
			currentLeague:
				'Irving Championship League',

			mergedFrom: [
				'Irving League',
				'DTSP'
			]
		},

		season:
			cleanSeason,

		week:
			cleanWeek ||
			null,

		archiveCoverage:
			archiveCoverage(
				archivedGames
			),

		capitalSnapshot,

		priorityStoryHooks:
			storyHooks({
				season:
					cleanSeason,
				teamMemory,
				matchupSeries,
				capitalSnapshot
			}),

		currentMatchupSeries:
			matchupSeries,

		/*
		 * Balanced matchup-by-matchup memory.
		 * Each row always carries BOTH teams' editorial notes
		 * and automatic context side-by-side.
		 */
		currentMatchupLore,

		teams:
			teamMemory,

		warnings
	};
}
