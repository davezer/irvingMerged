import { getParlayBundle } from '$lib/server/league/parlay.js';

export async function load({ url, platform, fetch }) {
  const season = url.searchParams.get('season');

  try {
    return await getParlayBundle({
      env: platform?.env,
      fetchFn: fetch,
      season
    });
  } catch (error) {
    return {
      source: 'Google Sheets · Apps Script',
      requestedSeason: season ? Number(season) : null,
      availableSeasons: [],
      rows: [],
      allRowCount: 0,
      stats: { total: 0, wins: 0, losses: 0, pushes: 0, pending: 0, decided: 0, hitRate: 0 },
      teamOptions: [],
      categoryOptions: [],
      resultOptions: [],
      hasData: false,
      error: error instanceof Error ? error.message : 'Unable to load the Parlay feed.'
    };
  }
}
