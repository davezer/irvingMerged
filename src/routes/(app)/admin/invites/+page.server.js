import { error } from '@sveltejs/kit';

export async function load({ platform }) {
  const db = platform?.env?.DB;
  if (!db) throw error(500, 'DB missing');

  const rows = await db.prepare(
    `SELECT code, role, created_at, used_at, used_by_user_id
     FROM invite_codes
     ORDER BY created_at DESC
     LIMIT 50`
  ).all();

  return { invites: rows.results || [] };
}
