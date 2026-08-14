import {
	error
} from '@sveltejs/kit';

import {
	getPublishedWeeklyPostBySlug
} from '$lib/server/league/weeklyPostRepository.js';

import {
	getPublishedWeeklyRecap
} from '$lib/server/league/weeklyRecapRepository.js';


export async function load({
	params,
	platform
}) {
	const db =
		platform?.env?.DB;

	if (!db) {
		throw error(
			500,
			'The Irving Weekly is unavailable.'
		);
	}

	const post =
		await getPublishedWeeklyPostBySlug(
			db,
			params.slug
		);

	if (!post) {
		throw error(
			404,
			'That Irving Weekly article could not be found.'
		);
	}

	let publishedRecap =
		null;

	if (
		post.sourceType ===
		'weekly_recap'
	) {
		publishedRecap =
			await getPublishedWeeklyRecap(
				db,
				{
					season:
						post.recapSeason,

					week:
						post.recapWeek
				}
			);

		if (!publishedRecap) {
			throw error(
				404,
				'The published recap snapshot could not be found.'
			);
		}
	}

	return {
		post,
		publishedRecap
	};
}