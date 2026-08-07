import { json } from '@sveltejs/kit';
import { generatePersonalCode, hashCode, normalizeUsername } from '$lib/server/authCodes.js';

export async function POST({ request, platform, locals }) {
  const db = platform?.env?.DB;
  if (!db) return json({ ok: false, error: 'DB binding missing' }, { status: 500 });

  if (!locals.user) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  if (locals.user.role !== 'admin') return json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const { username } = await request.json();
  const normalized = normalizeUsername(username);

  if (!normalized) return json({ ok: false, error: 'username required' }, { status: 400 });

  const user = await db
    .prepare(`SELECT id, username FROM users WHERE username = ? LIMIT 1`)
    .bind(normalized)
    .first();

  if (!user) return json({ ok: false, error: 'User not found' }, { status: 404 });

  const recoveryCode = generatePersonalCode();
  const recoveryHash = await hashCode(recoveryCode, user.id);

  // Do NOT clear the current password. This simply creates a one-time
  // recovery path. The code is burned when the user successfully resets.
  await db
    .prepare(`UPDATE users SET login_code_hash = ? WHERE id = ?`)
    .bind(recoveryHash, user.id)
    .run();

  return json({
    ok: true,
    recovery_code: recoveryCode,
    // backwards-compatible response field for any older admin UI
    new_code: recoveryCode
  });
}
