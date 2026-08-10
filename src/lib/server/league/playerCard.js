const SLEEPER_PLAYERS_URL = 'https://api.sleeper.app/v1/players/nfl';

const NFLVERSE_PLAYERS_URL =
	'https://github.com/nflverse/nflverse-data/releases/download/players/players.csv';

const PLAYER_CACHE_MS = 24 * 60 * 60 * 1000;
const STATS_CACHE_MS = 30 * 60 * 1000;

let sleeperPlayersCache = null;
let sleeperPlayersCachedAt = 0;

let nflversePlayersCache = null;
let nflversePlayersCachedAt = 0;

const seasonStatsCache = new Map();

function numberValue(value, fallback = 0) {
	const number = Number(value);
	return Number.isFinite(number) ? number : fallback;
}

function nullableNumber(value) {
	if (value == null || value === '') return null;

	const number = Number(value);
	return Number.isFinite(number) ? number : null;
}

function normalizeText(value) {
	return String(value || '')
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-zA-Z0-9]/g, '')
		.toLowerCase();
}

function normalizeTeam(value) {
	return String(value || '')
		.trim()
		.toUpperCase();
}

function fullSleeperName(player) {
	return (
		player?.full_name ||
		`${player?.first_name || ''} ${player?.last_name || ''}`.trim() ||
		player?.search_full_name ||
		'Unknown Player'
	);
}

function sleeperHeadshot(playerId) {
	return `https://sleepercdn.com/content/nfl/players/thumb/${encodeURIComponent(
		playerId
	)}.jpg`;
}

function statsUrl(season) {
	return `https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_${season}.csv`;
}


/*
 * Tiny CSV parser so we don't need another npm dependency.
 */
function parseCsv(text) {
	const rows = [];

	let row = [];
	let field = '';
	let quoted = false;

	for (let index = 0; index < text.length; index += 1) {
		const char = text[index];

		if (quoted) {
			if (char === '"') {
				if (text[index + 1] === '"') {
					field += '"';
					index += 1;
				} else {
					quoted = false;
				}
			} else {
				field += char;
			}

			continue;
		}

		if (char === '"') {
			quoted = true;
		} else if (char === ',') {
			row.push(field);
			field = '';
		} else if (char === '\n') {
			row.push(field.replace(/\r$/, ''));
			rows.push(row);

			row = [];
			field = '';
		} else {
			field += char;
		}
	}

	if (field.length || row.length) {
		row.push(field.replace(/\r$/, ''));
		rows.push(row);
	}

	if (!rows.length) {
		return [];
	}

	const headers = rows
		.shift()
		.map((header, index) =>
			index === 0
				? header.replace(/^\uFEFF/, '')
				: header
		);

	return rows
		.filter((values) =>
			values.some((value) => value !== '')
		)
		.map((values) => {
			const record = {};

			for (
				let index = 0;
				index < headers.length;
				index += 1
			) {
				record[headers[index]] =
					values[index] ?? '';
			}

			return record;
		});
}


async function fetchText(fetchFn, url) {
	const response = await fetchFn(url, {
		headers: {
			accept: 'text/csv,text/plain,*/*'
		}
	});

	if (!response.ok) {
		throw new Error(
			`Upstream request failed (${response.status}) for ${url}`
		);
	}

	return response.text();
}


/*
 * Sleeper asks consumers not to constantly refetch its
 * giant NFL player map, so cache it in the worker process.
 */
async function getSleeperPlayers(fetchFn) {
	const now = Date.now();

	if (
		sleeperPlayersCache &&
		now - sleeperPlayersCachedAt < PLAYER_CACHE_MS
	) {
		return sleeperPlayersCache;
	}

	const response = await fetchFn(
		SLEEPER_PLAYERS_URL,
		{
			headers: {
				accept: 'application/json'
			}
		}
	);

	if (!response.ok) {
		throw new Error(
			`Sleeper players request failed (${response.status})`
		);
	}

	const payload = await response.json();

	sleeperPlayersCache =
		payload &&
		typeof payload === 'object'
			? payload
			: {};

	sleeperPlayersCachedAt = now;

	return sleeperPlayersCache;
}


async function getNflversePlayers(fetchFn) {
	const now = Date.now();

	if (
		nflversePlayersCache &&
		now - nflversePlayersCachedAt < PLAYER_CACHE_MS
	) {
		return nflversePlayersCache;
	}

	const text = await fetchText(
		fetchFn,
		NFLVERSE_PLAYERS_URL
	);

	nflversePlayersCache = parseCsv(text);
	nflversePlayersCachedAt = now;

	return nflversePlayersCache;
}


async function getSeasonStats(fetchFn, season) {
	const cached =
		seasonStatsCache.get(season);

	const now = Date.now();

	if (
		cached &&
		now - cached.cachedAt <
			STATS_CACHE_MS
	) {
		return cached.rows;
	}

	try {
		const text = await fetchText(
			fetchFn,
			statsUrl(season)
		);

		const rows = parseCsv(text);

		seasonStatsCache.set(season, {
			cachedAt: now,
			rows
		});

		return rows;
	} catch (error) {
		/*
		 * Before regular-season data exists,
		 * the current year's file may not exist yet.
		 *
		 * That's fine. The modal will simply say
		 * there are no games and let us switch
		 * to 2025.
		 */
		if (
			String(
				error?.message || ''
			).includes('(404)')
		) {
			seasonStatsCache.set(
				season,
				{
					cachedAt: now,
					rows: []
				}
			);

			return [];
		}

		throw error;
	}
}


/*
 * Connect Sleeper's player to nflverse.
 *
 * ESPN ID is our strongest bridge when available.
 * Name + position is the fallback.
 */
function findNflversePlayer(
	sleeperPlayer,
	nflversePlayers
) {
	const espnId = String(
		sleeperPlayer?.espn_id || ''
	).trim();

	if (espnId) {
		const byEspn =
			nflversePlayers.find(
				(row) =>
					String(
						row?.espn_id || ''
					).trim() === espnId
			);

		if (byEspn) {
			return {
				player: byEspn,
				method: 'espn_id'
			};
		}
	}

	const sleeperName =
		normalizeText(
			fullSleeperName(
				sleeperPlayer
			)
		);

	const sleeperPosition =
		String(
			sleeperPlayer?.position ||
				''
		).toUpperCase();

	const exactNamePosition =
		nflversePlayers.find(
			(row) => {
				const rowName =
					normalizeText(
						row?.display_name ||
							row?.player_display_name ||
							row?.full_name
					);

				const rowPosition =
					String(
						row?.position ||
							''
					).toUpperCase();

				return (
					rowName ===
						sleeperName &&
					(
						!sleeperPosition ||
						!rowPosition ||
						rowPosition ===
							sleeperPosition
					)
				);
			}
		);

	if (exactNamePosition) {
		return {
			player:
				exactNamePosition,
			method:
				'name_position'
		};
	}

	const exactName =
		nflversePlayers.find(
			(row) => {
				const rowName =
					normalizeText(
						row?.display_name ||
							row?.player_display_name ||
							row?.full_name
					);

				return (
					rowName ===
					sleeperName
				);
			}
		);

	if (exactName) {
		return {
			player: exactName,
			method: 'name'
		};
	}

	return {
		player: null,
		method: null
	};
}


function findPlayerStatRows({
	sleeperPlayer,
	nflversePlayer,
	allStats
}) {
	const gsisId = String(
		nflversePlayer?.gsis_id || ''
	).trim();

	if (gsisId) {
		const byGsis =
			allStats.filter(
				(row) =>
					String(
						row?.player_id ||
							''
					).trim() ===
					gsisId
			);

		if (byGsis.length) {
			return {
				rows: byGsis,
				method: 'gsis_id',
				gsisId
			};
		}
	}

	/*
	 * Fallback for a player where the
	 * cross-service ID mapping is missing.
	 */
	const sleeperName =
		normalizeText(
			fullSleeperName(
				sleeperPlayer
			)
		);

	const sleeperPosition =
		String(
			sleeperPlayer?.position ||
				''
		).toUpperCase();

	const sleeperTeam =
		normalizeTeam(
			sleeperPlayer?.team
		);

	let rows =
		allStats.filter(
			(row) => {
				const rowName =
					normalizeText(
						row?.player_display_name ||
							row?.player_name
					);

				const rowPosition =
					String(
						row?.position ||
							''
					).toUpperCase();

				return (
					rowName ===
						sleeperName &&
					(
						!sleeperPosition ||
						!rowPosition ||
						rowPosition ===
							sleeperPosition
					)
				);
			}
		);

	if (
		rows.length > 1 &&
		sleeperTeam
	) {
		const sameTeam =
			rows.filter(
				(row) =>
					normalizeTeam(
						row?.recent_team ||
							row?.team
					) ===
					sleeperTeam
			);

		if (sameTeam.length) {
			rows = sameTeam;
		}
	}

	return {
		rows,
		method:
			rows.length
				? 'name_position'
				: null,
		gsisId:
			gsisId || null
	};
}


/*
 * nflverse fantasy_points = standard scoring.
 *
 * Irving is Half-PPR, so:
 *
 * standard points + 0.5 × receptions
 */
function halfPprPoints(row) {
	return (
		numberValue(
			row?.fantasy_points
		) +
		numberValue(
			row?.receptions
		) *
			0.5
	);
}


function fumblesLost(row) {
	return (
		numberValue(
			row?.sack_fumbles_lost
		) +
		numberValue(
			row?.rushing_fumbles_lost
		) +
		numberValue(
			row?.receiving_fumbles_lost
		)
	);
}


function buildGameRow(row) {
	return {
		week:
			numberValue(
				row?.week
			),

		seasonType:
			String(
				row?.season_type ||
					'REG'
			),

		team:
			row?.recent_team ||
			row?.team ||
			null,

		opponent:
			row?.opponent_team ||
			null,

		fantasyPoints:
			Math.round(
				(
					halfPprPoints(
						row
					) +
					Number.EPSILON
				) *
					100
			) / 100,

		passing: {
			completions:
				numberValue(
					row?.completions
				),

			attempts:
				numberValue(
					row?.attempts
				),

			yards:
				numberValue(
					row?.passing_yards
				),

			tds:
				numberValue(
					row?.passing_tds
				),

			interceptions:
				numberValue(
					row?.interceptions
				)
		},

		rushing: {
			attempts:
				numberValue(
					row?.carries
				),

			yards:
				numberValue(
					row?.rushing_yards
				),

			tds:
				numberValue(
					row?.rushing_tds
				)
		},

		receiving: {
			targets:
				numberValue(
					row?.targets
				),

			receptions:
				numberValue(
					row?.receptions
				),

			yards:
				numberValue(
					row?.receiving_yards
				),

			tds:
				numberValue(
					row?.receiving_tds
				)
		},

		fumblesLost:
			fumblesLost(row)
	};
}


function sum(rows, getter) {
	return rows.reduce(
		(total, row) =>
			total +
			numberValue(
				getter(row)
			),
		0
	);
}


function buildSummary(games) {
	const gameCount =
		games.length;

	const fantasyPoints =
		sum(
			games,
			(game) =>
				game.fantasyPoints
		);

	return {
		games:
			gameCount,

		fantasyPoints:
			Math.round(
				(
					fantasyPoints +
					Number.EPSILON
				) *
					100
			) / 100,

		fantasyPointsPerGame:
			gameCount
				? Math.round(
						(
							fantasyPoints /
								gameCount +
							Number.EPSILON
						) *
							100
					) / 100
				: 0,

		passingYards:
			sum(
				games,
				(game) =>
					game.passing.yards
			),

		passingTds:
			sum(
				games,
				(game) =>
					game.passing.tds
			),

		interceptions:
			sum(
				games,
				(game) =>
					game.passing.interceptions
			),

		rushingYards:
			sum(
				games,
				(game) =>
					game.rushing.yards
			),

		rushingTds:
			sum(
				games,
				(game) =>
					game.rushing.tds
			),

		receptions:
			sum(
				games,
				(game) =>
					game.receiving.receptions
			),

		receivingYards:
			sum(
				games,
				(game) =>
					game.receiving.yards
			),

		receivingTds:
			sum(
				games,
				(game) =>
					game.receiving.tds
			),

		fumblesLost:
			sum(
				games,
				(game) =>
					game.fumblesLost
			)
	};
}


function profileFromSleeper(
	playerId,
	sleeperPlayer,
	nflversePlayer
) {
	return {
		id:
			String(playerId),

		name:
			fullSleeperName(
				sleeperPlayer
			),

		firstName:
			sleeperPlayer?.first_name ||
			null,

		lastName:
			sleeperPlayer?.last_name ||
			null,

		position:
			sleeperPlayer?.position ||
			nflversePlayer?.position ||
			'—',

		team:
			sleeperPlayer?.team ||
			nflversePlayer?.latest_team ||
			null,

		number:
			nullableNumber(
				sleeperPlayer?.number
			),

		age:
			nullableNumber(
				sleeperPlayer?.age
			),

		height:
			sleeperPlayer?.height ||
			nflversePlayer?.height ||
			null,

		weight:
			nullableNumber(
				sleeperPlayer?.weight ||
				nflversePlayer?.weight
			),

		yearsExp:
			nullableNumber(
				sleeperPlayer?.years_exp ||
				nflversePlayer?.years_of_experience
			),

		college:
			sleeperPlayer?.college ||
			nflversePlayer?.college_name ||
			nflversePlayer?.college ||
			null,

		status:
			sleeperPlayer?.status ||
			nflversePlayer?.status ||
			null,

		injuryStatus:
			sleeperPlayer?.injury_status ||
			null,

		practiceParticipation:
			sleeperPlayer?.practice_participation ||
			null,

		depthChartOrder:
			nullableNumber(
				sleeperPlayer?.depth_chart_order
			),

		fantasyPositions:
			Array.isArray(
				sleeperPlayer?.fantasy_positions
			)
				? sleeperPlayer.fantasy_positions
				: [],

		headshotUrl:
			nflversePlayer?.headshot ||
			nflversePlayer?.headshot_url ||
			sleeperHeadshot(
				playerId
			)
	};
}


export async function getPlayerCard({
	playerId,
	season,
	fetchFn = fetch
}) {
	const cleanPlayerId =
		String(
			playerId || ''
		).trim();

	const cleanSeason =
		Number(season);

	if (!cleanPlayerId) {
		throw new Error(
			'playerId is required'
		);
	}

	if (
		!Number.isInteger(
			cleanSeason
		) ||
		cleanSeason < 1999 ||
		cleanSeason > 2100
	) {
		throw new Error(
			'A valid NFL season is required'
		);
	}

	const [
		sleeperPlayers,
		nflversePlayers,
		allStats
	] = await Promise.all([
		getSleeperPlayers(
			fetchFn
		),

		getNflversePlayers(
			fetchFn
		),

		getSeasonStats(
			fetchFn,
			cleanSeason
		)
	]);

	const sleeperPlayer =
		sleeperPlayers?.[
			cleanPlayerId
		];

	if (!sleeperPlayer) {
		const error =
			new Error(
				`Sleeper player ${cleanPlayerId} was not found`
			);

		error.status = 404;

		throw error;
	}

	const crosswalk =
		findNflversePlayer(
			sleeperPlayer,
			nflversePlayers
		);

	const statMatch =
		findPlayerStatRows({
			sleeperPlayer,
			nflversePlayer:
				crosswalk.player,
			allStats
		});

	const games =
		statMatch.rows
			.filter(
				(row) =>
					String(
						row?.season_type ||
							'REG'
					).toUpperCase() ===
					'REG'
			)
			.map(buildGameRow)
			.sort(
				(a, b) =>
					a.week -
					b.week
			);

	const currentYear =
		new Date().getFullYear();

	return {
		profile:
			profileFromSleeper(
				cleanPlayerId,
				sleeperPlayer,
				crosswalk.player
			),

		season:
			cleanSeason,

		availableSeasons: [
			currentYear,
			currentYear - 1,
			currentYear - 2,
			currentYear - 3,
			cleanSeason
		]
			.filter(
				(value) =>
					value >= 1999
			)
			.filter(
				(
					value,
					index,
					array
				) =>
					array.indexOf(
						value
					) ===
					index
			)
			.sort(
				(a, b) =>
					b - a
			),

		summary:
			buildSummary(
				games
			),

		games,

		dataMatch: {
			playerCrosswalk:
				crosswalk.method,

			statMatch:
				statMatch.method,

			gsisId:
				statMatch.gsisId
		},

		sources: {
			profile:
				'Sleeper',

			stats:
				'nflverse / nflfastR weekly player stats',

			fantasyScoring:
				'Half-PPR'
		}
	};
}