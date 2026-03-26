function safeJsonParse(value, fallback = null) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function tableExists(db, name) {
  const row = await db
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`)
    .bind(name)
    .first()
    .catch(() => null);
  return !!row?.name;
}

export async function getRosterView(db) {
  if (!db || !(await tableExists(db, 'sleeper_rosters'))) {
    return {
      updatedAt: null,
      teams: []
    };
  }

  const rosterRows = await db
    .prepare(`
      SELECT roster_id, owner_id, starters_json, players_json, settings_json, metadata_json, updated_at
      FROM sleeper_rosters
      ORDER BY roster_id ASC
    `)
    .all()
    .catch(() => ({ results: [] }));

  const userRows = (await db
    .prepare(`SELECT sleeper_user_id, display_name, avatar FROM sleeper_users`)
    .all()
    .catch(() => ({ results: [] }))).results || [];

  const managerMap = new Map(userRows.map((row) => [row.sleeper_user_id, row]));

  const teams = ((rosterRows.results || []).map((row) => {
    const manager = managerMap.get(row.owner_id) || {};
    const starters = safeJsonParse(row.starters_json, []) || [];
    const players = safeJsonParse(row.players_json, []) || [];
    const settings = safeJsonParse(row.settings_json, {}) || {};
    const metadata = safeJsonParse(row.metadata_json, {}) || {};

    return {
      rosterId: row.roster_id,
      ownerId: row.owner_id,
      managerName: manager.display_name || metadata.team_name || `Roster ${row.roster_id}`,
      avatar: manager.avatar || null,
      teamName: metadata.team_name || manager.display_name || `Roster ${row.roster_id}`,
      starters,
      players,
      record: {
        wins: Number(settings.wins || 0),
        losses: Number(settings.losses || 0),
        ties: Number(settings.ties || 0),
        fpts: Number(settings.fpts || 0)
      },
      updatedAt: row.updated_at || null
    };
  })) || [];

  const updatedAt = teams.map((t) => t.updatedAt).filter(Boolean).sort().at(-1) || null;
  return { updatedAt, teams };
}

export async function getTransactionsView(db) {
  if (!db || !(await tableExists(db, 'sleeper_transactions'))) {
    return {
      updatedAt: null,
      items: []
    };
  }

  const rows = await db
    .prepare(`
      SELECT transaction_id, type, status, roster_ids_json, adds_json, drops_json, draft_picks_json, waiver_budget_json, created_at
      FROM sleeper_transactions
      ORDER BY created_at DESC
      LIMIT 75
    `)
    .all()
    .catch(() => ({ results: [] }));

  const items = ((rows.results || []).map((row) => {
    const rosterIds = safeJsonParse(row.roster_ids_json, []) || [];
    const adds = safeJsonParse(row.adds_json, {}) || {};
    const drops = safeJsonParse(row.drops_json, {}) || {};
    const picks = safeJsonParse(row.draft_picks_json, []) || [];
    const budget = safeJsonParse(row.waiver_budget_json, {}) || {};

    return {
      id: row.transaction_id,
      type: row.type || 'move',
      status: row.status || 'complete',
      rosters: rosterIds,
      addCount: Object.keys(adds).length,
      dropCount: Object.keys(drops).length,
      pickCount: picks.length,
      budgetDelta: Object.values(budget).reduce((sum, n) => sum + Number(n || 0), 0),
      createdAt: row.created_at
    };
  })) || [];

  return {
    updatedAt: items[0]?.createdAt || null,
    items
  };
}

export async function getRivalryView(db) {
  if (!db) return { rivalries: [] };

  const hasRivals = await tableExists(db, 'rivals');
  const hasBadges = await tableExists(db, 'manager_badges');

  const rivals = hasRivals
    ? ((await db
        .prepare(`SELECT manager_id, rival_manager_id, wins, losses, ties, notes FROM rivals ORDER BY wins DESC, losses ASC`)
        .all()
        .catch(() => ({ results: [] }))).results || [])
    : [];

  const badgeCounts = hasBadges
    ? ((await db
        .prepare(`SELECT manager_id, COUNT(*) AS badge_count FROM manager_badges GROUP BY manager_id`)
        .all()
        .catch(() => ({ results: [] }))).results || [])
    : [];

  const badgeMap = new Map(badgeCounts.map((row) => [row.manager_id, Number(row.badge_count || 0)]));

  return {
    rivalries: rivals.map((row) => ({
      managerId: row.manager_id,
      rivalId: row.rival_manager_id,
      record: `${row.wins}-${row.losses}${row.ties ? `-${row.ties}` : ''}`,
      notes: row.notes || 'Legacy rivalry record',
      badgeCount: badgeMap.get(row.manager_id) || 0
    }))
  };
}

export async function getManagerDossierView(db, slug) {
  const base = {
    manager: null,
    badges: [],
    finance: null,
    rivalry: []
  };

  if (!db) return base;
  if (!(await tableExists(db, 'managers'))) return base;

  const manager = await db
    .prepare(`SELECT id, slug, name, team_name, bio, avatar_url FROM managers WHERE slug = ? LIMIT 1`)
    .bind(slug)
    .first()
    .catch(() => null);

  if (!manager) return base;

  const badges = (await tableExists(db, 'manager_badges'))
    ? ((await db
        .prepare(`
          SELECT mb.badge_id, b.name, b.slug, b.tier, mb.awarded_at, mb.notes
          FROM manager_badges mb
          LEFT JOIN badges b ON b.id = mb.badge_id
          WHERE mb.manager_id = ?
          ORDER BY mb.awarded_at DESC
        `)
        .bind(manager.id)
        .all()
        .catch(() => ({ results: [] }))).results || [])
    : [];

  const finance = (await tableExists(db, 'manager_financial_snapshots'))
    ? await db
        .prepare(`
          SELECT season, budget, spent, remaining, dead_money, notes
          FROM manager_financial_snapshots
          WHERE manager_id = ?
          ORDER BY season DESC
          LIMIT 1
        `)
        .bind(manager.id)
        .first()
        .catch(() => null)
    : null;

  const rivalry = (await tableExists(db, 'rivals'))
    ? ((await db
        .prepare(`SELECT rival_manager_id, wins, losses, ties, notes FROM rivals WHERE manager_id = ? ORDER BY wins DESC`)
        .bind(manager.id)
        .all()
        .catch(() => ({ results: [] }))).results || [])
    : [];

  return { manager, badges, finance, rivalry };
}
