// src/lib/server/db/entries.js

export async function getEntryForUser({ db, eventId, userId }) {
  const row = await db
  .prepare(
    `SELECT id, event_id, user_id, payload_json, submitted_at, updated_at
     FROM entries
     WHERE event_id = ? AND user_id = ?
     ORDER BY updated_at DESC
     LIMIT 1`
  )
  .bind(eventId, userId)
  .first();

  if (!row) return null;

  return {
    ...row,
    payload: safeJsonParse(row.payload_json)
  };
}

export async function upsertEntryForUser({ db, eventId, userId, payload, now }) {
  const entryId = crypto.randomUUID(); // Workers-safe
  const payloadJson = JSON.stringify(payload);

  await db
    .prepare(
      `INSERT INTO entries (id, event_id, user_id, payload_json, submitted_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(event_id, user_id)
       DO UPDATE SET
         payload_json = excluded.payload_json,
         updated_at   = excluded.updated_at`
    )
    .bind(entryId, eventId, userId, payloadJson, now, now)
    .run();
}

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
