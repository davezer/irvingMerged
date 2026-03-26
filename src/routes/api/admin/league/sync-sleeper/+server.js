import { json } from '@sveltejs/kit';
import { syncSleeperLeagueData, logLeagueSyncRun } from '$lib/server/league/sleeper';

export async function POST({ platform, request, locals }) {
  const env = platform?.env;
  const db = env?.DB;

  if (!db) {
    return json({ ok: false, error: 'DB binding missing.' }, { status: 500 });
  }

  // Relaxed role check: keep admins, allow no-auth local dev.
  const role = locals?.user?.role || null;
  if (role && role !== 'admin') {
    return json({ ok: false, error: 'Admin access required.' }, { status: 403 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const summary = await syncSleeperLeagueData(env, body);
    return json({ ok: true, summary });
  } catch (error) {
    await logLeagueSyncRun(db, {
      source: 'sleeper',
      status: 'error',
      season: body?.season ?? null,
      week: body?.week ?? null,
      error_text: error instanceof Error ? error.message : 'Unknown Sleeper sync error'
    }).catch(() => {});
    return json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown Sleeper sync error' },
      { status: 500 }
    );
  }
}
