import { getLeagueHomeBundle } from '$lib/server/league/homepage.js';

export async function load({ url, platform }) {
  return getLeagueHomeBundle({ url, env: platform?.env });
}
