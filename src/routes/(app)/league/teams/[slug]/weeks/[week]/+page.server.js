import { getTeamWeeklyBundle } from '$lib/server/league/franchisePages.js';

export async function load({ params, url, platform }) {
  return getTeamWeeklyBundle({ slug: params.slug, week: params.week, url, env: platform?.env });
}
