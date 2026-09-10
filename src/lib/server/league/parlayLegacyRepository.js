const DEFAULT_PARLAY_WEBAPP_URL =
  'https://script.google.com/macros/s/AKfycbwER8arauwMUsm1bOtb9dbZV78ijMnysrD-GC66H58AtCOtANvcrxszm2TmSVCD1Rj5/exec';

const FIELD_ALIASES = {
  team: ['GM Team', 'Team', 'Franchise', 'Manager Team'],
  date: ['Date', 'Bet Date', 'Parlay Date'],
  bet: ['Group Parlay Bet', 'Parlay Bet', 'Bet', 'Pick'],
  result: ['Group Parlay Result', 'Parlay Result', 'Result'],
  category: ['Bet Category 1', 'Bet Category', 'Category', 'Type']
};

function text(value) {
  return value == null ? '' : String(value).trim();
}

function keyToken(value) {
  return text(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
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

  const yearMatch = source.match(/(?:^|\D)(20\d{2})(?:$|\D)/);
  if (yearMatch) return Number(yearMatch[1]);

  const parsed = new Date(source);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getFullYear();
}

function normalizeSourceRows(payload) {
  return payload
    .map((record, index) => {
      const date = text(getField(record, FIELD_ALIASES.date));
      const team = text(getField(record, FIELD_ALIASES.team));
      const bet = text(getField(record, FIELD_ALIASES.bet));
      const result = normalizeResult(getField(record, FIELD_ALIASES.result));
      const category = text(getField(record, FIELD_ALIASES.category)) || 'Uncategorized';

      return {
        sourceRowIndex: index + 1,
        team: team || 'Unknown franchise',
        date,
        season: seasonFromDate(date),
        bet: bet || '—',
        result,
        category,
        rawJson: JSON.stringify(record)
      };
    })
    .filter((row) => row.team !== 'Unknown franchise' || row.bet !== '—' || row.date);
}

export function getLegacyParlaySourceUrl(env) {
  return (
    text(env?.PARLAY_WEBAPP_URL) ||
    text(env?.PUBLIC_PARLAY_WEBAPP_URL) ||
    DEFAULT_PARLAY_WEBAPP_URL
  );
}

export async function getLegacyParlayImportStatus(db) {
  try {
    const [state, count] = await Promise.all([
      db.prepare(`SELECT * FROM parlay_legacy_import_state WHERE id = 1`).first(),
      db.prepare(`SELECT COUNT(*) AS count FROM parlay_legacy_picks`).first()
    ]);

    return {
      configured: true,
      importedRows: Number(count?.count || 0),
      sourceRows: Number(state?.source_rows || 0),
      lastImportedAt: state?.last_imported_at || null,
      sourceUrl: state?.source_url || null,
      lastError: state?.last_error || null,
      complete:
        Number(count?.count || 0) > 0 &&
        Number(count?.count || 0) === Number(state?.imported_rows || 0)
    };
  } catch {
    return {
      configured: false,
      importedRows: 0,
      sourceRows: 0,
      lastImportedAt: null,
      sourceUrl: null,
      lastError: null,
      complete: false
    };
  }
}

export async function importLegacyParlayHistory({ db, env, fetchFn = fetch }) {
  const sourceUrl = getLegacyParlaySourceUrl(env);
  const requestUrl = new URL(sourceUrl);

  if (!requestUrl.searchParams.has('type') && !requestUrl.searchParams.has('sheet')) {
    requestUrl.searchParams.set('type', 'main');
  }

  try {
    const response = await fetchFn(requestUrl.toString(), {
      headers: { accept: 'application/json' },
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`Legacy Parlay feed returned HTTP ${response.status}.`);
    }

    const payload = await response.json();

    if (!Array.isArray(payload)) {
      if (payload?.error) throw new Error(`Legacy Parlay feed error: ${payload.error}`);
      throw new Error('Legacy Parlay feed returned an unexpected response shape.');
    }

    const rows = normalizeSourceRows(payload);

    // Full snapshot replacement: rerunning this action produces the exact same
    // historical set instead of duplicating records. D1 batch is transactional.
    const statements = [db.prepare(`DELETE FROM parlay_legacy_picks`)];

    for (const row of rows) {
      statements.push(
        db
          .prepare(`
            INSERT INTO parlay_legacy_picks (
              source_row_index,
              team,
              date,
              season,
              bet,
              result,
              category,
              raw_json,
              imported_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `)
          .bind(
            row.sourceRowIndex,
            row.team,
            row.date || null,
            row.season,
            row.bet,
            row.result,
            row.category,
            row.rawJson
          )
      );
    }

    statements.push(
      db
        .prepare(`
          UPDATE parlay_legacy_import_state
          SET source_url = ?,
              source_rows = ?,
              imported_rows = ?,
              last_imported_at = CURRENT_TIMESTAMP,
              last_error = NULL
          WHERE id = 1
        `)
        .bind(requestUrl.toString(), payload.length, rows.length)
    );

    await db.batch(statements);

    return {
      sourceRows: payload.length,
      importedRows: rows.length,
      skippedRows: payload.length - rows.length,
      sourceUrl: requestUrl.toString()
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    try {
      await db
        .prepare(`
          UPDATE parlay_legacy_import_state
          SET source_url = ?, last_error = ?
          WHERE id = 1
        `)
        .bind(requestUrl.toString(), message.slice(0, 1000))
        .run();
    } catch {
      // Migration may not be applied yet; preserve the original error.
    }

    throw error;
  }
}

export async function getImportedLegacyParlayRows(db) {
  try {
    const result = await db
      .prepare(`
        SELECT
          id,
          source_row_index,
          team,
          date,
          season,
          bet,
          result,
          category,
          imported_at
        FROM parlay_legacy_picks
        ORDER BY source_row_index ASC
      `)
      .all();

    return result.results || [];
  } catch {
    return [];
  }
}
