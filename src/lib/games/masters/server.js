// src/lib/games/masters/server.js
import { fail } from '@sveltejs/kit';
import { upsertEntryForUser, getEntryForUser } from '$lib/server/db/entries.js';
import { getResultsForEvent } from '$lib/server/db/results.js';

const ENFORCE_MASTERS_PICK_WINDOW = false;


export function needsOptions() {
  return true;
}

// Basic version for now:
// - allow editing when "window open"
// - you said we’ll nail down timing later; this is a placeholder that matches your “locked during active hours” concept.
function isPickWindowLockedNow(nowSec) {
  const d = new Date(nowSec * 1000);
  const hour = d.getHours(); // server-local; good enough for now
  return hour >= 7 && hour < 19; // locked 7am–7pm
}

function safeStage(x) {
  const v = String(x || '').trim();
  if (!v) return 'pre_r1';
  return v;
}

export async function saveEntry({ db, event, userId, form, now }) {
  // Ignore `locked` (which is based on lock_at) and use our Masters window for now.
      if (ENFORCE_MASTERS_PICK_WINDOW) {
    const windowLocked = isPickWindowLockedNow(now);
    if (windowLocked) {
      return fail(403, {
        message: 'Masters picks are locked while play is active (7am–7pm). Try again later.'
      });
    }
  }




  const golferIdRaw = (form.get('golferId') || '').toString().trim();
  if (!golferIdRaw) return fail(400, { message: 'Pick a golfer.' });

  let golferSnapshot = null;
  const snapRaw = form.get('golferSnapshot');
  if (typeof snapRaw === 'string' && snapRaw.trim()) {
    try {
      const s = JSON.parse(snapRaw);
      golferSnapshot = {
        id: s?.id != null ? String(s.id) : String(golferIdRaw),
        name: s?.name ? String(s.name) : null,
        country: s?.country ? String(s.country) : null
      };
    } catch {
      golferSnapshot = { id: String(golferIdRaw), name: null, country: null };
    }
  } else {
    golferSnapshot = { id: String(golferIdRaw), name: null, country: null };
  }

  // Load prior entry so we can keep it sticky unless user changed
  const prev = await getEntryForUser({ db, eventId: event.id, userId });
  const prevPayload = prev?.payload || {};
  const prevGolferId = prevPayload?.golferId != null ? String(prevPayload.golferId) : null;

  // Determine current stage from results payload (admin-controlled for now)
  const results = await getResultsForEvent(db, event.id);
  const currentStage = safeStage(results?.payload?.stage || 'pre_r1');

  let lockStage = prevPayload?.lockStage ? String(prevPayload.lockStage) : currentStage;

  // Only update stage if user changed their pick
  if (prevGolferId && prevGolferId !== String(golferIdRaw)) {
    lockStage = currentStage;
  }
  if (!prevGolferId) {
    // first save => stage is current
    lockStage = currentStage;
  }

  const payload = {
    golferId: String(golferIdRaw),
    golferSnapshot,
    lockStage
  };

  await upsertEntryForUser({
    db,
    eventId: event.id,
    userId,
    payload,
    now
  });

  return { success: true };
}
