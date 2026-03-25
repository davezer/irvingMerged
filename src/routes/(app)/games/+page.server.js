import { error } from '@sveltejs/kit';

export async function load({ platform }) {
  const db = platform?.env?.DB;
  if (!db) throw error(500, 'DB binding missing');

  const rows = await db
    .prepare(
      `SELECT id, slug, name, type, start_at, lock_at
       FROM events
       ORDER BY lock_at ASC`
    )
    .all();

  return { events: rows.results || [] };
}
