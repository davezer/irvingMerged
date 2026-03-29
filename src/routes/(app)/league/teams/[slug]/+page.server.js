import { getTeamDetailBundle } from '$lib/server/league/franchisePages.js';

export async function load({ params, url, platform }) {
  return getTeamDetailBundle({ slug: params.slug, url, env: platform?.env });
}
