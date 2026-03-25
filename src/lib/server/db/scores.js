// src/lib/server/db/scores.js
export async function upsertEntryScore(db, eventId, userId, scoreTotal, breakdown) {
  const breakdownJson = breakdown ? JSON.stringify(breakdown) : null;

  await db
    .prepare(`
      INSERT INTO entry_scores (event_id, user_id, score_total, breakdown_json, computed_at)
      VALUES (?, ?, ?, ?, (strftime('%Y-%m-%dT%H:%M:%fZ','now')))
      ON CONFLICT(event_id, user_id) DO UPDATE SET
        score_total = excluded.score_total,
        breakdown_json = excluded.breakdown_json,
        computed_at = (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    `)
    .bind(eventId, userId, scoreTotal, breakdownJson)
    .run();
}


export async function getLeaderboardTotals(db) {
  // total points across all events
  const rows = await db
    .prepare(`
      SELECT u.id as user_id,
             u.display_name as display_name,
             COALESCE(SUM(es.score_total), 0) as total_points
      FROM users u
      LEFT JOIN entry_scores es ON es.user_id = u.id
      GROUP BY u.id
      ORDER BY total_points DESC, u.display_name ASC
    `)
    .all();

  return rows?.results ?? [];
}

export async function getScoresForEvent(db, eventId) {
  const rows = await db
    .prepare(`
      SELECT es.user_id, u.display_name, es.score_total, es.breakdown_json
      FROM entry_scores es
      JOIN users u ON u.id = es.user_id
      WHERE es.event_id = ?
      ORDER BY es.score_total DESC, u.display_name ASC
    `)
    .bind(eventId)
    .all();

  return (rows?.results ?? []).map((r) => {
    let breakdown = null;
    try {
      breakdown = r.breakdown_json ? JSON.parse(r.breakdown_json) : null;
    } catch {breakdown = null;}
    return { ...r, breakdown };
  });
}
