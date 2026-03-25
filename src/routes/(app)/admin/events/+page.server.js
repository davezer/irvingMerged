// src/routes/(app)/admin/events/+page.server.js
import { redirect, fail } from '@sveltejs/kit';
import { recomputeScoresForEvent } from '$lib/server/scoring/recompute.js';

export const load = async ({ locals, platform }) => {
  if (!locals.user) throw redirect(302, '/login');
  const db = platform.env.DB;

  const res = await db
    .prepare(
      `
      SELECT
        e.id,
        e.slug,
        e.name,
        e.type,
        e.lock_at,
        e.start_at,
        COALESCE(e.manual_lock, 0)   AS manual_lock,
        COALESCE(e.manual_unlock, 0) AS manual_unlock,

        r.published_at AS resultsPublishedAt,
        CASE WHEN r.published_at IS NOT NULL AND r.published_at != '' THEN 1 ELSE 0 END AS resultsPublished,

        COALESCE(ec.entry_count, 0) AS entriesSubmitted
      FROM events e
      LEFT JOIN results r ON r.event_id = e.id
      LEFT JOIN (
        SELECT event_id, COUNT(*) AS entry_count
        FROM entries
        GROUP BY event_id
      ) ec ON ec.event_id = e.id
      ORDER BY e.start_at ASC
      `
    )
    .all();

  const events = (res?.results ?? []).map((e) => ({
    ...e,
    manual_lock: Number(e.manual_lock) ? 1 : 0,
    manual_unlock: Number(e.manual_unlock) ? 1 : 0,
    resultsPublished: Boolean(e.resultsPublished),
    entriesSubmitted: Number(e.entriesSubmitted ?? 0)
  }));

  return { events };
};

export const actions = {
  // existing
  recompute: async ({ locals, platform, request }) => {
    if (!locals.user) throw redirect(302, '/login');
    const db = platform.env.DB;
    const form = await request.formData();

    const eventId = (form.get('eventId') || '').toString().trim();
    if (!eventId) return fail(400, { ok: false, error: 'Missing eventId' });

    const event = await db
      .prepare(`SELECT id, slug, name, type, start_at, lock_at FROM events WHERE id = ? LIMIT 1`)
      .bind(eventId)
      .first();

    if (!event) return fail(404, { ok: false, error: 'Event not found' });

    const out = await recomputeScoresForEvent(db, event);
    if (!out?.ok) return fail(400, { ok: false, error: out?.error || 'Recompute failed' });

    return { ok: true, count: out.count };
  },

  // ✅ new: lock controls
  setLockOverride: async ({ locals, platform, request }) => {
    if (!locals.user) throw redirect(302, '/login');
    const db = platform.env.DB;
    const form = await request.formData();

    const eventId = (form.get('eventId') || '').toString().trim();
    const mode = (form.get('mode') || '').toString().trim(); // 'lock' | 'unlock' | 'auto'
    if (!eventId) return fail(400, { ok: false, error: 'Missing eventId' });
    if (!['lock', 'unlock', 'auto'].includes(mode)) {
      return fail(400, { ok: false, error: 'Invalid mode' });
    }

    let manual_lock = 0;
    let manual_unlock = 0;

    if (mode === 'lock') manual_lock = 1;
    if (mode === 'unlock') manual_unlock = 1;
    // mode === 'auto' => both 0

    await db
      .prepare(
        `
        UPDATE events
        SET manual_lock = ?, manual_unlock = ?
        WHERE id = ?
        `
      )
      .bind(manual_lock, manual_unlock, eventId)
      .run();

    return { ok: true };
  }
};
