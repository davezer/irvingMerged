import {
	getManagers
} from '$lib/server/league';

import {
	resolveLeagueContext
} from '$lib/server/league/context.js';

import {
	getMergedHistoryArchive
} from '$lib/server/league/historyArchive.js';


export const load = async ({
	platform,
	url
}) => {
	const db =
		platform?.env?.DB;

	const context =
		await resolveLeagueContext({
			url,
			env: platform?.env,
			allWeeksByDefault: false
		});


	const managers =
		getManagers();


	const archive =
		await getMergedHistoryArchive({
			db,

			env:
				platform?.env,

			rootLeagueId:
				context.rootLeagueId,

			currentSeason:
				context.currentSeason,

			currentWeek:
				context.currentWeek,

			managers,

			rivalries: []
		});


	const games =
		archive.games ?? [];


	const seasons =
		[
			...new Set(
				games.map(
					(game) =>
						Number(game.season)
				)
			)
		]
			.filter(Number.isFinite)
			.sort(
				(a, b) =>
					b - a
			);


	return {
		mergerStartYear:
			archive.mergerStartYear,

		currentSeason:
			context.currentSeason,

		games,

		seasons
	};
};