import { redirect } from '@sveltejs/kit';

const DEFAULT_CAPITAL_YEAR = 2027;
const DEFAULT_TRADE_SEASON = 2026;

function integerOr(value, fallback) {
	const number = Number(value);

	return Number.isInteger(number)
		? number
		: fallback;
}

async function reconcilePostedTradeReviews(db, tradeSeason) {
	if (!db) {
		return;
	}

	/*
	 * A Sleeper trade capital post creates the two ledger rows first,
	 * then records the review state. If that second write ever fails,
	 * the money is correctly in the ledger but the trade can still look
	 * pending. Recover those orphaned review states directly from the
	 * active two-sided ledger transfer.
	 */
	const result = await db
		.prepare(
			`
				SELECT
					sleeper_transaction_id,
					transfer_id,
					MAX(league_week) AS league_week,
					MAX(note) AS note,
					MAX(created_by) AS created_by,
					MAX(created_at) AS created_at,
					SUM(
						CASE
							WHEN amount_cents < 0 THEN 1
							ELSE 0
						END
					) AS outgoing_rows,
					SUM(
						CASE
							WHEN amount_cents > 0 THEN 1
							ELSE 0
						END
					) AS incoming_rows
				FROM draft_capital_entries
				WHERE
					voided_at IS NULL
					AND entry_type = 'trade'
					AND source = 'sleeper_trade'
					AND league_season = ?
					AND sleeper_transaction_id IS NOT NULL
					AND sleeper_transaction_id <> ''
					AND transfer_id IS NOT NULL
					AND transfer_id <> ''
				GROUP BY
					sleeper_transaction_id,
					transfer_id
				HAVING
					SUM(
						CASE
							WHEN amount_cents < 0 THEN 1
							ELSE 0
						END
					) > 0
					AND SUM(
						CASE
							WHEN amount_cents > 0 THEN 1
							ELSE 0
						END
					) > 0
			`
		)
		.bind(tradeSeason)
		.all();

	for (const row of result.results ?? []) {
		const transactionId = String(row.sleeper_transaction_id || '');
		const transferId = String(row.transfer_id || '');

		if (!transactionId || !transferId) {
			continue;
		}

		/*
		 * Do not depend on the UNIQUE constraint here. Updating first and
		 * inserting only when nothing exists also repairs older databases
		 * whose review table may have drifted from the current migration.
		 */
		const updated = await db
			.prepare(
				`
					UPDATE draft_capital_trade_reviews
					SET
						week = COALESCE(?, week),
						review_status = 'posted',
						transfer_id = ?,
						note = COALESCE(note, ?),
						reviewed_by = COALESCE(reviewed_by, ?),
						reviewed_at = COALESCE(reviewed_at, ?),
						updated_at = unixepoch()
					WHERE
						season = ?
						AND sleeper_transaction_id = ?
				`
			)
			.bind(
				row.league_week == null ? null : Number(row.league_week),
				transferId,
				row.note || null,
				row.created_by || null,
				row.created_at == null ? Math.floor(Date.now() / 1000) : Number(row.created_at),
				tradeSeason,
				transactionId
			)
			.run();

		if (Number(updated.meta?.changes || 0) > 0) {
			continue;
		}

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
					SELECT
						?,
						?,
						?,
						'posted',
						?,
						?,
						?,
						?,
						unixepoch()
					WHERE NOT EXISTS (
						SELECT 1
						FROM draft_capital_trade_reviews
						WHERE
							season = ?
							AND sleeper_transaction_id = ?
					)
				`
			)
			.bind(
				tradeSeason,
				row.league_week == null ? null : Number(row.league_week),
				transactionId,
				transferId,
				row.note || null,
				row.created_by || null,
				row.created_at == null ? Math.floor(Date.now() / 1000) : Number(row.created_at),
				tradeSeason,
				transactionId
			)
			.run();
	}
}

export async function load({ platform, url }) {
	const params = new URLSearchParams(url.searchParams);

	const hasCapitalYear =
		params.has('capitalYear') ||
		params.has('year');

	const hasTradeSeason =
		params.has('tradeSeason') ||
		params.has('season');

	if (!hasCapitalYear) {
		params.set(
			'capitalYear',
			String(DEFAULT_CAPITAL_YEAR)
		);
	}

	if (!hasTradeSeason) {
		params.set(
			'tradeSeason',
			String(DEFAULT_TRADE_SEASON)
		);
	}

	if (!hasCapitalYear || !hasTradeSeason) {
		throw redirect(
			307,
			`${url.pathname}?${params.toString()}`
		);
	}

	const tradeSeason = integerOr(
		params.get('tradeSeason') ??
			params.get('season'),
		DEFAULT_TRADE_SEASON
	);

	await reconcilePostedTradeReviews(
		platform?.env?.DB,
		tradeSeason
	);

	return {};
}
