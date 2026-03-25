import { json } from '@sveltejs/kit';

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function makeInviteCode() {
  // friendly + strong-ish, no ambiguous chars
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);

  let raw = '';
  for (let i = 0; i < bytes.length; i++) raw += alphabet[bytes[i] % alphabet.length];

  // e.g. XXXXX-XXXXX
  return `${raw.slice(0, 5)}-${raw.slice(5, 10)}`;
}

export async function GET({ platform, locals }) {
  const db = platform?.env?.DB;
  if (!db) return json({ ok: false, error: 'DB binding missing' }, { status: 500 });

  if (!locals.user) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  if (locals.user.role !== 'admin') return json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const rows = await db.prepare(
    `SELECT code, role, created_at, used_at, used_by_user_id
     FROM invite_codes
     ORDER BY created_at DESC
     LIMIT 50`
  ).all();

  return json({ ok: true, invites: rows.results || [] });
}

export async function POST({ request, platform, locals }) {
  const db = platform?.env?.DB;
  if (!db) return json({ ok: false, error: 'DB binding missing' }, { status: 500 });

  if (!locals.user) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  if (locals.user.role !== 'admin') return json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const role = body?.role === 'admin' ? 'admin' : 'gm';

  // optional expiry in days
  const expiresDays = Number(body?.expires_days || 0);
  const expiresAt = expiresDays > 0 ? nowSec() + expiresDays * 24 * 60 * 60 : null;

  // try a few times in case of collision
  for (let i = 0; i < 5; i++) {
    const code = makeInviteCode();
    const r = await db.prepare(
      `INSERT OR IGNORE INTO invite_codes (code, role, expires_at) VALUES (?, ?, ?)`
    ).bind(code, role, expiresAt).run();

    if (r.success && r.meta?.changes === 1) {
      return json({ ok: true, code, role, expires_at: expiresAt });
    }
  }

  return json({ ok: false, error: 'Failed to generate invite code (retry)' }, { status: 500 });
}
