import fs from 'node:fs/promises';
import path from 'node:path';

import {
	getPlayerCard
} from '../src/lib/server/league/playerCard.js';


const playerId =
	String(
		process.argv[2] || ''
	).trim();


if (!playerId) {
	console.error(
		'Usage: node scripts/build-player-card.mjs <playerId>'
	);

	process.exit(1);
}


/*
 * Seasons we want available in Player File.
 *
 * We can make this dynamic later.
 * For now this matches the modal you built.
 */
const seasons = [
	2026,
	2025,
	2024,
	2023
];


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


console.log(
	`Building Player File for Sleeper player ${playerId}...`
);


let profile = null;

let sources = null;

const seasonData = {};


for (const season of seasons) {

	console.log(
		`  → ${season}`
	);


	try {

		const card =
			await getPlayerCard({
				playerId,
				season,
				fetchFn: fetch
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

		console.warn(
			`  ⚠ ${season} failed:`,
			error?.message ||
				error
		);


		/*
		 * A missing season shouldn't prevent
		 * the rest of the player file from
		 * being generated.
		 */
		seasonData[
			String(season)
		] = {
			season,
			summary: null,
			games: [],
			dataMatch: null
		};

	}

}


if (!profile) {
	throw new Error(
		`Unable to build profile for Sleeper player ${playerId}`
	);
}


const payload = {
	generatedAt:
		new Date().toISOString(),

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


console.log('');
console.log(
	`✅ Player File generated:`
);
console.log(
	outputFile
);