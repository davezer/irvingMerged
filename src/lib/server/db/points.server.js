// src/lib/db/points.server.js

export async function getUserTotalPoints(db, userId) {
  const row = await db
    .prepare(`SELECT COALESCE(SUM(score_total), 0) AS points FROM entry_scores WHERE user_id = ?`)
    .bind(String(userId))
    .first();

  return Number(row?.points ?? 0);
}
