import { json } from '@sveltejs/kit';

import {
	getPlayerCard
} from '$lib/server/league/playerCard.js';

import {
	getPlayerLeagueHistory
} from '$lib/server/league/playerLeagueHistory.js';


export async function GET({
	params,
	url,
	fetch,
	platform
}) {
	const seasonParam =
		url.searchParams.get(
			'season'
		);


	const season =
		seasonParam
			? Number(
					seasonParam
				)
			: new Date().getFullYear();


	if (
		!Number.isInteger(
			season
		) ||
		season < 1999 ||
		season > 2100
	) {
		return json(
			{
				error:
					'Invalid season.'
			},
			{
				status: 400
			}
		);
	}


	try {
		const playerCard =
	await getPlayerCard({
		playerId: params.playerId,
		season,
		fetchFn: fetch
	});

const league = {
	available: false,

	currentRoster: {
		rostered: false,
		teamName: null,
		managerName: null,
		rosterId: null,
		season: null
	},

	history: [],
	historySeasons: []
};
		



		return json(
			{
				...playerCard,

				league
			},
			{
				headers: {
					'cache-control':
						'public, max-age=300, s-maxage=900'
				}
			}
		);

	} catch (error) {
		console.error(
			'Player card API failed:',
			error
		);


		return json(
			{
				error:
					error?.message ||
					'Unable to load player card.'
			},
			{
				status:
					Number(
						error?.status
					) ||
					500
			}
		);
	}
}