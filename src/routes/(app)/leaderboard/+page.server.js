// src/routes/(app)/leaderboard/+page.server.js
import { error } from '@sveltejs/kit';

function safeJsonParse(str) {
  try {
    return str ? JSON.parse(str) : null;
  } catch {
    return null;
  }
}

function buildTeamLogoMapFromEntries(rows) {
  const map = new Map();
  for (const r of rows || []) {
    const payload = safeJsonParse(r.payload_json) || {};
    const snaps = Array.isArray(payload.teamSnapshots) ? payload.teamSnapshots : [];
    for (const s of snaps) {
      const id = s?.id != null ? String(s.id) : '';
      const logo = s?.logo ? String(s.logo) : '';
      if (id && logo && !map.has(id)) map.set(id, logo);
    }
  }
  return Object.fromEntries(map);
}

export async function load({ platform }) {
  const db = platform?.env?.DB;
  if (!db) throw error(500, 'Database not available');

  // --- DEBUG: DB fingerprint (schema-safe; no assumption of entry_scores.id) ---
  try {
    const fp = await db
      .prepare(
        `
        SELECT
          (SELECT COUNT(*) FROM users) AS users,
          (SELECT COUNT(*) FROM entry_scores) AS entry_scores,
          (SELECT COALESCE(MIN(user_id), '') FROM entry_scores) AS min_user_id,
          (SELECT COALESCE(MAX(user_id), '') FROM entry_scores) AS max_user_id,
          (SELECT COALESCE(MIN(event_id), '') FROM entry_scores) AS min_event_id,
          (SELECT COALESCE(MAX(event_id), '') FROM entry_scores) AS max_event_id,
          (SELECT COALESCE(SUM(score_total), 0) FROM entry_scores) AS sum_points
        `
      )
      .first();

    console.log('LEADERBOARD DB FINGERPRINT:', fp);
  } catch (e) {
    console.log('LEADERBOARD DB FINGERPRINT: failed', e);
  }

  // Overall totals
  const totalsRes = await db
    .prepare(
      `
      SELECT
        u.id AS user_id,
        u.display_name,
        COALESCE(SUM(es.score_total), 0) AS points
      FROM users u
      LEFT JOIN entry_scores es ON es.user_id = u.id
      GROUP BY u.id
      ORDER BY points DESC, u.display_name ASC
      `
    )
    .all();

  const totals = (totalsRes.results ?? []).map((r, i) => ({
    rank: i + 1,
    user_id: r.user_id,
    display_name: r.display_name,
    points: Number(r.points ?? 0)
  }));

  // Per-event breakdown per user
  const breakdownRes = await db
    .prepare(
      `
      SELECT
        es.user_id,
        es.event_id,
        e.slug,
        e.type,
        e.name AS event_name,
        e.start_at,
        es.score_total,
        es.breakdown_json
      FROM entry_scores es
      JOIN events e ON e.id = es.event_id
      ORDER BY es.user_id, e.start_at ASC
      `
    )
    .all();

  const byUser = {};
  for (const r of breakdownRes.results ?? []) {
    const uid = r.user_id;
    if (!byUser[uid]) byUser[uid] = [];

    const breakdown = safeJsonParse(r.breakdown_json);
    
    const totals = breakdown?.totals ?? null;
    if (r.type === 'derby') {
      console.log('DERBY breakdown_json raw:', r.breakdown_json);
      console.log('DERBY breakdown parsed:', breakdown);
    }

    byUser[uid].push({
      event_id: r.event_id,
      slug: r.slug,
      type: r.type,
      event_name: r.event_name,
      start_at: r.start_at,
      points: Number(r.score_total ?? 0),
      breakdown,
      totals
    });
  }

  // --- Madness logos: build a teamId -> logo map from saved entry snapshots ---
  const entriesRes = await db
    .prepare(
      `
      SELECT user_id, payload_json
      FROM entries
      `
    )
    .all();

  const teamLogoById = buildTeamLogoMapFromEntries(entriesRes?.results ?? []);

  return { totals, byUser, teamLogoById };
}
