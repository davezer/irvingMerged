import { redirect } from '@sveltejs/kit';
import { getManagers } from '$lib/server/league';

const DEFAULT_CAPITAL_YEAR = 2027;
const DEFAULT_TRADE_SEASON = 2026;

function integerOr(value, fallback) {
	const number = Number(value);

	return Number.isInteger(number)
		? number
		: fallback;
}

function parseJson(value, fallback = {}) {
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

function managerIndex() {
	return new Map(
		getManagers().map((manager) => [
			String(manager.managerID),
			{
				id: String(manager.managerID),
				name: manager.name,
				teamName: manager.teamName,
				slug: manager.slug,
				photo: manager.photo || null,
				teamChiclet: manager.chiclet || manager.photo || null
			}
		])
	);
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

async function getRunningAuditLedger(db, capitalYear) {
	if (!db) {
		return [];
	}

	/*
	 * The balance board is a running balance: previous auction capital
	 * rolls into the selected capital year. The audit trail must mirror
	 * that same rule, otherwise 2027 only shows the brand-new 2027 rows
	 * and hides the 2025/2026 history that created the carried balance.
	 */
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
					futures_year <= ?
					AND voided_at IS NULL
				ORDER BY
					COALESCE(transaction_date, '') DESC,
					created_at DESC,
					id DESC
			`
		)
		.bind(capitalYear)
		.all();

	const managers = managerIndex();

	return (result.results ?? []).map((row) => ({
		id: Number(row.id),
		futuresYear: Number(row.futures_year),
		managerId: String(row.manager_id),
		amountCents: Number(row.amount_cents || 0),
		amount: Number(row.amount_cents || 0) / 100,
		entryType: row.entry_type,
		transactionDate: row.transaction_date || null,
		leagueSeason: row.league_season == null ? null : Number(row.league_season),
		leagueWeek: row.league_week == null ? null : Number(row.league_week),
		sleeperTransactionId: row.sleeper_transaction_id || null,
		transferId: row.transfer_id || null,
		counterpartyManagerId: row.counterparty_manager_id || null,
		note: row.note || null,
		metadata: parseJson(row.metadata_json, {}),
		source: row.source || null,
		createdBy: row.created_by || null,
		createdAt: Number(row.created_at || 0),
		manager:
			managers.get(String(row.manager_id)) || null,
		counterparty:
			row.counterparty_manager_id
				? managers.get(String(row.counterparty_manager_id)) || null
				: null
	}));
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

	const capitalYear = integerOr(
		params.get('capitalYear') ??
			params.get('year'),
		DEFAULT_CAPITAL_YEAR
	);

	const tradeSeason = integerOr(
		params.get('tradeSeason') ??
			params.get('season'),
		DEFAULT_TRADE_SEASON
	);

	const transactionYearParam = params.get('transactionYear');
	const transactionYear =
		transactionYearParam && transactionYearParam !== 'all'
			? integerOr(transactionYearParam, null)
			: null;

	const db = platform?.env?.DB;

	await reconcilePostedTradeReviews(
		db,
		tradeSeason
	);

	const fullAuditLedger = await getRunningAuditLedger(
		db,
		capitalYear
	);

	const auditTransactionYears = [
		...new Set(
			fullAuditLedger
				.map((entry) =>
					entry.transactionDate
						? Number(String(entry.transactionDate).slice(0, 4))
						: null
				)
				.filter(Number.isFinite)
		)
	].sort((a, b) => b - a);

	const auditLedger =
		transactionYear == null
			? fullAuditLedger
			: fullAuditLedger.filter(
				(entry) =>
					entry.transactionDate &&
					Number(String(entry.transactionDate).slice(0, 4)) === transactionYear
			);

	return {
		auditLedger,
		auditTransactionYears
	};
}
