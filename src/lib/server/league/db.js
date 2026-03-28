export async function tableExists(db, name) {
  if (!db) return false;

  const row = await db
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`)
    .bind(name)
    .first()
    .catch(() => null);

  return !!row?.name;
}

export async function columnExists(db, tableName, columnName) {
  if (!db) return false;

  const rows = await db.prepare(`PRAGMA table_info(${tableName})`).all().catch(() => ({ results: [] }));
  return (rows?.results || []).some((row) => row.name === columnName);
}

export async function resolveLeagueStorage(db) {
  const hasSeasonalRosters = await tableExists(db, 'sleeper_rosters_seasonal');
  const hasSeasonalTransactions = await tableExists(db, 'sleeper_transactions_seasonal');
  const hasLeagueSyncRuns = await tableExists(db, 'league_sync_runs');

  return {
    hasLeagueSyncRuns,
    rostersTable: hasSeasonalRosters ? 'sleeper_rosters_seasonal' : 'sleeper_rosters',
    transactionsTable: hasSeasonalTransactions ? 'sleeper_transactions_seasonal' : 'sleeper_transactions',
    hasSeasonalRosters,
    hasSeasonalTransactions,
    legacyRostersHaveSeason: await columnExists(db, 'sleeper_rosters', 'season'),
    legacyTransactionsHaveSeason: await columnExists(db, 'sleeper_transactions', 'season'),
    syncRunsHaveLeagueId: await columnExists(db, 'league_sync_runs', 'league_id'),
    syncRunsHaveMode: await columnExists(db, 'league_sync_runs', 'mode')
  };
}
