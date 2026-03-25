import { json } from '@sveltejs/kit';
import { generatePersonalCode, hashCode, normalizeUsername } from '$lib/server/authCodes.js';

const SESSION_TTL_DAYS = 30;

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function isProd(event) {
  const url = new URL(event.request.url);
  return url.protocol === 'https:';
}

export async function POST(event) {
  const { request, platform, cookies } = event;
  const db = platform?.env?.DB;
  if (!db) return json({ ok: false, error: 'DB binding missing (platform.env.DB)' }, { status: 500 });

  const form = await request.formData();
  const mode = String(form.get('mode') ?? 'returning');

  const usernameRaw = String(form.get('username') ?? '');
  const username = normalizeUsername(usernameRaw);

  if (!username) return json({ ok: false, error: 'Username required' }, { status: 400 });

  // -------------------------
  // RETURNING LOGIN
  // -------------------------
  if (mode === 'returning') {
    const personal = String(form.get('personal_code') ?? '');
    if (!personal) return json({ ok: false, error: 'Personal code required' }, { status: 400 });

    const user = await db
      .prepare(`SELECT id, username, display_name, role, login_code_hash FROM users WHERE username = ? LIMIT 1`)
      .bind(username)
      .first();

    if (!user) return json({ ok: false, error: 'Unknown username' }, { status: 401 });
    if (!user.login_code_hash) return json({ ok: false, error: 'No personal code set. Ask an admin to reset.' }, { status: 401 });

    const computed = await hashCode(personal, user.id);
    if (computed !== user.login_code_hash) return json({ ok: false, error: 'Invalid personal code' }, { status: 401 });

    const sessionId = crypto.randomUUID();
    const expiresAt = nowSec() + SESSION_TTL_DAYS * 24 * 60 * 60;

    await db.prepare(`INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)`)
      .bind(sessionId, user.id, expiresAt)
      .run();

    cookies.set('auth_session', sessionId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd(event),
      maxAge: SESSION_TTL_DAYS * 24 * 60 * 60
    });

    return json({ ok: true });
  }

  // -------------------------
  // SIGNUP (INVITE CODE)
  // -------------------------
  const displayName = String(form.get('display_name') ?? '').trim();
  const inviteCode = String(form.get('invite_code') ?? '').trim();

  if (!displayName || !inviteCode) {
    return json({ ok: false, error: 'display_name and invite_code required' }, { status: 400 });
  }

  // Ensure username not taken
  const existing = await db.prepare(`SELECT 1 AS one FROM users WHERE username = ? LIMIT 1`).bind(username).first();
  if (existing?.one) return json({ ok: false, error: 'Username already taken' }, { status: 409 });

  // Validate invite
  const invite = await db
    .prepare(`SELECT code, role, used_by_user_id, expires_at FROM invite_codes WHERE code = ? LIMIT 1`)
    .bind(inviteCode)
    .first();

  if (!invite) return json({ ok: false, error: 'Invalid invite code' }, { status: 401 });
  if (invite.used_by_user_id) return json({ ok: false, error: 'Invite code already used' }, { status: 401 });
  const t = nowSec();
  if (invite.expires_at && Number(invite.expires_at) <= t) return json({ ok: false, error: 'Invite code expired' }, { status: 401 });

  const userId = crypto.randomUUID();
  const createdCode = generatePersonalCode();
  const loginHash = await hashCode(createdCode, userId);

  // create user
  await db.prepare(`INSERT INTO users (id, username, display_name, role, login_code_hash) VALUES (?, ?, ?, ?, ?)`)
    .bind(userId, username, displayName, invite.role || 'gm', loginHash)
    .run();

  // burn invite (single-use)
  await db.prepare(`UPDATE invite_codes SET used_by_user_id = ?, used_at = ? WHERE code = ? AND used_by_user_id IS NULL`)
    .bind(userId, t, inviteCode)
    .run();

  // create session
  const sessionId = crypto.randomUUID();
  const expiresAt = t + SESSION_TTL_DAYS * 24 * 60 * 60;

  await db.prepare(`INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)`)
    .bind(sessionId, userId, expiresAt)
    .run();

  cookies.set('auth_session', sessionId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd(event),
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60
  });

  // Return the code ONCE so user can save it
  return json({ ok: true, created_code: createdCode });
}
