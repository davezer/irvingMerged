// src/routes/(app)/admin/events/[slug]/results/+page.server.js
import { error, redirect, fail } from '@sveltejs/kit';
import {
  getEventBySlug,
  loadAdminResults,
  actionPublish,
  actionSyncSeeds,
  actionResetEntries,
  actionUnpublish,
  actionResetTournament,
  actionToggleEliminated,
  actionSetSeed,
  actionSetWinState,
  actionSetCurrentStage
} from '$lib/games/adminResults.server.js';

export const load = async ({ locals, platform, params, fetch }) => {
  if (!locals.user) throw redirect(302, '/login');

  const db = platform.env.DB;
  const event = await getEventBySlug(db, params.slug);
  if (!event) throw error(404, 'Event not found');

  return loadAdminResults({ db, event, fetchImpl: fetch });
};

export const actions = {
  syncSeeds: async ({ locals, platform, params, request, fetch }) => {
    if (!locals.user) throw redirect(302, '/login');

    const db = platform.env.DB;
    const event = await getEventBySlug(db, params.slug);
    if (!event) return fail(404, { ok: false, error: 'Event not found' });

    return actionSyncSeeds({ db, event, request, fetchImpl: fetch });
  },

  publish: async ({ locals, platform, params, request, fetch }) => {
    if (!locals.user) throw redirect(302, '/login');

    const db = platform.env.DB;
    const event = await getEventBySlug(db, params.slug);
    if (!event) return fail(404, { ok: false, error: 'Event not found' });

    return actionPublish({ db, event, request, fetchImpl: fetch });
  },

  unpublish: async ({ locals, platform, params, request }) => {
    if (!locals.user) throw redirect(302, '/login');

    const db = platform.env.DB;
    const event = await getEventBySlug(db, params.slug);
    if (!event) return fail(404, { ok: false, error: 'Event not found' });

    return actionUnpublish({ db, event, request });
  },

  setSeed: async ({ locals, platform, params, request }) => {
    if (!locals.user) throw redirect(302, '/login');

    const db = platform.env.DB;
    const event = await getEventBySlug(db, params.slug);
    if (!event) return fail(404, { ok: false, error: 'Event not found' });

    return actionSetSeed({ db, event, request });
  },

  setWinState: async ({ locals, platform, params, request }) => {
    if (!locals.user) throw redirect(302, '/login');

    const db = platform.env.DB;
    const event = await getEventBySlug(db, params.slug);
    if (!event) return fail(404, { ok: false, error: 'Event not found' });

    return actionSetWinState({ db, event, request });
  },

  setCurrentStage: async ({ locals, platform, params, request }) => {
    if (!locals.user) throw redirect(302, '/login');

    const db = platform.env.DB;
    const event = await getEventBySlug(db, params.slug);
    if (!event) return fail(404, { ok: false, error: 'Event not found' });

    return actionSetCurrentStage({ db, event, request });
  },

  toggleEliminated: async ({ locals, platform, params, request }) => {
    if (!locals.user) throw redirect(302, '/login');

    const db = platform.env.DB;
    const event = await getEventBySlug(db, params.slug);
    if (!event) return fail(404, { ok: false, error: 'Event not found' });

    return actionToggleEliminated({ db, event, request });
  },

  resetEntries: async ({ locals, platform, params, request }) => {
    if (!locals.user) throw redirect(302, '/login');

    const db = platform.env.DB;
    const event = await getEventBySlug(db, params.slug);
    if (!event) return fail(404, { ok: false, error: 'Event not found' });

    return actionResetEntries({ db, event, request });
  },

  resetTournament: async ({ locals, platform, params }) => {
    if (!locals.user) throw redirect(302, '/login');

    const db = platform.env.DB;
    const event = await getEventBySlug(db, params.slug);
    if (!event) return fail(404, { ok: false, error: 'Event not found' });

    return actionResetTournament({ db, event });
  }
};
