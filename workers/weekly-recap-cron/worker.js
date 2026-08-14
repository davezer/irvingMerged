function headersFor(
	secret
) {
	return {
		authorization:
			`Bearer ${secret}`,

		accept:
			'application/json',

		'content-type':
			'application/json',

		'user-agent':
			'IrvingWeeklyCron/1.0'
	};
}


async function readJsonResponse(
	response,
	label
) {
	const text =
		await response.text();

	let body;

	try {
		body =
			JSON.parse(
				text
			);
	} catch {
		throw new Error(
			`${label} returned non-JSON: ${text}`
		);
	}

	if (!response.ok) {
		throw new Error(
			`${label} returned ${response.status}: ${text}`
		);
	}

	return body;
}


async function runWeeklyRecap(
	env,
	controller
) {
	const endpoint =
		String(
			env.RECAP_ENDPOINT_URL ||
			''
		).trim();

	const secret =
		String(
			env.WEEKLY_CRON_SECRET ||
			''
		).trim();

	if (!endpoint) {
		throw new Error(
			'RECAP_ENDPOINT_URL is not configured.'
		);
	}

	if (!secret) {
		throw new Error(
			'WEEKLY_CRON_SECRET is not configured.'
		);
	}

	console.log(
		`[irving-weekly-cron] Running ${controller?.cron || 'scheduled job'}.`
	);

	/*
	 * ============================================================
	 * PHASE 1 — PREPARE
	 * ============================================================
	 */

	const prepareUrl =
		new URL(
			endpoint
		);

	prepareUrl.searchParams.set(
		'phase',
		'prepare'
	);

	const prepareResponse =
		await fetch(
			prepareUrl.toString(),
			{
				method:
					'POST',

				headers:
					headersFor(
						secret
					),

				body:
					'{}'
			}
		);

	const prepared =
		await readJsonResponse(
			prepareResponse,
			'Prepare phase'
		);

	/*
	 * Existing recap or offseason.
	 */
	if (
		prepared.status ===
		'skipped'
	) {
		console.log(
			`[irving-weekly-cron] ${JSON.stringify(prepared)}`
		);

		return;
	}

	if (
		prepared.status !==
			'packet_ready' ||
		!prepared.packet
	) {
		throw new Error(
			`Unexpected prepare response: ${JSON.stringify(prepared)}`
		);
	}

	console.log(
		`[irving-weekly-cron] Prepared ${prepared.season} Week ${prepared.week}.`
	);

	/*
	 * ============================================================
	 * PHASE 2 — WRITE
	 *
	 * This hits Pages again, creating an entirely new Worker
	 * invocation with a fresh subrequest budget.
	 * ============================================================
	 */

	const writeUrl =
		new URL(
			endpoint
		);

	writeUrl.searchParams.set(
		'phase',
		'write'
	);

	const writeResponse =
		await fetch(
			writeUrl.toString(),
			{
				method:
					'POST',

				headers:
					headersFor(
						secret
					),

				body:
					JSON.stringify({
						season:
							prepared.season,

						week:
							prepared.week,

						packet:
							prepared.packet
					})
			}
		);

	const written =
		await readJsonResponse(
			writeResponse,
			'Write phase'
		);

	console.log(
		`[irving-weekly-cron] ${JSON.stringify(written)}`
	);
}


export default {
	async fetch(
		request
	) {
		const url =
			new URL(
				request.url
			);

		if (
			url.pathname ===
			'/health'
		) {
			return Response.json({
				ok: true,

				service:
					'irving-weekly-cron'
			});
		}

		return new Response(
			'Not found',
			{
				status: 404
			}
		);
	},


	async scheduled(
		controller,
		env,
		ctx
	) {
		ctx.waitUntil(
			runWeeklyRecap(
				env,
				controller
			)
		);
	}
};