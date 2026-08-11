import {
  fail
} from '@sveltejs/kit';

import {
  getManagers
} from '$lib/server/league';

import {
  getDraftCapitalBalances,
  getDraftCapitalLedger,
  getDraftCapitalTradeInbox,
  getLegacyDraftCapitalImportStatus,
  importLegacyDraftCapitalLedger,
  addDraftCapitalEntry,
  postDraftCapitalTransfer,
  postReviewedTradeCapital,
  markTradeReviewedNoCapital,
  voidDraftCapitalEntry
} from '$lib/server/league/draftCapitalRepository.js';

import {
  resolvePlayersByIds
} from '$lib/server/league/players.js';


/*
 * ============================================================
 * EXACT CURRENT 2026 BALANCES FROM YOUR SPREADSHEET SCREENSHOT
 *
 * This is a one-time opening-balance import.
 *
 * It gives D1 the SAME starting point as the spreadsheet.
 * Later we can import the complete historical ledger if desired.
 * ============================================================
 */

const OPENING_BALANCES_2026 = {
  'Amherst Union':
    247,

  'Clearwater HenryPussycats':
    273,

  'Dagobah Lightsabres':
    297,

  'Dunedin Homers':
    77,

  'Jacksonville Vincitori':
    293,

  'Kansas City Kodachromes':
    220,

  'Lehigh Crucible':
    103,

  'Milford Jayhawks':
    233,

  'Nakatomi Plaza CC':
    263,

  'Rebel Radio Lone Rangers':
    232,

  'Salem Hipsterjacks':
    274,

  'Saskatchewan Mounties':
    200,

  'Tallahassee Tribe':
    79,

  'Ultimate City Warriors':
    65
};


function clean(
  value
) {
  const result =
    String(value ?? '').trim();

  return result || null;
}


function parseNumber(
  value
) {
  if (
    value == null ||
    String(value).trim() === ''
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}


function assertAdmin(
  locals
) {
  if (
    !locals.user ||
    locals.user.role !== 'admin'
  ) {
    return false;
  }

  return true;
}


function managerRows() {
  return getManagers()
    .map(
      (manager) => ({
        id:
          String(
            manager.managerID
          ),

        name:
          manager.name,

        teamName:
          manager.teamName,

        slug:
          manager.slug,

        photo:
          manager.photo ||
          null
      })
    )
    .sort(
      (a, b) =>
        a.teamName.localeCompare(
          b.teamName
        )
    );
}


function buildManagerIndex(
  managers
) {
  return new Map(
    managers.map(
      (manager) => [
        String(
          manager.id
        ),
        manager
      ]
    )
  );
}


/*
 * ============================================================
 * TURN RAW STORED SLEEPER TRADE INTO ADMIN-FRIENDLY CARD
 * ============================================================
 */

async function enrichTradeInbox(
  trades,
  managers
) {
  const managerIndex =
    buildManagerIndex(
      managers
    );


  const allPlayerIds =
    trades.flatMap(
      (trade) => [
        ...Object.keys(
          trade.adds || {}
        ),

        ...Object.keys(
          trade.drops || {}
        )
      ]
    );


  const playersById =
    await resolvePlayersByIds(
      allPlayerIds
    );


  /*
   * We don't want a live Sleeper roster request here.
   *
   * sleeper_transactions_seasonal stores roster IDs,
   * while the seasonal roster table stores owner IDs.
   *
   * The manager lookup is filled in later by load().
   */
  return {
    managerIndex,
    playersById
  };
}


async function buildTradeCards(
  db,
  trades,
  managers
) {
  const {
    playersById
  } =
    await enrichTradeInbox(
      trades,
      managers
    );


  /*
   * Grab every roster identity for this season.
   */
  const seasons = [
    ...new Set(
      trades.map(
        (trade) =>
          Number(
            trade.season
          )
      )
    )
  ];


  const rosterRows = [];


  for (
    const season of
    seasons
  ) {
    const result =
      await db
        .prepare(`
          SELECT
            season,
            roster_id,
            owner_id

          FROM sleeper_rosters_seasonal

          WHERE
            season = ?
        `)
        .bind(
          season
        )
        .all();


    rosterRows.push(
      ...(
        result.results ??
        []
      )
    );
  }


  const managersById =
    buildManagerIndex(
      managers
    );


  const rosterManagerMap =
    new Map();


  for (
    const roster of
    rosterRows
  ) {
    const manager =
      managersById.get(
        String(
          roster.owner_id ||
          ''
        )
      );


    rosterManagerMap.set(
      `${roster.season}:${roster.roster_id}`,

      manager || {
        id:
          String(
            roster.owner_id ||
            ''
          ),

        teamName:
          `Roster ${roster.roster_id}`,

        name:
          'Unknown Manager',

        photo:
          null
      }
    );
  }


  function player(
    id
  ) {
    const row =
      playersById.get(
        String(id)
      );

    return {
      id:
        String(id),

      name:
        row?.name ||
        `Player ${id}`,

      shortName:
        row?.shortName ||
        row?.name ||
        `#${id}`,

      position:
        row?.position ||
        null
    };
  }


  return trades.map(
    (trade) => {
      const rosterIds = [
        ...new Set([
          ...(trade.rosterIds || []),

          ...Object.values(
            trade.adds || {}
          ),

          ...Object.values(
            trade.drops || {}
          )
        ].map(Number))
      ];


      const teams =
        rosterIds
          .map(
            (rosterId) => {
              const manager =
                rosterManagerMap.get(
                  `${trade.season}:${rosterId}`
                );

              const received =
                Object.entries(
                  trade.adds ||
                  {}
                )
                  .filter(
                    ([, destinationRoster]) =>
                      Number(
                        destinationRoster
                      ) ===
                      Number(
                        rosterId
                      )
                  )
                  .map(
                    ([playerId]) =>
                      player(
                        playerId
                      )
                  );


              const sent =
                Object.entries(
                  trade.drops ||
                  {}
                )
                  .filter(
                    ([, sourceRoster]) =>
                      Number(
                        sourceRoster
                      ) ===
                      Number(
                        rosterId
                      )
                  )
                  .map(
                    ([playerId]) =>
                      player(
                        playerId
                      )
                  );


              return {
                rosterId,

                managerId:
                  manager?.id ||
                  null,

                managerName:
                  manager?.name ||
                  'Unknown Manager',

                teamName:
                  manager?.teamName ||
                  `Roster ${rosterId}`,

                teamPhoto:
                  manager?.photo ||
                  null,

                received,

                sent
              };
            }
          );


      return {
        ...trade,
        teams
      };
    }
  );
}

/*
 * ============================================================
 * LEGACY CSV IMPORT
 * ============================================================
 */

const LEGACY_TYPE_MAP = {
  'Auction Budget Funded':
    'annual_funding',

  'Auction Budget Spend':
    'auction_spend',

  'Futures Trade':
    'trade'
};


/*
 * Small RFC-style CSV parser.
 *
 * Handles commas, quoted fields, escaped quotes
 * and Windows line endings without adding another dependency.
 */
function parseCsv(
  text
) {
  const output = [];

  let row = [];
  let field = '';
  let quoted = false;


  for (
    let index = 0;
    index < text.length;
    index++
  ) {
    const char =
      text[index];


    if (quoted) {

      if (
        char === '"' &&
        text[index + 1] === '"'
      ) {
        field += '"';
        index++;

        continue;
      }


      if (char === '"') {
        quoted = false;
        continue;
      }


      field += char;

      continue;
    }


    if (char === '"') {
      quoted = true;
      continue;
    }


    if (char === ',') {
      row.push(field);
      field = '';

      continue;
    }


    if (char === '\n') {
      row.push(field);

      if (
        row.some(
          (value) =>
            String(value)
              .trim()
        )
      ) {
        output.push(row);
      }

      row = [];
      field = '';

      continue;
    }


    if (char !== '\r') {
      field += char;
    }
  }


  if (
    field.length ||
    row.length
  ) {
    row.push(field);

    if (
      row.some(
        (value) =>
          String(value)
            .trim()
      )
    ) {
      output.push(row);
    }
  }


  return output;
}


function parseLegacyMoney(
  value
) {
  let text =
    String(value || '')
      .replace(/\$/g, '')
      .replace(/,/g, '')
      .trim();


  const parenthetical =
    text.startsWith('(') &&
    text.endsWith(')');


  if (parenthetical) {
    text =
      text
        .slice(1, -1)
        .trim();
  }


  const amount =
    Number(text);


  if (
    !Number.isFinite(amount)
  ) {
    throw new Error(
      `Invalid legacy dollar amount: "${value}"`
    );
  }


  const signed =
    parenthetical
      ? -amount
      : amount;


  return Math.round(
    signed * 100
  );
}


function parseLegacyDate(
  value
) {
  const text =
    String(value || '')
      .trim();


  const parts =
    text.split('/');


  if (
    parts.length !== 3
  ) {
    throw new Error(
      `Invalid legacy date: "${value}"`
    );
  }


  const month =
    Number(parts[0]);

  const day =
    Number(parts[1]);

  const year =
    Number(parts[2]);


  if (
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(year) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    throw new Error(
      `Invalid legacy date: "${value}"`
    );
  }


  return [
    String(year),

    String(month)
      .padStart(
        2,
        '0'
      ),

    String(day)
      .padStart(
        2,
        '0'
      )
  ].join('-');
}


function normalizeHeader(
  value
) {
  return String(
    value || ''
  )
    .replace(
      /^\uFEFF/,
      ''
    )
    .trim()
    .toLowerCase();
}


function normalizeTeamKey(
  value
) {
  return String(
    value || ''
  )
    .trim()
    .toLowerCase();
}


/*
 * Turn the exported Google Sheet into proper ledger rows.
 */
function parseLegacyLedgerCsv({
  text,
  managers,
  futuresYear,
  fileName
}) {
  const matrix =
    parseCsv(text);


  if (
    matrix.length < 2
  ) {
    throw new Error(
      'The CSV does not contain ledger rows.'
    );
  }


  const headers =
    matrix[0].map(
      normalizeHeader
    );


  const columns = {
    date:
      headers.indexOf(
        'date'
      ),

    team:
      headers.indexOf(
        'team'
      ),

    type:
      headers.indexOf(
        'transaction type'
      ),

    amount:
      headers.indexOf(
        'amount'
      ),

    notes:
      headers.indexOf(
        'notes'
      )
  };


  for (
    const [
      name,
      index
    ] of Object.entries(
      columns
    )
  ) {
    if (index === -1) {
      throw new Error(
        `CSV column "${name}" could not be found.`
      );
    }
  }


  const managerByTeam =
    new Map(
      managers.map(
        (manager) => [
          normalizeTeamKey(
            manager.teamName
          ),

          manager
        ]
      )
    );


  const rows = [];
  const errors = [];


  /*
   * CSV row 1 is headers.
   *
   * Google Sheets row numbers therefore start at 2.
   */
  for (
    let index = 1;
    index < matrix.length;
    index++
  ) {
    const values =
      matrix[index];


    const csvRow =
      index + 1;


    const dateText =
      String(
        values[
          columns.date
        ] || ''
      ).trim();


    const teamName =
      String(
        values[
          columns.team
        ] || ''
      ).trim();


    const originalType =
      String(
        values[
          columns.type
        ] || ''
      ).trim();


    const amountText =
      String(
        values[
          columns.amount
        ] || ''
      ).trim();


    const note =
      String(
        values[
          columns.notes
        ] || ''
      ).trim();


    if (
      !dateText &&
      !teamName &&
      !originalType &&
      !amountText
    ) {
      continue;
    }


    const manager =
      managerByTeam.get(
        normalizeTeamKey(
          teamName
        )
      );


    if (!manager) {
      errors.push(
        `Row ${csvRow}: unknown team "${teamName}".`
      );

      continue;
    }


    const entryType =
      LEGACY_TYPE_MAP[
        originalType
      ];


    if (!entryType) {
      errors.push(
        `Row ${csvRow}: unsupported transaction type "${originalType}".`
      );

      continue;
    }


    try {
      const amountCents =
        parseLegacyMoney(
          amountText
        );


      const transactionDate =
        parseLegacyDate(
          dateText
        );


      rows.push({
        csvRow,

        managerId:
          String(
            manager.id
          ),

        teamName:
          manager.teamName,

        amountCents,

        entryType,

        transactionDate,

        note:
          note || null,

        transferId:
          null,

        counterpartyManagerId:
          null,

        metadata: {
          legacyCsvRow:
            csvRow,

          legacyTeamName:
            teamName,

          legacyTransactionType:
            originalType,

          legacyAmount:
            amountText,

          legacyNote:
            note || null,

          legacyImportFile:
            fileName || null
        },

        dedupeKey:
          `legacy-ledger:${futuresYear}:${csvRow}`
      });

    } catch (error) {
      errors.push(
        `Row ${csvRow}: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`
      );
    }
  }


  /*
   * ==========================================================
   * RECONSTRUCT HISTORICAL TRADE PAIRS
   *
   * Your actual CSV is beautifully consistent:
   *
   * every Futures Trade appears as two adjacent rows
   * with equal/opposite dollar amounts.
   *
   * We can therefore restore the counterparty relationship.
   * ==========================================================
   */

  for (
    let index = 0;
    index < rows.length;
    index++
  ) {
    const current =
      rows[index];


    if (
      current.entryType !==
      'trade'
    ) {
      continue;
    }


    if (
      current.transferId
    ) {
      continue;
    }


    const next =
      rows[index + 1];


    const pairMatches =
      next &&
      next.entryType ===
        'trade' &&
      next.transactionDate ===
        current.transactionDate &&
      Math.abs(
        next.amountCents
      ) ===
        Math.abs(
          current.amountCents
        ) &&
      Math.sign(
        next.amountCents
      ) !==
        Math.sign(
          current.amountCents
        );


    if (!pairMatches) {
      errors.push(
        `Could not pair legacy trade row ${current.csvRow}.`
      );

      continue;
    }


    const transferId =
      `legacy:${futuresYear}:trade:${current.csvRow}:${next.csvRow}`;


    current.transferId =
      transferId;

    next.transferId =
      transferId;


    current.counterpartyManagerId =
      next.managerId;

    next.counterpartyManagerId =
      current.managerId;


    current.metadata = {
      ...current.metadata,

      legacyTradePairRow:
        next.csvRow,

      tradeDirection:
        current.amountCents > 0
          ? 'received'
          : 'away'
    };


    next.metadata = {
      ...next.metadata,

      legacyTradePairRow:
        current.csvRow,

      tradeDirection:
        next.amountCents > 0
          ? 'received'
          : 'away'
    };


    /*
     * We consumed the next trade row too.
     */
    index++;
  }


  if (errors.length) {
    throw new Error(
      errors
        .slice(0, 12)
        .join('\n')
    );
  }


  /*
   * Calculate the ledger result from scratch.
   */
  const totals =
    new Map();


  for (const row of rows) {
    totals.set(
      row.managerId,

      (
        totals.get(
          row.managerId
        ) || 0
      ) +
        row.amountCents
    );
  }


  return {
    rows,
    totals
  };
}


/*
 * ============================================================
 * LOAD
 * ============================================================
 */

export async function load({
  platform,
  url
}) {
  const db =
    platform?.env?.DB;


  if (!db) {
    throw new Error(
      'Cloudflare D1 binding "DB" is unavailable.'
    );
  }


  /*
 * ============================================================
 * THREE DIFFERENT CONCEPTS
 *
 * capitalYear
 *   Which auction-budget bucket we're viewing.
 *   Example: 2026 draft capital.
 *
 * tradeSeason
 *   Which Sleeper season supplies the trade-review inbox.
 *
 * transactionYear
 *   Optional audit-trail filter based on the actual transaction
 *   date. null means "all transaction years."
 * ============================================================
 */

const capitalYear =
  Number(
    url.searchParams.get(
      'capitalYear'
    ) ||
    url.searchParams.get(
      'year'
    ) ||
    2026
  );


const tradeSeason =
  Number(
    url.searchParams.get(
      'tradeSeason'
    ) ||
    url.searchParams.get(
      'season'
    ) ||
    2026
  );


const transactionYearParam =
  url.searchParams.get(
    'transactionYear'
  );


const transactionYear =
  transactionYearParam &&
  transactionYearParam !== 'all'
    ? Number(
        transactionYearParam
      )
    : null;


  const managers =
    managerRows();


  const [
  rawBalances,
  fullLedger,
  rawTrades,
  legacyImport
] =
  await Promise.all([
    getDraftCapitalBalances(
      db,
      {
        year:
          capitalYear
      }
    ),

    /*
     * Load the full capital-year ledger.
     *
     * We then filter by actual transaction year separately.
     */
    getDraftCapitalLedger(
      db,
      {
        year:
          capitalYear,

        limit:
          1000
      }
    ),

    getDraftCapitalTradeInbox(
      db,
      {
        season:
          tradeSeason
      }
    ),

    getLegacyDraftCapitalImportStatus(
      db,
      {
        year:
          capitalYear
      }
    )
  ]);

  /*
 * ============================================================
 * TRANSACTION-YEAR FILTER
 *
 * Capital year and transaction year are deliberately separate.
 *
 * Example:
 *
 *   2025-09-10 trade
 *   moving 2026 auction capital
 *
 * lives under capitalYear=2026,
 * transactionYear=2025.
 * ============================================================
 */

const transactionYears =
  [
    ...new Set(
      fullLedger
        .map(
          (entry) =>
            entry.transactionDate
              ? Number(
                  String(
                    entry.transactionDate
                  ).slice(
                    0,
                    4
                  )
                )
              : null
        )
        .filter(
          Number.isFinite
        )
    )
  ].sort(
    (a, b) =>
      b - a
  );


const ledger =
  transactionYear == null
    ? fullLedger
    : fullLedger.filter(
        (entry) =>
          entry.transactionDate &&
          Number(
            String(
              entry.transactionDate
            ).slice(
              0,
              4
            )
          ) ===
            transactionYear
      );


  const balanceIndex =
    new Map(
      rawBalances.map(
        (row) => [
          String(
            row.managerId
          ),
          row
        ]
      )
    );


  const managerIndex =
    buildManagerIndex(
      managers
    );


  const balances =
    managers.map(
      (manager) => {
        const balance =
          balanceIndex.get(
            String(
              manager.id
            )
          );

        return {
          ...manager,

          balance:
            balance?.balance ??
            0,

          balanceCents:
            balance?.balanceCents ??
            0,

          entryCount:
            balance?.entryCount ??
            0
        };
      }
    );


  const enrichedLedger =
    ledger.map(
      (entry) => ({
        ...entry,

        manager:
          managerIndex.get(
            String(
              entry.managerId
            )
          ) || null,

        counterparty:
          entry.counterpartyManagerId
            ? managerIndex.get(
                String(
                  entry.counterpartyManagerId
                )
              ) || null
            : null
      })
    );


  const tradeCards =
    await buildTradeCards(
      db,
      rawTrades,
      managers
    );


  return {
  /*
   * Explicit names.
   */
  capitalYear,
  tradeSeason,
  transactionYear,
  transactionYears,

  /*
   * Temporary compatibility aliases.
   *
   * We can remove these later once nothing else
   * references data.year / data.season.
   */
  year:
    capitalYear,

  season:
    tradeSeason,

  managers,
  balances,

  ledger:
    enrichedLedger,

  trades:
    tradeCards,

  pendingTradeCount:
    tradeCards.filter(
      (trade) =>
        trade.reviewStatus ===
        'pending'
    ).length,

  legacyImport
};
}


/*
 * ============================================================
 * ACTIONS
 * ============================================================
 */

export const actions = {

    /*
 * ----------------------------------------------------------
 * IMPORT COMPLETE LEGACY GOOGLE SHEETS LEDGER
 * ----------------------------------------------------------
 */

importLegacyLedger: async ({
  request,
  platform,
  locals
}) => {
  if (
    !assertAdmin(
      locals
    )
  ) {
    return fail(
      403,
      {
        ok: false,
        action:
          'importLegacyLedger',
        error:
          'Admin access required.'
      }
    );
  }


  const db =
    platform?.env?.DB;


  if (!db) {
    return fail(
      500,
      {
        ok: false,
        action:
          'importLegacyLedger',
        error:
          'Cloudflare D1 binding is unavailable.'
      }
    );
  }


  const form =
    await request.formData();


  const futuresYear =
    Number(
      form.get(
        'futuresYear'
      )
    );


  const file =
    form.get(
      'ledgerCsv'
    );


  if (
    !file ||
    typeof file.text !==
      'function'
  ) {
    return fail(
      400,
      {
        ok: false,
        action:
          'importLegacyLedger',
        error:
          'Choose the legacy Ledger CSV.'
      }
    );
  }


  if (
    !Number.isInteger(
      futuresYear
    )
  ) {
    return fail(
      400,
      {
        ok: false,
        action:
          'importLegacyLedger',
        error:
          'Choose a valid auction capital year.'
      }
    );
  }


  try {
    /*
     * ========================================================
     * READ + PARSE CSV
     * ========================================================
     */

    const csvText =
      await file.text();


    const managers =
      managerRows();


    const parsed =
      parseLegacyLedgerCsv({
        text:
          csvText,

        managers,

        futuresYear,

        fileName:
          file.name ||
          'legacy-ledger.csv'
      });


    /*
     * ========================================================
     * LOAD CURRENT D1 BALANCES
     *
     * This is the piece that was missing.
     * ========================================================
     */

    const current =
      await getDraftCapitalBalances(
        db,
        {
          year:
            futuresYear
        }
      );


    /*
     * ========================================================
     * SAFETY CHECK
     *
     * If active ledger rows already exist, the CSV must
     * calculate to exactly the same balances before we import.
     *
     * If the ledger was fully reset and is empty, we allow
     * the import and verify everything afterward instead.
     * ========================================================
     */

    const hasActiveLedger =
      current.some(
        (row) =>
          Number(
            row.entryCount || 0
          ) > 0
      );


    if (
      hasActiveLedger
    ) {
      const currentByManager =
        new Map(
          current.map(
            (row) => [
              String(
                row.managerId
              ),

              Number(
                row.balanceCents
              )
            ]
          )
        );


      const mismatches =
        [];


      for (
        const manager of
        managers
      ) {
        const managerId =
          String(
            manager.id
          );


        const csvBalance =
          Number(
            parsed.totals.get(
              managerId
            ) || 0
          );


        const d1Balance =
          Number(
            currentByManager.get(
              managerId
            ) || 0
          );


        if (
          csvBalance !==
          d1Balance
        ) {
          mismatches.push({
            team:
              manager.teamName,

            csv:
              csvBalance / 100,

            d1:
              d1Balance / 100
          });
        }
      }


      if (
        mismatches.length
      ) {
        const detail =
          mismatches
            .slice(
              0,
              8
            )
            .map(
              (item) =>
                `${item.team}: CSV $${item.csv.toFixed(2)} vs D1 $${item.d1.toFixed(2)}`
            )
            .join(
              ' · '
            );


        return fail(
          409,
          {
            ok: false,

            action:
              'importLegacyLedger',

            error:
              `Legacy ledger safety check failed. Nothing was imported. ${detail}`
          }
        );
      }
    }


    /*
     * ========================================================
     * IMPORT HISTORICAL LEDGER
     * ========================================================
     */

    const result =
      await importLegacyDraftCapitalLedger(
        db,
        {
          futuresYear,

          rows:
            parsed.rows,

          createdBy:
            locals.user.id
        }
      );


    /*
     * ========================================================
     * POST-IMPORT VERIFICATION
     *
     * D1 must now exactly equal the balances calculated
     * from the uploaded CSV.
     * ========================================================
     */

    const after =
      await getDraftCapitalBalances(
        db,
        {
          year:
            futuresYear
        }
      );


    const afterMap =
      new Map(
        after.map(
          (row) => [
            String(
              row.managerId
            ),

            Number(
              row.balanceCents
            )
          ]
        )
      );


    const postImportErrors =
      [];


    for (
      const manager of
      managers
    ) {
      const managerId =
        String(
          manager.id
        );


      const expected =
        Number(
          parsed.totals.get(
            managerId
          ) || 0
        );


      const actual =
        Number(
          afterMap.get(
            managerId
          ) || 0
        );


      if (
        expected !==
        actual
      ) {
        postImportErrors.push({
          team:
            manager.teamName,

          expected:
            expected / 100,

          actual:
            actual / 100
        });
      }
    }


    if (
      postImportErrors.length
    ) {
      const detail =
        postImportErrors
          .slice(
            0,
            8
          )
          .map(
            (item) =>
              `${item.team}: expected $${item.expected.toFixed(2)}, got $${item.actual.toFixed(2)}`
          )
          .join(
            ' · '
          );


      console.error(
        'Legacy draft capital post-import mismatch:',
        postImportErrors
      );


      return fail(
        500,
        {
          ok: false,

          action:
            'importLegacyLedger',

          error:
            `Historical rows were imported, but final verification failed. ${detail}`
        }
      );
    }


    /*
     * Every reconstructed trade has two ledger rows:
     * one negative and one positive.
     */

    const tradeRows =
      parsed.rows.filter(
        (row) =>
          row.entryType ===
          'trade'
      ).length;


    const reconstructedTrades =
      tradeRows / 2;


    return {
      ok: true,

      action:
        'importLegacyLedger',

      message:
        `Legacy ledger imported successfully: ${result.storedRows} historical rows, ${reconstructedTrades} reconstructed trades, and all ${managers.length} balances verified exactly.`
    };

  } catch (error) {
    console.error(
      'Legacy ledger import failed:',
      error
    );


    return fail(
      400,
      {
        ok: false,

        action:
          'importLegacyLedger',

        error:
          error instanceof Error
            ? error.message
            : 'Unable to import legacy ledger.'
      }
    );
  }
},

  /*
   * ----------------------------------------------------------
   * ONE-TIME OPENING BALANCE IMPORT
   * ----------------------------------------------------------
   */




  /*
   * ----------------------------------------------------------
   * MANUAL ADJUSTMENT
   * ----------------------------------------------------------
   */

  addEntry: async ({
    request,
    platform,
    locals
  }) => {
    if (
      !assertAdmin(
        locals
      )
    ) {
      return fail(
        403,
        {
          ok: false,
          error:
            'Admin access required.'
        }
      );
    }


    const db =
      platform?.env?.DB;

    const form =
      await request.formData();


    try {
      const managerId =
        clean(
          form.get(
            'managerId'
          )
        );

      const futuresYear =
        Number(
          form.get(
            'futuresYear'
          )
        );

      const amount =
        Number(
          form.get(
            'amount'
          )
        );

      const entryType =
        clean(
          form.get(
            'entryType'
          )
        ) ||
        'manual_adjustment';


      const note =
        clean(
          form.get(
            'note'
          )
        );


      await addDraftCapitalEntry(
        db,
        {
          futuresYear,
          managerId,
          amount,
          entryType,

          transactionDate:
            clean(
              form.get(
                'transactionDate'
              )
            ),

          note,

          source:
            'manual',

          createdBy:
            locals.user.id
        }
      );


      return {
        ok: true,
        action:
          'addEntry',

        message:
          'Draft capital entry posted.'
      };
    } catch (error) {
      return fail(
        400,
        {
          ok: false,

          error:
            error instanceof Error
              ? error.message
              : 'Unable to post ledger entry.'
        }
      );
    }
  },


  /*
   * ----------------------------------------------------------
   * MANUAL TRANSFER
   * ----------------------------------------------------------
   */

  transfer: async ({
    request,
    platform,
    locals
  }) => {
    if (
      !assertAdmin(
        locals
      )
    ) {
      return fail(
        403,
        {
          ok: false,
          error:
            'Admin access required.'
        }
      );
    }


    const db =
      platform?.env?.DB;

    const form =
      await request.formData();


    try {
      await postDraftCapitalTransfer(
        db,
        {
          futuresYear:
            Number(
              form.get(
                'futuresYear'
              )
            ),

          fromManagerId:
            clean(
              form.get(
                'fromManagerId'
              )
            ),

          toManagerId:
            clean(
              form.get(
                'toManagerId'
              )
            ),

          amount:
            Number(
              form.get(
                'amount'
              )
            ),

          transactionDate:
            clean(
              form.get(
                'transactionDate'
              )
            ),

          note:
            clean(
              form.get(
                'note'
              )
            ),

          source:
            'manual',

          createdBy:
            locals.user.id
        }
      );


      return {
        ok: true,
        action:
          'transfer',

        message:
          'Draft capital transfer posted.'
      };
    } catch (error) {
      return fail(
        400,
        {
          ok: false,

          error:
            error instanceof Error
              ? error.message
              : 'Unable to post transfer.'
        }
      );
    }
  },


  /*
   * ----------------------------------------------------------
   * SLEEPER TRADE → CAPITAL TRANSFER
   * ----------------------------------------------------------
   */

  postTradeCapital: async ({
    request,
    platform,
    locals
  }) => {
    if (
      !assertAdmin(
        locals
      )
    ) {
      return fail(
        403,
        {
          ok: false,
          error:
            'Admin access required.'
        }
      );
    }


    const db =
      platform?.env?.DB;

    const form =
      await request.formData();


    try {
      const season =
        Number(
          form.get(
            'season'
          )
        );

      const week =
        parseNumber(
          form.get(
            'week'
          )
        );

      const transactionId =
        clean(
          form.get(
            'transactionId'
          )
        );


      const fromManagerId =
        clean(
          form.get(
            'fromManagerId'
          )
        );

      const toManagerId =
        clean(
          form.get(
            'toManagerId'
          )
        );


      const amount =
        Number(
          form.get(
            'amount'
          )
        );


      const futuresYear =
        Number(
          form.get(
            'futuresYear'
          )
        );


      await postReviewedTradeCapital(
        db,
        {
          season,
          week,

          sleeperTransactionId:
            transactionId,

          futuresYear,

          fromManagerId,
          toManagerId,

          amount,

          transactionDate:
            clean(
              form.get(
                'transactionDate'
              )
            ),

          note:
            clean(
              form.get(
                'note'
              )
            ) ||
            'Draft capital included in Sleeper trade.',

          metadata: {
            reviewedFrom:
              'Admin Draft Capital Trade Inbox'
          },

          createdBy:
            locals.user.id
        }
      );


      return {
        ok: true,
        action:
          'postTradeCapital',

        message:
          `Posted $${amount.toFixed(2)} of ${futuresYear} draft capital.`
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);


      if (
        message.includes(
          'UNIQUE constraint failed'
        )
      ) {
        return fail(
          409,
          {
            ok: false,

            error:
              'This Sleeper trade already has draft capital posted.'
          }
        );
      }


      return fail(
        400,
        {
          ok: false,
          error:
            message
        }
      );
    }
  },


  /*
   * ----------------------------------------------------------
   * TRADE HAD NO CAPITAL
   * ----------------------------------------------------------
   */

  noTradeCapital: async ({
    request,
    platform,
    locals
  }) => {
    if (
      !assertAdmin(
        locals
      )
    ) {
      return fail(
        403,
        {
          ok: false,
          error:
            'Admin access required.'
        }
      );
    }


    const db =
      platform?.env?.DB;

    const form =
      await request.formData();


    try {
      await markTradeReviewedNoCapital(
        db,
        {
          season:
            Number(
              form.get(
                'season'
              )
            ),

          week:
            parseNumber(
              form.get(
                'week'
              )
            ),

          sleeperTransactionId:
            clean(
              form.get(
                'transactionId'
              )
            ),

          note:
            'Reviewed by commissioner — no draft capital included.',

          reviewedBy:
            locals.user.id
        }
      );


      return {
        ok: true,

        action:
          'noTradeCapital',

        message:
          'Trade marked as reviewed with no draft capital.'
      };
    } catch (error) {
      return fail(
        400,
        {
          ok: false,

          error:
            error instanceof Error
              ? error.message
              : 'Unable to review trade.'
        }
      );
    }
  },


  /*
   * ----------------------------------------------------------
   * VOID
   * ----------------------------------------------------------
   */

  voidEntry: async ({
    request,
    platform,
    locals
  }) => {
    if (
      !assertAdmin(
        locals
      )
    ) {
      return fail(
        403,
        {
          ok: false,
          error:
            'Admin access required.'
        }
      );
    }


    const db =
      platform?.env?.DB;

    const form =
      await request.formData();


    try {
      await voidDraftCapitalEntry(
        db,
        {
          entryId:
            Number(
              form.get(
                'entryId'
              )
            ),

          voidedBy:
            locals.user.id
        }
      );


      return {
        ok: true,
        action:
          'voidEntry',

        message:
          'Ledger entry voided.'
      };
    } catch (error) {
      return fail(
        400,
        {
          ok: false,

          error:
            error instanceof Error
              ? error.message
              : 'Unable to void entry.'
        }
      );
    }
  }
};