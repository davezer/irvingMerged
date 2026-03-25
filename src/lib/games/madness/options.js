// src/lib/games/madness/options.js
import { getMarchTeamOptionsLocal } from '$lib/server/providers/march_madness_local.js';

export async function getOptions({ db, event }) {
  const out = await getMarchTeamOptionsLocal({
    db,
    eventId: event.id
  });

  return {
    provider: out.provider || 'local',
    cacheKey: out.cacheKey || 'march-2026-bracket:v1',
    options: out.options || [],
    mode: out.mode || 'fallback:local',
    note: out.note || ''
  };
}