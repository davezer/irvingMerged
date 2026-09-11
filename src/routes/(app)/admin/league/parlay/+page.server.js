import { fail } from '@sveltejs/kit';
import { getManagers } from '$lib/server/league';
import {
  getParlayAdminBundle,
  parseAmericanOdds,
  parseOptionalNumber,
  writePickHistory
} from '$lib/server/league/parlayRepository.js';
import {
  getLegacyParlayImportStatus,
  importLegacyParlayHistory
} from '$lib/server/league/parlayLegacyRepository.js';
import { syncDiscordPickMessage } from '$lib/server/league/discordParlaySync.js';

function requireDb(platform) {
  const db = platform?.env?.DB;
  if (!db) throw new Error('Cloudflare D1 binding "DB" is unavailable.');
  return db;
}

function adminName(locals) {
  return String(locals?.user?.name || locals?.user?.email || locals?.user?.id || 'admin');
}

function clean(value, max = 250) {
  return String(value ?? '').trim().slice(0, max);
}


async function syncPick(db, env, id) {
  const pick = await db.prepare(`SELECT * FROM parlay_picks WHERE id = ?`).bind(Number(id)).first();
  if (!pick) return;

  try {
    await syncDiscordPickMessage(env, pick);
  } catch (error) {
    console.error('Discord Parlay message sync failed:', error);
  }
}

function managerRows() {
  return getManagers()
    .map((manager) => ({
      id: String(manager.managerID),
      name: manager.name,
      teamName: manager.teamName,
      slug: manager.slug,
      photo: manager.photo || null,
      chiclet: manager.chiclet || manager.photo || null
    }))
    .sort((a, b) => a.teamName.localeCompare(b.teamName));
}

async function selectedBundle(db, url) {
  const season = Number(url.searchParams.get('season'));
  const week = Number(url.searchParams.get('week'));
  return getParlayAdminBundle(db, {
    season: Number.isInteger(season) && season > 2000 ? season : undefined,
    week: Number.isInteger(week) && week > 0 ? week : undefined
  });
}

export async function load({ platform, url }) {
  const db = requireDb(platform);
  const managers = managerRows();
  const bundle = await selectedBundle(db, url);
  const legacyImport = await getLegacyParlayImportStatus(db);
  const linkByManager = Object.fromEntries(
    bundle.links.filter((row) => Number(row.active) === 1).map((row) => [String(row.manager_id), row])
  );

  return {
    ...bundle,
    managers,
    linkByManager,
    legacyImport
  };
}

export const actions = {
  importLegacyHistory: async ({ platform, fetch }) => {
    const db = requireDb(platform);

    try {
      const result = await importLegacyParlayHistory({
        db,
        env: platform?.env,
        fetchFn: fetch
      });

      return {
        success: true,
        message: `Legacy Parlay history imported: ${result.importedRows} rows from ${result.sourceRows} source rows.`
      };
    } catch (error) {
      return fail(500, {
        message: error instanceof Error ? error.message : 'Legacy Parlay import failed.'
      });
    }
  },

  openWeek: async ({ request, platform, locals }) => {
    const db = requireDb(platform);
    const form = await request.formData();
    const season = Number(form.get('season'));
    const week = Number(form.get('week'));

    if (!Number.isInteger(season) || season < 2020 || !Number.isInteger(week) || week < 1 || week > 30) {
      return fail(400, { message: 'Enter a valid season and week.' });
    }

    // Only one week can be open at a time. Older open week becomes locked.
    await db.batch([
      db.prepare(`UPDATE parlay_weeks SET status = 'locked', locks_at = COALESCE(locks_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP WHERE status = 'open' AND NOT (season = ? AND week = ?)`)
        .bind(season, week),
      db.prepare(`
        INSERT INTO parlay_weeks (season, week, status, opens_at, updated_at)
        VALUES (?, ?, 'open', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(season, week) DO UPDATE SET
          status = 'open',
          opens_at = COALESCE(parlay_weeks.opens_at, CURRENT_TIMESTAMP),
          locks_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      `).bind(season, week)
    ]);

    return { success: true, message: `Week ${week} is open for submissions.` };
  },

  setWeekStatus: async ({ request, platform }) => {
    const db = requireDb(platform);
    const form = await request.formData();
    const id = Number(form.get('id'));
    const status = clean(form.get('status'), 20);
    const allowed = new Set(['open', 'locked', 'placed', 'graded']);

    if (!Number.isInteger(id) || !allowed.has(status)) return fail(400, { message: 'Invalid week/status.' });

    if (status === 'open') {
      await db.prepare(`UPDATE parlay_weeks SET status = 'locked', locks_at = COALESCE(locks_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP WHERE status = 'open' AND id <> ?`).bind(id).run();
    }

    await db.prepare(`
      UPDATE parlay_weeks
      SET status = ?,
          locks_at = CASE WHEN ? = 'locked' THEN CURRENT_TIMESTAMP WHEN ? = 'open' THEN NULL ELSE locks_at END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, status, status, id).run();

    return { success: true, message: `Parlay week marked ${status}.` };
  },

  rolloverWeek: async ({ request, platform }) => {
    const db = requireDb(platform);
    const form = await request.formData();
    const id = Number(form.get('id'));

    const current = await db.prepare(`SELECT * FROM parlay_weeks WHERE id = ?`).bind(id).first();
    if (!current) return fail(404, { message: 'Current parlay week not found.' });

    const nextSeason = Number(current.season);
    const nextWeek = Number(current.week) + 1;

    await db.batch([
      db.prepare(`
        UPDATE parlay_weeks
        SET status = CASE WHEN status = 'open' THEN 'locked' ELSE status END,
            locks_at = CASE WHEN status = 'open' THEN COALESCE(locks_at, CURRENT_TIMESTAMP) ELSE locks_at END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(id),
      db.prepare(`
        UPDATE parlay_weeks
        SET status = 'locked',
            locks_at = COALESCE(locks_at, CURRENT_TIMESTAMP),
            updated_at = CURRENT_TIMESTAMP
        WHERE status = 'open' AND id <> ?
      `).bind(id),
      db.prepare(`
        INSERT INTO parlay_weeks (season, week, status, opens_at, updated_at)
        VALUES (?, ?, 'open', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(season, week) DO UPDATE SET
          status = 'open',
          opens_at = COALESCE(parlay_weeks.opens_at, CURRENT_TIMESTAMP),
          locks_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      `).bind(nextSeason, nextWeek)
    ]);

    return { success: true, message: `Week ${current.week} closed. Week ${nextWeek} is now open.` };
  },

  saveTicket: async ({ request, platform }) => {
    const db = requireDb(platform);
    const form = await request.formData();
    const id = Number(form.get('id'));
    const combinedOdds = clean(form.get('combinedOdds'), 40) || null;
    const wagerAmount = parseOptionalNumber(form.get('wagerAmount'));
    const potentialPayout = parseOptionalNumber(form.get('potentialPayout'));

    if (!Number.isInteger(id)) return fail(400, { message: 'Invalid parlay week.' });

    await db.prepare(`
      UPDATE parlay_weeks
      SET combined_odds = ?, wager_amount = ?, potential_payout = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(combinedOdds, wagerAmount, potentialPayout, id).run();

    return { success: true, message: 'Final ticket details saved.' };
  },

  saveDiscordLink: async ({ request, platform }) => {
    const db = requireDb(platform);
    const form = await request.formData();
    const managerId = clean(form.get('managerId'), 80);
    const discordUserId = clean(form.get('discordUserId'), 32);
    const manager = managerRows().find((row) => row.id === managerId);

    if (!manager) return fail(400, { message: 'Manager not found.' });

    // Blank value removes this manager's current link.
    await db.prepare(`UPDATE discord_manager_links SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE manager_id = ?`).bind(managerId).run();

    if (!discordUserId) return { success: true, message: `${manager.teamName} Discord link removed.` };
    if (!/^\d{15,22}$/.test(discordUserId)) return fail(400, { message: 'Discord User ID should be the numeric ID copied from Discord.' });

    await db.prepare(`
      INSERT INTO discord_manager_links (discord_user_id, manager_id, manager_name, team_name, active, updated_at)
      VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(discord_user_id) DO UPDATE SET
        manager_id = excluded.manager_id,
        manager_name = excluded.manager_name,
        team_name = excluded.team_name,
        active = 1,
        updated_at = CURRENT_TIMESTAMP
    `).bind(discordUserId, manager.id, manager.name, manager.teamName).run();

    return { success: true, message: `${manager.teamName} linked to Discord.` };
  },

  addManualPick: async ({ request, platform, locals }) => {
    const db = requireDb(platform);
    const form = await request.formData();

    const weekId = Number(form.get('weekId'));
    const season = Number(form.get('season'));
    const week = Number(form.get('week'));
    const managerId = clean(form.get('managerId'), 80);
    const sport = clean(form.get('sport'), 20).toLowerCase();
    const betType = clean(form.get('betType'), 30).toLowerCase();
    const subject = clean(form.get('subject'), 120);
    const market = clean(form.get('market'), 120) || null;
    const direction = clean(form.get('direction'), 10).toLowerCase() || null;
    const line = parseOptionalNumber(form.get('line'));
    const odds = parseAmericanOdds(form.get('odds'));
    const notes = clean(form.get('notes'), 500) || null;

    const manager = managerRows().find((row) => row.id === managerId);
    if (!manager) return fail(400, { message: 'Choose a valid Irving manager.' });

    if (!Number.isInteger(weekId) || !Number.isInteger(season) || !Number.isInteger(week)) {
      return fail(400, { message: 'Invalid parlay week.' });
    }

    if (!['nfl', 'ncaaf'].includes(sport)) {
      return fail(400, { message: 'Manual picks must be NFL or College Football.' });
    }

    if (!['player_prop', 'spread', 'moneyline', 'game_total', 'team_total', 'anytime_td', 'other'].includes(betType)) {
      return fail(400, { message: 'Choose a valid bet type.' });
    }

    if (direction && !['over', 'under'].includes(direction)) {
      return fail(400, { message: 'Direction must be Over, Under, or blank.' });
    }

    if (!subject || odds == null) {
      return fail(400, { message: 'Player/team and valid American odds are required.' });
    }

    const selectedWeek = await db
      .prepare(`SELECT id, season, week, status FROM parlay_weeks WHERE id = ?`)
      .bind(weekId)
      .first();

    if (!selectedWeek || Number(selectedWeek.season) !== season || Number(selectedWeek.week) !== week) {
      return fail(409, { message: 'That parlay week changed. Refresh the page and try again.' });
    }

    if (String(selectedWeek.status) === 'graded') {
      return fail(409, { message: 'A graded week cannot accept new picks.' });
    }

    const existing = await db
      .prepare(`
        SELECT id, subject
        FROM parlay_picks
        WHERE season = ? AND week = ? AND manager_id = ? AND status = 'active'
        LIMIT 1
      `)
      .bind(season, week, managerId)
      .first();

    if (existing) {
      return fail(409, { message: `${manager.teamName} already has an active pick: ${existing.subject}.` });
    }

    const normalize = (value) => String(value || '')
      .toLowerCase()
      .replace(/[’']/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');

    const subjectNormalized = normalize(subject);
    const marketNormalized = normalize(market || '');

    const duplicate = await db
      .prepare(`
        SELECT manager_name, team_name, subject
        FROM parlay_picks
        WHERE season = ?
          AND week = ?
          AND subject_normalized = ?
          AND bet_type = ?
          AND market_normalized = ?
          AND COALESCE(direction, '') = ?
          AND status = 'active'
        LIMIT 1
      `)
      .bind(season, week, subjectNormalized, betType, marketNormalized, direction || '')
      .first();

    if (duplicate) {
      return fail(409, {
        message: `Duplicate wager: ${duplicate.team_name || duplicate.manager_name} already has ${duplicate.subject}.`
      });
    }

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
          sportsbook, notes,
          status, locked, result
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 0, 'PENDING')
      `)
      .bind(
        season, week, weekId,
        manager.id, manager.name, manager.teamName,
        `manual:${manager.id}`, 'manual-admin', adminName(locals),
        sport, subject, subjectNormalized, betType,
        market, marketNormalized, direction,
        line, line, odds, odds,
        notes
      )
      .run();

    const pickId = Number(result.meta?.last_row_id);
    if (pickId) {
      await writePickHistory(db, {
        pickId,
        action: 'MANUAL_ADD',
        newValue: JSON.stringify({ subject, market, direction, line, odds, betType, sport }),
        changedBy: adminName(locals)
      });
    }

    return { success: true, message: `${manager.teamName} manual pick added to Week ${week}.` };
  },

  editPick: async ({ request, platform, locals }) => {
    const db = requireDb(platform);
    const form = await request.formData();
    const id = Number(form.get('id'));
    const current = await db.prepare(`SELECT * FROM parlay_picks WHERE id = ?`).bind(id).first();
    if (!current) return fail(404, { message: 'Pick not found.' });
    if (Number(current.locked) === 1) return fail(409, { message: 'Unlock this pick before editing it.' });

    const subject = clean(form.get('subject'), 120);
    const market = clean(form.get('market'), 120) || null;
    const line = parseOptionalNumber(form.get('line'));
    const odds = parseAmericanOdds(form.get('odds'));
    const direction = clean(form.get('direction'), 10) || null;
    const notes = clean(form.get('notes'), 500) || null;

    if (!subject || odds == null) return fail(400, { message: 'Player/team and valid American odds are required.' });

    const before = JSON.stringify({ subject: current.subject, market: current.market, line: current.current_line, odds: current.current_odds, direction: current.direction, notes: current.notes });
    const after = JSON.stringify({ subject, market, line, odds, direction, notes });

    const normalize = (value) => String(value || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');

    await db.prepare(`
      UPDATE parlay_picks
      SET subject = ?, subject_normalized = ?, market = ?, market_normalized = ?,
          current_line = ?, current_odds = ?, direction = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(subject, normalize(subject), market, normalize(market), line, odds, direction, notes, id).run();

    await writePickHistory(db, { pickId: id, action: 'EDIT', oldValue: before, newValue: after, changedBy: adminName(locals) });
    await syncPick(db, platform?.env, id);
    return { success: true, message: 'Pick updated and Discord synced.' };
  },

  togglePickLock: async ({ request, platform, locals }) => {
    const db = requireDb(platform);
    const form = await request.formData();
    const id = Number(form.get('id'));
    const current = await db.prepare(`SELECT locked FROM parlay_picks WHERE id = ?`).bind(id).first();
    if (!current) return fail(404, { message: 'Pick not found.' });
    const next = Number(current.locked) === 1 ? 0 : 1;
    await db.prepare(`UPDATE parlay_picks SET locked = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(next, id).run();
    await writePickHistory(db, { pickId: id, action: next ? 'LOCK' : 'UNLOCK', changedBy: adminName(locals) });
    await syncPick(db, platform?.env, id);
    return { success: true, message: next ? 'Pick locked.' : 'Pick unlocked.' };
  },

  voidPick: async ({ request, platform, locals }) => {
    const db = requireDb(platform);
    const form = await request.formData();
    const id = Number(form.get('id'));
    const current = await db.prepare(`SELECT * FROM parlay_picks WHERE id = ?`).bind(id).first();
    if (!current) return fail(404, { message: 'Pick not found.' });
    await db.prepare(`UPDATE parlay_picks SET status = 'voided', locked = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(id).run();
    await writePickHistory(db, { pickId: id, action: 'VOID', oldValue: JSON.stringify(current), changedBy: adminName(locals) });
    await syncPick(db, platform?.env, id);
    return { success: true, message: 'Pick voided, Discord synced, and that manager can submit again.' };
  },

  gradePick: async ({ request, platform, locals }) => {
    const db = requireDb(platform);
    const form = await request.formData();
    const id = Number(form.get('id'));
    const result = clean(form.get('result'), 10).toUpperCase();
    if (!['PENDING', 'WIN', 'LOSS', 'PUSH'].includes(result)) return fail(400, { message: 'Invalid result.' });
    const current = await db.prepare(`SELECT result FROM parlay_picks WHERE id = ?`).bind(id).first();
    if (!current) return fail(404, { message: 'Pick not found.' });
    await db.prepare(`UPDATE parlay_picks SET result = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(result, id).run();
    await writePickHistory(db, { pickId: id, action: 'GRADE', oldValue: String(current.result), newValue: result, changedBy: adminName(locals) });
    await syncPick(db, platform?.env, id);
    return { success: true, message: `Pick marked ${result} and Discord synced.` };
  }
};
