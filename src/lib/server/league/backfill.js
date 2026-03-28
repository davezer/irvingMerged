import { resolveLeagueStorage } from '$lib/server/league/db.js';

function nowEpoch() {
  return Math.floor(Date.now() / 1000);
}

function parseWeeksInput(value) {
  const raw = String(value ?? '').trim();

  if (!raw) {
    return Array.from({ length: 18 }, (_, i) => i + 1);
  }

  const parts = raw
    .split(',')
    .map((v) => Number(String(v).trim()))
    .filter((v) => Number.isInteger(v) && v > 0);

  return Array.from(new Set(parts)).sort((a, b) => a - b);
}

async function upsertRoster(db, roster, { season, leagueId }) {
  const storage = await resolveLeagueStorage(db);

  if (storage.hasSeasonalRosters) {
    await db
      .prepare(`
        INSERT INTO ${storage.rostersTable} (
          id,
          league_id,
          season,
          roster_id,
          owner_id,
          starters_json,
          players_json,
          settings_json,
          metadata_json,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          owner_id = excluded.owner_id,
          starters_json = excluded.starters_json,
          players_json = excluded.players_json,
          settings_json = excluded.settings_json,
          metadata_json = excluded.metadata_json,
          updated_at = excluded.updated_at
      `)
      .bind(
        `${leagueId}:${season}:${roster?.roster_id ?? 'unknown'}`,
        leagueId,
        season,
        roster?.roster_id ?? null,
        roster?.owner_id ?? null,
        JSON.stringify(roster?.starters ?? []),
        JSON.stringify(roster?.players ?? []),
        JSON.stringify(roster?.settings ?? {}),
        JSON.stringify(roster?.metadata ?? {}),
        nowEpoch()
      )
      .run();

    return;
  }

  await db
    .prepare(`
      INSERT INTO sleeper_rosters (
        roster_id,
        owner_id,
        starters_json,
        players_json,
        settings_json,
        metadata_json,
        updated_at,
        season,
        league_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(roster_id) DO UPDATE SET
        owner_id = excluded.owner_id,
        starters_json = excluded.starters_json,
        players_json = excluded.players_json,
        settings_json = excluded.settings_json,
        metadata_json = excluded.metadata_json,
        updated_at = excluded.updated_at,
        season = excluded.season,
        league_id = excluded.league_id
    `)
    .bind(
      roster?.roster_id ?? null,
      roster?.owner_id ?? null,
      JSON.stringify(roster?.starters ?? []),
      JSON.stringify(roster?.players ?? []),
      JSON.stringify(roster?.settings ?? {}),
      JSON.stringify(roster?.metadata ?? {}),
      nowEpoch(),
      season,
      leagueId
    )
    .run();
}

async function upsertTransaction(db, tx, { season, leagueId, round }) {
  const transactionId = String(
    tx?.transaction_id ?? `${leagueId}-${season}-${round}-${globalThis.crypto.randomUUID()}`
  );
  const storage = await resolveLeagueStorage(db);

  if (storage.hasSeasonalTransactions) {
    await db
      .prepare(`
        INSERT INTO ${storage.transactionsTable} (
          id,
          league_id,
          season,
          round,
          transaction_id,
          type,
          status,
          roster_ids_json,
          adds_json,
          drops_json,
          draft_picks_json,
          waiver_budget_json,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          type = excluded.type,
          status = excluded.status,
          roster_ids_json = excluded.roster_ids_json,
          adds_json = excluded.adds_json,
          drops_json = excluded.drops_json,
          draft_picks_json = excluded.draft_picks_json,
          waiver_budget_json = excluded.waiver_budget_json,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at,
          round = excluded.round
      `)
      .bind(
        `${leagueId}:${season}:${transactionId}`,
        leagueId,
        season,
        round,
        transactionId,
        tx?.type ?? null,
        tx?.status ?? null,
        JSON.stringify(tx?.roster_ids ?? []),
        JSON.stringify(tx?.adds ?? {}),
        JSON.stringify(tx?.drops ?? {}),
        JSON.stringify(tx?.draft_picks ?? []),
        JSON.stringify(tx?.waiver_budget ?? {}),
        tx?.created ? Math.floor(Number(tx.created) / 1000) : null,
        nowEpoch()
      )
      .run();

    return;
  }

  await db
    .prepare(`
      INSERT INTO sleeper_transactions (
        transaction_id,
        type,
        status,
        roster_ids_json,
        adds_json,
        drops_json,
        draft_picks_json,
        waiver_budget_json,
        created_at,
        updated_at,
        season,
        league_id,
        round
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(transaction_id) DO UPDATE SET
        type = excluded.type,
        status = excluded.status,
        roster_ids_json = excluded.roster_ids_json,
        adds_json = excluded.adds_json,
        drops_json = excluded.drops_json,
        draft_picks_json = excluded.draft_picks_json,
        waiver_budget_json = excluded.waiver_budget_json,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        season = excluded.season,
        league_id = excluded.league_id,
        round = excluded.round
    `)
    .bind(
      transactionId,
      tx?.type ?? null,
      tx?.status ?? null,
      JSON.stringify(tx?.roster_ids ?? []),
      JSON.stringify(tx?.adds ?? {}),
      JSON.stringify(tx?.drops ?? {}),
      JSON.stringify(tx?.draft_picks ?? []),
      JSON.stringify(tx?.waiver_budget ?? {}),
      tx?.created ? Math.floor(Number(tx.created) / 1000) : null,
      nowEpoch(),
      season,
      leagueId,
      round
    )
    .run();
}

async function createRun(db, { runId, leagueId, season }) {
  const storage = await resolveLeagueStorage(db);
  const columns = ['id', 'source', 'status', 'season', 'week'];
  const values = [runId, 'sleeper', 'running', season, null];

  if (storage.syncRunsHaveLeagueId) {
    columns.push('league_id');
    values.push(leagueId);
  }

  if (storage.syncRunsHaveMode) {
    columns.push('mode');
    values.push('backfill');
  }

  columns.push('summary_json', 'error_text', 'created_at');
  values.push(null, null, nowEpoch());

  const placeholders = columns.map((_, index) => `?${index + 1}`).join(', ');

  await db
    .prepare(`INSERT INTO league_sync_runs (${columns.join(', ')}) VALUES (${placeholders})`)
    .bind(...values)
    .run();
}

async function markRunOk(db, { runId, summary }) {
  await db
    .prepare(`
      UPDATE league_sync_runs
      SET status = ?, summary_json = ?
      WHERE id = ?
    `)
    .bind('ok', JSON.stringify(summary), runId)
    .run();
}

async function markRunError(db, { runId, error }) {
  await db
    .prepare(`
      UPDATE league_sync_runs
      SET status = ?, error_text = ?
      WHERE id = ?
    `)
    .bind('error', error?.message || 'Backfill failed', runId)
    .run();
}

export async function backfillSleeperSeason({
  db,
  leagueId,
  season,
  weeks,
  sleeperFetch
}) {
  if (!db) throw new Error('DB binding missing');
  if (!leagueId) throw new Error('Missing Sleeper league id');
  if (!season) throw new Error('Missing season');

  const runId = globalThis.crypto.randomUUID();
  const parsedWeeks = parseWeeksInput(weeks);

  await createRun(db, { runId, leagueId, season });

  try {
    const rosters = await sleeperFetch(`/league/${leagueId}/rosters`);
    for (const roster of rosters ?? []) {
      await upsertRoster(db, roster, { season, leagueId });
    }

    let transactionCount = 0;
    for (const round of parsedWeeks) {
      const transactions = await sleeperFetch(`/league/${leagueId}/transactions/${round}`);
      for (const tx of transactions ?? []) {
        await upsertTransaction(db, tx, { season, leagueId, round });
        transactionCount += 1;
      }
    }

    const summary = {
      ok: true,
      source: 'sleeper',
      mode: 'backfill',
      leagueId,
      season,
      weeks: parsedWeeks,
      rosterCount: Array.isArray(rosters) ? rosters.length : 0,
      transactionCount
    };

    await markRunOk(db, { runId, summary });
    return summary;
  } catch (error) {
    await markRunError(db, { runId, error });
    throw error;
  }
}
