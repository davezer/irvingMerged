import { fail } from '@sveltejs/kit';

import { buildWeeklyRecapPacket } from '$lib/server/league/weeklyRecapPacket.js';

import { generateWeeklyRecap } from '$lib/server/league/weeklyRecapWriter.js';

import {
  upsertWeeklyRecapDraftPost,
  upsertWeeklyRecapPost
} from '$lib/server/league/weeklyPostRepository.js';

import {
	getWeeklyRecap,
	publishWeeklyRecap,
	saveWeeklyRecapDraft
} from '$lib/server/league/weeklyRecapRepository.js';

function validSeason(value) {
	const season = Number(value);

	return Number.isInteger(season) && season >= 2017 && season <= 2100;
}

function validWeek(value) {
	const week = Number(value);

	return Number.isInteger(week) && week >= 1 && week <= 18;
}

function validateSelection(season, week) {
	if (!validSeason(season)) {
		return 'Choose a valid season.';
	}

	if (!validWeek(week)) {
		return 'Choose a week from 1 through 18.';
	}

	return null;
}

function buildPacketUrl({ url, season, week }) {
	const packetUrl = new URL(url);

	packetUrl.searchParams.set('season', String(season));

	packetUrl.searchParams.set('week', String(week));

	packetUrl.searchParams.delete('weeks');

	packetUrl.searchParams.delete('team');

	packetUrl.searchParams.delete('rosterId');

	return packetUrl;
}

async function readSelection(request) {
	const form = await request.formData();

	return {
		season: Number(form.get('season')),

		week: Number(form.get('week'))
	};
}

export async function load({ url, platform }) {
	const season = Number(
		url.searchParams.get('season') ||
		2025
	);

	const week = Number(
		url.searchParams.get('week') ||
		8
	);

	const defaultSeason =
		validSeason(season)
			? season
			: 2025;

	const defaultWeek =
		validWeek(week)
			? week
			: 8;

	const db =
		platform?.env?.DB;

	let savedRecap =
		null;

	if (db) {
		try {
			savedRecap =
				await getWeeklyRecap(
					db,
					{
						season:
							defaultSeason,

						week:
							defaultWeek
					}
				);
		} catch (error) {
			console.warn(
				'[weekly-recap] Could not load saved recap:',
				error
			);
		}
	}

	return {
		defaultSeason,
		defaultWeek,
		savedRecap
	};
}

export const actions = {
	build: async ({ request, url, platform }) => {
		const { season, week } = await readSelection(request);

		const error = validateSelection(season, week);

		if (error) {
			return fail(400, {
				ok: false,

				season,

				week,

				error
			});
		}

		try {
			const packet = await buildWeeklyRecapPacket({
				url: buildPacketUrl({
					url,
					season,
					week
				}),

				env: platform?.env
			});

			return {
				ok: true,

				mode: 'packet',

				season,

				week,

				packet
			};
		} catch (error) {
			console.error('[weekly-recap] Build failed:', error);

			return fail(500, {
				ok: false,

				season,

				week,

				error: error instanceof Error ? error.message : 'Could not build weekly recap packet.'
			});
		}
	},

	generate: async ({ request, url, platform, locals }) => {
		const { season, week } = await readSelection(request);

		const error = validateSelection(season, week);

		if (error) {
			return fail(400, {
				ok: false,

				season,

				week,

				error
			});
		}

		const apiKey = platform?.env?.OPENAI_API_KEY;

		if (!String(apiKey || '').trim()) {
			return fail(500, {
				ok: false,

				season,

				week,

				error: 'OPENAI_API_KEY is missing. Add it to .dev.vars and restart the dev server.'
			});
		}

		try {
			/*
			 * Rebuild the packet instead
			 * of trusting anything sent
			 * from the browser.
			 */
			const packet = await buildWeeklyRecapPacket({
				url: buildPacketUrl({
					url,
					season,
					week
				}),

				env: platform?.env
			});

			const { recap, meta } = await generateWeeklyRecap({
				packet,

				apiKey
			});

			const db = platform?.env?.DB;

			if (!db) {
				return fail(500, {
					ok: false,

					season,

					week,

					error:
						'Cloudflare D1 binding is unavailable. The recap was generated but could not be saved.'
				});
			}

			const savedRecap = await saveWeeklyRecapDraft(db, {
				season,

				week,

				leagueId: packet.league.id,

				recap,

				packet,

				aiMeta: meta,

				generatedBy: locals.user?.id || null
			});
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

			return {
				ok: true,

				mode: 'recap',

				season,

				week,

				packet,

				recap,

				aiMeta: meta,

				savedRecap,

				message: 'AI recap generated and draft saved.'
			};
		} catch (error) {
			console.error('[weekly-recap] AI generation failed:', error);

			return fail(500, {
				ok: false,

				season,

				week,

				error: error instanceof Error ? error.message : 'Could not generate weekly recap.'
			});
		}
	},

	publish: async ({
  request,
  platform,
  locals
}) => {
  const {
    season,
    week
  } =
    await readSelection(
      request
    );

  const selectionError =
    validateSelection(
      season,
      week
    );

  if (selectionError) {
    return fail(
      400,
      {
        ok: false,
        season,
        week,
        error:
          selectionError
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
        season,
        week,
        error:
          'Cloudflare D1 binding is unavailable.'
      }
    );
  }

  try {
    const publishedBy =
      locals.user?.id ||
      null;

    const savedRecap =
      await publishWeeklyRecap(
        db,
        {
          season,
          week,
          publishedBy
        }
      );

    await upsertWeeklyRecapPost(
      db,
      {
        season,
        week,

        title:
          savedRecap.publishedTitle,

        subtitle:
          savedRecap.publishedSubtitle,

        publishedAt:
          savedRecap.publishedAt,

        publishedBy
      }
    );

    return {
      ok: true,
      mode: 'publish',
      season,
      week,
      savedRecap,

      message:
        `${season} Week ${week} recap published.`
    };
  } catch (error) {
    console.error(
      '[weekly-recap] Publish failed:',
      error
    );

    return fail(
      400,
      {
        ok: false,
        season,
        week,

        error:
          error instanceof Error
            ? error.message
            : 'Could not publish recap.'
      }
    );
  }
}};
