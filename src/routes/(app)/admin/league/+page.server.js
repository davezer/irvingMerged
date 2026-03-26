import { fail } from '@sveltejs/kit';
import { getAdminLeagueDeck } from '$lib/server/league';

async function postJson(fetch, path, body = {}) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = { ok: res.ok, status: res.status };
  }

  if (!res.ok) {
    return fail(res.status, {
      ok: false,
      actionError: payload?.error || `Request failed with ${res.status}`,
      actionResult: payload,
      deck: getAdminLeagueDeck()
    });
  }

  return {
    ok: true,
    actionResult: payload,
    deck: getAdminLeagueDeck()
  };
}

export function load() {
  return {
    deck: getAdminLeagueDeck(),
    actionResult: null,
    actionError: null
  };
}

export const actions = {
  syncSleeper: async ({ fetch }) => {
    return postJson(fetch, '/api/admin/league/sync-sleeper');
  },

  rebuildBadges: async ({ fetch }) => {
    return postJson(fetch, '/api/admin/league/rebuild-badges');
  },

  recalcDraftEconomy: async ({ fetch }) => {
    return postJson(fetch, '/api/admin/league/recalc-draft-economy');
  }
};
