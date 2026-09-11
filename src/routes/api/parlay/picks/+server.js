import { json } from '@sveltejs/kit';
import { getManagers } from '$lib/server/league';
import {
  createParlayPick,
  linkDiscordMessage,
  replaceParlayPick,
  findDuplicatePick,
  getActiveManagerPick,
  getDiscordManagerLink,
  getOpenParlayWeek,
  getWeekProgress,
  normalizeParlayToken,
  parseAmericanOdds,
  parseOptionalNumber
} from '$lib/server/league/parlayRepository.js';

const VALID_SPORTS = new Set(['nfl', 'ncaaf', 'nba', 'ncaab', 'mlb', 'nhl', 'other']);
const VALID_BET_TYPES = new Set([
  'player_prop',
  'spread',
  'moneyline',
  'game_total',
  'team_total',
  'anytime_td',
  'other'
]);
const VALID_DIRECTIONS = new Set(['over', 'under']);

function clean(value, max = 250) {
  return String(value ?? '').trim().slice(0, max);
}

function errorResponse(error, code, status = 400, extra = {}) {
  return json({ success: false, error, code, ...extra }, { status });
}

function authenticateBot(request, platform) {
  const db = platform?.env?.DB;
  const configuredSecret = String(platform?.env?.IRVING_BOT_SECRET || '');
  const providedSecret = String(request.headers.get('x-irving-bot-secret') || '');

  if (!db) {
    return {
      error: errorResponse('Cloudflare D1 binding "DB" is unavailable.', 'DB_UNAVAILABLE', 500)
    };
  }

  if (!configuredSecret) {
    return {
      error: errorResponse(
        'IRVING_BOT_SECRET is not configured on Irving.',
        'BOT_SECRET_MISSING',
        500
      )
    };
  }

  if (!providedSecret || providedSecret !== configuredSecret) {
    return {
      error: errorResponse('Unauthorized bot request.', 'UNAUTHORIZED', 401)
    };
  }

  return { db };
}

function rowToPick(row) {
  return {
    id: row.id,
    managerId: row.manager_id != null ? String(row.manager_id) : undefined,
    managerName: row.manager_name,
    teamName: row.team_name || null,
    discordUserId: row.discord_user_id || null,
    sport: row.sport,
    subject: row.subject,
    betType: row.bet_type,
    market: row.market || null,
    direction: row.direction || null,
    line: row.current_line == null ? null : Number(row.current_line),
    odds: row.current_odds == null ? null : Number(row.current_odds),
    sportsbook: row.sportsbook || null,
    result: row.result || 'PENDING',
    status: row.status || 'active',
    createdAt: row.created_at || null,
    season: row.season == null ? undefined : Number(row.season),
    week: row.week == null ? undefined : Number(row.week)
  };
}

async function currentWeek(db) {
  const row = await db
    .prepare(`
      SELECT
        id,
        season,
        week,
        status,
        combined_odds,
        wager_amount,
        potential_payout
      FROM parlay_weeks
      ORDER BY
        CASE WHEN status = 'open' THEN 0 ELSE 1 END,
        season DESC,
        week DESC,
        id DESC
      LIMIT 1
    `)
    .first();

  return row || null;
}

function weekShape(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    season: Number(row.season),
    week: Number(row.week),
    status: String(row.status),
    combinedOdds: row.combined_odds || null,
    wagerAmount: row.wager_amount == null ? null : Number(row.wager_amount),
    potentialPayout: row.potential_payout == null ? null : Number(row.potential_payout)
  };
}

async function picksForWeek(db, season, week) {
  const result = await db
    .prepare(`
      SELECT
        id,
        season,
        week,
        manager_id,
        manager_name,
        team_name,
        discord_user_id,
        sport,
        subject,
        bet_type,
        market,
        direction,
        current_line,
        current_odds,
        sportsbook,
        result,
        status,
        created_at
      FROM parlay_picks
      WHERE season = ?
        AND week = ?
        AND status = 'active'
      ORDER BY
        created_at ASC,
        id ASC
    `)
    .bind(Number(season), Number(week))
    .all();

  return (result.results || []).map(rowToPick);
}

async function currentBundle(db) {
  const week = await currentWeek(db);

  if (!week) {
    return {
      week: null,
      picks: [],
      progress: { submitted: 0, total: 14, missing: 14 }
    };
  }

  const picks = await picksForWeek(db, week.season, week.week);
  const progress = await getWeekProgress(db, week.season, week.week);

  return {
    week: weekShape(week),
    picks,
    progress: {
      submitted: Number(progress?.submitted || picks.length),
      total: Number(progress?.total || 14),
      missing: Math.max(
        Number(progress?.total || 14) - Number(progress?.submitted || picks.length),
        0
      )
    }
  };
}

function allManagerRows() {
  return getManagers()
    .map((manager) => ({
      managerId: String(manager.managerID),
      managerName: String(manager.name || ''),
      teamName: String(manager.teamName || '')
    }))
    .sort((a, b) => a.teamName.localeCompare(b.teamName));
}

async function allLinks(db) {
  const result = await db
    .prepare(`
      SELECT
        discord_user_id,
        manager_id,
        manager_name,
        team_name
      FROM discord_manager_links
      WHERE active = 1
    `)
    .all();

  const linksByManager = new Map(
    (result.results || []).map((row) => [String(row.manager_id), row])
  );

  return allManagerRows().map((manager) => {
    const link = linksByManager.get(manager.managerId);

    return {
      ...manager,
      discordUserId: link?.discord_user_id ? String(link.discord_user_id) : null,
      linked: Boolean(link?.discord_user_id)
    };
  });
}

async function missingManagers(db, season, week) {
  const links = await allLinks(db);

  const result = await db
    .prepare(`
      SELECT manager_id
      FROM parlay_picks
      WHERE season = ?
        AND week = ?
        AND status = 'active'
    `)
    .bind(Number(season), Number(week))
    .all();

  const submitted = new Set(
    (result.results || []).map((row) => String(row.manager_id))
  );

  return links
    .filter((row) => !submitted.has(row.managerId))
    .map((row) => ({
      managerId: row.managerId,
      managerName: row.managerName,
      teamName: row.teamName,
      discordUserId: row.discordUserId
    }));
}

async function managerForDiscord(db, discordUserId) {
  const link = await db
    .prepare(`
      SELECT
        discord_user_id,
        manager_id,
        manager_name,
        team_name
      FROM discord_manager_links
      WHERE discord_user_id = ?
        AND active = 1
      LIMIT 1
    `)
    .bind(String(discordUserId))
    .first();

  if (!link) return null;

  return {
    managerId: String(link.manager_id),
    managerName: String(link.manager_name),
    teamName: String(link.team_name || link.manager_name),
    discordUserId: String(link.discord_user_id)
  };
}

function legacyResult(value) {
  const normalized = String(value || '').trim().toUpperCase();

  if (['W', 'WIN', 'WON'].includes(normalized)) return 'WIN';
  if (['L', 'LOSS', 'LOST', 'LOSE'].includes(normalized)) return 'LOSS';
  if (['P', 'PUSH', 'TIE'].includes(normalized)) return 'PUSH';
  if (['PENDING', 'OPEN', 'TBD', 'LIVE'].includes(normalized)) return 'PENDING';

  return normalized || 'PENDING';
}

async function historyForManager(db, manager, limit = 10) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 20));

  const currentResult = await db
    .prepare(`
      SELECT
        season,
        week,
        created_at,
        subject,
        bet_type,
        market,
        direction,
        current_line,
        current_odds,
        result
      FROM parlay_picks
      WHERE manager_id = ?
        AND status != 'voided'
      ORDER BY season DESC, week DESC, created_at DESC
      LIMIT 50
    `)
    .bind(manager.managerId)
    .all();

  const legacyResultRows = await db
    .prepare(`
      SELECT
        season,
        date,
        bet,
        category,
        result,
        source_row_index
      FROM parlay_legacy_picks
      WHERE team = ?
      ORDER BY
        CASE WHEN season IS NULL THEN 1 ELSE 0 END,
        season DESC,
        source_row_index DESC
      LIMIT 100
    `)
    .bind(manager.teamName)
    .all();

  const currentHistory = (currentResult.results || []).map((row) => {
    const pieces = [row.subject];

    if (row.bet_type === 'moneyline') {
      pieces.push('Moneyline');
    } else if (row.bet_type === 'anytime_td') {
      pieces.push('Anytime TD');
    } else {
      if (row.direction) pieces.push(String(row.direction).toUpperCase());
      if (row.current_line != null) pieces.push(String(row.current_line));
      if (row.market) pieces.push(String(row.market));
      else if (row.bet_type) pieces.push(String(row.bet_type).replace(/_/g, ' '));
    }

    if (row.current_odds != null) {
      const odds = Number(row.current_odds);
      pieces.push(odds > 0 ? `+${odds}` : String(odds));
    }

    return {
      source: 'new',
      season: row.season == null ? null : Number(row.season),
      week: row.week == null ? null : Number(row.week),
      date: row.created_at || null,
      bet: pieces.join(' · '),
      category: row.bet_type ? String(row.bet_type).replace(/_/g, ' ') : null,
      result: legacyResult(row.result)
    };
  });

  const legacyHistory = (legacyResultRows.results || []).map((row) => ({
    source: 'legacy',
    season: row.season == null ? null : Number(row.season),
    week: null,
    date: row.date || null,
    bet: String(row.bet || '—'),
    category: row.category ? String(row.category) : null,
    result: legacyResult(row.result)
  }));

  return [...currentHistory, ...legacyHistory]
    .sort((a, b) => {
      const seasonDiff = Number(b.season || 0) - Number(a.season || 0);
      if (seasonDiff) return seasonDiff;

      const weekDiff = Number(b.week || 0) - Number(a.week || 0);
      if (weekDiff) return weekDiff;

      const aDate = Date.parse(a.date || '') || 0;
      const bDate = Date.parse(b.date || '') || 0;
      return bDate - aDate;
    })
    .slice(0, safeLimit);
}

async function recordForManager(db, manager) {
  const newResult = await db
    .prepare(`
      SELECT result, COUNT(*) AS count
      FROM parlay_picks
      WHERE manager_id = ?
        AND status != 'voided'
      GROUP BY result
    `)
    .bind(manager.managerId)
    .all();

  const legacyRows = await db
    .prepare(`
      SELECT result, COUNT(*) AS count
      FROM parlay_legacy_picks
      WHERE team = ?
      GROUP BY result
    `)
    .bind(manager.teamName)
    .all();

  const totals = {
    WIN: 0,
    LOSS: 0,
    PUSH: 0,
    PENDING: 0
  };

  for (const row of newResult.results || []) {
    const key = legacyResult(row.result);
    if (key in totals) totals[key] += Number(row.count || 0);
  }

  for (const row of legacyRows.results || []) {
    const key = legacyResult(row.result);
    if (key in totals) totals[key] += Number(row.count || 0);
  }

  const decided = totals.WIN + totals.LOSS;
  const total = decided + totals.PUSH + totals.PENDING;

  return {
    wins: totals.WIN,
    losses: totals.LOSS,
    pushes: totals.PUSH,
    pending: totals.PENDING,
    decided,
    hitRate: decided ? Number(((totals.WIN / decided) * 100).toFixed(1)) : 0,
    total
  };
}

async function previousWeek(db, current) {
  if (!current) return null;

  const row = await db
    .prepare(`
      SELECT
        id,
        season,
        week,
        status,
        combined_odds,
        wager_amount,
        potential_payout
      FROM parlay_weeks
      WHERE
        season < ?
        OR (season = ? AND week < ?)
      ORDER BY season DESC, week DESC, id DESC
      LIMIT 1
    `)
    .bind(Number(current.season), Number(current.season), Number(current.week))
    .first();

  return row || null;
}

async function mostRecentGradedWeek(db) {
  return await db
    .prepare(`
      SELECT
        id,
        season,
        week,
        status,
        combined_odds,
        wager_amount,
        potential_payout
      FROM parlay_weeks
      WHERE status = 'graded'
      ORDER BY season DESC, week DESC, id DESC
      LIMIT 1
    `)
    .first();
}

function overlapGroups(picks) {
  const groups = new Map();

  for (const pick of picks) {
    const key = normalizeParlayToken(pick.subject || '');
    if (!key) continue;

    const group = groups.get(key) || [];
    group.push(pick);
    groups.set(key, group);
  }

  return [...groups.values()]
    .filter((group) => group.length > 1)
    .map((group) => ({
      subject: group[0]?.subject || 'Potential overlap',
      picks: group
    }));
}

export async function GET({ request, platform, url }) {
  const auth = authenticateBot(request, platform);
  if (auth.error) return auth.error;

  const db = auth.db;
  const action = clean(url.searchParams.get('action') || 'current', 40).toLowerCase();

  try {
    if (action === 'current' || action === 'ticket' || action === 'status') {
      const bundle = await currentBundle(db);

      return json({
        success: true,
        action,
        ...bundle
      });
    }

    if (action === 'mypick') {
      const discordUserId = clean(url.searchParams.get('discordUserId'), 32);

      if (!discordUserId) {
        return errorResponse('discordUserId is required.', 'DISCORD_USER_REQUIRED');
      }

      const manager = await managerForDiscord(db, discordUserId);

      if (!manager) {
        return errorResponse(
          'That Discord account is not linked to an Irving manager.',
          'DISCORD_NOT_LINKED',
          404
        );
      }

      const bundle = await currentBundle(db);

      if (!bundle.week) {
        return json({ success: true, action, manager, week: null, pick: null });
      }

      const pick = bundle.picks.find(
        (row) => String(row.managerId) === manager.managerId
      ) || null;

      return json({
        success: true,
        action,
        manager,
        week: bundle.week,
        pick
      });
    }

    if (action === 'missing' || action === 'randommanager') {
      const bundle = await currentBundle(db);

      if (!bundle.week) {
        return json({
          success: true,
          action,
          week: null,
          missing: []
        });
      }

      let missing = await missingManagers(
        db,
        bundle.week.season,
        bundle.week.week
      );

      if (action === 'randommanager' && missing.length) {
        const choice = missing[Math.floor(Math.random() * missing.length)];
        missing = [choice];
      }

      return json({
        success: true,
        action,
        week: bundle.week,
        progress: bundle.progress,
        missing
      });
    }

    if (action === 'duplicates') {
      const bundle = await currentBundle(db);

      return json({
        success: true,
        action,
        week: bundle.week,
        overlaps: overlapGroups(bundle.picks)
      });
    }

    if (action === 'linkstatus') {
      const links = await allLinks(db);

      return json({
        success: true,
        action,
        links
      });
    }

    if (action === 'history' || action === 'record') {
      const discordUserId = clean(url.searchParams.get('discordUserId'), 32);

      if (!discordUserId) {
        return errorResponse('discordUserId is required.', 'DISCORD_USER_REQUIRED');
      }

      const manager = await managerForDiscord(db, discordUserId);

      if (!manager) {
        return errorResponse(
          'That Discord account is not linked to an Irving manager.',
          'DISCORD_NOT_LINKED',
          404
        );
      }

      if (action === 'history') {
        const history = await historyForManager(
          db,
          manager,
          url.searchParams.get('limit') || 10
        );

        return json({
          success: true,
          action,
          manager,
          history
        });
      }

      return json({
        success: true,
        action,
        manager,
        record: await recordForManager(db, manager)
      });
    }

    if (action === 'lastweek') {
      const current = await currentWeek(db);
      const previous = await previousWeek(db, current);

      if (!previous) {
        return json({
          success: true,
          action,
          previousWeek: null,
          picks: []
        });
      }

      return json({
        success: true,
        action,
        previousWeek: weekShape(previous),
        picks: await picksForWeek(db, previous.season, previous.week)
      });
    }

    if (action === 'weekresult') {
      const graded = await mostRecentGradedWeek(db);

      if (!graded) {
        return json({
          success: true,
          action,
          week: null,
          picks: []
        });
      }

      return json({
        success: true,
        action,
        week: weekShape(graded),
        picks: await picksForWeek(db, graded.season, graded.week)
      });
    }

    return errorResponse(`Unknown bot action: ${action}`, 'UNKNOWN_ACTION', 400);
  } catch (error) {
    console.error(`Parlay bot GET action "${action}" failed:`, error);

    return errorResponse(
      error instanceof Error ? error.message : 'Unable to load parlay data.',
      'BOT_QUERY_FAILED',
      500
    );
  }
}

export async function POST({ request, platform }) {
  const auth = authenticateBot(request, platform);
  if (auth.error) return auth.error;

  const db = auth.db;

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Request body must be valid JSON.', 'INVALID_JSON');
  }

  const discordUserId = clean(body.discordUserId, 32);
  const discordUsername = clean(body.discordUsername, 80);
  const discordDisplayName = clean(body.discordDisplayName, 100);
  const sport = clean(body.sport, 20).toLowerCase();
  const betType = clean(body.betType, 30).toLowerCase();
  const directionRaw = clean(body.direction, 10).toLowerCase();
  const direction = directionRaw ? directionRaw : null;
  const subject = clean(body.subject, 120);
  const market = clean(body.market, 120) || null;
  const notes = clean(body.notes, 500) || null;
  const line = parseOptionalNumber(body.line);
  const odds = parseAmericanOdds(body.odds);

  if (!discordUserId || !discordUsername || !subject) {
    return errorResponse(
      'Discord user, username, and player/team are required.',
      'MISSING_FIELDS'
    );
  }

  if (!VALID_SPORTS.has(sport)) {
    return errorResponse('Unsupported sport.', 'INVALID_SPORT');
  }

  if (!VALID_BET_TYPES.has(betType)) {
    return errorResponse('Unsupported bet type.', 'INVALID_BET_TYPE');
  }

  if (direction && !VALID_DIRECTIONS.has(direction)) {
    return errorResponse('Direction must be over or under.', 'INVALID_DIRECTION');
  }

  if (odds == null) {
    return errorResponse(
      'Odds must be valid American odds such as -110 or +150.',
      'INVALID_ODDS'
    );
  }

  if (body.line != null && String(body.line).trim() && line == null) {
    return errorResponse('Line must be numeric.', 'INVALID_LINE');
  }

  const openWeek = await getOpenParlayWeek(db);

  if (!openWeek) {
    return errorResponse(
      'There is no open Irving parlay week right now.',
      'NO_OPEN_WEEK',
      409
    );
  }

  const link = await getDiscordManagerLink(db, discordUserId);

  if (!link) {
    return errorResponse(
      'Your Discord account is not linked to an Irving manager yet. Ask an admin to link it in the Parlay Control Room.',
      'DISCORD_NOT_LINKED',
      403
    );
  }

  const existingPick = await getActiveManagerPick(db, {
    season: openWeek.season,
    week: openWeek.week,
    managerId: link.manager_id
  });

  const replaceExisting = body.replaceExisting === true;

  if (existingPick && !replaceExisting) {
    return errorResponse(
      `You already submitted a Week ${openWeek.week} pick: ${existingPick.subject}. Use /replacepick to replace it.`,
      'PICK_ALREADY_SUBMITTED',
      409,
      { existingPick }
    );
  }

  if (existingPick && Number(existingPick.locked) === 1) {
    return errorResponse(
      'Your current pick is locked and cannot be replaced.',
      'PICK_LOCKED',
      409,
      { existingPick }
    );
  }

  const candidate = {
    season: Number(openWeek.season),
    week: Number(openWeek.week),
    parlayWeekId: Number(openWeek.id),
    managerId: String(link.manager_id),
    managerName: String(link.manager_name),
    teamName: link.team_name ? String(link.team_name) : null,
    discordUserId,
    discordUsername,
    discordDisplayName,
    sport,
    subject,
    subjectNormalized: normalizeParlayToken(subject),
    betType,
    market,
    marketNormalized: normalizeParlayToken(market || ''),
    direction,
    line,
    odds,
    sportsbook,
    notes,
    excludePickId: existingPick?.id ?? null
  };

  const duplicate = await findDuplicatePick(db, candidate);

  if (duplicate) {
    const directionLabel = duplicate.direction
      ? ` ${String(duplicate.direction).toUpperCase()}`
      : '';
    const marketLabel = duplicate.market ? ` ${duplicate.market}` : '';

    return errorResponse(
      `That wager is already being used by ${duplicate.manager_name}: ${duplicate.subject}${directionLabel}${marketLabel}. Choose another leg.`,
      'DUPLICATE_PICK',
      409,
      { existingPick: duplicate }
    );
  }

  let created;

  try {
    created = existingPick && replaceExisting
      ? await replaceParlayPick(db, existingPick, candidate)
      : await createParlayPick(db, candidate);
  } catch (error) {
    console.error('Parlay pick insert failed:', error);

    return errorResponse(
      'Unable to save the pick.',
      'INSERT_FAILED',
      500
    );
  }

  const progress = await getWeekProgress(
    db,
    openWeek.season,
    openWeek.week
  );

  return json({
    success: true,
    pick: {
      id: created.id,
      season: Number(created.season),
      week: Number(created.week),
      managerName: created.manager_name,
      teamName: created.team_name
    },
    progress
  });
}


export async function PATCH({ request, platform }) {
  const auth = authenticateBot(request, platform);
  if (auth.error) return auth.error;
  const db = auth.db;

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Request body must be valid JSON.', 'INVALID_JSON');
  }

  const action = clean(body.action, 40);

  if (action === 'link-message') {
    const pickId = Number(body.pickId);
    const discordMessageId = clean(body.discordMessageId, 32);

    if (!Number.isInteger(pickId) || !discordMessageId) {
      return errorResponse('pickId and discordMessageId are required.', 'MISSING_MESSAGE_LINK_FIELDS');
    }

    const pick = await linkDiscordMessage(db, pickId, discordMessageId);
    if (!pick) return errorResponse('Pick not found.', 'PICK_NOT_FOUND', 404);

    return json({ success: true, pickId, discordMessageId });
  }

  return errorResponse(`Unknown PATCH action: ${action}`, 'UNKNOWN_ACTION', 400);
}
