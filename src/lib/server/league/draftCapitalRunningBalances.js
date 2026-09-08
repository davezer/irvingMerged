function centsToDollars(cents) {
	return Number(cents || 0) / 100;
}

/*
 * ============================================================
 * RUNNING / ROLLED-FORWARD DRAFT CAPITAL
 *
 * Draft capital behaves like a running bank account rather than
 * a set of isolated yearly wallets.
 *
 * Example for 2027:
 *   all active 2026 entries
 * + all active 2027 entries
 * = current 2027 auction capital
 *
 * This keeps the existing exact-year repository helper untouched
 * so legacy CSV verification can continue comparing one year at
 * a time.
 * ============================================================
 */
export async function getDraftCapitalRunningBalances(
	db,
	{ year } = {}
) {
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

          COALESCE(
            SUM(
              CASE
                WHEN futures_year = ? THEN 1
                ELSE 0
              END
            ),
            0
          ) AS entry_count

        FROM draft_capital_entries

        WHERE
          futures_year <= ?
          AND voided_at IS NULL

        GROUP BY
          manager_id
      `
		)
		.bind(
			futuresYear,
			futuresYear
		)
		.all();

	return (result.results ?? []).map((row) => ({
		managerId: String(row.manager_id),

		futuresYear,

		balanceCents: Number(row.balance_cents || 0),

		balance: centsToDollars(row.balance_cents),

		entryCount: Number(row.entry_count || 0)
	}));
}
