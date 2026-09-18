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
  "Lehigh Crucible": [
    "Lehigh went all in on the 2025 championship, spending future draft capital to maximize the title window. The post-title resource squeeze is a direct result of that strategy.",
    "Dave and Kevin have a long-standing rivalry dating back to the early 2000s.",
    "Lehigh lost the 2025 ICL championship to Dunedin in a close matchup. Around the league, it was viewed as a major upset given how aggressively Lehigh had built for that title run.",
    "The 2004 Irving championship was a defining early moment for the franchise, followed by a long championship drought."
  ],

  "Ultimate City Warriors": [
    "One of Jeff's most famous championship runs came in a season where he was effectively unable to participate normally in the draft because of overconsumption, forcing a remarkable recovery afterward.",
    "Jeff and Jamie are brothers. Their rivalry is built into the family dynamic and amplified by decades of fantasy football history.",
    "Jeff's Littlefinger persona fits his league reputation for strategic maneuvering, unexpected trades, and moves that tend to catch the rest of the league off guard.",
    "Ultimate City went all in on the 2025 playoff run, spending future draft capital to maximize the title window. The resource squeeze that followed is a direct result of that strategy."
  ],

  "Dagobah Lightsabres": [
    "Jamie and Jeff are brothers. Their rivalry is built into the family dynamic and amplified by decades of fantasy football history.",
    "Jamie has a league-wide reputation as one of the strongest negotiators in the trade market and is often able to extract premium value from his trade partners.",

    // Add: Is either the 2008 or 2018 championship remembered for a specific run, upset, or moment?
    // Add: What makes 'The Kornacki' especially fitting for Jamie beyond the persona label?
  ],

  "Rebel Radio Lone Rangers": [
    "Kenny and James are longtime friends who frequently find themselves arguing about just about everything.",
    "Kenny is often one of the first managers to speak up about league rules or call out a trade he thinks is absurd, frequently turning a simple transaction into a league-wide debate.",

    // Add: Is there a memorable story attached to the 2013 or 2017 Irving championships?
    // Add: What pushed Rebel Radio into its current rebuild?
  ],

  "Salem Hipsterjacks": [
    "Salem famously went into full sell mode only three weeks into the 2025 season.",
    "Clifton loves to trade. A recurring league joke is that his enthusiasm for making deals sometimes exceeds the quality of the deals themselves.",

    // Add: What made Salem's 2023 DTSP championship run distinctive?
    // Add: Why are Clifton and Brian James/Kodachromes rivals?
  ],

  "Nakatomi Plaza CC": [
    "The 2023 and 2024 championships were back-to-back titles and should be treated as a defining recent Nakatomi era when that history is relevant.",
    "Kevin and Dave were roommates and have a long-standing friendship that naturally developed into one of the league's oldest rivalries.",
    "Before the 2026 draft, Kevin made two trades that were widely viewed around the league as especially sharp strategic moves.",
    "Nakatomi has a league reputation for refusing to disappear from the playoff picture. Even during a rebuild or transition year, the franchise is rarely treated as harmless. The John McClane comparison is part of the team mythology."
  ],

  "Amherst Union": [
    "Drew is one of the league's more willing and active trade partners.",

    // Add: What was the story of Drew's 2024 DTSP championship?
    // Add: Why are Amherst and Jacksonville/Romano rivals?
    // Add: Was the championship especially quick or remarkable given Drew's relatively recent arrival?
  ],

  "Milford Jayhawks": [
    "Jay and Adam are longtime friends going all the way back to high school. Their real-life friendship adds another layer to the Milford-Saskatchewan rivalry.",

    // Add: Is the 2005 Irving championship remembered for anything specific?
    // Add: Any long-running Jason roster-building habit or league joke?
    // Add: Any brutal near-miss or playoff scar that still gets brought up?
  ],

  "Jacksonville Vincitori": [
    "Jacksonville won three consecutive DTSP championships from 2016 through 2018. When that history is relevant, treat it as a dynasty-era run rather than three isolated titles.",

    // Add: What made that three-peat happen? Dominant drafts? Trades? Keeper advantage?
    // Add: Why is Romano's rivalry with Brian Marx/Tallahassee meaningful?
    // Add: Any famous Romano overconfidence, blowup, trade, or playoff moment the league quotes?
  ],

  "Dunedin Homers": [
    "The 2025 championship was an intentional all-in title push. Dunedin aggressively spent future resources to maximize its championship window, won the ICL title, and entered 2026 dealing with the roster and draft-capital squeeze created by that successful push.",
    "Do not frame Dunedin's post-2025 shortage of draft resources as an unexplained collapse or simple mismanagement. When relevant, it is the bill for a championship strategy that actually worked.",
    "When Dunedin is competitive despite its post-title resource disadvantage, that is a meaningful part of the story because the franchise entered 2026 with far less flexibility than most of the league.",
    "Jamie and James have a rivalry that extends well beyond fantasy football. Sports arguments, everyday disagreements, and years of friendship have all fed into a rivalry that feels more personal than an ordinary league matchup.",
    "During the 2025 championship push, James was willing to pay premium prices for elite players rather than preserve future flexibility."
  ],

  "Kansas City Kodachromes": [
    // Add: Why are Brian James and Clifton/Salem rivals?
    // Add: Is there a famous near-title, playoff collapse, or 'always almost there' narrative?
    // Add: Any particular player or draft philosophy Brian is known for?
    // Add: What does the league tease Brian about that the database could never understand?
  ],

  "Tallahassee Tribe": [
    // Add: What was distinctive about Brian Marx's 2022 DTSP championship?
    // Add: What is the actual origin of the Tallahassee/Jacksonville rivalry?
    // Add: Any famous trade, waiver claim, draft decision, or rules argument?
    // Add: Is there a particular way Brian approaches roster construction that everyone recognizes?
  ],

  "Saskatchewan Mounties": [
    "Jay and Adam are longtime friends going all the way back to high school. Their real-life friendship adds another layer to the Milford-Saskatchewan rivalry.",
    "The Mounties have a reputation for sticking with their guys. Adam rarely treats the roster as a revolving door and does not explore the trade market as aggressively as many other managers.",
    "Saskatchewan has a long-running reputation for staying relevant. Even in transition years, the Mounties are rarely dismissed from the playoff picture.",

    // Add: Is the 2006 Irving title remembered for anything specific?
  ],

  "Clearwater HenryPussycats": [
    "Brad is one of the league's true mystery managers: quiet, low-profile, and rarely interested in broadcasting what he is thinking or planning.",
    "Clearwater has long carried a dark-horse quality because the franchise tends to operate quietly compared with the louder personalities around the league.",

    // Add: Why are Brad and James/Dunedin rivals?
    // Add: Is there a memorable story behind the 2010 or 2014 Irving championships?
    // Add: Any playoff scar or historic matchup everyone still remembers?
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
						`That is $${team.draftCapital.gapToLeader} behind capital leader ${capitalSnapshot.leader.teamName}.`
					);
				}
			}


			if (
				team.editorialNotes
					?.length
			) {
				pieces.push(
					...team.editorialNotes
				);
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


	return {
		purpose:
			'Authoritative institutional memory for the Irving Weekly writer. This is the historical beat sheet that explains why a current result matters. Use it selectively and naturally; do not dump it like trivia.',

		writerDirectives: [
			'Before writing the recap, inspect priorityStoryHooks, currentMatchupSeries, and the relevant team memory. Use historical context when it explains the present week.',
			'Treat automatic D1 history as descriptive evidence: prior meetings, scores, streaks, archived finishes, and recorded capital movement. Do not invent causation from those numbers.',
			'Editorial notes are commissioner-approved factual context and MAY establish cause/effect that raw database history cannot prove.',
			'Use one or two strong historical callbacks in a matchup when they genuinely improve the story. Do not force lore into every blurb.',
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

		teams:
			teamMemory,

		warnings
	};
}
