function safeJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function avatarUrl(avatar) {
  return avatar ? `https://sleepercdn.com/avatars/${avatar}` : null;
}

function initials(name = '') {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export async function getLeagueRosters(db) {
  const result = await db.prepare(`
    SELECT
      r.roster_id,
      r.owner_id,
      r.starters_json,
      r.players_json,
      r.settings_json,
      r.metadata_json,
      u.display_name,
      u.avatar,
      m.slug AS manager_slug,
      m.display_name AS manager_name
    FROM sleeper_rosters r
    LEFT JOIN sleeper_users u
      ON u.sleeper_user_id = r.owner_id
    LEFT JOIN managers m
      ON LOWER(TRIM(m.display_name)) = LOWER(TRIM(u.display_name))
    ORDER BY COALESCE(m.display_name, u.display_name, 'zzz') ASC
  `).all();

  const rows = result?.results || [];
  return rows.map((row) => {
    const players = safeJson(row.players_json, []);
    const starters = safeJson(row.starters_json, []);
    const settings = safeJson(row.settings_json, {});
    const metadata = safeJson(row.metadata_json, {});
    const displayName = row.manager_name || row.display_name || metadata?.team_name || `Roster ${row.roster_id}`;

    return {
      rosterId: Number(row.roster_id),
      ownerId: row.owner_id,
      displayName,
      managerSlug: row.manager_slug || null,
      avatarUrl: avatarUrl(row.avatar),
      initials: initials(displayName),
      starters,
      players,
      settings,
      metadata,
      starterCount: starters.length,
      playerCount: players.length,
      wins: Number(settings?.wins || 0),
      losses: Number(settings?.losses || 0),
      ties: Number(settings?.ties || 0),
      waiverBudgetUsed: Number(settings?.waiver_budget_used || 0),
      teamName: metadata?.team_name || null
    };
  });
}

export async function getLeagueTransactions(db, options = {}) {
  const limit = Math.max(10, Math.min(250, Number(options.limit || 100)));

  const result = await db.prepare(`
    SELECT
      t.transaction_id,
      t.type,
      t.status,
      t.roster_ids_json,
      t.adds_json,
      t.drops_json,
      t.draft_picks_json,
      t.waiver_budget_json,
      t.created_at
    FROM sleeper_transactions t
    ORDER BY COALESCE(t.created_at, 0) DESC
    LIMIT ?1
  `).bind(limit).all();

  const rows = result?.results || [];
  return rows.map((row) => {
    const rosterIds = safeJson(row.roster_ids_json, []);
    const adds = safeJson(row.adds_json, {});
    const drops = safeJson(row.drops_json, {});
    const draftPicks = safeJson(row.draft_picks_json, []);
    const waiverBudget = safeJson(row.waiver_budget_json, {});
    const addEntries = Object.entries(adds);
    const dropEntries = Object.entries(drops);
    const faabMoves = Object.entries(waiverBudget);

    return {
      id: row.transaction_id,
      type: row.type || 'unknown',
      status: row.status || 'unknown',
      rosterIds,
      addEntries,
      dropEntries,
      draftPicks,
      faabMoves,
      createdAt: row.created_at ? Number(row.created_at) : null,
      summaryLine: summarizeTransaction({
        type: row.type,
        addEntries,
        dropEntries,
        draftPicks,
        faabMoves
      })
    };
  });
}

function summarizeTransaction(txn) {
  if (txn.type === 'trade') {
    const pieces = [];
    if (txn.addEntries.length) pieces.push(`${txn.addEntries.length} player add${txn.addEntries.length === 1 ? '' : 's'}`);
    if (txn.dropEntries.length) pieces.push(`${txn.dropEntries.length} player drop${txn.dropEntries.length === 1 ? '' : 's'}`);
    if (txn.draftPicks.length) pieces.push(`${txn.draftPicks.length} pick asset${txn.draftPicks.length === 1 ? '' : 's'}`);
    return `Trade • ${pieces.join(' • ') || 'asset movement'}`;
  }

  if (txn.type === 'waiver') {
    return `Waiver • ${txn.addEntries.length} add${txn.addEntries.length === 1 ? '' : 's'} / ${txn.dropEntries.length} drop${txn.dropEntries.length === 1 ? '' : 's'}`;
  }

  if (txn.type === 'free_agent') {
    return `Free agent • ${txn.addEntries.length} add${txn.addEntries.length === 1 ? '' : 's'}`;
  }

  if (txn.type === 'commish') {
    return `Commissioner action`;
  }

  return `Transaction activity`;
}

export async function getRivalryDeck(db) {
  const result = await db.prepare(`
    SELECT
      r.manager_id,
      r.rival_manager_id,
      r.wins,
      r.losses,
      r.ties,
      r.notes,
      m1.display_name AS manager_name,
      m2.display_name AS rival_name
    FROM rivals r
    LEFT JOIN managers m1 ON m1.id = r.manager_id
    LEFT JOIN managers m2 ON m2.id = r.rival_manager_id
    ORDER BY (r.wins + r.losses + r.ties) DESC, COALESCE(m1.display_name, '') ASC
  `).all();

  return (result?.results || []).map((row) => ({
    managerName: row.manager_name || row.manager_id,
    rivalName: row.rival_name || row.rival_manager_id,
    record: `${row.wins}-${row.losses}${row.ties ? `-${row.ties}` : ''}`,
    notes: row.notes || ''
  }));
}
