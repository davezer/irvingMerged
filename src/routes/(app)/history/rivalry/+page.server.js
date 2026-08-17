import {
	getManagers,
	getRivalries
} from '$lib/server/league';

import {
	resolveLeagueContext
} from '$lib/server/league/context.js';

import {
	getMergedHistoryArchive
} from '$lib/server/league/historyArchive.js';


function pairKey(left, right) {
	return [
		String(left),
		String(right)
	]
		.sort()
		.join('__');
}


function orientMeeting(
	game,
	leftManagerId,
	rightManagerId
) {
	const gameLeftId =
		String(
			game?.left?.managerId || ''
		);

	const gameRightId =
		String(
			game?.right?.managerId || ''
		);


	let left;
	let right;


	if (
		gameLeftId ===
		leftManagerId
	) {
		left = game.left;
		right = game.right;

	} else if (
		gameRightId ===
		leftManagerId
	) {
		left = game.right;
		right = game.left;

	} else {
		return null;
	}


	if (
		String(
			right?.managerId || ''
		) !== rightManagerId
	) {
		return null;
	}


	const leftScore =
		Number(
			left?.score || 0
		);

	const rightScore =
		Number(
			right?.score || 0
		);


	let winner =
		'Tie';


	if (
		leftScore >
		rightScore
	) {
		winner =
			left.teamName;

	} else if (
		rightScore >
		leftScore
	) {
		winner =
			right.teamName;
	}


	return {
		season:
			Number(game.season),

		week:
			Number(game.week),

		playoff:
			Boolean(game.playoff),

		leftScore,

		rightScore,

		margin:
			Number(
				Math.abs(
					leftScore -
					rightScore
				).toFixed(2)
			),

		winner
	};
}


export const load = async ({
	platform,
	url
}) => {
	const db =
		platform?.env?.DB;


	const managers =
		getManagers();

	const rivalryDefinitions =
		getRivalries();


	const context =
		await resolveLeagueContext({
			url,

			env:
				platform?.env,

			allWeeksByDefault:
				false
		});


	const archive =
		await getMergedHistoryArchive({
			db,

			env:
				platform?.env,

			rootLeagueId:
				context.rootLeagueId,

			currentSeason:
				context.currentSeason,

			currentWeek:
				context.currentWeek,

			managers,

			rivalries:
				rivalryDefinitions
		});


	const managerBySlug =
		new Map(
			managers.map(
				(manager) => [
					manager.slug,
					manager
				]
			)
		);


	const rivalryFiles =
		archive.rivalries.map(
			(rivalry) => {

				const leftManager =
					managerBySlug.get(
						rivalry.left.slug
					);

				const rightManager =
					managerBySlug.get(
						rivalry.right.slug
					);


				if (
					!leftManager ||
					!rightManager
				) {
					return {
						...rivalry,
						meetingHistory: []
					};
				}


				const leftManagerId =
					String(
						leftManager.managerID
					);

				const rightManagerId =
					String(
						rightManager.managerID
					);


				const wantedPair =
					pairKey(
						leftManagerId,
						rightManagerId
					);


				const meetingHistory =
					archive.games
						.filter(
							(game) =>
								game.pairKey ===
								wantedPair
						)
						.map(
							(game) =>
								orientMeeting(
									game,
									leftManagerId,
									rightManagerId
								)
						)
						.filter(Boolean)
						.sort(
							(a, b) =>
								b.season -
									a.season ||
								b.week -
									a.week
						);


				return {
					...rivalry,
					meetingHistory
				};
			}
		);


	const totalMeetings =
		rivalryFiles.reduce(
			(sum, rivalry) =>
				sum +
				Number(
					rivalry.meetings || 0
				),
			0
		);


	const playoffMeetings =
		rivalryFiles.reduce(
			(sum, rivalry) =>
				sum +
				Number(
					rivalry.playoffMeetings ||
					0
				),
			0
		);


	const mostPlayed =
		[...rivalryFiles]
			.sort(
				(a, b) =>
					Number(
						b.meetings || 0
					) -
					Number(
						a.meetings || 0
					)
			)[0] ||
		null;


	return {
		mergerStartYear:
			archive.mergerStartYear,

		rivalries:
			rivalryFiles,

		stats: {
			files:
				rivalryFiles.length,

			meetings:
				totalMeetings,

			playoffMeetings,

			mostPlayed:
				mostPlayed
					? `${mostPlayed.left.teamName} vs ${mostPlayed.right.teamName}`
					: '—'
		}
	};
};