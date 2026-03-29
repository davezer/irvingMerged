import { getLiveStandingsBundle } from '$lib/server/league/standings.js';

export async function load({ url, platform }) {
  return getLiveStandingsBundle({ url, env: platform?.env });
}
