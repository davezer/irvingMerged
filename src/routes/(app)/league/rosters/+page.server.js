import { parseSeasonParam } from '$lib/server/league/season.js';

export async function load({ url, platform }) {
  const season = parseSeasonParam(url.searchParams.get('season'));
  const db = platform?.env?.DB;
  if (!db) return { season, rosters: [] };

  const res = await db.prepare(`
    SELECT roster_id, owner_id, players_json, starters_json, settings_json, metadata_json, season
    FROM sleeper_rosters
    WHERE season = ?
    ORDER BY roster_id ASC
  `).bind(season).all();

  const rosters = (res?.results || []).map((row) => ({
    ...row,
    players: JSON.parse(row.players_json || '[]'),
    starters: JSON.parse(row.starters_json || '[]'),
    settings: JSON.parse(row.settings_json || '{}'),
    metadata: JSON.parse(row.metadata_json || '{}')
  }));

  return { season, rosters };
}
