// src/routes/api/events/[slug]/options/+server.js
import { json } from '@sveltejs/kit';
import { getOptionsForEvent } from '$lib/games/options.js';

export async function GET({ params, platform, fetch }) {
  const db = platform?.env?.DB;
  if (!db) return json({ error: 'Database not available' }, { status: 500 });

  const slug = params.slug;

  const event = await db
    .prepare(`SELECT id, slug, type, start_at, name FROM events WHERE slug = ? LIMIT 1`)
    .bind(slug)
    .first();

  if (!event) return json({ error: 'Event not found' }, { status: 404 });

  const out = await getOptionsForEvent({
    db,
    event,
    // ✅ MUST use SvelteKit fetch (Cloudflare-safe + supports relative URLs)
    fetchImpl: fetch
  });

  // optional: mild caching of the API response itself (you already cache inside options.js)
  return json(out, {
    headers: {
      'cache-control': 'max-age=60'
    }
  });
}
