import { json } from '@sveltejs/kit';

export async function GET({ platform }) {
  const db = platform?.env?.DB;

  if (!db) {
    return json({ ok: false, error: 'DB binding missing (platform.env.DB)' }, { status: 500 });
  }

  const r = await db.prepare('SELECT 1 AS one').first();

  return json({ ok: true, one: r?.one ?? null });
}
