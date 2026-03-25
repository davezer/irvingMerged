// src/lib/games/adminResults.server.js
import { fail } from '@sveltejs/kit';
import { getResultsForEvent, upsertResultsForEvent } from '$lib/server/db/results.js';
import { recomputeScoresForEvent } from '$lib/server/scoring/recompute.js';

import * as daytona from '$lib/games/daytona/adminResults.server.js';
import * as madness from '$lib/games/madness/adminResults.server.js';
import * as masters from '$lib/games/masters/adminResults.server.js';
import * as derby from '$lib/games/kentucky-derby/adminResults.server.js';
import * as worldcup from '$lib/games/worldcup/adminResults.server.js';

const HANDLERS = {
  daytona,
  madness,
  masters,
  derby,
  worldcup
};

function safeJsonParse(str) {
  try {
    return str ? JSON.parse(str) : null;
  } catch {
    return null;
  }
}

export async function getEventBySlug(db, slug) {
  return db
    .prepare(`SELECT * FROM events WHERE slug = ? LIMIT 1`)
    .bind(slug)
    .first();
}

/**
 * Shared: load entries + scores for any event.
 */
export async function loadEntriesWithScores({ db, eventId }) {
  const entriesRes = await db
    .prepare(
      `
      SELECT
        e.user_id,
        u.display_name,
        e.payload_json,
        e.submitted_at,
        e.updated_at
      FROM entries e
      JOIN users u ON u.id = e.user_id
      WHERE e.event_id = ?
      ORDER BY e.updated_at DESC, e.submitted_at DESC
      `
    )
    .bind(eventId)
    .all();

  const entries = (entriesRes?.results || []).map((r) => ({
    user_id: r.user_id,
    display_name: r.display_name,
    submitted_at: r.submitted_at,
    updated_at: r.updated_at,
    payload: safeJsonParse(r.payload_json) || {}
  }));

  const scoresRes = await db
    .prepare(
      `
      SELECT user_id, score_total, breakdown_json
      FROM entry_scores
      WHERE event_id = ?
      `
    )
    .bind(eventId)
    .all();

  const scoreByUserId = new Map(
    (scoresRes?.results || []).map((r) => {
      let breakdown = null;
      try {
        breakdown = r.breakdown_json ? JSON.parse(r.breakdown_json) : null;
      } catch {
        breakdown = null;
      }
      return [r.user_id, { score_total: r.score_total ?? 0, breakdown }];
    })
  );

  return entries.map((e) => ({ ...e, score: scoreByUserId.get(e.user_id) ?? null }));
}

export async function mergeResultsPayload({ db, eventId, patch, now, setPublishedAt = false, slug = null }) {
  const current = await getResultsForEvent(db, eventId);
  const base = current?.payload && typeof current.payload === 'object' ? current.payload : {};
  const next = { ...base, ...(patch && typeof patch === 'object' ? patch : {}) };

  const nowSec = Number.isFinite(now) ? Number(now) : Math.floor(Date.now() / 1000);

  await upsertResultsForEvent(db, eventId, next, {
    nowSec,
    setPublishedAt,
    slug
  });

  return next;
}

export async function loadAdminResults({ db, event, fetchImpl }) {
  const handler = HANDLERS[event.type];
  if (!handler?.load) {
    const results = await getResultsForEvent(db, event.id);
    const entries = await loadEntriesWithScores({ db, eventId: event.id });
    return { event, results, entries };
  }

  return handler.load({ db, event, fetchImpl });
}

export async function actionPublish({ db, event, request, fetchImpl }) {
  const handler = HANDLERS[event.type];
  if (!handler?.publish) return fail(400, { ok: false, error: 'Unsupported event type for publishing.' });

  const form = await request.formData();
  const out = await handler.publish({ db, event, form, fetchImpl });
  if (!out?.ok) return out;

  const recompute = await recomputeScoresForEvent(db, event);
  if (!recompute.ok) return fail(400, { ok: false, error: recompute.error });

  // Mark event as published (unix seconds)
  await db
    .prepare(
      `
      UPDATE events
      SET results_published_at = unixepoch()
      WHERE id = ?
      `
    )
    .bind(event.id)
    .run();

  return { ok: true, count: recompute.count };
}

export async function actionSyncSeeds({ db, event, request, fetchImpl }) {
  const handler = HANDLERS[event.type];
  if (!handler?.syncSeeds) return fail(400, { ok: false, error: 'Seed sync not supported for this event.' });

  const form = await request.formData();
  return handler.syncSeeds({ db, event, form, fetchImpl });
}

export async function actionSetSeed({ db, event, request }) {
  const handler = HANDLERS[event.type];
  if (!handler?.setSeed) {
    return fail(400, { ok: false, error: 'Seed updates not supported for this event type.' });
  }

  const form = await request.formData();
  const out = await handler.setSeed({ db, event, form });
  if (!out?.ok) return out;

  return out;
}

export async function actionSetWinState({ db, event, request }) {
  const handler = HANDLERS[event.type];
  if (!handler?.setWinState) {
    return fail(400, { ok: false, error: 'Win updates not supported for this event type.' });
  }

  const form = await request.formData();
  const out = await handler.setWinState({ db, event, form });
  if (!out?.ok) return out;

  return out;
}

export async function actionSetCurrentStage({ db, event, request }) {
  const handler = HANDLERS[event.type];
  if (!handler?.setCurrentStage) {
    return fail(400, { ok: false, error: 'Stage updates not supported for this event type.' });
  }

  const form = await request.formData();
  const out = await handler.setCurrentStage({ db, event, form });
  if (!out?.ok) return out;

  return out;
}

export async function actionAdvanceRound({ db, event, request, fetchImpl }) {
  const handler = HANDLERS[event.type];
  if (!handler?.advanceRound) return fail(400, { ok: false, error: 'Advance not supported for this event type.' });

  const form = await request.formData();
  // form unused but keeps signature consistent
  return handler.advanceRound({ db, event, form, fetchImpl });
}

export async function actionResetEntries({ db, event }) {
  const eventId = event.id;

  // 1. Delete scores FIRST (FK safety)
  await db
    .prepare(`DELETE FROM entry_scores WHERE event_id = ?`)
    .bind(eventId)
    .run();

  // 2. Delete entries
  await db
    .prepare(`DELETE FROM entries WHERE event_id = ?`)
    .bind(eventId)
    .run();

  return { ok: true };
}

export async function actionUnpublish({ db, event }) {
  if (!event?.id) return fail(400, { ok: false, error: 'Invalid event' });

  const eventId = event.id;

  // 1) Clear global published flag
  const upd = await db
    .prepare(
      `
      UPDATE events
      SET results_published_at = NULL
      WHERE id = ?
      `
    )
    .bind(eventId)
    .run();

  if (!upd?.success) {
    return fail(500, { ok: false, error: 'Failed to update event publish state.' });
  }

  // 2) Remove computed scores
  await db
    .prepare(`DELETE FROM entry_scores WHERE event_id = ?`)
    .bind(eventId)
    .run();

  // 3) Optional: clear per-game results published timestamp if supported.
  try {
    await db
      .prepare(`UPDATE results SET published_at = NULL WHERE event_id = ?`)
      .bind(eventId)
      .run();
  } catch {
    // ignore if results table doesn't have published_at
  }

  return { ok: true };
}

export async function actionResetTournament({ db, event }) {
  const handler = HANDLERS[event.type];
  if (!handler?.resetTournament)
    return fail(400, { ok: false, error: 'Reset tournament not supported for this event type.' });

  return handler.resetTournament({ db, event });
}

export async function actionToggleEliminated({ db, event, request }) {
  const handler = HANDLERS[event.type];
  if (!handler?.toggleEliminated)
    return fail(400, { ok: false, error: 'Team elimination not supported for this event type.' });

  const form = await request.formData();
  const out = await handler.toggleEliminated({ db, event, form });
  if (!out?.ok) return out;

  return out;
}
