import { error } from '@sveltejs/kit';

export async function load({ platform }) {
  const db = platform?.env?.DB;
  if (!db) throw error(500, 'DB missing');

  const rows = await db
    .prepare(`
      SELECT
        username,
        display_name,
        role,
        created_at,
        password_set_at,
        CASE WHEN password_hash IS NOT NULL THEN 1 ELSE 0 END AS has_password,
        CASE WHEN login_code_hash IS NOT NULL THEN 1 ELSE 0 END AS has_recovery_code
      FROM users
      ORDER BY created_at DESC
    `)
    .all();

  return { users: rows.results || [] };
}
