import { json } from '@sveltejs/kit';

export async function GET({ locals }) {
  if (!locals.user) return json({ ok: false, user: null }, { status: 200 });
  return json({ ok: true, user: locals.user }, { status: 200 });
}
