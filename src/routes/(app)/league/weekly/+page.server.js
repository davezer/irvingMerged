import {
	error
} from '@sveltejs/kit';

import {
	listPublishedWeeklyPosts
} from '$lib/server/league/weeklyPostRepository.js';


export async function load({
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

	const posts =
		await listPublishedWeeklyPosts(
			db
		);

	return {
		posts
	};
}