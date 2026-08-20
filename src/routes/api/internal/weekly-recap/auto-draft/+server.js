import {
  json
} from '@sveltejs/kit';

import {
  resolveLeagueContext
} from '$lib/server/league/context.js';

import {
  buildWeeklyRecapPacket
} from '$lib/server/league/weeklyRecapPacket.js';

import {
  generateWeeklyRecap
} from '$lib/server/league/weeklyRecapWriter.js';

import {
  getWeeklyRecap,
  saveWeeklyRecapDraft
} from '$lib/server/league/weeklyRecapRepository.js';

import {
  upsertWeeklyRecapDraftPost
} from '$lib/server/league/weeklyPostRepository.js';

import {
  getSleeperMatchupsForWeek,
  getSleeperNFLState
} from '$lib/server/league/sleeperClient.js';


const MAX_AUTO_RECAP_WEEK =
  17;


function numberOrNull(
  value
) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  ) {
    return null;
  }

  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  )
    ? number
    : null;
}


function isAuthorized(
	request,
	env,
	locals
) {
	/*
	 * Logged-in admins may use the endpoint
	 * from the Recap Lab.
	 */
	if (
		locals?.user?.role ===
		'admin'
	) {
		return true;
	}

	/*
	 * The standalone Tuesday cron still
	 * authenticates with its bearer secret.
	 */
	const expected =
		String(
			env
				?.WEEKLY_CRON_SECRET ||
			''
		).trim();

	if (!expected) {
		return false;
	}

	const supplied =
		String(
			request.headers.get(
				'authorization'
			) || ''
		);

	return (
		supplied ===
		`Bearer ${expected}`
	);
}


function matchupScore(
  entry
) {
  const score =
    Number(
      entry?.custom_points ??
      entry?.points
    );

  return Number.isFinite(
    score
  )
    ? score
    : null;
}


function matchupsLookComplete(
  matchups,
  expectedRosterCount = 0
) {
  if (
    !Array.isArray(
      matchups
    ) ||
    matchups.length < 2
  ) {
    return false;
  }

  if (
    expectedRosterCount > 0 &&
    matchups.length <
      expectedRosterCount
  ) {
    return false;
  }

  const groups =
    new Map();

  for (
    const entry of matchups
  ) {
    const key =
      Number(
        entry.matchup_id
      );

    if (
      !groups.has(
        key
      )
    ) {
      groups.set(
        key,
        []
      );
    }

    groups
      .get(
        key
      )
      .push(
        entry
      );
  }

  /*
   * Every fantasy matchup should
   * have exactly two sides.
   */
  if (
    [...groups.values()]
      .some(
        (teams) =>
          teams.length !== 2
      )
  ) {
    return false;
  }

  const scores =
    matchups.map(
      matchupScore
    );

  /*
   * Null/undefined scoring means
   * the data is not ready.
   */
  if (
    scores.some(
      (score) =>
        score === null
    )
  ) {
    return false;
  }

  /*
   * Future Sleeper matchups may
   * already exist but contain all
   * zero scores.
   */
  return scores.some(
    (score) =>
      score > 0
  );
}


function packetUrl({
  url,
  season,
  week
}) {
  const next =
    new URL(
      url
    );

  next.searchParams.set(
    'season',
    String(
      season
    )
  );

  next.searchParams.set(
    'week',
    String(
      week
    )
  );

  next.searchParams.delete(
    'weeks'
  );

  return next;
}


async function findLatestCompletedWeek({
  url,
  env
}) {
  const state =
    await getSleeperNFLState();

  const season =
    numberOrNull(
      state?.season
    );

  if (
    !Number.isInteger(
      season
    )
  ) {
    throw new Error(
      'Sleeper did not return a valid NFL season.'
    );
  }

  const stateWeek =
    Math.max(
      1,

      numberOrNull(
        state?.display_week
      ) || 1,

      numberOrNull(
        state?.week
      ) || 1,

      numberOrNull(
        state?.leg
      ) || 1
    );

  const upperWeek =
    Math.min(
      MAX_AUTO_RECAP_WEEK,
      stateWeek
    );

  /*
   * Scan backward.
   *
   * This handles both possibilities:
   * - Sleeper has already advanced
   *   to the next week (all zeroes).
   * - Sleeper still reports the week
   *   that just finished.
   */
  for (
    let week =
      upperWeek;

    week >= 1;

    week -= 1
  ) {
    const candidateUrl =
      packetUrl({
        url,
        season,
        week
      });

    const context =
      await resolveLeagueContext({
        url:
          candidateUrl,

        env,

        allWeeksByDefault:
          false
      });

    const matchups =
      await getSleeperMatchupsForWeek(
        context.leagueId,
        week
      );

    const expectedRosterCount =
      Number(
        context.league
          ?.total_rosters ||
        0
      );

    if (
      matchupsLookComplete(
        matchups,
        expectedRosterCount
      )
    ) {
      return {
        season,
        week,
        leagueId:
          context.leagueId
      };
    }
  }

  return null;
}


export async function POST({
	request,
	url,
	platform,
	locals
}) {
	const env =
		platform?.env;

    const phase =
	url.searchParams.get(
		'phase'
	) ||
	'full';

	/*
	 * ------------------------------------------------------------
	 * AUTH
	 * ------------------------------------------------------------
	 */
	if (
	!isAuthorized(
		request,
		env,
		locals
	)
) {
		return json(
			{
				ok: false,
				error:
					'Unauthorized.'
			},
			{
				status: 401
			}
		);
	}

	const db =
		env?.DB;

	if (!db) {
		return json(
			{
				ok: false,
				error:
					'D1 binding is unavailable.'
			},
			{
				status: 500
			}
		);
	}
  /*
 * ============================================================
 * PHASE 2 — WRITE
 *
 * This is intentionally a separate HTTP invocation so the
 * Cloudflare subrequest counter starts fresh.
 * ============================================================
 */

if (
	phase === 'write'
) {
	let stage =
		'reading_write_payload';
		const force =
	url.searchParams.get(
		'force'
	) === '1';

	try {
		const body =
			await request.json();

		const season =
			Number(
				body?.season
			);

		const week =
			Number(
				body?.week
			);

		const packet =
			body?.packet;

		if (
			!Number.isInteger(
				season
			) ||
			!Number.isInteger(
				week
			) ||
			!packet
		) {
			return json(
				{
					ok: false,
					stage,

					error:
						'Write phase requires season, week, and packet.'
				},
				{
					status: 400
				}
			);
		}

		/*
		 * Never overwrite something that
		 * appeared between PREPARE and WRITE.
		 */
		stage =
			'checking_existing';

		const existing =
			await getWeeklyRecap(
				db,
				{
					season,
					week
				}
			);

		if (
	!force &&
	(
		existing?.draftRecap ||
		existing?.publishedRecap
	)
) {
			return json({
				ok: true,

				status:
					'skipped',

				reason:
					'A draft or published recap already exists.',

				season,
				week
			});
		}

		const apiKey =
			String(
				env
					?.OPENAI_API_KEY ||
				''
			).trim();

		if (!apiKey) {
			return json(
				{
					ok: false,

					stage:
						'generating_ai',

					error:
						'OPENAI_API_KEY is not configured.'
				},
				{
					status: 500
				}
			);
		}

		stage =
			'generating_ai';

		console.log(
			`[weekly-cron] Writing ${season} Week ${week}.`
		);

		const {
			recap,
			meta
		} =
			await generateWeeklyRecap({
				packet,
				apiKey
			});

		stage =
			'saving_recap';

		const savedRecap =
			await saveWeeklyRecapDraft(
				db,
				{
					season,
					week,

					leagueId:
						packet.league.id,

					recap,
					packet,

					aiMeta:
						meta,

					generatedBy:
	locals?.user?.id ||
	'automation'
				}
			);

		stage =
			'saving_weekly_post';

		await upsertWeeklyRecapDraftPost(
			db,
			{
				season,
				week,

				title:
					recap.title,

				subtitle:
					recap.subtitle
			}
		);

		return json(
			{
				ok: true,

				status:
					'draft_created',

				season,
				week,

				title:
					recap.title,

				generatedAt:
					savedRecap
						?.draftGeneratedAt ||
					null
			},
			{
				status: 201
			}
		);
	} catch (error) {
		console.error(
			`[weekly-cron] Write phase failed during ${stage}:`,
			error
		);

		return json(
			{
				ok: false,
				stage,

				error:
					error instanceof Error
						? error.message
						: 'Automatic recap writing failed.'
			},
			{
				status: 500
			}
		);
	}
}

	/*
	 * Keep track of exactly where a
	 * production failure happens.
	 */
	let stage =
		'startup';

	try {
		/*
		 * ------------------------------------------------------------
		 * READ REQUEST
		 * ------------------------------------------------------------
		 */

		stage =
			'reading_selection';

		const seasonParam =
			numberOrNull(
				url.searchParams.get(
					'season'
				)
			);

		const weekParam =
			numberOrNull(
				url.searchParams.get(
					'week'
				)
			);

		const force =
			url.searchParams.get(
				'force'
			) ===
			'1';

		const dryRun =
			url.searchParams.get(
				'dryRun'
			) ===
			'1';

		const packetOnly =
			url.searchParams.get(
				'packetOnly'
			) ===
			'1';

		/*
		 * Explicit season/week is useful
		 * for testing.
		 *
		 * The actual Tuesday cron provides
		 * neither and lets us auto-detect.
		 */
		const hasExplicitSelection =
			Number.isInteger(
				seasonParam
			) &&
			Number.isInteger(
				weekParam
			);

		if (
			(
				seasonParam !== null ||
				weekParam !== null
			) &&
			!hasExplicitSelection
		) {
			return json(
				{
					ok: false,
					error:
						'Provide both season and week, or neither.'
				},
				{
					status: 400
				}
			);
		}

		/*
		 * ------------------------------------------------------------
		 * DETERMINE SEASON / WEEK
		 * ------------------------------------------------------------
		 */

		stage =
			'selecting_week';

		const selection =
			hasExplicitSelection
				? {
						season:
							seasonParam,

						week:
							weekParam
					}
				: await findLatestCompletedWeek({
						url,
						env
					});

		if (!selection) {
			return json({
				ok: true,

				status:
					'skipped',

				reason:
					'No completed Irving fantasy week was found.'
			});
		}

		const {
			season,
			week
		} =
			selection;

		if (
			!Number.isInteger(
				season
			) ||
			season < 2017 ||
			season > 2100
		) {
			return json(
				{
					ok: false,

					error:
						'Selected season is invalid.'
				},
				{
					status: 400
				}
			);
		}

		if (
			!Number.isInteger(
				week
			) ||
			week < 1 ||
			week >
				MAX_AUTO_RECAP_WEEK
		) {
			return json(
				{
					ok: false,

					error:
						'Selected week is outside the automatic recap window.'
				},
				{
					status: 400
				}
			);
		}

		/*
		 * ------------------------------------------------------------
		 * CHECK EXISTING RECAP
		 * ------------------------------------------------------------
		 */

		stage =
			'checking_existing';

		const existing =
			await getWeeklyRecap(
				db,
				{
					season,
					week
				}
			);

		/*
		 * Diagnostic:
		 *
		 * Tells us whether this recap exists
		 * in THIS D1 database without doing
		 * anything else.
		 */
		if (dryRun) {
			return json({
				ok: true,

				status:
					'dry_run',

				season,
				week,

				existing: {
					found:
						Boolean(
							existing
						),

					hasDraft:
						Boolean(
							existing
								?.draftRecap
						),

					hasPublished:
						Boolean(
							existing
								?.publishedRecap
						)
				}
			});
		}

		/*
		 * Normal automation should never
		 * overwrite Dave's existing work.
		 *
		 * packetOnly deliberately bypasses
		 * this because it performs no writes.
		 */
		if (
			!force &&
			!packetOnly &&
			(
				existing?.draftRecap ||
				existing?.publishedRecap
			)
		) {
			return json({
				ok: true,

				status:
					'skipped',

				reason:
					'A draft or published recap already exists.',

				season,
				week
			});
		}

		/*
		 * ------------------------------------------------------------
		 * BUILD FACTUAL PACKET
		 * ------------------------------------------------------------
		 */

		const recapUrl =
			packetUrl({
				url,
				season,
				week
			});

		stage =
			'building_packet';

		console.log(
			`[weekly-cron] Building ${season} Week ${week} packet.`
		);

		const packet =
			await buildWeeklyRecapPacket({
				url:
					recapUrl,

				env
			});

		/*
		 * Diagnostic:
		 *
		 * Build the entire authoritative
		 * recap packet, but STOP before
		 * OpenAI and before any database
		 * writes.
		 */
		/*
 * PREPARE mode returns the actual packet
 * to the cron orchestrator.
 *
 * packetOnly remains our smaller diagnostic.
 */

if (
	phase === 'prepare'
) {
	return json({
		ok: true,

		status:
			'packet_ready',

		season,
		week,

		packet
	});
}


if (packetOnly) {
	return json({
		ok: true,

		status:
			'packet_ready',

		season,
		week,

		leagueId:
			packet?.league?.id ||
			null,

		matchups:
			Array.isArray(
				packet?.matchups
			)
				? packet.matchups.length
				: 0,

		transactions:
			Array.isArray(
				packet?.transactions
			)
				? packet.transactions.length
				: 0,

		warnings:
			packet
				?.enrichmentWarnings ||
			[]
	});
}
		/*
		 * ------------------------------------------------------------
		 * OPENAI
		 * ------------------------------------------------------------
		 *
		 * We intentionally check the API key
		 * HERE instead of at the top.
		 *
		 * That means dryRun and packetOnly
		 * diagnostics do not require OpenAI.
		 */

		const apiKey =
			String(
				env
					?.OPENAI_API_KEY ||
				''
			).trim();

		if (!apiKey) {
			return json(
				{
					ok: false,

					stage:
						'generating_ai',

					error:
						'OPENAI_API_KEY is not configured.'
				},
				{
					status: 500
				}
			);
		}

		stage =
			'generating_ai';

		console.log(
			`[weekly-cron] Sending ${season} Week ${week} to OpenAI.`
		);

		const {
			recap,
			meta
		} =
			await generateWeeklyRecap({
				packet,
				apiKey
			});

		/*
		 * ------------------------------------------------------------
		 * SAVE RECAP DRAFT
		 * ------------------------------------------------------------
		 */

		stage =
			'saving_recap';

		console.log(
			`[weekly-cron] Saving ${season} Week ${week} draft.`
		);

		const savedRecap =
			await saveWeeklyRecapDraft(
				db,
				{
					season,
					week,

					leagueId:
						packet.league.id,

					recap,

					packet,

					aiMeta:
						meta,

					generatedBy:
						'automation'
				}
			);

		/*
		 * ------------------------------------------------------------
		 * REGISTER WITH THE IRVING WEEKLY
		 * ------------------------------------------------------------
		 */

		stage =
			'saving_weekly_post';

		await upsertWeeklyRecapDraftPost(
			db,
			{
				season,
				week,

				title:
					recap.title,

				subtitle:
					recap.subtitle
			}
		);

		/*
		 * ------------------------------------------------------------
		 * SUCCESS
		 * ------------------------------------------------------------
		 */

		return json(
			{
				ok: true,

				status:
					'draft_created',

				season,
				week,

				title:
					recap.title,

				generatedAt:
					savedRecap
						?.draftGeneratedAt ||
					null
			},
			{
				status: 201
			}
		);
	} catch (error) {
		console.error(
			`[weekly-cron] Auto draft failed during ${stage}:`,
			error
		);

		return json(
			{
				ok: false,

				stage,

				error:
					error instanceof Error
						? error.message
						: 'Automatic recap generation failed.'
			},
			{
				status: 500
			}
		);
	}
}