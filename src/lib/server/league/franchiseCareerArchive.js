import { getFranchiseCareerBundle } from '$lib/server/league/franchiseCareer.js';

function numberValue(value) {
	const n = Number(value);
	return Number.isFinite(n) ? n : 0;
}

function recordPct(wins, losses, ties) {
	const games =
		numberValue(wins) +
		numberValue(losses) +
		numberValue(ties);

	return games
		? Number(
				(
					(
						numberValue(wins) +
						numberValue(ties) * 0.5
					) /
					games
				).toFixed(3)
			)
		: 0;
}

function recordLabel({
	wins = 0,
	losses = 0,
	ties = 0
} = {}) {
	return `${wins}-${losses}${ties ? `-${ties}` : ''}`;
}

function parseLegacyTitleYears(profile = {}) {
	const raw =
		profile?.championship?.years;

	if (!raw) {
		return [];
	}

	return String(raw)
		.split(/[,|/]+/)
		.map((value) =>
			value.trim()
		)
		.filter(Boolean);
}

function summarizeGames(games = []) {
	const decided =
		games.filter((game) =>
			[
				'Win',
				'Loss',
				'Tie'
			].includes(game.result)
		);

	const wins =
		decided.filter(
			(game) =>
				game.result === 'Win'
		).length;

	const losses =
		decided.filter(
			(game) =>
				game.result === 'Loss'
		).length;

	const ties =
		decided.filter(
			(game) =>
				game.result === 'Tie'
		).length;

	const pointsFor =
		games.reduce(
			(sum, game) =>
				sum +
				numberValue(
					game.score
				),
			0
		);

	const pointsAgainst =
		games.reduce(
			(sum, game) =>
				sum +
				numberValue(
					game.oppScore
				),
			0
		);

	const bestScore =
		games.length
			? [...games]
					.sort(
						(a, b) =>
							b.score -
							a.score
					)[0]
			: null;

	const worstScore =
		games.length
			? [...games]
					.sort(
						(a, b) =>
							a.score -
							b.score
					)[0]
			: null;

	const biggestWin =
		decided
			.filter(
				(game) =>
					game.result ===
					'Win'
			)
			.sort(
				(a, b) =>
					b.margin -
					a.margin
			)[0] ||
		null;

	const worstLoss =
		decided
			.filter(
				(game) =>
					game.result ===
					'Loss'
			)
			.sort(
				(a, b) =>
					a.margin -
					b.margin
			)[0] ||
		null;

	return {
		recordLabel:
			recordLabel({
				wins,
				losses,
				ties
			}),

		wins,
		losses,
		ties,

		gamesPlayed:
			wins +
			losses +
			ties,

		pct:
			recordPct(
				wins,
				losses,
				ties
			),

		pointsFor:
			Number(
				pointsFor.toFixed(
					2
				)
			),

		pointsAgainst:
			Number(
				pointsAgainst.toFixed(
					2
				)
			),

		pointDiff:
			Number(
				(
					pointsFor -
					pointsAgainst
				).toFixed(2)
			),

		averageFor:
			games.length
				? Number(
						(
							pointsFor /
							games.length
						).toFixed(2)
					)
				: 0,

		averageAgainst:
			games.length
				? Number(
						(
							pointsAgainst /
							games.length
						).toFixed(2)
					)
				: 0,

		bestScore,
		worstScore,
		biggestWin,
		worstLoss
	};
}

function summarizeOfficialRecord(
	seasons = []
) {
	const wins =
		seasons.reduce(
			(sum, season) =>
				sum +
				numberValue(
					season.wins
				),
			0
		);

	const losses =
		seasons.reduce(
			(sum, season) =>
				sum +
				numberValue(
					season.losses
				),
			0
		);

	const ties =
		seasons.reduce(
			(sum, season) =>
				sum +
				numberValue(
					season.ties
				),
			0
		);

	const pointsFor =
		seasons.reduce(
			(sum, season) =>
				sum +
				numberValue(
					season.points
				),
			0
		);

	const pointsAgainst =
		seasons.reduce(
			(sum, season) =>
				sum +
				numberValue(
					season.pointsAgainst
				),
			0
		);

	const ranked =
		seasons.filter(
			(season) =>
				Number.isFinite(
					Number(
						season.rank
					)
				)
		);

	const averageFinish =
		ranked.length
			? ranked.reduce(
					(sum, season) =>
						sum +
						numberValue(
							season.rank
						),
					0
				) /
				ranked.length
			: null;

	return {
		recordLabel:
			recordLabel({
				wins,
				losses,
				ties
			}),

		wins,
		losses,
		ties,

		gamesPlayed:
			wins +
			losses +
			ties,

		pct:
			recordPct(
				wins,
				losses,
				ties
			),

		pointsFor:
			Number(
				pointsFor.toFixed(
					2
				)
			),

		pointsAgainst:
			Number(
				pointsAgainst.toFixed(
					2
				)
			),

		pointDiff:
			Number(
				(
					pointsFor -
					pointsAgainst
				).toFixed(2)
			),

		averagePointsFor:
			seasons.length
				? Number(
						(
							pointsFor /
							seasons.length
						).toFixed(2)
					)
				: 0,

		averagePointsAgainst:
			seasons.length
				? Number(
						(
							pointsAgainst /
							seasons.length
						).toFixed(2)
					)
				: 0,

		seasons:
			seasons.length,

		bestFinish:
			ranked.length
				? Math.min(
						...ranked.map(
							(season) =>
								Number(
									season.rank
								)
						)
					)
				: null,

		averageFinish:
			averageFinish == null
				? null
				: Number(
						averageFinish.toFixed(
							2
						)
					)
	};
}

async function getArchivedGames(
	db,
	managerId
) {
	const result =
		await db
			.prepare(`
				SELECT
					mine.season,
					mine.week,
					mine.matchup_id,
					mine.manager_id,
					COALESCE(
						mine.custom_points,
						mine.points,
						0
					) AS score,

					other.manager_id
						AS opponent_manager_id,

					COALESCE(
						other.custom_points,
						other.points,
						0
					) AS opponent_score

				FROM matchups AS mine

				LEFT JOIN matchups AS other
					ON other.season =
						mine.season

					AND other.week =
						mine.week

					AND other.matchup_id =
						mine.matchup_id

					AND other.id !=
						mine.id

				WHERE
					mine.manager_id = ?

				ORDER BY
					CAST(
						mine.season AS INTEGER
					) DESC,

					mine.week DESC
			`)
			.bind(
				String(managerId)
			)
			.all();

	return (
		result.results ||
		[]
	).map((row) => {
		const score =
			numberValue(
				row.score
			);

		const oppScore =
			numberValue(
				row.opponent_score
			);

		const hasOpponent =
			row.opponent_manager_id !=
			null;

		let resultLabel =
			'Bye';

		if (hasOpponent) {
			resultLabel =
				score === oppScore
					? 'Tie'
					: score > oppScore
						? 'Win'
						: 'Loss';
		}

		return {
			season:
				Number(
					row.season
				),

			week:
				Number(
					row.week
				),

			score,

			oppScore,

			result:
				resultLabel,

			margin:
				Number(
					(
						score -
						oppScore
					).toFixed(2)
				),

			opponentManagerId:
				row.opponent_manager_id
					? String(
							row.opponent_manager_id
						)
					: null
		};
	});
}

async function getArchivedStandings(
	db,
	managerId
) {
	const result =
		await db
			.prepare(`
				SELECT
					s.season,
					s.wins,
					s.losses,
					s.ties,
					s.points_for,
					s.points_against,
					s.rank

				FROM standings_snapshots AS s

				INNER JOIN (
					SELECT
						season,
						MAX(created_at)
							AS latest_created_at

					FROM standings_snapshots

					WHERE
						manager_id = ?

					GROUP BY
						season
				) latest
					ON latest.season =
						s.season

					AND latest.latest_created_at =
						s.created_at

				WHERE
					s.manager_id = ?

				ORDER BY
					CAST(
						s.season AS INTEGER
					) DESC
			`)
			.bind(
				String(managerId),
				String(managerId)
			)
			.all();

	return (
		result.results ||
		[]
	).map((row) => {
		const wins =
			numberValue(
				row.wins
			);

		const losses =
			numberValue(
				row.losses
			);

		const ties =
			numberValue(
				row.ties
			);

		const points =
			numberValue(
				row.points_for
			);

		const pointsAgainst =
			numberValue(
				row.points_against
			);

		return {
			season:
				Number(
					row.season
				),

			rank:
				row.rank == null
					? null
					: Number(
							row.rank
						),

			wins,
			losses,
			ties,

			recordLabel:
				recordLabel({
					wins,
					losses,
					ties
				}),

			gamesPlayed:
				wins +
				losses +
				ties,

			pct:
				recordPct(
					wins,
					losses,
					ties
				),

			points,

			pointsAgainst,

			pointDiff:
				Number(
					(
						points -
						pointsAgainst
					).toFixed(2)
				)
		};
	});
}

function mergeSeasonRows({
	standings,
	games,
	currentSeason
}) {
	const gamesBySeason =
		new Map();

	for (const game of games) {
		const season =
			Number(
				game.season
			);

		if (
			!gamesBySeason.has(
				season
			)
		) {
			gamesBySeason.set(
				season,
				[]
			);
		}

		gamesBySeason
			.get(season)
			.push(game);
	}

	const standingsBySeason =
		new Map(
			standings.map(
				(row) => [
					Number(
						row.season
					),
					row
				]
			)
		);

	const years =
		[
			...new Set([
				...gamesBySeason.keys(),
				...standingsBySeason.keys()
			])
		]
			.sort(
				(a, b) =>
					b - a
			);

	return years.map(
		(season) => {
			const official =
				standingsBySeason.get(
					season
				) ||
				null;

			const seasonGames =
				gamesBySeason.get(
					season
				) ||
				[];

			const calculated =
				summarizeGames(
					seasonGames
				);

			const wins =
				official?.wins ??
				calculated.wins;

			const losses =
				official?.losses ??
				calculated.losses;

			const ties =
				official?.ties ??
				calculated.ties;

			const points =
				official?.points ??
				calculated.pointsFor;

			const pointsAgainst =
				official?.pointsAgainst ??
				calculated.pointsAgainst;

			return {
				season,

				leagueId:
					null,

				leagueName:
					`Season ${season}`,

				rank:
					official?.rank ??
					null,

				recordLabel:
					recordLabel({
						wins,
						losses,
						ties
					}),

				wins,
				losses,
				ties,

				gamesPlayed:
					wins +
					losses +
					ties,

				pct:
					recordPct(
						wins,
						losses,
						ties
					),

				points,

				pointsAgainst,

				pointDiff:
					Number(
						(
							points -
							pointsAgainst
						).toFixed(2)
					),

				weeksSampled:
					seasonGames.length,

				games:
					seasonGames,

				isCurrentSeason:
					Number(season) ===
					Number(
						currentSeason
					),

				completed:
					Number(season) <
					Number(
						currentSeason
					),

				champion:
					Number(
						official?.rank
					) === 1,

				source:
					'D1 league archive'
			};
		}
	);
}

export async function getFranchiseCareerArchiveBundle({
	db,
	rootLeagueId,
	env,
	profile,
	currentSeason,
	currentWeek
} = {}) {
	/*
	 * No DB? Keep the existing behavior.
	 */
	if (
		!db ||
		!profile?.managerID
	) {
		return getFranchiseCareerBundle({
			rootLeagueId,
			env,
			profile,
			currentSeason,
			currentWeek
		});
	}

	const [
		games,
		standings
	] = await Promise.all([
		getArchivedGames(
			db,
			profile.managerID
		),

		getArchivedStandings(
			db,
			profile.managerID
		)
	]);

	/*
	 * Archive hasn't been backfilled yet.
	 *
	 * Preserve full history by falling back
	 * to the existing Sleeper implementation.
	 */
	if (
		!games.length &&
		!standings.length
	) {
		console.warn(
			`[franchiseCareerArchive] no D1 archive for ${profile.managerID}; falling back to Sleeper`
		);

		return getFranchiseCareerBundle({
			rootLeagueId,
			env,
			profile,
			currentSeason,
			currentWeek
		});
	}

	const seasons =
		mergeSeasonRows({
			standings,
			games,
			currentSeason
		});

	const allGames =
		seasons
			.flatMap(
				(season) =>
					season.games ||
					[]
			)
			.sort(
				(a, b) =>
					b.season -
						a.season ||
					b.week -
						a.week
			);

	const official =
		summarizeOfficialRecord(
			seasons
		);

	const h2h =
		summarizeGames(
			allGames
		);

	const legacyTitleYears =
		parseLegacyTitleYears(
			profile
		);

	const archiveTitleYears =
		seasons
			.filter(
				(season) =>
					season.champion
			)
			.map(
				(season) =>
					String(
						season.season
					)
			);

	const titleYears =
		[
			...new Set([
				...legacyTitleYears,
				...archiveTitleYears
			])
		]
			.sort(
				(a, b) =>
					Number(a) -
					Number(b)
			);

	return {
		seasons,

		games:
			allGames,

		recentGames:
			allGames.slice(
				0,
				8
			),

		official,

		h2h,

		legacyTitles:
			legacyTitleYears.length,

		legacyTitleYears,

		legacyLeague:
			profile?.championship
				?.league ||
			null,

		sleeperTitles:
			archiveTitleYears.length,

		sleeperTitleYears:
			archiveTitleYears,

		totalTitles:
			titleYears.length,

		titleYears,

		source:
			'D1 archived matchups + standings snapshots'
	};
}