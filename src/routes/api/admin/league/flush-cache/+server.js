import { json } from '@sveltejs/kit';
import { clearLeagueCache, listLeagueCacheKeys } from '$lib/server/league/cacheStore.js';

export async function POST({ request, locals }) {
  const role = locals?.user?.role || null;
  if (role && role !== 'admin') {
    return json({ ok: false, error: 'Admin access required.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const prefix = String(body?.prefix || 'sleeper:').trim();
  const before = listLeagueCacheKeys(prefix);
  const result = await clearLeagueCache({ prefix });

  return json({ ok: true, prefix, before: before.length, ...result });
}
