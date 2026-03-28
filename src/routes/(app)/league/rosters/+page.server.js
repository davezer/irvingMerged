import { parseSeasonParam } from '$lib/server/league/season.js';
import { resolveLeagueStorage } from '$lib/server/league/db.js';

function safeJsonParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function initialsFromName(name = '') {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '?';
}

export async function load({ url, platform }) {
  const season = parseSeasonParam(url.searchParams.get('season'));
  const db = platform?.env?.DB;
  const leagueId = String(url.searchParams.get('leagueId') || platform?.env?.SLEEPER_LEAGUE_ID || '').trim() || null;

  if (!db) {
    return { season, leagueId, rosters: [], hasData: false };
  }

  const storage = await resolveLeagueStorage(db);

  const rosterRes = await db.prepare(`
    SELECT roster_id, owner_id, players_json, starters_json, settings_json, metadata_json, season, league_id
    FROM ${storage.rostersTable}
    WHERE (?1 IS NULL OR season = ?1)
      AND (?2 IS NULL OR league_id = ?2)
    ORDER BY roster_id ASC
  `).bind(storage.hasSeasonalRosters || storage.legacyRostersHaveSeason ? season : null, leagueId).all();

  const userRes = await db.prepare(`
    SELECT sleeper_user_id, display_name, avatar
    FROM sleeper_users
  `).all().catch(() => ({ results: [] }));

  const users = new Map((userRes?.results || []).map((u) => [u.sleeper_user_id, u]));

  const rosters = (rosterRes?.results || []).map((row) => {
    const starters = safeJsonParse(row.starters_json, []) || [];
    const players = safeJsonParse(row.players_json, []) || [];
    const settings = safeJsonParse(row.settings_json, {}) || {};
    const metadata = safeJsonParse(row.metadata_json, {}) || {};
    const user = users.get(row.owner_id) || {};

    const displayName =
      user.display_name ||
      metadata.team_name ||
      `Roster ${row.roster_id}`;

    return {
      rosterId: row.roster_id,
      ownerId: row.owner_id,
      displayName,
      initials: initialsFromName(displayName),
      avatarUrl: user.avatar ? `https://sleepercdn.com/avatars/${user.avatar}` : null,
      teamName: metadata.team_name || '',
      wins: Number(settings.wins || 0),
      losses: Number(settings.losses || 0),
      ties: Number(settings.ties || 0),
      starterCount: starters.length,
      playerCount: players.length,
      waiverBudgetUsed: Number(settings.waiver_budget_used || settings.waiver_budget_spent || 0),
      starters,
      managerSlug: null,
      season: row.season,
      leagueId: row.league_id
    };
  });

  return {
    season,
    leagueId,
    rosters,
    hasData: rosters.length > 0,
    storage: storage.rostersTable
  };
}