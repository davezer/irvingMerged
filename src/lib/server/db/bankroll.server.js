// src/lib/server/db/bankroll.server.js

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Returns { userId, bankroll, usedDevFallback }
 *
 * - Bankroll is computed EXACTLY like leaderboard:
 *   users LEFT JOIN entry_scores, SUM(score_total)
 * - Attempts to resolve the user's row by:
 *   1) users.id === locals.user.id
 *   2) users.display_name === locals.user.displayName
 * - If bankroll == 0 and DEV_BANKROLL is set (local dev), fallback applies.
 */
export async function getUserBankrollLikeLeaderboard(db, localsUser, devBankroll = null) {
  const authId = localsUser?.id ? String(localsUser.id) : '';
  const displayName = localsUser?.displayName ? String(localsUser.displayName) : '';

  let row = null;

  // 1) If locals.user.id happens to match users.id
  if (authId) {
    row = await db
      .prepare(
        `
        SELECT
          u.id AS user_id,
          COALESCE(SUM(es.score_total), 0) AS points
        FROM users u
        LEFT JOIN entry_scores es ON es.user_id = u.id
        WHERE u.id = ?
        GROUP BY u.id
        LIMIT 1
        `
      )
      .bind(authId)
      .first();
  }

  // 2) Fallback: match by display_name (works in your current locals.user shape)
  if ((!row || !row.user_id) && displayName) {
    row = await db
      .prepare(
        `
        SELECT
          u.id AS user_id,
          COALESCE(SUM(es.score_total), 0) AS points
        FROM users u
        LEFT JOIN entry_scores es ON es.user_id = u.id
        WHERE u.display_name = ?
        GROUP BY u.id
        LIMIT 1
        `
      )
      .bind(displayName)
      .first();
  }

  const userId = row?.user_id ? String(row.user_id) : authId;
  let bankroll = Number(row?.points ?? 0);
  let usedDevFallback = false;

  // ✅ dev-only fallback (only when DB returns zero)
  if (bankroll === 0) {
    const fb = safeNumber(devBankroll);
    if (fb != null && fb > 0) {
      bankroll = fb;
      usedDevFallback = true;
    }
  }

  return { userId, bankroll, usedDevFallback };
}
