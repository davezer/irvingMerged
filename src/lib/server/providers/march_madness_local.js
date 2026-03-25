// src/lib/server/providers/march_madness_local.js
import { getOptionsCache, setOptionsCache } from '$lib/server/db/optionsCache.js';
import BRACKET from '$lib/games/madness/data/2026_ncaa_mens_tournament_seeds.json';
import { buildFromBracketJson } from '$lib/games/madness/bracketUtils.js';

const MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year
const provider = 'local';
const cacheKey = 'march-2026-bracket:v6';

export async function getMarchTeamOptionsLocal({ db, eventId }) {
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

  const built = buildFromBracketJson(BRACKET);

  const fetchedAt = Math.floor(Date.now() / 1000);
  await setOptionsCache({
    db,
    eventId,
    provider,
    cacheKey,
    payload: built.options,
    fetchedAt
  });

  return {
    provider,
    cacheKey,
    options: built.options,
    mode: 'live:local',
    note: `Loaded ${built.options.length} tournament teams (incl. play-in)`
  };
}