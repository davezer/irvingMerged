import { resolveLeagueContext } from '$lib/server/league/context.js';
import { getLegacyManagerById } from '$lib/server/league/identity.js';

import {
	getLiveStandingsBundle
} from '$lib/server/league/standings.js';

import {
	getSleeperLeagueDrafts,
	getSleeperMatchupsForWeek,
	getSleeperTransactionsForWeek
} from '$lib/server/league/sleeperClient.js';


function chunkPairs(entries = []) {
	const grouped = new Map();

	for (const entry of entries) {
		const key = Number(
			entry.matchup_id || 0
		);

		if (!grouped.has(key)) {
			grouped.set(key, []);
		}

		grouped
			.get(key)
			.push(entry);
	}

	return [...grouped.values()];
}


function buildSpotlightMatchup(
	raw = [],
	standingsByRoster = new Map()
) {
	const pairs = chunkPairs(raw)
		.map((teams) => {
			const left =
				teams[0];

			const right =
				teams[1];

			if (!left || !right) {
				return null;
			}

			const leftStanding =
				standingsByRoster.get(
					Number(
						left.roster_id
					)
				);

			const rightStanding =
				standingsByRoster.get(
					Number(
						right.roster_id
					)
				);

			if (
				!leftStanding ||
				!rightStanding
			) {
				return null;
			}

			const leftScore =
				Number(
					left.custom_points ??
						left.points ??
						0
				);

			const rightScore =
				Number(
					right.custom_points ??
						right.points ??
						0
				);

			return {
				left:
					leftStanding,

				right:
					rightStanding,

				leftScore,

				rightScore,

				totalScore:
					Number(
						(
							leftScore +
							rightScore
						).toFixed(2)
					),

				margin:
					Number(
						Math.abs(
							leftScore -
							rightScore
						).toFixed(2)
					),

				winnerName:
					leftScore === rightScore
						? 'Draw'
						: leftScore >
								rightScore
							? leftStanding.teamName
							: rightStanding.teamName
			};
		})
		.filter(Boolean)
		.sort(
			(a, b) =>
				b.totalScore -
					a.totalScore ||
				a.margin -
					b.margin
		);

	return pairs[0] || null;
}


function buildRecentMoveCards(
	rawWeeks = [],
	standingsByRoster = new Map()
) {
	const cards = [];

	for (const bucket of rawWeeks) {
		for (
			const txn
			of bucket.items || []
		) {
			const rosterIds =
				(
					txn.roster_ids ||
					[]
				).map(
					(id) =>
						Number(id)
				);

			const teams =
				rosterIds
					.map(
						(id) =>
							standingsByRoster.get(
								id
							)
					)
					.filter(Boolean);

			cards.push({
				id:
					String(
						txn.transaction_id ||
							`${bucket.week}-${cards.length}`
					),

				week:
					bucket.week,

				type:
					String(
						txn.type ||
							'move'
					).replaceAll(
						'_',
						' '
					),

				createdAt:
					Number(
						txn.status_updated ||
							txn.created ||
							0
					),

				summary:
					teams.length
						? teams
								.map(
									(team) =>
										team.teamName
								)
								.join(
									' ↔ '
								)
						: 'League movement',

				teams
			});
		}
	}

	return cards
		.sort(
			(a, b) =>
				b.createdAt -
				a.createdAt
		)
		.slice(0, 5);
}


function buildActivityLeaders(
	rawWeeks = [],
	standingsByRoster = new Map()
) {
	const counts = new Map();

	for (const bucket of rawWeeks) {
		for (
			const txn
			of bucket.items || []
		) {
			for (
				const rosterId
				of (
					txn.roster_ids ||
					[]
				).map(
					(id) =>
						Number(id)
				)
			) {
				counts.set(
					rosterId,
					(
						counts.get(
							rosterId
						) || 0
					) + 1
				);
			}

			for (
				const rosterId
				of Object.values(
					txn.adds || {}
				).map(
					(id) =>
						Number(id)
				)
			) {
				counts.set(
					rosterId,
					(
						counts.get(
							rosterId
						) || 0
					) + 1
				);
			}

			for (
				const rosterId
				of Object.values(
					txn.drops || {}
				).map(
					(id) =>
						Number(id)
				)
			) {
				counts.set(
					rosterId,
					(
						counts.get(
							rosterId
						) || 0
					) + 1
				);
			}
		}
	}

	return [...counts.entries()]
		.map(
			([
				rosterId,
				count
			]) => ({
				...(
					standingsByRoster.get(
						rosterId
					) || {
						rosterId,

						teamName:
							`Roster ${rosterId}`,

						teamPhoto:
							null,

						initials:
							'?'
					}
				),

				activityCount:
					count
			})
		)
		.sort(
			(a, b) =>
				b.activityCount -
					a.activityCount ||
				Number(
					a.rank || 999
				) -
					Number(
						b.rank || 999
					)
		)
		.slice(0, 5);
}


function choosePrimaryDraft(
	drafts = []
) {
	return (
		drafts.find(
			(draft) =>
				draft.status ===
				'complete'
		) ||
		drafts[0] ||
		null
	);
}


export async function getLeagueHomeBundle({
	url,
	env
} = {}) {

	/*
	 * Resolve the normal League page context.
	 */
	const context =
		await resolveLeagueContext({
			url,
			env,
			allWeeksByDefault:
				false
		});


	/*
	 * IMPORTANT:
	 *
	 * Do NOT rebuild standings here.
	 *
	 * The Standings Desk already has the
	 * canonical standings pipeline.
	 *
	 * Using getLiveStandingsBundle means
	 * /league and /league/standings now
	 * use the exact same:
	 *
	 * - franchise identity
	 * - team names
	 * - manager names
	 * - logos
	 * - records
	 * - points
	 * - rank
	 * - slugs
	 */
	const standingsBundle =
		await getLiveStandingsBundle({
			url,
			env
		});


	const standings =
		standingsBundle?.standings ||
		[];


	const standingsByRoster =
		new Map(
			standings.map(
				(row) => [
					Number(
						row.rosterId
					),
					row
				]
			)
		);


	/*
	 * Use the exact same league pulse
	 * as Standings Desk when available.
	 */
	const pulse =
		standingsBundle?.pulse || {
			topSeed:
				standings[0] ||
				null,

			hottest:
				null,

			averagePoints:
				0
		};


	const currentWeek =
		context.selectedWeek;


	const activityWeeks =
		context.availableWeeks.slice(
			-4
		);


	/*
	 * These are League-home-specific
	 * feeds, so we still load them here.
	 */
	const [
		drafts,
		matchups,
		recentTransactionsByWeek
	] = await Promise.all([

		getSleeperLeagueDrafts(
			context.leagueId
		),

		getSleeperMatchupsForWeek(
			context.leagueId,
			currentWeek
		),

		Promise.all(
			activityWeeks.map(
				async (week) => ({
					week,

					items:
						await getSleeperTransactionsForWeek(
							context.leagueId,
							week
						)
				})
			)
		)
	]);


	const featuredManagers =
		standings
			.slice(0, 4)
			.map(
				(row) => {
					const legacy =
						getLegacyManagerById(
							row.ownerId
						);

					return {
						...row,

						bio:
							legacy?.bio ||
							`${row.teamName} is live on the Sleeper spine for ${context.season}.`,

						dossierHref:
							row.slug
								? `/league/managers/${row.slug}?season=${context.season}`
								: `/league/standings?season=${context.season}`,

						movesHref:
							row.slug
								? `/league/transactions?season=${context.season}&team=${row.slug}`
								: `/league/transactions?season=${context.season}&rosterId=${row.rosterId}`,

						gamesHref:
							row.slug
								? `/league/matchups?season=${context.season}&team=${row.slug}`
								: `/league/matchups?season=${context.season}&rosterId=${row.rosterId}`
					};
				}
			);


	const latestDraft =
		choosePrimaryDraft(
			drafts
		);


	return {
		...context,


		leagueName:
			context.league?.name ||
			'CHAMPIONSHIP LEAGUE',


		/*
		 * EXACT SAME ARRAY SOURCE
		 * AS STANDINGS DESK.
		 */
		standings,


		/*
		 * League page only needs
		 * a preview.
		 */
		topBoard:
			standings.slice(
				0,
				8
			),


		pulse,


		spotlightMatchup:
			buildSpotlightMatchup(
				matchups,
				standingsByRoster
			),


		recentMoves:
			buildRecentMoveCards(
				recentTransactionsByWeek,
				standingsByRoster
			),


		activityLeaders:
			buildActivityLeaders(
				recentTransactionsByWeek,
				standingsByRoster
			),


		featuredManagers,


		draft:
			latestDraft
				? {
						rounds:
							Number(
								latestDraft
									.settings
									?.rounds ||
									0
							),

						teams:
							Number(
								latestDraft
									.settings
									?.teams ||
									0
							),

						status:
							latestDraft
								.status ||
							'unknown'
					}
				: null,


		source:
			'Sleeper API + canonical standings bundle + shared edge/runtime cache'
	};
}