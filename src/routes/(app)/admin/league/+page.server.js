import { fail } from '@sveltejs/kit';
import { listLeagueCacheKeys } from '$lib/server/league/cacheStore.js';

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

  return { ok: true, result: payload };
}

export async function load() {
  return {
    recentRuns: [],
    cacheKeys: listLeagueCacheKeys('sleeper:').slice(0, 60)
  };
}

export const actions = {
  flushLeagueCache: async ({ request, fetch }) => {
    const form = await request.formData();
    const prefix = String(form.get('prefix') || 'sleeper:').trim();
    return postJson(fetch, '/api/admin/league/flush-cache', { prefix });
  }
};
