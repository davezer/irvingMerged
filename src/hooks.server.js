function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function wantsHtml(event) {
  const accept = event.request.headers.get('accept') || '';
  return accept.includes('text/html');
}

const PUBLIC_PATHS = new Set(['/login']);

function isPublicPath(pathname) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/api/auth/')) return true;
  return false;
}

export async function handle({ event, resolve }) {
  const { platform, cookies, url } = event;
  const db = platform?.env?.DB;

  // 👇 locals always exists, but we can be extra safe
  event.locals = event.locals || {};
  event.locals.user = null;
  
  const sid = cookies.get('auth_session') || null;

  if (db && sid) {
    try {
      const row = await db
        .prepare(
          `SELECT s.id AS session_id, s.expires_at,
                  u.id AS user_id, u.display_name, u.role
           FROM sessions s
           JOIN users u ON u.id = s.user_id
           WHERE s.id = ?
           LIMIT 1`
        )
        .bind(sid)
        .first();

      if (row) {
        const expired = Number(row.expires_at) <= nowSec();
        if (expired) {
          await db.prepare(`DELETE FROM sessions WHERE id = ?`).bind(sid).run();
          cookies.delete('auth_session', { path: '/' });
        } else {
          event.locals.user = {
            id: row.user_id,
            displayName: row.display_name,
            role: row.role
          };
        }
      } else {
        cookies.delete('auth_session', { path: '/' });
      }
    } catch {
      // schema missing or any db issue → just clear cookie and keep going
      cookies.delete('auth_session', { path: '/' });
    }
  }

  if (!event.locals.user && !isPublicPath(url.pathname) && wantsHtml(event)) {
    return Response.redirect(new URL('/login', url), 303);
  }

  return resolve(event);
}
