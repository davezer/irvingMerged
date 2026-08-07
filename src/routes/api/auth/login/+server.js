import { json } from '@sveltejs/kit';
import { hashCode, normalizeUsername } from '$lib/server/authCodes.js';
import { hashPassword, validatePassword, verifyPassword } from '$lib/server/passwords.js';

const SESSION_TTL_DAYS = 30;

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function isProd(event) {
  const url = new URL(event.request.url);
  return url.protocol === 'https:';
}

async function createSession(event, userId) {
  const { platform, cookies } = event;
  const db = platform?.env?.DB;
  const sessionId = crypto.randomUUID();
  const expiresAt = nowSec() + SESSION_TTL_DAYS * 24 * 60 * 60;

  await db
    .prepare(`INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)`)
    .bind(sessionId, userId, expiresAt)
    .run();

  cookies.set('auth_session', sessionId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd(event),
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60
  });
}

async function readUser(db, username) {
  return db
    .prepare(`
      SELECT
        id,
        username,
        display_name,
        role,
        login_code_hash,
        password_hash,
        password_salt,
        password_iterations,
        password_set_at
      FROM users
      WHERE username = ?
      LIMIT 1
    `)
    .bind(username)
    .first();
}

function passwordsFromForm(form, { prefix = '' } = {}) {
  const password = String(form.get(`${prefix}password`) ?? '');
  const confirm = String(form.get(`${prefix}confirm_password`) ?? '');
  return { password, confirm };
}

export async function POST(event) {
  const { request, platform } = event;
  const db = platform?.env?.DB;

  if (!db) {
    return json({ ok: false, error: 'DB binding missing (platform.env.DB)' }, { status: 500 });
  }

  const form = await request.formData();
  const mode = String(form.get('mode') ?? 'returning').toLowerCase();
  const username = normalizeUsername(String(form.get('username') ?? ''));

  if (!username) {
    return json({ ok: false, error: 'Username required.' }, { status: 400 });
  }

  // ------------------------------------------------------------
  // RETURNING USER: username + password
  // ------------------------------------------------------------
  if (mode === 'returning') {
    const password = String(form.get('password') ?? '');
    if (!password) return json({ ok: false, error: 'Password required.' }, { status: 400 });

    const user = await readUser(db, username);
    if (!user) return json({ ok: false, error: 'Invalid username or password.' }, { status: 401 });

    if (!user.password_hash || !user.password_salt || !user.password_iterations) {
      return json(
        {
          ok: false,
          code: 'password_setup_required',
          error: 'This account has not set a password yet. Use “Set / reset password” with your old personal code.'
        },
        { status: 409 }
      );
    }

    const valid = await verifyPassword(
      password,
      user.password_hash,
      user.password_salt,
      user.password_iterations
    );

    if (!valid) return json({ ok: false, error: 'Invalid username or password.' }, { status: 401 });

    await createSession(event, user.id);
    return json({ ok: true });
  }

  // ------------------------------------------------------------
  // SIGNUP: invite code + chosen password
  // ------------------------------------------------------------
  if (mode === 'signup') {
    const displayName = String(form.get('display_name') ?? '').trim();
    const inviteCode = String(form.get('invite_code') ?? '').trim();
    const { password, confirm } = passwordsFromForm(form);

    if (!displayName || !inviteCode) {
      return json({ ok: false, error: 'Display name and invite code are required.' }, { status: 400 });
    }

    if (password !== confirm) {
      return json({ ok: false, error: 'Passwords do not match.' }, { status: 400 });
    }

    const validation = validatePassword(password);
    if (!validation.ok) return json({ ok: false, error: validation.error }, { status: 400 });

    const existing = await db
      .prepare(`SELECT 1 AS one FROM users WHERE username = ? LIMIT 1`)
      .bind(username)
      .first();

    if (existing?.one) {
      return json({ ok: false, error: 'Username already taken.' }, { status: 409 });
    }

    const invite = await db
      .prepare(`SELECT code, role, used_by_user_id, expires_at FROM invite_codes WHERE code = ? LIMIT 1`)
      .bind(inviteCode)
      .first();

    if (!invite) return json({ ok: false, error: 'Invalid invite code.' }, { status: 401 });
    if (invite.used_by_user_id) {
      return json({ ok: false, error: 'Invite code already used.' }, { status: 401 });
    }

    const t = nowSec();
    if (invite.expires_at && Number(invite.expires_at) <= t) {
      return json({ ok: false, error: 'Invite code expired.' }, { status: 401 });
    }

    const userId = crypto.randomUUID();
    const credential = await hashPassword(password);

    await db
      .prepare(`
        INSERT INTO users (
          id,
          username,
          display_name,
          role,
          login_code_hash,
          password_hash,
          password_salt,
          password_iterations,
          password_set_at
        ) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?)
      `)
      .bind(
        userId,
        username,
        displayName,
        invite.role || 'gm',
        credential.hash,
        credential.salt,
        credential.iterations,
        t
      )
      .run();

    await db
      .prepare(`UPDATE invite_codes SET used_by_user_id = ?, used_at = ? WHERE code = ? AND used_by_user_id IS NULL`)
      .bind(userId, t, inviteCode)
      .run();

    await createSession(event, userId);
    return json({ ok: true });
  }

  // ------------------------------------------------------------
  // RECOVERY / LEGACY CONVERSION
  // Old personal codes and admin-issued recovery codes both use
  // login_code_hash. The code is burned after a successful reset.
  // ------------------------------------------------------------
  if (mode === 'recover' || mode === 'legacy') {
    const recoveryCode = String(form.get('recovery_code') ?? form.get('personal_code') ?? '').trim();
    const { password, confirm } = passwordsFromForm(form, { prefix: 'new_' });

    if (!recoveryCode) {
      return json({ ok: false, error: 'Personal / recovery code required.' }, { status: 400 });
    }

    if (password !== confirm) {
      return json({ ok: false, error: 'Passwords do not match.' }, { status: 400 });
    }

    const validation = validatePassword(password);
    if (!validation.ok) return json({ ok: false, error: validation.error }, { status: 400 });

    const user = await readUser(db, username);
    if (!user) return json({ ok: false, error: 'User not found.' }, { status: 404 });

    if (!user.login_code_hash) {
      return json(
        {
          ok: false,
          error: 'No recovery code is active for this account. Ask an admin to issue one.'
        },
        { status: 409 }
      );
    }

    const computed = await hashCode(recoveryCode, user.id);
    if (computed !== user.login_code_hash) {
      return json({ ok: false, error: 'Invalid personal / recovery code.' }, { status: 401 });
    }

    const credential = await hashPassword(password);
    const t = nowSec();

    // Burn the recovery code, set the new password, and invalidate old sessions.
    await db
      .prepare(`
        UPDATE users
        SET
          password_hash = ?,
          password_salt = ?,
          password_iterations = ?,
          password_set_at = ?,
          login_code_hash = NULL
        WHERE id = ?
      `)
      .bind(
        credential.hash,
        credential.salt,
        credential.iterations,
        t,
        user.id
      )
      .run();

    await db.prepare(`DELETE FROM sessions WHERE user_id = ?`).bind(user.id).run();
    await createSession(event, user.id);

    return json({ ok: true, password_set: true });
  }

  return json({ ok: false, error: 'Unknown login mode.' }, { status: 400 });
}
