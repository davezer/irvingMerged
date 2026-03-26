const SLEEPER_BASE = 'https://api.sleeper.app/v1';

function nowEpoch() {
  return Math.floor(Date.now() / 1000);
}

function makeId(prefix = 'lg') {
  return `${prefix}_${crypto.randomUUID()}`;
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

export async function upsertSleeperRosters(db, rosters = []) {
  const stmt = db.prepare(`
    INSERT INTO sleeper_rosters (
      roster_id,
      owner_id,
      starters_json,
      players_json,
      settings_json,
      metadata_json,
      updated_at
    )
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
    ON CONFLICT(roster_id) DO UPDATE SET
      owner_id = excluded.owner_id,
      starters_json = excluded.starters_json,
      players_json = excluded.players_json,
      settings_json = excluded.settings_json,
      metadata_json = excluded.metadata_json,
      updated_at = excluded.updated_at
  `);

  const batch = rosters.map((roster) => stmt.bind(
    Number(roster.roster_id),
    roster.owner_id ? String(roster.owner_id) : null,
    JSON.stringify(roster.starters || []),
    JSON.stringify(roster.players || []),
    JSON.stringify(roster.settings || {}),
    JSON.stringify(roster.metadata || {}),
    nowEpoch()
  ));

  if (batch.length) await db.batch(batch);
  return { count: batch.length };
}

export async function upsertSleeperTransactions(db, transactions = []) {
  const stmt = db.prepare(`
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
      updated_at
    )
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
    ON CONFLICT(transaction_id) DO UPDATE SET
      type = excluded.type,
      status = excluded.status,
      roster_ids_json = excluded.roster_ids_json,
      adds_json = excluded.adds_json,
      drops_json = excluded.drops_json,
      draft_picks_json = excluded.draft_picks_json,
      waiver_budget_json = excluded.waiver_budget_json,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at
  `);

  const batch = transactions.map((txn) => stmt.bind(
    String(txn.transaction_id),
    txn.type ? String(txn.type) : null,
    txn.status ? String(txn.status) : null,
    JSON.stringify(txn.roster_ids || []),
    JSON.stringify(txn.adds || {}),
    JSON.stringify(txn.drops || {}),
    JSON.stringify(txn.draft_picks || []),
    JSON.stringify(txn.waiver_budget || {}),
    txn.created ? Math.floor(Number(txn.created) / 1000) : null,
    nowEpoch()
  ));

  if (batch.length) await db.batch(batch);
  return { count: batch.length };
}

export async function logLeagueSyncRun(db, payload) {
  const stmt = db.prepare(`
    INSERT INTO league_sync_runs (id, source, status, season, week, summary_json, error_text, created_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
  `);

  await stmt.bind(
    makeId('sync'),
    payload.source || 'sleeper',
    payload.status || 'ok',
    payload.season ?? null,
    payload.week ?? null,
    payload.summary ? JSON.stringify(payload.summary) : null,
    payload.error_text || null,
    nowEpoch()
  ).run();
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

  const transactionGroups = await Promise.all(txnWeeks.map((w) => fetchSleeperTransactions(leagueId, w).catch(() => [])));
  const transactions = transactionGroups.flat();

  const usersSummary = await upsertSleeperUsers(db, users);
  const rostersSummary = await upsertSleeperRosters(db, rosters);
  const txSummary = await upsertSleeperTransactions(db, transactions);

  const summary = {
    leagueId,
    season,
    week,
    weeksBack,
    users: usersSummary.count,
    rosters: rostersSummary.count,
    transactions: txSummary.count
  };

  await logLeagueSyncRun(db, {
    source: 'sleeper',
    status: 'ok',
    season,
    week,
    summary
  });

  return summary;
}
