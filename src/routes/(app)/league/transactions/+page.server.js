import { parseSeasonParam } from '$lib/server/league/season.js';

export async function load({ url, platform }) {
  const season = parseSeasonParam(url.searchParams.get('season'));
  const db = platform?.env?.DB;
  if (!db) return { season, transactions: [] };

  const res = await db.prepare(`
    SELECT transaction_id, type, status, roster_ids_json, adds_json, drops_json, draft_picks_json,
           waiver_budget_json, created_at, round, season
    FROM sleeper_transactions
    WHERE season = ?
    ORDER BY COALESCE(created_at, 0) DESC, COALESCE(round, 0) DESC
    LIMIT 250
  `).bind(season).all();

  const transactions = (res?.results || []).map((row) => ({
    ...row,
    roster_ids: JSON.parse(row.roster_ids_json || '[]'),
    adds: JSON.parse(row.adds_json || '{}'),
    drops: JSON.parse(row.drops_json || '{}'),
    draft_picks: JSON.parse(row.draft_picks_json || '[]'),
    waiver_budget: JSON.parse(row.waiver_budget_json || '{}')
  }));

  return { season, transactions };
}
