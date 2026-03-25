// src/lib/server/providers/march_madness.js
import { getOptionsCache, setOptionsCache } from '$lib/server/db/optionsCache.js';

const MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours

export async function getMarchTeamOptions({ db, eventId, fetchImpl }) {
  const provider = 'espn';
  const cacheKey = 'march-teams:mens:v4'; // ✅ bump version to bust old 50-team cache
 
  

  const cached = await getOptionsCache({
    db,
    eventId,
    provider,
    cacheKey,
    maxAgeSeconds: MAX_AGE_SECONDS
  });

  if (cached && Array.isArray(cached) && cached.length) {
    return { provider, cacheKey, options: cached, mode: 'cache', note: '' };
  }

  const url =
    'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams?limit=1000';

  const res = await fetchImpl(url);
  if (!res.ok) {
    return {
      provider,
      cacheKey,
      options: [],
      mode: 'error',
      note: `ESPN request failed (${res.status})`
    };
  }

  const data = await res.json();
  const teams = data?.sports?.[0]?.leagues?.[0]?.teams ?? [];

  const options = teams
    .map((t) => {
      const team = t?.team;
      return {
        id: String(team?.id || ''),
        name: team?.displayName || '',
        abbrev: team?.abbreviation || null,
        logo: team?.logos?.[0]?.href || null
      };
    })
    .filter((t) => t.id && t.name);

  // ✅ Guard: don't cache an obviously partial list
  if (options.length && options.length < 300) {
    return {
      provider,
      cacheKey,
      options,
      mode: 'live:espn:partial',
      note: `Only received ${options.length} teams (expected ~360). Not caching.`
    };
  }

  const fetchedAt = Math.floor(Date.now() / 1000);
  await setOptionsCache({
    db,
    eventId,
    provider,
    cacheKey,
    payload: options,
    fetchedAt
  });

  return {
    provider,
    cacheKey,
    options,
    mode: 'live:espn',
    note: `Loaded ${options.length} teams`
  };
}
