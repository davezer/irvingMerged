/*
 * The server page still owns the capital board, trade inbox and actions.
 * The parent layout owns the running audit history because the audit trail
 * needs every prior capital-year row that contributes to the selected
 * rolled-forward balance.
 */
export async function load({ data, parent }) {
	const parentData = await parent();

	return {
		...data,
		ledger:
			parentData.auditLedger ??
			data.ledger ??
			[],
		transactionYears:
			parentData.auditTransactionYears ??
			data.transactionYears ??
			[]
	};
}
