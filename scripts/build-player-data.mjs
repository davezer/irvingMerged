import fs from 'node:fs/promises';
import path from 'node:path';

import {
	getPlayerCard
} from '../src/lib/server/league/playerCard.js';

import {
	leagueID as FALLBACK_LEAGUE_ID
} from '../src/lib/legacy/leagueInfo.js';


/*
 * =====================================================
 * CONFIG
 * =====================================================
 *
 * League ID can come from:
 *
 * 1. command line:
 *    node scripts/build-player-data.mjs 123456789
 *
 * OR
 *
 * 2. environment variable:
 *    SLEEPER_LEAGUE_ID=123456789
 *
 * Cloudflare will eventually use the env variable.
 */

const leagueId =
	String(
		process.argv[2] ||
		process.env.SLEEPER_LEAGUE_ID ||
		FALLBACK_LEAGUE_ID ||
		''
	).trim();


if (!leagueId) {
	console.error('');
	console.error(
		'❌ Missing Sleeper league ID.'
	);

	console.error('');
	console.error(
		'Run:'
	);

	console.error(
		'node scripts/build-player-data.mjs YOUR_LEAGUE_ID'
	);

	console.error('');
	console.error(
		'or set SLEEPER_LEAGUE_ID.'
	);

	process.exit(1);
}


/*
 * =====================================================
 * SEASONS
 * =====================================================
 */

const currentYear =
	new Date().getFullYear();


const seasons = [
	currentYear,
	currentYear - 1,
	currentYear - 2,
	currentYear - 3
];


/*
 * =====================================================
 * OUTPUT
 * =====================================================
 */

const outputDir =
	path.resolve(
		'static',
		'player-data'
	);


await fs.mkdir(
	outputDir,
	{
		recursive: true
	}
);


/*
 * =====================================================
 * HELPERS
 * =====================================================
 */

async function fetchJson(url) {

	const response =
		await fetch(
			url,
			{
				headers: {
					accept:
						'application/json'
				}
			}
		);


	if (!response.ok) {
		throw new Error(
			`Request failed ${response.status}: ${url}`
		);
	}


	return response.json();
}


async function getLeaguePlayerIds(
	leagueId
) {

	console.log(
		`📡 Loading ICL rosters from Sleeper...`
	);


	const rosters =
		await fetchJson(
			`https://api.sleeper.app/v1/league/${encodeURIComponent(
				leagueId
			)}/rosters`
		);


	const ids =
		new Set();


	for (
		const roster
		of rosters || []
	) {

		const rosterPlayerIds = [
			...(roster?.players || []),
			...(roster?.starters || []),
			...(roster?.reserve || []),
			...(roster?.taxi || [])
		];


		for (
			const rawId
			of rosterPlayerIds
		) {

			const id =
				String(
					rawId || ''
				).trim();


			/*
			 * Sleeper sometimes uses 0 /
			 * null-ish placeholders.
			 */
			if (
				!id ||
				id === '0'
			) {
				continue;
			}


			ids.add(id);
		}
	}


	return [
		...ids
	];
}


async function buildPlayerFile(
	playerId
) {

	let profile = null;

	let sources = null;

	const seasonData = {};


	for (
		const season
		of seasons
	) {

		try {

			const card =
				await getPlayerCard({
					playerId,
					season,
					fetchFn:
						fetch
				});


			if (!profile) {
				profile =
					card.profile;
			}


			if (!sources) {
				sources =
					card.sources;
			}


			seasonData[
				String(season)
			] = {
				season:
					card.season,

				summary:
					card.summary,

				games:
					card.games,

				dataMatch:
					card.dataMatch
			};

		} catch (error) {

			const message =
				String(
					error?.message ||
					error
				);


			/*
			 * Missing current-season nflverse
			 * data is totally fine.
			 */
			console.warn(
				`      ⚠ ${season}: ${message}`
			);


			seasonData[
				String(season)
			] = {
				season,

				summary:
					null,

				games:
					[],

				dataMatch:
					null
			};

		}

	}


if (!profile) {

		console.warn(
			`   ⚠ Skipping ${playerId}: no profile`
		);

		return null;
	}


	const payload = {

		generatedAt:
			new Date()
				.toISOString(),

		playerId,

		profile,

		availableSeasons:
			Object.keys(
				seasonData
			)
				.map(Number)
				.sort(
					(a, b) =>
						b - a
				),

		seasons:
			seasonData,

		sources:
			sources || {
				profile:
					'Sleeper',

				stats:
					'nflverse / nflfastR weekly player stats',

				fantasyScoring:
					'Half-PPR'
			}
	};


	const outputFile =
		path.join(
			outputDir,
			`${playerId}.json`
		);


	await fs.writeFile(
		outputFile,
		JSON.stringify(
			payload,
			null,
			2
		),
		'utf8'
	);


	return {
		playerId,

		name:
			profile.name,

		position:
			profile.position,

		team:
			profile.team
	};
}


/*
 * =====================================================
 * BUILD
 * =====================================================
 */

console.log('');
console.log(
	'======================================'
);

console.log(
	' ICL PLAYER FILE GENERATOR'
);

console.log(
	'======================================'
);

console.log('');

console.log(
	`League: ${leagueId}`
);

console.log(
	`Seasons: ${seasons.join(', ')}`
);

console.log('');


const playerIds =
	await getLeaguePlayerIds(
		leagueId
	);


console.log(
	`✅ Found ${playerIds.length} unique rostered players.`
);

console.log('');


const generated = [];

const failed = [];


for (
	let index = 0;
	index < playerIds.length;
	index += 1
) {

	const playerId =
		playerIds[index];


	console.log(
		`[${index + 1}/${playerIds.length}] Building ${playerId}...`
	);


	try {

		const result =
			await buildPlayerFile(
				playerId
			);


		if (result) {

			generated.push(
				result
			);


			console.log(
				`   ✅ ${result.name} · ${result.position} · ${result.team || 'FA'}`
			);

		} else {

			failed.push(
				playerId
			);

		}

	} catch (error) {

		console.error(
			`   ❌ ${playerId}:`,
			error?.message ||
				error
		);


		failed.push(
			playerId
		);

	}

}


/*
 * =====================================================
 * MANIFEST
 * =====================================================
 *
 * Handy for debugging and lets us see exactly
 * when the static Player File data was built.
 */

const manifest = {

	generatedAt:
		new Date()
			.toISOString(),

	leagueId,

	seasons,

	playerCount:
		generated.length,

	failedCount:
		failed.length,

	players:
		generated
			.sort(
				(a, b) =>
					a.name.localeCompare(
						b.name
					)
			),

	failed
};


await fs.writeFile(
	path.join(
		outputDir,
		'index.json'
	),

	JSON.stringify(
		manifest,
		null,
		2
	),

	'utf8'
);


/*
 * =====================================================
 * DONE
 * =====================================================
 */

console.log('');
console.log(
	'======================================'
);

console.log(
	' PLAYER FILE BUILD COMPLETE'
);

console.log(
	'======================================'
);

console.log('');

console.log(
	`Generated: ${generated.length}`
);

console.log(
	`Failed:    ${failed.length}`
);

console.log('');

console.log(
	`Output: ${outputDir}`
);

console.log('');


if (failed.length) {

	console.log(
		'Failed player IDs:'
	);

	console.log(
		failed.join(', ')
	);

	console.log('');

}