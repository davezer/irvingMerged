function text(value) {
  return value == null ? '' : String(value).trim();
}

export function normalizeParlayToken(value) {
  return text(value)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function parseOptionalNumber(value) {
  if (value == null || text(value) === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function parseAmericanOdds(value) {
  const source = text(value).replace(/\s/g, '');
  if (!/^[+-]?\d+$/.test(source)) return null;
  const number = Number(source);
  if (!Number.isInteger(number) || number === 0) return null;
  return number;
}

export async function getOpenParlayWeek(db) {
  return await db
    .prepare(`
      SELECT *
      FROM parlay_weeks
      WHERE status = 'open'
      ORDER BY season DESC, week DESC
      LIMIT 1
    `)
    .first();
}

export async function getParlayWeek(db, season, week) {
  return await db
    .prepare(`SELECT * FROM parlay_weeks WHERE season = ? AND week = ? LIMIT 1`)
    .bind(Number(season), Number(week))
    .first();
}

export async function getDiscordManagerLink(db, discordUserId) {
  return await db
    .prepare(`
      SELECT * FROM discord_manager_links
      WHERE discord_user_id = ? AND active = 1
      LIMIT 1
    `)
    .bind(String(discordUserId))
    .first();
}

export async function getActiveManagerPick(db, { season, week, managerId }) {
  return await db
    .prepare(`
      SELECT * FROM parlay_picks
      WHERE season = ? AND week = ? AND manager_id = ? AND status = 'active'
        AND id <> COALESCE(?, -1)
      LIMIT 1
    `)
    .bind(Number(season), Number(week), String(managerId))
    .first();
}

export async function findDuplicatePick(db, pick) {
  return await db
    .prepare(`
      SELECT id, manager_id, manager_name, team_name, subject, market, bet_type, direction,
             current_line, current_odds
      FROM parlay_picks
      WHERE season = ?
        AND week = ?
        AND subject_normalized = ?
        AND bet_type = ?
        AND market_normalized = ?
        AND COALESCE(direction, '') = COALESCE(?, '')
        AND status = 'active'
      LIMIT 1
    `)
    .bind(
      Number(pick.season),
      Number(pick.week),
      pick.subjectNormalized,
      pick.betType,
      pick.marketNormalized,
      pick.direction || null,
      pick.excludePickId == null ? null : Number(pick.excludePickId)
    )
    .first();
}

export async function createParlayPick(db, pick) {
  const result = await db
    .prepare(`
      INSERT INTO parlay_picks (
        season, week, parlay_week_id,
        manager_id, manager_name, team_name,
        discord_user_id, discord_username, discord_display_name,
        sport, subject, subject_normalized, bet_type,
        market, market_normalized, direction,
        original_line, current_line,
        original_odds, current_odds,
        sportsbook, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      pick.season,
      pick.week,
      pick.parlayWeekId,
      pick.managerId,
      pick.managerName,
      pick.teamName || null,
      pick.discordUserId,
      pick.discordUsername,
      pick.discordDisplayName || null,
      pick.sport,
      pick.subject,
      pick.subjectNormalized,
      pick.betType,
      pick.market || null,
      pick.marketNormalized,
      pick.direction || null,
      pick.line,
      pick.line,
      pick.odds,
      pick.odds,
      pick.sportsbook || 'Hard Rock',
      pick.notes || null
    )
    .run();

  const id = Number(result.meta?.last_row_id);
  return await db.prepare(`SELECT * FROM parlay_picks WHERE id = ?`).bind(id).first();
}

export async function getWeekProgress(db, season, week) {
  const row = await db
    .prepare(`
      SELECT COUNT(*) AS submitted
      FROM parlay_picks
      WHERE season = ? AND week = ? AND status = 'active'
    `)
    .bind(Number(season), Number(week))
    .first();

  return { submitted: Number(row?.submitted || 0), total: 14 };
}

export async function getParlayAdminBundle(db, { season, week } = {}) {
  let selectedWeek;
  if (Number.isInteger(Number(season)) && Number.isInteger(Number(week))) {
    selectedWeek = await getParlayWeek(db, Number(season), Number(week));
  }
  selectedWeek ||= await getOpenParlayWeek(db);
  selectedWeek ||= await db.prepare(`SELECT * FROM parlay_weeks ORDER BY season DESC, week DESC LIMIT 1`).first();

  const weeksResult = await db.prepare(`SELECT * FROM parlay_weeks ORDER BY season DESC, week DESC`).all();
  const linksResult = await db.prepare(`SELECT * FROM discord_manager_links ORDER BY team_name, manager_name`).all();

  let picks = [];
  if (selectedWeek) {
    const picksResult = await db
      .prepare(`
        SELECT * FROM parlay_picks
        WHERE season = ? AND week = ?
        ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, team_name, manager_name, created_at
      `)
      .bind(selectedWeek.season, selectedWeek.week)
      .all();
    picks = picksResult.results || [];
  }

  return {
    selectedWeek,
    weeks: weeksResult.results || [],
    links: linksResult.results || [],
    picks,
    progress: selectedWeek ? await getWeekProgress(db, selectedWeek.season, selectedWeek.week) : { submitted: 0, total: 14 }
  };
}

export async function writePickHistory(db, { pickId, action, oldValue = null, newValue = null, changedBy }) {
  await db
    .prepare(`
      INSERT INTO parlay_pick_history (pick_id, action, old_value, new_value, changed_by)
      VALUES (?, ?, ?, ?, ?)
    `)
    .bind(Number(pickId), action, oldValue, newValue, changedBy || 'admin')
    .run();
}


export async function linkDiscordMessage(db, pickId, discordMessageId) {
  await db
    .prepare(`
      UPDATE parlay_picks
      SET discord_message_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(String(discordMessageId), Number(pickId))
    .run();

  return await db.prepare(`SELECT * FROM parlay_picks WHERE id = ?`).bind(Number(pickId)).first();
}

export async function replaceParlayPick(db, existingPick, pick) {
  const replaceOld = db.prepare(`
    UPDATE parlay_picks
    SET status = 'replaced',
        locked = 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(Number(existingPick.id));

  const insertNew = db.prepare(`
    INSERT INTO parlay_picks (
      season, week, parlay_week_id,
      manager_id, manager_name, team_name,
      discord_user_id, discord_username, discord_display_name,
      sport, subject, subject_normalized, bet_type,
      market, market_normalized, direction,
      original_line, current_line,
      original_odds, current_odds,
      sportsbook, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    pick.season, pick.week, pick.parlayWeekId,
    pick.managerId, pick.managerName, pick.teamName || null,
    pick.discordUserId, pick.discordUsername, pick.discordDisplayName || null,
    pick.sport, pick.subject, pick.subjectNormalized, pick.betType,
    pick.market || null, pick.marketNormalized, pick.direction || null,
    pick.line, pick.line, pick.odds, pick.odds,
    pick.sportsbook || 'Hard Rock', pick.notes || null
  );

  const audit = db.prepare(`
    INSERT INTO parlay_pick_history (
      pick_id, action, old_value, new_value, changed_by
    ) VALUES (?, 'REPLACED_BY_USER', ?, ?, ?)
  `).bind(
    Number(existingPick.id),
    JSON.stringify({
      subject: existingPick.subject,
      market: existingPick.market,
      line: existingPick.current_line,
      odds: existingPick.current_odds
    }),
    JSON.stringify({
      subject: pick.subject,
      market: pick.market,
      line: pick.line,
      odds: pick.odds
    }),
    pick.discordDisplayName || pick.discordUsername || 'Discord user'
  );

  const results = await db.batch([replaceOld, insertNew, audit]);
  const newId = Number(results?.[1]?.meta?.last_row_id);

  return await db.prepare(`SELECT * FROM parlay_picks WHERE id = ?`).bind(newId).first();
}
