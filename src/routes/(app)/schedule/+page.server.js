// src/routes/(app)/schedule/+page.server.js
import { error } from '@sveltejs/kit';

export async function load({ platform, locals }) {
  const db = platform?.env?.DB;
  if (!db) throw error(500, 'Database not available');

  const eventsRes = await db
    .prepare(
      `
      SELECT
        id,
        slug,
        name,
        type,
        start_at,
        lock_at
      FROM events
      ORDER BY start_at ASC
    `
    )
    .all();

  const events = (eventsRes.results ?? []).map((e) => ({
    id: e.id,
    slug: e.slug,
    name: e.name,
    type: e.type,
    start_at: Number(e.start_at),
    lock_at: Number(e.lock_at)
  }));

  // If not logged in, we can still render schedule (just no per-user status)
  const userId = locals?.user?.id;
  if (!userId) return { events, myEntries: {} };

  // Pull this user's entries for any events (fast enough for small N)
  const entriesRes = await db
    .prepare(
      `
      SELECT
        id,
        event_id,
        submitted_at,
        updated_at
      FROM entries
      WHERE user_id = ?
    `
    )
    .bind(userId)
    .all();

  // Map: event_id -> entry summary
  const myEntries = {};
  for (const r of entriesRes.results ?? []) {
    myEntries[r.event_id] = {
      id: r.id,
      submitted_at: r.submitted_at ? Number(r.submitted_at) : null,
      updated_at: r.updated_at ? Number(r.updated_at) : null
    };
  }

  return { events, myEntries };
}
