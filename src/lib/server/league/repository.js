async function batchInsert(db, sql, rows, mapper) {
  for (const row of rows) {
    await db.prepare(sql).bind(...mapper(row)).run();
  }
}

export async function upsertLeagueBundle(db, normalized) {
  await batchInsert(
    db,
    `INSERT INTO managers (
      id, slug, name, team_name, photo, bio, favorite_team, persona, philosophy, created_at,
      sleeper_user_id, sleeper_roster_id, sleeper_avatar, sleeper_username, metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      slug=excluded.slug,
      name=excluded.name,
      team_name=excluded.team_name,
      photo=excluded.photo,
      favorite_team=excluded.favorite_team,
      sleeper_roster_id=excluded.sleeper_roster_id,
      sleeper_avatar=excluded.sleeper_avatar,
      sleeper_username=excluded.sleeper_username,
      metadata_json=excluded.metadata_json`,
    normalized.managers,
    (row) => [
      row.id, row.slug, row.name, row.team_name, row.photo, row.bio, row.favorite_team, row.persona, row.philosophy,
      row.created_at, row.sleeper_user_id, row.sleeper_roster_id, row.sleeper_avatar, row.sleeper_username, row.metadata_json
    ]
  );

  const season = String(normalized.standings[0]?.season || normalized.drafts[0]?.season || new Date().getFullYear());

  await db.prepare(`DELETE FROM standings_snapshots WHERE season = ?`).bind(season).run();
  await batchInsert(
    db,
    `INSERT INTO standings_snapshots (
      season, manager_id, wins, losses, ties, points_for, points_against, streak_type, streak_value, rank, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())`,
    normalized.standings,
    (row) => [row.season, row.manager_id, row.wins, row.losses, row.ties, row.points_for, row.points_against, row.streak_type, row.streak_value, row.rank]
  );

  await db.prepare(`DELETE FROM roster_players WHERE season = ?`).bind(season).run();
  await batchInsert(
    db,
    `INSERT INTO roster_players (season, manager_id, sleeper_roster_id, player_id, slot, lineup_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    normalized.rosters,
    (row) => [row.season, row.manager_id, row.sleeper_roster_id, row.player_id, row.slot, row.lineup_order, row.created_at]
  );

  await batchInsert(
    db,
    `INSERT INTO drafts (id, season, label, kind, status, draft_order_json, settings_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET label=excluded.label, status=excluded.status, draft_order_json=excluded.draft_order_json, settings_json=excluded.settings_json`,
    normalized.drafts,
    (row) => [row.id, row.season, row.label, row.kind, row.status, row.draft_order_json, row.settings_json, row.created_at]
  );

  await db.prepare(`DELETE FROM draft_picks WHERE season = ?`).bind(season).run();
  await batchInsert(
    db,
    `INSERT INTO draft_picks (draft_id, season, pick_no, round, manager_id, player_id, amount, is_keeper, metadata_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    normalized.draftPicks,
    (row) => [row.draft_id, row.season, row.pick_no, row.round, row.manager_id, row.player_id, row.amount, row.is_keeper, row.metadata_json, row.created_at]
  );

  await db.prepare(`DELETE FROM matchups WHERE season = ?`).bind(season).run();
  await batchInsert(
    db,
    `INSERT INTO matchups (season, week, matchup_id, roster_id, manager_id, starters_json, players_json, points, custom_points, metadata_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    normalized.matchups,
    (row) => [row.season, row.week, row.matchup_id, row.roster_id, row.manager_id, row.starters_json, row.players_json, row.points, row.custom_points, row.metadata_json, row.created_at]
  );

  await db.prepare(`DELETE FROM transactions WHERE season = ?`).bind(season).run();
  await batchInsert(
    db,
    `INSERT INTO transactions (id, season, week, kind, status, creator_id, roster_ids_json, adds_json, drops_json, draft_picks_json, waiver_budget_json, metadata_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    normalized.transactions,
    (row) => [row.id, row.season, row.week, row.kind, row.status, row.creator_id, row.roster_ids_json, row.adds_json, row.drops_json, row.draft_picks_json, row.waiver_budget_json, row.metadata_json, row.created_at]
  );

  return { ok: true, season };
}

export async function replaceManagerBadges(db, season, badgeAwards = []) {
  await db.prepare(`DELETE FROM manager_badges WHERE season = ?`).bind(String(season)).run();
  for (const award of badgeAwards) {
    await db.prepare(
      `INSERT INTO manager_badges (season, badge_key, manager_id, reason, score, metadata_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, unixepoch())`
    ).bind(award.season, award.badge_key, award.manager_id, award.reason, award.score, award.metadata_json).run();
  }
  return { ok: true, count: badgeAwards.length };
}

export async function replaceDraftBudgetLedger(db, season, ledgerRows = []) {
  await db.prepare(`DELETE FROM draft_budget_ledger WHERE season = ?`).bind(String(season)).run();
  for (const row of ledgerRows) {
    await db.prepare(
      `INSERT INTO draft_budget_ledger (
        season, manager_id, starting_budget, spent_budget, remaining_budget, keeper_commitment,
        max_purchase, average_purchase, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch())`
    ).bind(
      row.season,
      row.manager_id,
      row.starting_budget,
      row.spent_budget,
      row.remaining_budget,
      row.keeper_commitment,
      row.max_purchase,
      row.average_purchase
    ).run();
  }
  return { ok: true, count: ledgerRows.length };
}
