function centsToDollars(cents) {
	return Number(cents || 0) / 100;
}

function dollarsToCents(dollars) {
	const value = Number(dollars);

	if (!Number.isFinite(value)) {
		throw new Error('Invalid dollar amount.');
	}

	return Math.round(value * 100);
}

function parseJson(value, fallback) {
	if (!value) {
		return fallback;
	}

	if (typeof value === 'object') {
		return value;
	}

	try {
		return JSON.parse(value);
	} catch {
		return fallback;
	}
}

function clean(value) {
	const result = String(value ?? '').trim();

	return result || null;
}

/*
 * ============================================================
 * BALANCES
 * ============================================================
 */

export async function getDraftCapitalBalances(db, { year } = {}) {
	if (!db) {
		throw new Error('D1 database binding is required.');
	}

	const futuresYear = Number(year);

	if (!Number.isInteger(futuresYear)) {
		throw new Error('A valid futures year is required.');
	}

	const result = await db
		.prepare(
			`
        SELECT
          manager_id,

          COALESCE(
            SUM(amount_cents),
            0
          ) AS balance_cents,

          COUNT(*) AS entry_count

        FROM draft_capital_entries

        WHERE
          futures_year = ?
          AND voided_at IS NULL

        GROUP BY
          manager_id
      `
		)
		.bind(futuresYear)
		.all();

	return (result.results ?? []).map((row) => ({
		managerId: String(row.manager_id),

		balanceCents: Number(row.balance_cents || 0),

		balance: centsToDollars(row.balance_cents),

		entryCount: Number(row.entry_count || 0)
	}));
}

/*
 * ============================================================
 * DRAFT CAPITAL TRANSFERS
 *
 * Returns one object per two-sided capital transfer.
 *
 * Used outside the Admin area to enrich things like the
 * Player Franchise Trail.
 * ============================================================
 */

export async function getDraftCapitalTransfers(db) {
	if (!db) {
		return [];
	}

	const result = await db
		.prepare(
			`
        SELECT
          id,
          futures_year,
          manager_id,
          amount_cents,
          transaction_date,
          league_season,
          league_week,
          sleeper_transaction_id,
          transfer_id,
          counterparty_manager_id,
          source,
          metadata_json,
          created_at

        FROM draft_capital_entries

        WHERE
          entry_type = 'trade'
          AND voided_at IS NULL
          AND transfer_id IS NOT NULL

        ORDER BY
          created_at,
          id
      `
		)
		.all();

	const rows = result.results ?? [];

	const transfers = new Map();

	for (const row of rows) {
		const transferId = String(row.transfer_id || '');

		if (!transferId) {
			continue;
		}

		if (!transfers.has(transferId)) {
			transfers.set(transferId, {
				transferId,

				futuresYear: Number(row.futures_year),

				transactionDate: row.transaction_date || null,

				leagueSeason: row.league_season == null ? null : Number(row.league_season),

				leagueWeek: row.league_week == null ? null : Number(row.league_week),

				sleeperTransactionId: row.sleeper_transaction_id
					? String(row.sleeper_transaction_id)
					: null,

				source: row.source || null,

				fromManagerId: null,

				toManagerId: null,

				amountCents: 0,

				amount: 0
			});
		}

		const transfer = transfers.get(transferId);

		const amountCents = Number(row.amount_cents || 0);

		/*
		 * Negative row = team that SENT the capital.
		 * Positive row = team that RECEIVED the capital.
		 */
		if (amountCents < 0) {
			transfer.fromManagerId = String(row.manager_id);

			transfer.amountCents = Math.abs(amountCents);
		}

		if (amountCents > 0) {
			transfer.toManagerId = String(row.manager_id);

			transfer.amountCents = Math.abs(amountCents);
		}

		transfer.amount = transfer.amountCents / 100;
	}

	return [...transfers.values()].filter(
		(transfer) => transfer.fromManagerId && transfer.toManagerId && transfer.amountCents > 0
	);
}

/*
 * ============================================================
 * ALL-TIME MANAGER TRADE CAPITAL TOTALS
 *
 * Uses the signed ledger rows directly rather than requiring
 * a paired transfer_id.
 *
 * This intentionally includes historical/legacy trade rows.
 * Voided rows never count.
 * ============================================================
 */

export async function getManagerDraftCapitalTradeTotals(
	db,
	{
		managerId
	} = {}
) {
	const empty = {
		managerId:
			managerId
				? String(managerId)
				: null,

		sentCents:
			0,

		acquiredCents:
			0,

		netCents:
			0,

		sent:
			0,

		acquired:
			0,

		net:
			0,

		movementCount:
			0,

		firstDate:
			null,

		lastDate:
			null
	};

	if (
		!db ||
		!managerId
	) {
		return empty;
	}

	const row =
		await db
			.prepare(`
				SELECT
					COALESCE(
						SUM(
							CASE
								WHEN amount_cents < 0
								THEN ABS(amount_cents)
								ELSE 0
							END
						),
						0
					) AS sent_cents,

					COALESCE(
						SUM(
							CASE
								WHEN amount_cents > 0
								THEN amount_cents
								ELSE 0
							END
						),
						0
					) AS acquired_cents,

					COUNT(*) AS movement_count,

					MIN(transaction_date)
						AS first_date,

					MAX(transaction_date)
						AS last_date

				FROM draft_capital_entries

				WHERE
					manager_id = ?
					AND entry_type = 'trade'
					AND voided_at IS NULL
			`)
			.bind(
				String(managerId)
			)
			.first();

	const sentCents =
		Number(
			row?.sent_cents ||
			0
		);

	const acquiredCents =
		Number(
			row?.acquired_cents ||
			0
		);

	const netCents =
		acquiredCents -
		sentCents;

	return {
		managerId:
			String(managerId),

		sentCents,

		acquiredCents,

		netCents,

		sent:
			sentCents /
			100,

		acquired:
			acquiredCents /
			100,

		net:
			netCents /
			100,

		movementCount:
			Number(
				row?.movement_count ||
				0
			),

		firstDate:
			row?.first_date ||
			null,

		lastDate:
			row?.last_date ||
			null
	};
}

/*
 * ============================================================
 * ONE MANAGER BALANCE
 * ============================================================
 */

export async function getManagerDraftCapital(db, { managerId, year } = {}) {
	if (!db) {
		throw new Error('D1 database binding is required.');
	}

	const futuresYear = Number(year);

	const result = await db
		.prepare(
			`
        SELECT
          COALESCE(
            SUM(amount_cents),
            0
          ) AS balance_cents

        FROM draft_capital_entries

        WHERE
          manager_id = ?
          AND futures_year = ?
          AND voided_at IS NULL
      `
		)
		.bind(String(managerId), futuresYear)
		.first();

	const balanceCents = Number(result?.balance_cents || 0);

	return {
		managerId: String(managerId),

		futuresYear,

		balanceCents,

		balance: centsToDollars(balanceCents)
	};
}

/*
 * ============================================================
 * LEDGER
 * ============================================================
 */

export async function getDraftCapitalLedger(
	db,
	{ year = null, managerId = null, limit = 250 } = {}
) {
	if (!db) {
		throw new Error('D1 database binding is required.');
	}

	const clauses = ['voided_at IS NULL'];

	const binds = [];

	if (year != null && String(year).trim() !== '') {
		clauses.push('futures_year = ?');

		binds.push(Number(year));
	}

	if (managerId) {
		clauses.push('manager_id = ?');

		binds.push(String(managerId));
	}

	const safeLimit = Math.min(1000, Math.max(1, Number(limit) || 250));

	binds.push(safeLimit);

	const result = await db
		.prepare(
			`
        SELECT
          id,
          futures_year,
          manager_id,
          amount_cents,
          entry_type,
          transaction_date,
          league_season,
          league_week,
          sleeper_transaction_id,
          transfer_id,
          counterparty_manager_id,
          note,
          metadata_json,
          source,
          created_by,
          created_at

        FROM draft_capital_entries

        WHERE
          ${clauses.join('\nAND ')}

        ORDER BY
          COALESCE(
            transaction_date,
            ''
          ) DESC,

          created_at DESC,

          id DESC

        LIMIT ?
      `
		)
		.bind(...binds)
		.all();

	return (result.results ?? []).map((row) => ({
		id: Number(row.id),

		futuresYear: Number(row.futures_year),

		managerId: String(row.manager_id),

		amountCents: Number(row.amount_cents),

		amount: centsToDollars(row.amount_cents),

		entryType: row.entry_type,

		transactionDate: row.transaction_date || null,

		leagueSeason: row.league_season == null ? null : Number(row.league_season),

		leagueWeek: row.league_week == null ? null : Number(row.league_week),

		sleeperTransactionId: row.sleeper_transaction_id || null,

		transferId: row.transfer_id || null,

		counterpartyManagerId: row.counterparty_manager_id || null,

		note: row.note || null,

		metadata: parseJson(row.metadata_json, {}),

		source: row.source,

		createdBy: row.created_by || null,

		createdAt: Number(row.created_at || 0)
	}));
}

/*
 * ============================================================
 * ADD ONE LEDGER ENTRY
 * ============================================================
 */

export async function addDraftCapitalEntry(
	db,
	{
		futuresYear,
		managerId,
		amount,
		entryType = 'manual_adjustment',

		transactionDate = null,

		leagueSeason = null,
		leagueWeek = null,

		sleeperTransactionId = null,
		transferId = null,
		counterpartyManagerId = null,

		note = null,
		metadata = {},

		source = 'manual',
		createdBy = null,

		dedupeKey = null
	} = {}
) {
	if (!db) {
		throw new Error('D1 database binding is required.');
	}

	const year = Number(futuresYear);

	if (!Number.isInteger(year)) {
		throw new Error('A valid futures year is required.');
	}

	if (!managerId) {
		throw new Error('Manager is required.');
	}

	const amountCents = dollarsToCents(amount);

	if (amountCents === 0) {
		throw new Error('Ledger amount cannot be zero.');
	}

	const result = await db
		.prepare(
			`
        INSERT INTO draft_capital_entries (
          futures_year,
          manager_id,
          amount_cents,
          entry_type,
          transaction_date,
          league_season,
          league_week,
          sleeper_transaction_id,
          transfer_id,
          counterparty_manager_id,
          note,
          metadata_json,
          source,
          created_by,
          dedupe_key,
          updated_at
        )

        VALUES (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          unixepoch()
        )
      `
		)
		.bind(
			year,
			String(managerId),
			amountCents,
			String(entryType),

			clean(transactionDate),

			leagueSeason == null ? null : Number(leagueSeason),

			leagueWeek == null ? null : Number(leagueWeek),

			clean(sleeperTransactionId),

			clean(transferId),

			clean(counterpartyManagerId),

			clean(note),

			JSON.stringify(metadata || {}),

			String(source || 'manual'),

			clean(createdBy),

			clean(dedupeKey)
		)
		.run();

	return {
		id: result.meta?.last_row_id ?? null,

		futuresYear: year,

		managerId: String(managerId),

		amountCents,

		amount: centsToDollars(amountCents)
	};
}

/*
 * ============================================================
 * POST A TWO-SIDED TRANSFER
 *
 * Example:
 *
 * Ultimate sends $20 to Lehigh
 *
 * Lehigh    +2000
 * Ultimate  -2000
 *
 * Same transfer_id ties them together permanently.
 * ============================================================
 */

export async function postDraftCapitalTransfer(
	db,
	{
		futuresYear,

		fromManagerId,
		toManagerId,

		amount,

		transactionDate = null,

		leagueSeason = null,
		leagueWeek = null,

		sleeperTransactionId = null,

		note = null,

		metadata = {},

		source = 'manual',

		createdBy = null
	} = {}
) {
	if (!db) {
		throw new Error('D1 database binding is required.');
	}

	if (!fromManagerId || !toManagerId) {
		throw new Error('Both teams are required.');
	}

	if (String(fromManagerId) === String(toManagerId)) {
		throw new Error('Capital cannot be transferred to the same team.');
	}

	const year = Number(futuresYear);

	const amountCents = Math.abs(dollarsToCents(amount));

	if (!Number.isInteger(year)) {
		throw new Error('A valid futures year is required.');
	}

	if (amountCents <= 0) {
		throw new Error('Transfer amount must be greater than zero.');
	}

	const transferId = crypto.randomUUID();

	const transactionId = clean(sleeperTransactionId);

	const baseMetadata = {
		...metadata,

		transferId,

		futuresYear: year,

		dollarAmount: centsToDollars(amountCents)
	};

	const outgoingDedupe = transactionId
		? `capital:${transactionId}:${year}:${fromManagerId}:out`
		: null;

	const incomingDedupe = transactionId
		? `capital:${transactionId}:${year}:${toManagerId}:in`
		: null;

	const outgoing = db
		.prepare(
			`
      INSERT INTO draft_capital_entries (
        futures_year,
        manager_id,
        amount_cents,
        entry_type,
        transaction_date,
        league_season,
        league_week,
        sleeper_transaction_id,
        transfer_id,
        counterparty_manager_id,
        note,
        metadata_json,
        source,
        created_by,
        dedupe_key,
        updated_at
      )

      VALUES (
        ?,
        ?,
        ?,
        'trade',
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        unixepoch()
      )
    `
		)
		.bind(
			year,

			String(fromManagerId),

			-amountCents,

			clean(transactionDate),

			leagueSeason == null ? null : Number(leagueSeason),

			leagueWeek == null ? null : Number(leagueWeek),

			transactionId,

			transferId,

			String(toManagerId),

			clean(note),

			JSON.stringify({
				...baseMetadata,
				direction: 'away'
			}),

			String(source),

			clean(createdBy),

			outgoingDedupe
		);

	const incoming = db
		.prepare(
			`
      INSERT INTO draft_capital_entries (
        futures_year,
        manager_id,
        amount_cents,
        entry_type,
        transaction_date,
        league_season,
        league_week,
        sleeper_transaction_id,
        transfer_id,
        counterparty_manager_id,
        note,
        metadata_json,
        source,
        created_by,
        dedupe_key,
        updated_at
      )

      VALUES (
        ?,
        ?,
        ?,
        'trade',
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        unixepoch()
      )
    `
		)
		.bind(
			year,

			String(toManagerId),

			amountCents,

			clean(transactionDate),

			leagueSeason == null ? null : Number(leagueSeason),

			leagueWeek == null ? null : Number(leagueWeek),

			transactionId,

			transferId,

			String(fromManagerId),

			clean(note),

			JSON.stringify({
				...baseMetadata,
				direction: 'received'
			}),

			String(source),

			clean(createdBy),

			incomingDedupe
		);

	await db.batch([outgoing, incoming]);

	return {
		transferId,

		futuresYear: year,

		amountCents,

		amount: centsToDollars(amountCents),

		fromManagerId: String(fromManagerId),

		toManagerId: String(toManagerId)
	};
}

/*
 * ============================================================
 * TRADE REVIEW STATE
 * ============================================================
 */

export async function markTradeReviewedNoCapital(
	db,
	{ season, week, sleeperTransactionId, note = null, reviewedBy = null } = {}
) {
	await db
		.prepare(
			`
      INSERT INTO draft_capital_trade_reviews (
        season,
        week,
        sleeper_transaction_id,
        review_status,
        note,
        reviewed_by,
        reviewed_at,
        updated_at
      )

      VALUES (
        ?,
        ?,
        ?,
        'no_capital',
        ?,
        ?,
        unixepoch(),
        unixepoch()
      )

      ON CONFLICT(
        season,
        sleeper_transaction_id
      )

      DO UPDATE SET
        week =
          excluded.week,

        review_status =
          'no_capital',

        transfer_id =
          NULL,

        note =
          excluded.note,

        reviewed_by =
          excluded.reviewed_by,

        reviewed_at =
          unixepoch(),

        updated_at =
          unixepoch()
    `
		)
		.bind(
			Number(season),

			week == null ? null : Number(week),

			String(sleeperTransactionId),

			clean(note),

			clean(reviewedBy)
		)
		.run();
}

/*
 * ============================================================
 * POST CAPITAL + MARK TRADE REVIEWED
 * ============================================================
 */

export async function postReviewedTradeCapital(
	db,
	{
		season,
		week,

		sleeperTransactionId,

		futuresYear,

		fromManagerId,
		toManagerId,

		amount,

		transactionDate = null,

		note = null,

		metadata = {},

		createdBy = null
	} = {}
) {
	const transfer = await postDraftCapitalTransfer(db, {
		futuresYear,

		fromManagerId,
		toManagerId,

		amount,

		transactionDate,

		leagueSeason: season,

		leagueWeek: week,

		sleeperTransactionId,

		note,

		metadata,

		source: 'sleeper_trade',

		createdBy
	});

	await db
		.prepare(
			`
      INSERT INTO draft_capital_trade_reviews (
        season,
        week,
        sleeper_transaction_id,
        review_status,
        transfer_id,
        note,
        reviewed_by,
        reviewed_at,
        updated_at
      )

      VALUES (
        ?,
        ?,
        ?,
        'posted',
        ?,
        ?,
        ?,
        unixepoch(),
        unixepoch()
      )

      ON CONFLICT(
        season,
        sleeper_transaction_id
      )

      DO UPDATE SET
        week =
          excluded.week,

        review_status =
          'posted',

        transfer_id =
          excluded.transfer_id,

        note =
          excluded.note,

        reviewed_by =
          excluded.reviewed_by,

        reviewed_at =
          unixepoch(),

        updated_at =
          unixepoch()
    `
		)
		.bind(
			Number(season),

			week == null ? null : Number(week),

			String(sleeperTransactionId),

			transfer.transferId,

			clean(note),

			clean(createdBy)
		)
		.run();

	return transfer;
}

/*
 * ============================================================
 * GET DRAFT-CAPITAL TRADE REVIEW STATES
 *
 * Sleeper is the source of truth for the actual trades.
 * D1 only remembers whether each trade has been reviewed.
 * ============================================================
 */

export async function getDraftCapitalTradeReviews(db, { season } = {}) {
	if (!db) {
		throw new Error('D1 database binding is required.');
	}

	const year = Number(season);

	if (!Number.isInteger(year)) {
		throw new Error('A valid season is required.');
	}

	const result = await db
		.prepare(
			`
        SELECT
          r.season,
          r.week,
          r.sleeper_transaction_id,
          r.review_status,
          r.transfer_id,
          r.note,
          r.reviewed_at,

          outgoing.futures_year
            AS futures_year,

          outgoing.manager_id
            AS from_manager_id,

          incoming.manager_id
            AS to_manager_id,

          ABS(
            outgoing.amount_cents
          )
            AS amount_cents,

          COALESCE(
            outgoing.transaction_date,
            incoming.transaction_date
          )
            AS transaction_date,

          COALESCE(
            outgoing.note,
            incoming.note,
            r.note
          )
            AS capital_note

        FROM draft_capital_trade_reviews r

        LEFT JOIN draft_capital_entries outgoing
          ON
            outgoing.transfer_id =
              r.transfer_id

            AND
            outgoing.amount_cents < 0

            AND
            outgoing.voided_at IS NULL

        LEFT JOIN draft_capital_entries incoming
          ON
            incoming.transfer_id =
              r.transfer_id

            AND
            incoming.amount_cents > 0

            AND
            incoming.voided_at IS NULL

        WHERE
          r.season = ?

        ORDER BY
          COALESCE(
            r.week,
            0
          ) DESC,

          r.reviewed_at DESC
      `
		)
		.bind(year)
		.all();

	return (result.results ?? []).map((row) => {
		const amountCents = row.amount_cents == null ? null : Number(row.amount_cents);

		return {
			season: Number(row.season),

			week: row.week == null ? null : Number(row.week),

			transactionId: String(row.sleeper_transaction_id),

			reviewStatus: row.review_status || 'pending',

			transferId: row.transfer_id || null,

			reviewNote: row.note || null,

			reviewedAt: row.reviewed_at == null ? null : Number(row.reviewed_at),

			capital:
				row.transfer_id && amountCents != null
					? {
							futuresYear: Number(row.futures_year),

							fromManagerId: String(row.from_manager_id),

							toManagerId: String(row.to_manager_id),

							amountCents,

							amount: amountCents / 100,

							transactionDate: row.transaction_date || null,

							note: row.capital_note || null
						}
					: null
		};
	});
}

/*
 * ============================================================
 * EDIT EXISTING REVIEWED SLEEPER CAPITAL TRANSFER
 *
 * Keeps the SAME transfer_id and SAME Sleeper transaction ID.
 *
 * That means:
 *
 * - audit trail remains intact
 * - player Franchise Trail remains linked
 * - no duplicate ledger entries
 * ============================================================
 */

export async function updateReviewedTradeCapital(
	db,
	{
		season,
		week,

		sleeperTransactionId,

		futuresYear,

		fromManagerId,
		toManagerId,

		amount,

		transactionDate = null,

		note = null,

		metadata = {},

		updatedBy = null
	} = {}
) {
	if (!db) {
		throw new Error('D1 database binding is required.');
	}

	const year = Number(futuresYear);

	if (!Number.isInteger(year)) {
		throw new Error('A valid auction capital year is required.');
	}

	if (!fromManagerId || !toManagerId) {
		throw new Error('Both teams are required.');
	}

	if (String(fromManagerId) === String(toManagerId)) {
		throw new Error('Capital cannot be transferred to the same team.');
	}

	const amountCents = Math.abs(dollarsToCents(amount));

	if (amountCents <= 0) {
		throw new Error('Transfer amount must be greater than zero.');
	}

	/*
	 * Find the existing review + transfer.
	 */
	const review = await db
		.prepare(
			`
        SELECT
          transfer_id

        FROM draft_capital_trade_reviews

        WHERE
          season = ?
          AND sleeper_transaction_id = ?
          AND review_status = 'posted'
      `
		)
		.bind(Number(season), String(sleeperTransactionId))
		.first();

	if (!review?.transfer_id) {
		throw new Error('Posted draft-capital transfer could not be found.');
	}

	const transferId = String(review.transfer_id);

	/*
	 * Make sure both active ledger halves exist.
	 */
	const existing = await db
		.prepare(
			`
        SELECT
          id,
          amount_cents

        FROM draft_capital_entries

        WHERE
          transfer_id = ?
          AND voided_at IS NULL
      `
		)
		.bind(transferId)
		.all();

	const rows = existing.results ?? [];

	const outgoingRow = rows.find((row) => Number(row.amount_cents) < 0);

	const incomingRow = rows.find((row) => Number(row.amount_cents) > 0);

	if (!outgoingRow || !incomingRow) {
		throw new Error('The linked ledger transfer is incomplete.');
	}

	const transactionId = String(sleeperTransactionId);

	const outgoingDedupe = `capital:${transactionId}:${year}:${fromManagerId}:out`;

	const incomingDedupe = `capital:${transactionId}:${year}:${toManagerId}:in`;

	const commonMetadata = {
		...metadata,

		transferId,

		futuresYear: year,

		dollarAmount: amountCents / 100,

		edited: true,

		editedAt: new Date().toISOString(),

		editedBy: updatedBy ? String(updatedBy) : null
	};

	const outgoing = db
		.prepare(
			`
        UPDATE draft_capital_entries

        SET
          futures_year = ?,
          manager_id = ?,
          amount_cents = ?,
          transaction_date = ?,
          league_season = ?,
          league_week = ?,
          sleeper_transaction_id = ?,
          counterparty_manager_id = ?,
          note = ?,
          metadata_json = ?,
          source = 'sleeper_trade',
          dedupe_key = ?,
          updated_at = unixepoch()

        WHERE
          id = ?
          AND voided_at IS NULL
      `
		)
		.bind(
			year,

			String(fromManagerId),

			-amountCents,

			clean(transactionDate),

			Number(season),

			week == null ? null : Number(week),

			transactionId,

			String(toManagerId),

			clean(note),

			JSON.stringify({
				...commonMetadata,
				direction: 'away'
			}),

			outgoingDedupe,

			Number(outgoingRow.id)
		);

	const incoming = db
		.prepare(
			`
        UPDATE draft_capital_entries

        SET
          futures_year = ?,
          manager_id = ?,
          amount_cents = ?,
          transaction_date = ?,
          league_season = ?,
          league_week = ?,
          sleeper_transaction_id = ?,
          counterparty_manager_id = ?,
          note = ?,
          metadata_json = ?,
          source = 'sleeper_trade',
          dedupe_key = ?,
          updated_at = unixepoch()

        WHERE
          id = ?
          AND voided_at IS NULL
      `
		)
		.bind(
			year,

			String(toManagerId),

			amountCents,

			clean(transactionDate),

			Number(season),

			week == null ? null : Number(week),

			transactionId,

			String(fromManagerId),

			clean(note),

			JSON.stringify({
				...commonMetadata,
				direction: 'received'
			}),

			incomingDedupe,

			Number(incomingRow.id)
		);

	const updateReview = db
		.prepare(
			`
        UPDATE draft_capital_trade_reviews

        SET
          week = ?,
          note = ?,
          reviewed_by = ?,
          reviewed_at = unixepoch(),
          updated_at = unixepoch()

        WHERE
          season = ?
          AND sleeper_transaction_id = ?
      `
		)
		.bind(
			week == null ? null : Number(week),

			clean(note),

			clean(updatedBy),

			Number(season),

			transactionId
		);

	await db.batch([outgoing, incoming, updateReview]);

	return {
		transferId,

		futuresYear: year,

		amount: amountCents / 100,

		fromManagerId: String(fromManagerId),

		toManagerId: String(toManagerId)
	};
}

/*
 * ============================================================
 * REMOVE CAPITAL FROM A REVIEWED TRADE
 *
 * Voids the linked ledger pair and changes the review to
 * "no_capital".
 * ============================================================
 */

export async function removeReviewedTradeCapital(
	db,
	{ season, sleeperTransactionId, removedBy = null } = {}
) {
	if (!db) {
		throw new Error('D1 database binding is required.');
	}

	const review = await db
		.prepare(
			`
        SELECT
          transfer_id

        FROM draft_capital_trade_reviews

        WHERE
          season = ?
          AND sleeper_transaction_id = ?
      `
		)
		.bind(
			Number(season),

			String(sleeperTransactionId)
		)
		.first();

	if (!review?.transfer_id) {
		throw new Error('No linked capital transfer was found.');
	}

	const transferId = String(review.transfer_id);

	await db.batch([
		db
			.prepare(
				`
        UPDATE draft_capital_entries

        SET
          voided_at =
            unixepoch(),

          voided_by =
            ?,

          updated_at =
            unixepoch()

        WHERE
          transfer_id = ?
          AND voided_at IS NULL
      `
			)
			.bind(
				clean(removedBy),

				transferId
			),

		db
			.prepare(
				`
        UPDATE draft_capital_trade_reviews

        SET
          review_status =
            'no_capital',

          transfer_id =
            NULL,

          note =
            'Capital removed by commissioner edit.',

          reviewed_by =
            ?,

          reviewed_at =
            unixepoch(),

          updated_at =
            unixepoch()

        WHERE
          season = ?
          AND sleeper_transaction_id = ?
      `
			)
			.bind(
				clean(removedBy),

				Number(season),

				String(sleeperTransactionId)
			)
	]);

	return {
		transferId
	};
}
/*
 * ============================================================
 * GET STORED SLEEPER TRADES FOR ADMIN REVIEW
 * ============================================================
 */

export async function getDraftCapitalTradeInbox(db, { season } = {}) {
	const year = Number(season);

	const result = await db
		.prepare(
			`
        SELECT
          t.transaction_id,
          t.season,
          t.round,
          t.status,
          t.roster_ids_json,
          t.adds_json,
          t.drops_json,
          t.draft_picks_json,
          t.created_at,

          r.review_status,
          r.transfer_id,
          r.note AS review_note,
          r.reviewed_at

        FROM sleeper_transactions_seasonal t

        LEFT JOIN draft_capital_trade_reviews r
          ON
            r.season =
              t.season

            AND
            r.sleeper_transaction_id =
              t.transaction_id

        WHERE
          t.season = ?

          AND LOWER(
            COALESCE(
              t.type,
              ''
            )
          ) = 'trade'

          AND LOWER(
            COALESCE(
              t.status,
              'complete'
            )
          ) = 'complete'

        ORDER BY
          COALESCE(
            t.round,
            0
          ) DESC,

          COALESCE(
            t.created_at,
            0
          ) DESC
      `
		)
		.bind(year)
		.all();

	return (result.results ?? []).map((row) => ({
		transactionId: String(row.transaction_id),

		season: Number(row.season),

		week: row.round == null ? null : Number(row.round),

		status: row.status,

		rosterIds: parseJson(row.roster_ids_json, []),

		adds: parseJson(row.adds_json, {}),

		drops: parseJson(row.drops_json, {}),

		draftPicks: parseJson(row.draft_picks_json, []),

		createdAt: Number(row.created_at || 0),

		reviewStatus: row.review_status || 'pending',

		transferId: row.transfer_id || null,

		reviewNote: row.review_note || null,

		reviewedAt: row.reviewed_at == null ? null : Number(row.reviewed_at)
	}));
}

/*
 * ============================================================
 * VOID
 * ============================================================
 */

export async function voidDraftCapitalEntry(db, { entryId, voidedBy = null } = {}) {
	if (!db) {
		throw new Error('D1 database binding is required.');
	}

	const id = Number(entryId);

	if (!Number.isInteger(id)) {
		throw new Error('A valid ledger entry ID is required.');
	}

	/*
	 * First find out WHAT we're voiding.
	 *
	 * If it belongs to a transfer, we want to void the
	 * entire transfer pair rather than only one side.
	 */
	const entry = await db
		.prepare(
			`
        SELECT
          id,
          transfer_id,
          sleeper_transaction_id,
          entry_type,
          source

        FROM draft_capital_entries

        WHERE
          id = ?
          AND voided_at IS NULL
      `
		)
		.bind(id)
		.first();

	if (!entry) {
		throw new Error('Active ledger entry could not be found.');
	}

	const transferId = entry.transfer_id ? String(entry.transfer_id) : null;

	/*
	 * See whether this transfer came from a reviewed
	 * Sleeper trade.
	 */
	let tradeReview = null;

	if (transferId) {
		tradeReview = await db
			.prepare(
				`
          SELECT
            season,
            sleeper_transaction_id,
            review_status,
            transfer_id

          FROM draft_capital_trade_reviews

          WHERE
            transfer_id = ?

          LIMIT 1
        `
			)
			.bind(transferId)
			.first();
	}

	const statements = [];

	if (transferId) {
		/*
		 * ========================================================
		 * VOID THE ENTIRE TRANSFER
		 *
		 * Never leave one team with +$20 while the other team's
		 * -$20 has been voided.
		 * ========================================================
		 */

		statements.push(
			db
				.prepare(
					`
          UPDATE draft_capital_entries

          SET
            voided_at =
              unixepoch(),

            voided_by =
              ?,

            /*
             * Allow this Sleeper trade to create a replacement
             * capital entry later, even if dedupe_key has a
             * global unique constraint.
             */
            dedupe_key =
              NULL,

            updated_at =
              unixepoch()

          WHERE
            transfer_id = ?
            AND voided_at IS NULL
        `
				)
				.bind(
					voidedBy ? String(voidedBy) : null,

					transferId
				)
		);

		/*
		 * ========================================================
		 * REOPEN THE SLEEPER TRADE
		 *
		 * If the capital transfer has been voided, "posted" is no
		 * longer a truthful review state.
		 * ========================================================
		 */

		if (tradeReview) {
			statements.push(
				db
					.prepare(
						`
            UPDATE draft_capital_trade_reviews

            SET
              review_status =
                'pending',

              transfer_id =
                NULL,

              reviewed_by =
                NULL,

              reviewed_at =
                NULL,

              note =
                CASE

                  WHEN
                    note IS NULL
                    OR TRIM(note) = ''

                  THEN
                    'Reopened automatically because the linked draft-capital transfer was voided.'

                  ELSE
                    note ||
                    ' · Reopened automatically because the linked draft-capital transfer was voided.'

                END,

              updated_at =
                unixepoch()

            WHERE
              transfer_id = ?
          `
					)
					.bind(transferId)
			);
		}
	} else {
		/*
		 * ========================================================
		 * NORMAL NON-TRANSFER LEDGER ENTRY
		 *
		 * Manual adjustment, auction funding, auction spend, etc.
		 * ========================================================
		 */

		statements.push(
			db
				.prepare(
					`
          UPDATE draft_capital_entries

          SET
            voided_at =
              unixepoch(),

            voided_by =
              ?,

            dedupe_key =
              NULL,

            updated_at =
              unixepoch()

          WHERE
            id = ?
            AND voided_at IS NULL
        `
				)
				.bind(
					voidedBy ? String(voidedBy) : null,

					id
				)
		);
	}

	await db.batch(statements);

	return {
		entryId: id,

		transferId,

		voidedTransfer: Boolean(transferId),

		reopenedTradeReview: Boolean(tradeReview),

		sleeperTransactionId: tradeReview?.sleeper_transaction_id
			? String(tradeReview.sleeper_transaction_id)
			: null
	};
}
/*
 * ============================================================
 * LEGACY IMPORT STATUS
 * ============================================================
 */

export async function getLegacyDraftCapitalImportStatus(db, { year } = {}) {
	if (!db) {
		throw new Error('D1 database binding is required.');
	}

	const futuresYear = Number(year);

	const legacy = await db
		.prepare(
			`
        SELECT
          COUNT(*) AS row_count,
          MIN(transaction_date) AS first_date,
          MAX(transaction_date) AS last_date

        FROM draft_capital_entries

        WHERE
          futures_year = ?
          AND source = 'legacy_sheet'
          AND voided_at IS NULL
      `
		)
		.bind(futuresYear)
		.first();

	const opening = await db
		.prepare(
			`
        SELECT
          COUNT(*) AS row_count

        FROM draft_capital_entries

        WHERE
          futures_year = ?
          AND entry_type = 'opening_balance'
          AND voided_at IS NULL
      `
		)
		.bind(futuresYear)
		.first();

	return {
		rowCount: Number(legacy?.row_count || 0),

		firstDate: legacy?.first_date || null,

		lastDate: legacy?.last_date || null,

		openingBalanceCount: Number(opening?.row_count || 0)
	};
}

/*
 * ============================================================
 * LEGACY LEDGER IMPORT
 *
 * Rows passed here are ALREADY parsed, validated, and mapped
 * to Irving manager IDs.
 *
 * The process is intentionally:
 *
 * 1. Insert historical rows
 * 2. Only after they all succeed, void temporary opening
 *    balance snapshots
 *
 * This way a failed import can never destroy our working
 * balances.
 * ============================================================
 */

export async function importLegacyDraftCapitalLedger(
	db,
	{ futuresYear, rows, createdBy = null } = {}
) {
	if (!db) {
		throw new Error('D1 database binding is required.');
	}

	const year = Number(futuresYear);

	if (!Number.isInteger(year)) {
		throw new Error('A valid futures year is required.');
	}

	if (!Array.isArray(rows) || !rows.length) {
		throw new Error('No legacy ledger rows were supplied.');
	}

	/*
	 * D1 batches are kept intentionally modest.
	 *
	 * The import is idempotent because every CSV row
	 * gets its own deterministic dedupe key.
	 */
	const statements = rows.map((row) =>
		db
			.prepare(
				`
            INSERT OR IGNORE INTO draft_capital_entries (
              futures_year,
              manager_id,
              amount_cents,
              entry_type,
              transaction_date,
              transfer_id,
              counterparty_manager_id,
              note,
              metadata_json,
              source,
              created_by,
              dedupe_key,
              updated_at
            )

            VALUES (
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              'legacy_sheet',
              ?,
              ?,
              unixepoch()
            )
          `
			)
			.bind(
				year,

				String(row.managerId),

				Number(row.amountCents),

				String(row.entryType),

				row.transactionDate || null,

				row.transferId || null,

				row.counterpartyManagerId || null,

				row.note || null,

				JSON.stringify(row.metadata || {}),

				createdBy ? String(createdBy) : null,

				String(row.dedupeKey)
			)
	);

	const chunkSize = 40;

	for (let index = 0; index < statements.length; index += chunkSize) {
		await db.batch(statements.slice(index, index + chunkSize));
	}

	/*
	 * Historical entries are safely in D1.
	 *
	 * NOW retire the temporary snapshot rows.
	 */
	await db
		.prepare(
			`
      UPDATE draft_capital_entries

      SET
        voided_at =
          unixepoch(),

        voided_by =
          ?,

        updated_at =
          unixepoch()

      WHERE
        futures_year = ?
        AND entry_type = 'opening_balance'
        AND voided_at IS NULL
    `
		)
		.bind(
			createdBy ? String(createdBy) : null,

			year
		)
		.run();

	const stored = await db
		.prepare(
			`
        SELECT
          COUNT(*) AS row_count

        FROM draft_capital_entries

        WHERE
          futures_year = ?
          AND source = 'legacy_sheet'
          AND voided_at IS NULL
      `
		)
		.bind(year)
		.first();

	return {
		futuresYear: year,

		storedRows: Number(stored?.row_count || 0),

		submittedRows: rows.length
	};
}
