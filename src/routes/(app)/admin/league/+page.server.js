import { fail } from '@sveltejs/kit';

import { parseSeasonParam } from '$lib/server/league/season.js';

async function postJson(fetch, url, body = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = { ok: false, error: `Non-JSON response from ${url}` };
  }

  if (!res.ok) {
    return fail(res.status, {
      ok: false,
      error: payload?.error || `Request failed (${res.status})`,
      result: payload ?? null
    });
  }

  return {
    ok: true,
    result: payload
  };
}

export async function load({ platform }) {
  const db = platform?.env?.DB;

  let recentRuns = [];
  if (db) {
    try {
      const rs = await db
        .prepare(`
          SELECT id, season, week, status, mode, created_at, summary_json, error_text
          FROM league_sync_runs
          ORDER BY created_at DESC
          LIMIT 10
        `)
        .all();

      recentRuns = rs?.results || [];
    } catch {
      recentRuns = [];
    }
  }

  return { recentRuns };
}

export const actions = {
  syncSleeper: async ({ fetch }) => {
    return await postJson(fetch, '/api/admin/league/sync-sleeper', {});
  },

  rebuildBadges: async ({ fetch }) => {
    return await postJson(fetch, '/api/admin/league/rebuild-badges', {});
  },

  recalcDraftEconomy: async ({ fetch }) => {
    return await postJson(fetch, '/api/admin/league/recalc-draft-economy', {});
  },

  backfillSeason: async ({ request, platform, fetch }) => {
    const db = platform?.env?.DB;
    if (!db) {
      return fail(500, { ok: false, error: 'DB binding missing' });
    }

    const form = await request.formData();
    const season = parseSeasonParam(form.get('season'));
    const weeks = String(form.get('weeks') || '');
    const leagueId = String(form.get('leagueId') || platform?.env?.SLEEPER_LEAGUE_ID || '').trim();

    if (!leagueId) {
      return fail(400, { ok: false, error: 'Missing league id' });
    }

    const { backfillSleeperSeason } = await import('$lib/server/league/backfill.js');

    const sleeperFetch = async (path) => {
      const res = await fetch(`https://api.sleeper.app/v1${path}`);
      if (!res.ok) throw new Error(`Sleeper request failed: ${res.status}`);
      return res.json();
    };

    try {
      const summary = await backfillSleeperSeason({
        db,
        leagueId,
        season,
        weeks,
        sleeperFetch
      });

      return {
        ok: true,
        result: summary
      };
    } catch (error) {
      return fail(500, {
        ok: false,
        error: error?.message || 'Backfill failed'
      });
    }
  }
};
