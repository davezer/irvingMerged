// src/lib/server/db/users.js

export async function resolveDbUserId(db, localsUser) {
  const rawId = localsUser?.id ? String(localsUser.id) : '';
  const displayName = localsUser?.displayName ? String(localsUser.displayName) : '';

  // 1) Best case: locals.user.id already matches users.id
  if (rawId) {
    const byId = await db
      .prepare(`SELECT id FROM users WHERE id = ? LIMIT 1`)
      .bind(rawId)
      .first();

    if (byId?.id) return String(byId.id);
  }

  // 2) Fallback: match by display_name (works for you right now)
  if (displayName) {
    const byName = await db
      .prepare(`SELECT id FROM users WHERE display_name = ? LIMIT 1`)
      .bind(displayName)
      .first();

    if (byName?.id) return String(byName.id);
  }

  // last resort: return rawId so things don't hard-crash
  return rawId;
}
