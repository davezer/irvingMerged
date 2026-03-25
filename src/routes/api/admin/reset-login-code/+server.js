import { json } from '@sveltejs/kit';
import { generatePersonalCode, hashCode, normalizeUsername } from '$lib/server/authCodes.js';

export async function POST({ request, platform, locals }) {
  const db = platform?.env?.DB;
  if (!db) return json({ ok: false, error: 'DB binding missing' }, { status: 500 });

  if (!locals.user) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  if (locals.user.role !== 'admin') return json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const { username } = await request.json();
  const u = normalizeUsername(username);

  if (!u) return json({ ok: false, error: 'username required' }, { status: 400 });

  const user = await db.prepare(`SELECT id, username FROM users WHERE username = ? LIMIT 1`).bind(u).first();
  if (!user) return json({ ok: false, error: 'User not found' }, { status: 404 });

  const newCode = generatePersonalCode();
  const newHash = await hashCode(newCode, user.id);

  await db.prepare(`UPDATE users SET login_code_hash = ? WHERE id = ?`).bind(newHash, user.id).run();

  return json({ ok: true, new_code: newCode });
}
