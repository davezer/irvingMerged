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

export async function load({ url, platform }) {
  const season = parseSeasonParam(url.searchParams.get('season'));
  const db = platform?.env?.DB;
  const leagueId = String(url.searchParams.get('leagueId') || platform?.env?.SLEEPER_LEAGUE_ID || '').trim() || null;

  if (!db) {
    return { season, leagueId, transactions: [], hasData: false };
  }

  const storage = await resolveLeagueStorage(db);

  const res = await db.prepare(`
    SELECT transaction_id, type, status, roster_ids_json, adds_json, drops_json, draft_picks_json,
           waiver_budget_json, created_at, round, season, league_id
    FROM ${storage.transactionsTable}
    WHERE (?1 IS NULL OR season = ?1)
      AND (?2 IS NULL OR league_id = ?2)
    ORDER BY COALESCE(created_at, 0) DESC, COALESCE(round, 0) DESC
    LIMIT 100
  `).bind(
    storage.hasSeasonalTransactions || storage.legacyTransactionsHaveSeason ? season : null,
    leagueId
  ).all();

  const transactions = (res?.results || []).map((row) => {
    const adds = safeJsonParse(row.adds_json, {}) || {};
    const drops = safeJsonParse(row.drops_json, {}) || {};
    const draftPicks = safeJsonParse(row.draft_picks_json, []) || [];
    const faab = safeJsonParse(row.waiver_budget_json, {}) || {};

    const addEntries = Object.entries(adds);
    const dropEntries = Object.entries(drops);
    const faabMoves = Object.entries(faab);

    const summaryBits = [];
    if (addEntries.length) summaryBits.push(`${addEntries.length} add${addEntries.length === 1 ? '' : 's'}`);
    if (dropEntries.length) summaryBits.push(`${dropEntries.length} drop${dropEntries.length === 1 ? '' : 's'}`);
    if (draftPicks.length) summaryBits.push(`${draftPicks.length} pick move${draftPicks.length === 1 ? '' : 's'}`);
    if (faabMoves.length) summaryBits.push(`${faabMoves.length} FAAB change${faabMoves.length === 1 ? '' : 's'}`);

    return {
      id: row.transaction_id,
      type: row.type || 'move',
      status: row.status || 'complete',
      createdAt: row.created_at || null,
      round: row.round || null,
      addEntries,
      dropEntries,
      draftPicks,
      faabMoves,
      summaryLine: summaryBits.join(' • ') || 'Transaction record',
      season: row.season,
      leagueId: row.league_id
    };
  });

  return {
    season,
    leagueId,
    transactions,
    hasData: transactions.length > 0,
    storage: storage.transactionsTable
  };
}