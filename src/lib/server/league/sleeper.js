import { resolveLeagueStorage } from '$lib/server/league/db.js';

const SLEEPER_BASE = 'https://api.sleeper.app/v1';

function nowEpoch() {
  return Math.floor(Date.now() / 1000);
}

function makeId(prefix = 'lg') {
  return `${prefix}_${globalThis.crypto.randomUUID()}`;
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      'accept': 'application/json'
    }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Sleeper request failed (${res.status}) for ${url}: ${text}`);
  }

  return res.json();
}

export async function fetchSleeperUsers(leagueId) {
  return fetchJson(`${SLEEPER_BASE}/league/${leagueId}/users`);
}

export async function fetchSleeperRosters(leagueId) {
  return fetchJson(`${SLEEPER_BASE}/league/${leagueId}/rosters`);
}

export async function fetchSleeperLeague(leagueId) {
  return fetchJson(`${SLEEPER_BASE}/league/${leagueId}`);
}

export async function fetchSleeperTransactions(leagueId, week) {
  return fetchJson(`${SLEEPER_BASE}/league/${leagueId}/transactions/${week}`);
}

export async function fetchSleeperMatchups(leagueId, week) {
  return fetchJson(`${SLEEPER_BASE}/league/${leagueId}/matchups/${week}`);
}

export async function upsertSleeperUsers(db, users = []) {
  const stmt = db.prepare(`
    INSERT INTO sleeper_users (sleeper_user_id, display_name, avatar, updated_at)
    VALUES (?1, ?2, ?3, ?4)
    ON CONFLICT(sleeper_user_id) DO UPDATE SET
      display_name = excluded.display_name,
      avatar = excluded.avatar,
      updated_at = excluded.updated_at
  `);

  const batch = users.map((user) => {
    const displayName = user.display_name || user.metadata?.team_name || user.username || 'Unknown';
    const avatar = user.avatar || null;
    return stmt.bind(String(user.user_id), String(displayName), avatar, nowEpoch());
  });

  if (batch.length) await db.batch(batch);
  return { count: batch.length };
}

export async function upsertSleeperRosters(db, rosters = [], options = {}) {
  const storage = await resolveLeagueStorage(db);
  const tableName = storage.rostersTable;
  const season = options.season ?? null;
  const leagueId = options.leagueId ?? null;

  const stmt = storage.hasSeasonalRosters
    ? db.prepare(`
        INSERT INTO ${tableName} (
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
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
        ON CONFLICT(id) DO UPDATE SET
          owner_id = excluded.owner_id,
          starters_json = excluded.starters_json,
          players_json = excluded.players_json,
          settings_json = excluded.settings_json,
          metadata_json = excluded.metadata_json,
          updated_at = excluded.updated_at
      `)
    : db.prepare(`
        INSERT INTO ${tableName} (
          roster_id,
          owner_id,
          starters_json,
          players_json,
          settings_json,
          metadata_json,
          updated_at,
          season,
          league_id
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
        ON CONFLICT(roster_id) DO UPDATE SET
          owner_id = excluded.owner_id,
          starters_json = excluded.starters_json,
          players_json = excluded.players_json,
          settings_json = excluded.settings_json,
          metadata_json = excluded.metadata_json,
          updated_at = excluded.updated_at,
          season = excluded.season,
          league_id = excluded.league_id
      `);

  const batch = rosters.map((roster) => {
    const rosterId = Number(roster.roster_id);
    const ownerId = roster.owner_id ? String(roster.owner_id) : null;
    const startersJson = JSON.stringify(roster.starters || []);
    const playersJson = JSON.stringify(roster.players || []);
    const settingsJson = JSON.stringify(roster.settings || {});
    const metadataJson = JSON.stringify(roster.metadata || {});
    const updatedAt = nowEpoch();

    if (storage.hasSeasonalRosters) {
      const id = `${leagueId || 'default'}:${season || 'current'}:${rosterId}`;
      return stmt.bind(
        id,
        leagueId,
        season,
        rosterId,
        ownerId,
        startersJson,
        playersJson,
        settingsJson,
        metadataJson,
        updatedAt
      );
    }

    return stmt.bind(
      rosterId,
      ownerId,
      startersJson,
      playersJson,
      settingsJson,
      metadataJson,
      updatedAt,
      season,
      leagueId
    );
  });

  if (batch.length) await db.batch(batch);
  return { count: batch.length, tableName };
}

export async function upsertSleeperTransactions(db, transactions = [], options = {}) {
  const storage = await resolveLeagueStorage(db);
  const tableName = storage.transactionsTable;
  const season = options.season ?? null;
  const leagueId = options.leagueId ?? null;

  const stmt = storage.hasSeasonalTransactions
    ? db.prepare(`
        INSERT INTO ${tableName} (
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
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
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
    : db.prepare(`
        INSERT INTO ${tableName} (
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
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
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
      `);

  const batch = transactions.map((txn) => {
    const transactionId = String(txn.transaction_id);
    const type = txn.type ? String(txn.type) : null;
    const status = txn.status ? String(txn.status) : null;
    const rosterIdsJson = JSON.stringify(txn.roster_ids || []);
    const addsJson = JSON.stringify(txn.adds || {});
    const dropsJson = JSON.stringify(txn.drops || {});
    const draftPicksJson = JSON.stringify(txn.draft_picks || []);
    const waiverBudgetJson = JSON.stringify(txn.waiver_budget || {});
    const createdAt = txn.created ? Math.floor(Number(txn.created) / 1000) : null;
    const updatedAt = nowEpoch();
    const round = options.round ?? txn.round ?? null;

    if (storage.hasSeasonalTransactions) {
      const id = `${leagueId || 'default'}:${season || 'current'}:${transactionId}`;
      return stmt.bind(
        id,
        leagueId,
        season,
        round,
        transactionId,
        type,
        status,
        rosterIdsJson,
        addsJson,
        dropsJson,
        draftPicksJson,
        waiverBudgetJson,
        createdAt,
        updatedAt
      );
    }

    return stmt.bind(
      transactionId,
      type,
      status,
      rosterIdsJson,
      addsJson,
      dropsJson,
      draftPicksJson,
      waiverBudgetJson,
      createdAt,
      updatedAt,
      season,
      leagueId,
      round
    );
  });

  if (batch.length) await db.batch(batch);
  return { count: batch.length, tableName };
}

export async function logLeagueSyncRun(db, payload) {
  const storage = await resolveLeagueStorage(db);
  const columns = ['id', 'source', 'status', 'season', 'week'];
  const values = [
    makeId('sync'),
    payload.source || 'sleeper',
    payload.status || 'ok',
    payload.season ?? null,
    payload.week ?? null
  ];

  if (storage.syncRunsHaveLeagueId) {
    columns.push('league_id');
    values.push(payload.leagueId ?? null);
  }

  if (storage.syncRunsHaveMode) {
    columns.push('mode');
    values.push(payload.mode || 'sync');
  }

  columns.push('summary_json', 'error_text', 'created_at');
  values.push(
    payload.summary ? JSON.stringify(payload.summary) : null,
    payload.error_text || null,
    nowEpoch()
  );

  const placeholders = columns.map((_, index) => `?${index + 1}`).join(', ');
  await db.prepare(`INSERT INTO league_sync_runs (${columns.join(', ')}) VALUES (${placeholders})`).bind(...values).run();
}

export async function syncSleeperLeagueData(env, options = {}) {
  const db = env?.DB;
  const leagueId = options.leagueId || env?.SLEEPER_LEAGUE_ID;
  const season = Number(options.season || env?.SLEEPER_DEFAULT_SEASON || new Date().getFullYear());
  const week = Number(options.week || env?.SLEEPER_DEFAULT_WEEK || 1);
  const weeksBack = Math.max(0, Number(options.weeksBack ?? 4));

  if (!db) throw new Error('DB binding missing.');
  if (!leagueId) throw new Error('SLEEPER_LEAGUE_ID is missing.');

  const users = await fetchSleeperUsers(leagueId);
  const rosters = await fetchSleeperRosters(leagueId);

  const startWeek = Math.max(1, week - weeksBack + 1);
  const txnWeeks = [];
  for (let w = startWeek; w <= week; w += 1) {
    txnWeeks.push(w);
  }

  const transactionGroups = await Promise.all(
    txnWeeks.map(async (round) => {
      const items = await fetchSleeperTransactions(leagueId, round).catch(() => []);
      return (items || []).map((item) => ({ ...item, round }));
    })
  );
  const transactions = transactionGroups.flat();

  const usersSummary = await upsertSleeperUsers(db, users);
  const rostersSummary = await upsertSleeperRosters(db, rosters, { season, leagueId });
  const txSummary = await upsertSleeperTransactions(db, transactions, { season, leagueId });

  const summary = {
    leagueId,
    season,
    week,
    weeksBack,
    users: usersSummary.count,
    rosters: rostersSummary.count,
    transactions: txSummary.count,
    rosterTable: rostersSummary.tableName,
    transactionTable: txSummary.tableName
  };

  await logLeagueSyncRun(db, {
    source: 'sleeper',
    mode: 'sync',
    status: 'ok',
    leagueId,
    season,
    week,
    summary
  });

  return summary;
}
