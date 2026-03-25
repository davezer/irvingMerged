import { error } from '@sveltejs/kit';

export async function load({ platform }) {
  const db = platform?.env?.DB;
  if (!db) throw error(500, 'DB missing');

  const rows = await db.prepare(`SELECT username, display_name, role, created_at FROM users ORDER BY created_at DESC`).all();
  return { users: rows.results || [] };
}
