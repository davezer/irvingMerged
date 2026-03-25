import { redirect } from '@sveltejs/kit';

export async function POST({ platform, cookies }) {
  const db = platform?.env?.DB;
  const sid = cookies.get('auth_session');

  if (db && sid) {
    await db.prepare(`DELETE FROM sessions WHERE id = ?`).bind(sid).run();
  }

  cookies.delete('auth_session', { path: '/' });

  throw redirect(303, '/login');
}
