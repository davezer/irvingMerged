import { getImportedLegacyParlayRows } from '$lib/server/league/parlayLegacyRepository.js';

const DEFAULT_PARLAY_WEBAPP_URL =
  'https://script.google.com/macros/s/AKfycbwER8arauwMUsm1bOtb9dbZV78ijMnysrD-GC66H58AtCOtANvcrxszm2TmSVCD1Rj5/exec';

const FIELD_ALIASES = {
  team: ['GM Team', 'Team', 'Franchise', 'Manager Team'],
  date: ['Date', 'Bet Date', 'Parlay Date'],
  bet: ['Group Parlay Bet', 'Parlay Bet', 'Bet', 'Pick'],
  result: ['Group Parlay Result', 'Parlay Result', 'Result'],
  category: ['Bet Category 1', 'Bet Category', 'Category', 'Type']
};

function keyToken(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}
function text(value) { return value == null ? '' : String(value).trim(); }
function getField(record, aliases) {
  const keys = Object.keys(record || {});
  const normalized = new Map(keys.map((key) => [keyToken(key), key]));
  for (const alias of aliases) {
    const actualKey = normalized.get(keyToken(alias));
    if (actualKey) return record[actualKey];
  }
  return '';
}
function normalizeResult(value) {
  const result = text(value).toUpperCase();
  if (['W','WIN','WON'].includes(result)) return 'WIN';
  if (['L','LOSS','LOST','LOSE'].includes(result)) return 'LOSS';
  if (['P','PUSH','TIE'].includes(result)) return 'PUSH';
  if (['PENDING','OPEN','TBD','LIVE'].includes(result)) return 'PENDING';
  return result || '—';
}
function seasonFromDate(value) {
  const source = text(value);
  if (!source) return null;
  const yearMatch = source.match(/(?:^|\D)(20\d{2})(?:$|\D)/);
  if (yearMatch) return Number(yearMatch[1]);
  const parsed = new Date(source);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getFullYear();
}
function dateSortValue(value) {
  const source = text(value);
  if (!source) return 0;
  const parsed = new Date(source);
  if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  const match = source.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  return match ? Date.UTC(Number(match[3]), Number(match[1]) - 1, Number(match[2])) : 0;
}
function percentage(wins, losses) {
  const decided = wins + losses;
  return decided ? Number(((wins / decided) * 100).toFixed(1)) : 0;
}
function summarize(rows) {
  const wins = rows.filter((row) => row.result === 'WIN').length;
  const losses = rows.filter((row) => row.result === 'LOSS').length;
  const pushes = rows.filter((row) => row.result === 'PUSH').length;
  const pending = rows.filter((row) => row.result === 'PENDING').length;
  return { total: rows.length, wins, losses, pushes, pending, decided: wins + losses, hitRate: percentage(wins, losses) };
}
function uniqueSorted(values) {
  return [...new Set(values.map(text).filter(Boolean))].sort((a,b) => a.localeCompare(b, undefined, { sensitivity:'base' }));
}
function normalizeLegacyRows(payload) {
  return payload.map((record,index) => {
    const date = text(getField(record, FIELD_ALIASES.date));
    return {
      id: `legacy-parlay-${index + 1}`,
      sourceIndex: index,
      sourceType: 'legacy-google',
      team: text(getField(record, FIELD_ALIASES.team)) || 'Unknown franchise',
      date,
      season: seasonFromDate(date),
      week: null,
      bet: text(getField(record, FIELD_ALIASES.bet)) || '—',
      result: normalizeResult(getField(record, FIELD_ALIASES.result)),
      category: text(getField(record, FIELD_ALIASES.category)) || 'Uncategorized',
      dateSort: dateSortValue(date),
      raw: record
    };
  }).filter((row) => row.team !== 'Unknown franchise' || row.bet !== '—' || row.date);
}
function normalizeImportedLegacyRows(rows) {
  return rows.map((row, index) => ({
    id: `legacy-d1-${row.id}`,
    sourceIndex: Number(row.source_row_index || index + 1),
    sourceType: 'legacy-d1',
    team: text(row.team) || 'Unknown franchise',
    date: text(row.date),
    season: Number.isFinite(Number(row.season)) ? Number(row.season) : seasonFromDate(row.date),
    week: null,
    bet: text(row.bet) || '—',
    result: normalizeResult(row.result),
    category: text(row.category) || 'Uncategorized',
    dateSort: dateSortValue(row.date),
    raw: row
  }));
}
function titleCaseToken(value) {
  return text(value).split('_').map((part) => part ? part[0].toUpperCase() + part.slice(1) : '').join(' ');
}
function formatD1Bet(row) {
  const direction = row.direction ? `${String(row.direction).toUpperCase()} ` : '';
  const line = row.current_line == null ? '' : `${row.current_line} `;
  const market = text(row.market) || titleCaseToken(row.bet_type);
  const odds = Number(row.current_odds);
  const oddsText = Number.isFinite(odds) ? ` (${odds > 0 ? '+' : ''}${odds})` : '';
  return `${row.subject} — ${direction}${line}${market}${oddsText}`.replace(/\s+/g, ' ').trim();
}
async function getD1Rows(env) {
  const db = env?.DB;
  if (!db) return [];
  try {
    const result = await db.prepare(`
      SELECT id, season, week, team_name, manager_name, subject, bet_type, market,
             direction, current_line, current_odds, result, created_at, updated_at
      FROM parlay_picks
      WHERE status = 'active'
      ORDER BY season DESC, week DESC, created_at ASC
    `).all();
    return (result.results || []).map((row,index) => {
      const date = text(row.created_at);
      return {
        id: `d1-parlay-${row.id}`,
        sourceIndex: index,
        sourceType: 'd1',
        team: text(row.team_name) || text(row.manager_name) || 'Unknown franchise',
        date,
        season: Number(row.season),
        week: Number(row.week),
        bet: formatD1Bet(row),
        result: normalizeResult(row.result),
        category: titleCaseToken(row.bet_type) || 'Uncategorized',
        dateSort: dateSortValue(text(row.updated_at) || date),
        raw: row
      };
    });
  } catch (error) {
    console.warn('D1 parlay table unavailable; using legacy feed only.', error);
    return [];
  }
}
async function getLegacyRowsFromGoogle({ env, fetchFn }) {
  const endpoint = text(env?.PARLAY_WEBAPP_URL) || text(env?.PUBLIC_PARLAY_WEBAPP_URL) || DEFAULT_PARLAY_WEBAPP_URL;
  try {
    const requestUrl = new URL(endpoint);
    if (!requestUrl.searchParams.has('type') && !requestUrl.searchParams.has('sheet')) requestUrl.searchParams.set('type', 'main');
    const response = await fetchFn(requestUrl.toString(), { headers: { accept: 'application/json' }, redirect: 'follow' });
    if (!response.ok) throw new Error(`Parlay feed returned HTTP ${response.status}.`);
    const payload = await response.json();
    if (!Array.isArray(payload)) {
      if (payload?.error) throw new Error(`Parlay feed error: ${payload.error}`);
      throw new Error('Parlay feed returned an unexpected response shape.');
    }
    return normalizeLegacyRows(payload);
  } catch (error) {
    console.warn('Legacy parlay feed unavailable.', error);
    return [];
  }
}
async function getLegacyRows({ env, fetchFn }) {
  const db = env?.DB;

  if (db) {
    const imported = await getImportedLegacyParlayRows(db);
    if (imported.length) {
      return {
        rows: normalizeImportedLegacyRows(imported),
        source: 'Irving D1 Legacy Archive'
      };
    }
  }

  return {
    rows: await getLegacyRowsFromGoogle({ env, fetchFn }),
    source: 'Google Sheets · Apps Script'
  };
}

export async function getParlayBundle({ env, fetchFn = fetch, season = null } = {}) {
  const [d1Rows, legacyBundle] = await Promise.all([
    getD1Rows(env),
    getLegacyRows({ env, fetchFn })
  ]);

  const legacyRows = legacyBundle.rows;
  const allRows = [...d1Rows, ...legacyRows].sort((a,b) => {
    if (Number(b.season || 0) !== Number(a.season || 0)) return Number(b.season || 0) - Number(a.season || 0);
    if (Number(b.week || 0) !== Number(a.week || 0)) return Number(b.week || 0) - Number(a.week || 0);
    if (b.dateSort !== a.dateSort) return b.dateSort - a.dateSort;
    return a.sourceIndex - b.sourceIndex;
  });

  const availableSeasons = [...new Set(allRows.map((row) => row.season).filter(Number.isFinite))].sort((a,b) => b-a);
  const requestedSeason = Number(season);
  const hasSeasonFilter = Number.isFinite(requestedSeason) && requestedSeason > 2000;
  const rows = hasSeasonFilter ? allRows.filter((row) => Number(row.season) === requestedSeason) : allRows;

  return {
    source:
      d1Rows.length && legacyRows.length
        ? `Irving D1 + ${legacyBundle.source}`
        : d1Rows.length
          ? 'Irving D1'
          : legacyBundle.source,
    endpointConfigured: true,
    requestedSeason: hasSeasonFilter ? requestedSeason : null,
    availableSeasons,
    rows,
    allRowCount: allRows.length,
    stats: summarize(rows),
    teamOptions: uniqueSorted(rows.map((row) => row.team)),
    categoryOptions: uniqueSorted(rows.map((row) => row.category)),
    resultOptions: uniqueSorted(rows.map((row) => row.result).filter((value) => value !== '—')),
    hasData: rows.length > 0
  };
}
