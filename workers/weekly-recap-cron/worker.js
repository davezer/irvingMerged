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

	const response =
	await fetch(
		endpoint,
		{
			method:
				'POST',

			headers: {
				authorization:
					`Bearer ${secret}`,

				accept:
					'application/json',

				'content-type':
					'application/json',

				'user-agent':
					'IrvingWeeklyCron/1.0'
			},

			body:
				'{}'
		}
	);
	const body =
		await response.text();

	if (!response.ok) {
		throw new Error(
			`Recap endpoint returned ${response.status}: ${body}`
		);
	}

	console.log(
		`[irving-weekly-cron] ${body}`
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