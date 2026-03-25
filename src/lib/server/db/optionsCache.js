// src/lib/server/db/optionsCache.js

export async function getOptionsCache({ db, eventId, provider, cacheKey, maxAgeSeconds }) {
  const row = await db
    .prepare(
      `SELECT payload_json, fetched_at
       FROM options_cache
       WHERE event_id = ? AND provider = ? AND cache_key = ?
       LIMIT 1`
    )
    .bind(eventId, provider, cacheKey)
    .first();

  if (!row) return null;

  const now = Math.floor(Date.now() / 1000);
  const age = now - Number(row.fetched_at);
  if (maxAgeSeconds != null && age > maxAgeSeconds) return null;

  try {
    return JSON.parse(row.payload_json);
  } catch {
    return null;
  }
}

export async function setOptionsCache({ db, eventId, provider, cacheKey, payload, fetchedAt }) {
  const payloadJson = JSON.stringify(payload);
  await db
    .prepare(
      `INSERT INTO options_cache (event_id, provider, cache_key, payload_json, fetched_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(event_id, provider, cache_key)
       DO UPDATE SET
         payload_json = excluded.payload_json,
         fetched_at = excluded.fetched_at`
    )
    .bind(eventId, provider, cacheKey, payloadJson, fetchedAt)
    .run();
}
