import { json } from '@sveltejs/kit';

import {
	getPlayerLeagueHistory
} from '$lib/server/league/playerLeagueHistory.js';


function unavailableLeague(
	error = null
) {
	return {
		available: false,

		currentRoster: {
			rostered: false,
			teamName: null,
			managerName: null,
			rosterId: null,
			season: null
		},

		history: [],

		historySeasons: [],

		error:
			error?.message ||
			null
	};
}


export async function GET({
	params,
	url,
	platform
}) {
	const playerId =
		String(
			params.playerId ||
				''
		).trim();


	if (!playerId) {
		return json(
			unavailableLeague(
				new Error(
					'Player ID is required.'
				)
			),
			{
				status: 400
			}
		);
	}


	try {
		const league =
			await getPlayerLeagueHistory({
				playerId,

				url,

				env:
					platform?.env
			});


		return json(
			league,
			{
				headers: {
					'cache-control':
						'public, max-age=60, s-maxage=300'
				}
			}
		);

	} catch (error) {
		console.error(
			'Player league history API failed:',
			error
		);


		/*
		 * League history is secondary.
		 *
		 * Never kill Player File because
		 * this feed had a bad day.
		 */
		return json(
			unavailableLeague(
				error
			),
			{
				status: 200,

				headers: {
					'cache-control':
						'public, max-age=30, s-maxage=60'
				}
			}
		);
	}
}