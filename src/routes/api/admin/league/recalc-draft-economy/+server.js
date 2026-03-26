import { json } from '@sveltejs/kit';
import { buildDraftEconomy, buildDraftBudgetLedger } from '$lib/server/league/draftMoney';
import { replaceDraftBudgetLedger } from '$lib/server/league/repository';

export async function POST({ platform, locals, request }) {
  const db = platform?.env?.DB;
  if (!db) return json({ ok: false, error: 'DB binding missing' }, { status: 500 });
  if (!locals.user) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  if (locals.user.role !== 'admin') return json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const season = String(body?.season || new Date().getFullYear());
  const startingBudget = Number(body?.startingBudget || 200);

  const draftRows = await db.prepare(`SELECT season, manager_id, amount, is_keeper FROM draft_picks WHERE season = ?`).bind(season).all();
  const economy = buildDraftEconomy(draftRows.results || []);
  const ledger = buildDraftBudgetLedger({ season, economyRows: economy, startingBudget });
  const result = await replaceDraftBudgetLedger(db, season, ledger);

  return json({ ok: true, season, count: result.count, economy, ledger });
}
