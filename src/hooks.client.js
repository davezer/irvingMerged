/*
 * Irving Collective — live current-season player stats
 *
 * PlayerModal.svelte intentionally loads the pre-generated
 * /player-data/<playerId>.json files for fast modal rendering.
 *
 * Historical seasons are perfect for that because they never change.
 * The current season does change, so this client hook transparently
 * refreshes ONLY the current-season portion from the existing
 * /api/player-card/<playerId> endpoint.
 *
 * Nothing else in the app's fetch behavior is changed.
 */

const PATCH_FLAG =
	'__irvingLivePlayerStatsFetchInstalled__';


function getPlayerDataRequest(
	input,
	options
) {
	const method =
		input instanceof Request
			? input.method
			: options?.method ||
				'GET';


	if (
		String(method)
			.toUpperCase() !==
		'GET'
	) {
		return null;
	}


	const rawUrl =
		input instanceof Request
			? input.url
			: String(
					input ||
						''
				);


	let url;


	try {
		url =
			new URL(
				rawUrl,
				window.location.origin
			);
	} catch {
		return null;
	}


	if (
		url.origin !==
		window.location.origin
	) {
		return null;
	}


	const match =
		url.pathname.match(
			/^\/player-data\/([^/]+)\.json$/
		);


	if (!match) {
		return null;
	}


	let playerId;


	try {
		playerId =
			decodeURIComponent(
				match[1]
			);
	} catch {
		playerId =
			match[1];
	}


	playerId =
		String(
			playerId ||
				''
		).trim();


	return playerId
		? {
				playerId,
				url
			}
		: null;
}


function gameCount(
	season
) {
	const games =
		Array.isArray(
			season?.games
		)
			? season.games
			: [];


	const summaryGames =
		Number(
			season?.summary?.games
		);


	return Number.isFinite(
		summaryGames
	)
		? Math.max(
				summaryGames,
				games.length
			)
		: games.length;
}


function liveGameCount(
	live
) {
	const games =
		Array.isArray(
			live?.games
		)
			? live.games
			: [];


	const summaryGames =
		Number(
			live?.summary?.games
		);


	return Number.isFinite(
		summaryGames
	)
		? Math.max(
				summaryGames,
				games.length
			)
		: games.length;
}


function mergeCurrentSeason(
	staticPlayerFile,
	live,
	season
) {
	if (
		!staticPlayerFile ||
		typeof staticPlayerFile !==
			'object' ||
		!live ||
		typeof live !==
			'object'
	) {
		return staticPlayerFile;
	}


	const seasonKey =
		String(
			season
		);


	const existingSeason =
		staticPlayerFile?.seasons?.[
			seasonKey
		] ||
		{};


	/*
	 * Do not let a temporarily stale upstream response
	 * replace a better static snapshot.
	 *
	 * Equal game counts are allowed so stat corrections
	 * can still flow through.
	 */
	if (
		liveGameCount(
			live
		) <
		gameCount(
			existingSeason
		)
	) {
		return staticPlayerFile;
	}


	const liveGames =
		Array.isArray(
			live?.games
		)
			? live.games
			: [];


	const availableSeasons =
		[
			...new Set(
				[
					...(
						Array.isArray(
							staticPlayerFile
								?.availableSeasons
						)
							? staticPlayerFile
									.availableSeasons
							: []
					),

					...Object.keys(
						staticPlayerFile
							?.seasons ||
							{}
					),

					season
				]
					.map(
						Number
					)
					.filter(
						Number.isFinite
					)
			)
		].sort(
			(a, b) =>
				b - a
		);


	return {
		...staticPlayerFile,

		profile:
			live?.profile ||
			staticPlayerFile.profile,

		availableSeasons,

		seasons: {
			...(
				staticPlayerFile
					.seasons ||
				{}
			),

			[seasonKey]: {
				season,

				summary:
					live?.summary ||
					existingSeason?.summary ||
					null,

				games:
					liveGames,

				dataMatch:
					live?.dataMatch ||
					existingSeason?.dataMatch ||
					null
			}
		},

		sources: {
			...(
				staticPlayerFile
					.sources ||
				{}
			),

			...(
				live?.sources ||
				{}
			)
		}
	};
}


function jsonResponse(
	payload,
	originalResponse
) {
	const headers =
		new Headers(
			originalResponse.headers
		);


	headers.set(
		'content-type',
		'application/json; charset=utf-8'
	);

	headers.set(
		'cache-control',
		'no-store'
	);


	/*
	 * These describe the original static response body
	 * and are no longer valid after we replace that body.
	 */
	headers.delete(
		'content-length'
	);

	headers.delete(
		'content-encoding'
	);

	headers.delete(
		'etag'
	);


	return new Response(
		JSON.stringify(
			payload
		),
		{
			status:
				originalResponse.status,

			statusText:
				originalResponse.statusText,

			headers
		}
	);
}


export function init() {
	if (
		typeof window ===
			'undefined' ||
		window[
			PATCH_FLAG
		]
	) {
		return;
	}


	window[
		PATCH_FLAG
	] = true;


	const nativeFetch =
		window.fetch.bind(
			window
		);


	window.fetch =
		async function irvingFetch(
			input,
			options
		) {
			const playerRequest =
				getPlayerDataRequest(
					input,
					options
				);


			/*
			 * Every non-player-data request is untouched.
			 */
			if (!playerRequest) {
				return nativeFetch(
					input,
					options
				);
			}


			/*
			 * Load the normal static Player File first.
			 * This remains our fast and reliable fallback.
			 */
			const staticResponse =
				await nativeFetch(
					input,
					options
				);


			if (
				!staticResponse.ok
			) {
				return staticResponse;
			}


			try {
				const staticPlayerFile =
					await staticResponse
						.clone()
						.json();


				const currentSeason =
					new Date()
						.getFullYear();


				const liveResponse =
					await nativeFetch(
						`/api/player-card/${encodeURIComponent(
							playerRequest.playerId
						)}?season=${encodeURIComponent(
							currentSeason
						)}`,
						{
							cache:
								'no-store',

							headers: {
								accept:
									'application/json'
							}
						}
					);


				/*
				 * Live stats are an enhancement, never a
				 * requirement. If the endpoint is unavailable,
				 * the modal still receives its normal static file.
				 */
				if (
					!liveResponse.ok
				) {
					return staticResponse;
				}


				const live =
					await liveResponse.json();


				const merged =
					mergeCurrentSeason(
						staticPlayerFile,
						live,
						currentSeason
					);


				return jsonResponse(
					merged,
					staticResponse
				);

			} catch (error) {
				console.warn(
					'[player-data] Live current-season refresh failed:',
					error
				);


				return staticResponse;
			}
		};
}
