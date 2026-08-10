import { getLeagueHomeBundle } from '$lib/server/league/homepage.js';

export async function load({ url, platform }) {
	const leagueUrl = new URL(url);

	/*
	 * The Clubhouse has no season selector,
	 * so always point it at the current
	 * Irving Champions League season.
	 */
	leagueUrl.searchParams.set('season', '2026');

	return getLeagueHomeBundle({
		url: leagueUrl,
		env: platform?.env
	});
}