import {
	error,
	redirect
} from '@sveltejs/kit';

import {
	getPublishedWeeklyRecapPost
} from '$lib/server/league/weeklyPostRepository.js';

import {
	getPublishedWeeklyRecap
} from '$lib/server/league/weeklyRecapRepository.js';


export async function load({
	params,
	platform
}) {
	const season =
		Number(
			params.season
		);

	const week =
		Number(
			params.week
		);

	if (
		!Number.isInteger(season) ||
		!Number.isInteger(week) ||
		week < 1 ||
		week > 18
	) {
		throw error(
			404,
			'Recap not found.'
		);
	}

	const db =
		platform?.env?.DB;

	if (!db) {
		throw error(
			500,
			'The Irving Weekly is unavailable.'
		);
	}

	const post =
		await getPublishedWeeklyRecapPost(
			db,
			{
				season,
				week
			}
		);

	if (post) {
		throw redirect(
			308,
			`/league/weekly/${post.slug}`
		);
	}

	/*
	 * Legacy fallback:
	 * if an old recap somehow exists
	 * without a publication post,
	 * allow the old renderer to work.
	 */
	const published =
		await getPublishedWeeklyRecap(
			db,
			{
				season,
				week
			}
		);

	if (!published) {
		throw error(
			404,
			'That Irving Weekly edition has not been published.'
		);
	}

	return {
		published
	};
}