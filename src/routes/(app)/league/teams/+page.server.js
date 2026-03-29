import { getTeamsIndexBundle } from '$lib/server/league/franchisePages.js';

export async function load({ url, platform }) {
  return getTeamsIndexBundle({ url, env: platform?.env });
}
