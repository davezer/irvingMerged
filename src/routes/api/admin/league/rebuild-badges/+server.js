import { json } from '@sveltejs/kit';
import { buildBadgeAwards } from '$lib/server/league/badges';
import { buildDraftEconomy } from '$lib/server/league/draftMoney';
import { replaceManagerBadges } from '$lib/server/league/repository';

export async function POST({ platform, locals, request }) {
  const db = platform?.env?.DB;
  if (!db) return json({ ok: false, error: 'DB binding missing' }, { status: 500 });
  if (!locals.user) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  if (locals.user.role !== 'admin') return json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const season = String(body?.season || new Date().getFullYear());

  const standingsRows = await db.prepare(`SELECT season, manager_id, wins, losses, ties, points_for FROM standings_snapshots WHERE season = ?`).bind(season).all();
  const matchupRows = await db.prepare(`SELECT season, week, manager_id, points FROM matchups WHERE season = ?`).bind(season).all();
  const draftRows = await db.prepare(`SELECT season, manager_id, amount, is_keeper FROM draft_picks WHERE season = ?`).bind(season).all();

  const draftEconomyByManager = buildDraftEconomy(draftRows.results || []);
  const awards = buildBadgeAwards({
    season,
    standings: standingsRows.results || [],
    matchups: matchupRows.results || [],
    draftEconomyByManager
  });

  const result = await replaceManagerBadges(db, season, awards);
  return json({ ok: true, season, count: result.count, awards });
}
