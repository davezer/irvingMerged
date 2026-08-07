import { json } from '@sveltejs/kit';
import { getParlayBundle } from '$lib/server/league/parlay.js';

export async function GET({ url, platform, fetch }) {
  try {
    const season = url.searchParams.get('season');
    const bundle = await getParlayBundle({
      env: platform?.env,
      fetchFn: fetch,
      season
    });

    return json(bundle, {
      headers: {
        'cache-control': 'public, max-age=60, s-maxage=300'
      }
    });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : 'Unable to load the Parlay feed.'
      },
      { status: 502 }
    );
  }
}
