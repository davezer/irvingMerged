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
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function text(value) {
  if (value == null) return '';
  return String(value).trim();
}

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

  if (['W', 'WIN', 'WON'].includes(result)) return 'WIN';
  if (['L', 'LOSS', 'LOST', 'LOSE'].includes(result)) return 'LOSS';
  if (['P', 'PUSH', 'TIE'].includes(result)) return 'PUSH';
  if (['PENDING', 'OPEN', 'TBD', 'LIVE'].includes(result)) return 'PENDING';

  return result || '—';
}

function seasonFromDate(value) {
  const source = text(value);
  if (!source) return null;

  const slashMatch = source.match(/(?:^|\D)(20\d{2})(?:$|\D)/);
  if (slashMatch) return Number(slashMatch[1]);

  const mmddyyyy = source.match(/^\s*\d{1,2}[/-]\d{1,2}[/-](20\d{2})\s*$/);
  if (mmddyyyy) return Number(mmddyyyy[1]);

  const parsed = new Date(source);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getFullYear();
}

function dateSortValue(value) {
  const source = text(value);
  if (!source) return 0;

  const parsed = new Date(source);
  if (!Number.isNaN(parsed.getTime())) return parsed.getTime();

  const match = source.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!match) return 0;

  return Date.UTC(Number(match[3]), Number(match[1]) - 1, Number(match[2]));
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

  return {
    total: rows.length,
    wins,
    losses,
    pushes,
    pending,
    decided: wins + losses,
    hitRate: percentage(wins, losses)
  };
}

function uniqueSorted(values) {
  return [...new Set(values.map(text).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );
}

function normalizeRows(payload) {
  return payload
    .map((record, index) => {
      const date = text(getField(record, FIELD_ALIASES.date));

      return {
        id: `parlay-${index + 1}`,
        sourceIndex: index,
        team: text(getField(record, FIELD_ALIASES.team)) || 'Unknown franchise',
        date,
        season: seasonFromDate(date),
        bet: text(getField(record, FIELD_ALIASES.bet)) || '—',
        result: normalizeResult(getField(record, FIELD_ALIASES.result)),
        category: text(getField(record, FIELD_ALIASES.category)) || 'Uncategorized',
        dateSort: dateSortValue(date),
        raw: record
      };
    })
    .filter((row) => row.team !== 'Unknown franchise' || row.bet !== '—' || row.date)
    .sort((a, b) => {
      // Keep the newest cards at the top while preserving source order for same-day rows.
      if (b.dateSort !== a.dateSort) return b.dateSort - a.dateSort;
      return a.sourceIndex - b.sourceIndex;
    });
}

export async function getParlayBundle({ env, fetchFn = fetch, season = null } = {}) {
  const endpoint =
    text(env?.PARLAY_WEBAPP_URL) ||
    text(env?.PUBLIC_PARLAY_WEBAPP_URL) ||
    DEFAULT_PARLAY_WEBAPP_URL;

  const requestUrl = new URL(endpoint);
  if (!requestUrl.searchParams.has('type') && !requestUrl.searchParams.has('sheet')) {
    requestUrl.searchParams.set('type', 'main');
  }

  const response = await fetchFn(requestUrl.toString(), {
    headers: { accept: 'application/json' },
    redirect: 'follow'
  });

  if (!response.ok) {
    throw new Error(`Parlay feed returned HTTP ${response.status}.`);
  }

  const payload = await response.json();

  if (!Array.isArray(payload)) {
    if (payload?.error) throw new Error(`Parlay feed error: ${payload.error}`);
    throw new Error('Parlay feed returned an unexpected response shape.');
  }

  const allRows = normalizeRows(payload);
  const availableSeasons = [...new Set(allRows.map((row) => row.season).filter(Number.isFinite))]
    .sort((a, b) => b - a);

  const requestedSeason = Number(season);
  const hasSeasonFilter = Number.isFinite(requestedSeason) && requestedSeason > 2000;
  const rows = hasSeasonFilter
    ? allRows.filter((row) => Number(row.season) === requestedSeason)
    : allRows;

  return {
    source: 'Google Sheets · Apps Script',
    endpointConfigured: Boolean(endpoint),
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
