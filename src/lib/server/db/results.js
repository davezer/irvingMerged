// src/lib/server/db/results.js

function safeJsonParse(str) {
  try {
    return str ? JSON.parse(str) : null;
  } catch {
    return null;
  }
}

/**
 * Get results payload for an event. Works even if the results table
 * doesn't have optional columns like id or slug.
 */
export async function getResultsForEvent(db, eventId) {
  // Try "full" schema first (id/slug exist)
  try {
    const row = await db
      .prepare(
        `
        SELECT id, event_id, slug, payload_json, published_at
        FROM results
        WHERE event_id = ?
        ORDER BY
          CASE WHEN published_at IS NULL THEN 0 ELSE 1 END DESC,
          published_at DESC,
          id DESC
        LIMIT 1
        `
      )
      .bind(eventId)
      .first();

    if (!row) return null;

    return {
      id: row.id ?? null,
      event_id: row.event_id,
      slug: row.slug ?? null,
      published_at: row.published_at ? Number(row.published_at) : null,
      payload: safeJsonParse(row.payload_json) ?? {}
    };
  } catch {
    // Fallback: minimal schema (event_id, payload_json, published_at)
    const row = await db
      .prepare(
        `
        SELECT event_id, payload_json, published_at
        FROM results
        WHERE event_id = ?
        ORDER BY
          CASE WHEN published_at IS NULL THEN 0 ELSE 1 END DESC,
          published_at DESC
        LIMIT 1
        `
      )
      .bind(eventId)
      .first();

    if (!row) return null;

    return {
      id: null,
      event_id: row.event_id,
      slug: null,
      published_at: row.published_at ? Number(row.published_at) : null,
      payload: safeJsonParse(row.payload_json) ?? {}
    };
  }
}

/**
 * Upsert results for an event by event_id (source of truth).
 *
 * opts:
 * - slug: optional, stored if the column exists
 * - nowSec: unix seconds used for published_at when setPublishedAt = true
 * - setPublishedAt: if true, writes published_at = nowSec
 */
export async function upsertResultsForEvent(db, eventId, payload, opts = {}) {
  const nowSec = Number.isFinite(opts.nowSec) ? Number(opts.nowSec) : Math.floor(Date.now() / 1000);
  const setPublishedAt = opts.setPublishedAt ? 1 : 0;
  const slug = opts.slug != null ? String(opts.slug) : null;

  const payloadJson = JSON.stringify(payload ?? {});

  // 1) Try update with slug (if slug column exists)
  try {
    const upd = await db
      .prepare(
        `
        UPDATE results
        SET
          payload_json = ?,
          slug = COALESCE(?, slug),
          published_at = CASE WHEN ? = 1 THEN ? ELSE published_at END
        WHERE event_id = ?
        `
      )
      .bind(payloadJson, slug, setPublishedAt, nowSec, eventId)
      .run();

    if (upd?.meta?.changes > 0) return { ok: true };
  } catch {
    // Retry update without slug
    const upd2 = await db
      .prepare(
        `
        UPDATE results
        SET
          payload_json = ?,
          published_at = CASE WHEN ? = 1 THEN ? ELSE published_at END
        WHERE event_id = ?
        `
      )
      .bind(payloadJson, setPublishedAt, nowSec, eventId)
      .run();

    if (upd2?.meta?.changes > 0) return { ok: true };
  }

  // 2) Insert new row (MUST include event_id)
  // Try with slug first; fallback if slug column doesn't exist.
  try {
    await db
      .prepare(
        `
        INSERT INTO results (event_id, slug, payload_json, published_at)
        VALUES (?, ?, ?, ?)
        `
      )
      .bind(eventId, slug, payloadJson, opts.setPublishedAt ? nowSec : null)
      .run();

    return { ok: true };
  } catch {
    await db
      .prepare(
        `
        INSERT INTO results (event_id, payload_json, published_at)
        VALUES (?, ?, ?)
        `
      )
      .bind(eventId, payloadJson, opts.setPublishedAt ? nowSec : null)
      .run();

    return { ok: true };
  }
}
