<script>
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';

	import {
		playerModal,
		closePlayerModal
	} from '$lib/stores/playerModal.js';


	let card = null;

	/*
	 * Raw static Player File containing
	 * every generated season.
	 */
	let staticPlayerFile = null;


	let loading = false;

	let error = '';

	let selectedSeason = null;

	let requestKey = '';

	let requestToken = 0;


	$: modal =
		$playerModal;


	$: currentIrvingRoster =
		card?.league?.currentRoster ||
		null;


	$: irvingHistory =
		card?.league?.history ||
		[];


	$: irvingLeagueAvailable =
		card?.league?.available !==
		false;


	$: modalKey =
		modal.open &&
		modal.playerId
			? `${modal.playerId}:${modal.season ?? ''}`
			: '';


	$: if (
		modalKey &&
		modalKey !== requestKey
	) {
		requestKey =
			modalKey;


		selectedSeason =
			Number(
				modal.season
			) ||
			new Date()
				.getFullYear();


		loadPlayer(
			modal.playerId,
			selectedSeason
		);
	}


	$: if (
		!modalKey &&
		requestKey
	) {
		requestKey = '';

		card = null;

		staticPlayerFile =
			null;

		error = '';

		loading =
			false;
	}


	$: if (browser) {
		document.body.style.overflow =
			modal.open
				? 'hidden'
				: '';
	}


	onDestroy(
		() => {
			if (browser) {
				document.body.style.overflow =
					'';
			}
		}
	);


	function unavailableLeague() {
		return {
			available:
				false,

			currentRoster: {
				rostered:
					false,

				teamName:
					null,

				managerName:
					null,

				rosterId:
					null,

				season:
					null
			},

			history: [],

			historySeasons: []
		};
	}


	function emptySummary() {
		return {
			games: 0,

			fantasyPoints: 0,

			fantasyPointsPerGame:
				0,

			passingYards: 0,

			passingTds: 0,

			interceptions: 0,

			rushingYards: 0,

			rushingTds: 0,

			receptions: 0,

			receivingYards: 0,

			receivingTds: 0,

			fumblesLost: 0
		};
	}


	function availableSeasons(
		payload
	) {
		const explicit =
			Array.isArray(
				payload?.availableSeasons
			)
				? payload.availableSeasons
				: [];


		const fromData =
			Object.keys(
				payload?.seasons ||
					{}
			)
				.map(Number)
				.filter(
					Number.isFinite
				);


		return [
			...new Set([
				...explicit.map(
					Number
				),

				...fromData
			])
		]
			.filter(
				Number.isFinite
			)
			.sort(
				(a, b) =>
					b - a
			);
	}


	function resolveSeason(
		payload,
		requestedSeason
	) {
		const seasons =
			availableSeasons(
				payload
			);


		const requested =
			Number(
				requestedSeason
			);


		if (
			Number.isFinite(
				requested
			) &&
			payload?.seasons?.[
				String(
					requested
				)
			]
		) {
			return requested;
		}


		return (
			seasons[0] ||
			requested ||
			new Date()
				.getFullYear()
		);
	}


	function buildSeasonCard(
		payload,
		season,
		league =
			unavailableLeague()
	) {
		const cleanSeason =
			resolveSeason(
				payload,
				season
			);


		const seasonData =
			payload?.seasons?.[
				String(
					cleanSeason
				)
			] ||
			{};


		return {
			profile:
				payload?.profile ||
				null,

			season:
				cleanSeason,

			availableSeasons:
				availableSeasons(
					payload
				),

			summary:
				seasonData?.summary ||
				emptySummary(),

			games:
				Array.isArray(
					seasonData?.games
				)
					? seasonData.games
					: [],

			dataMatch:
				seasonData?.dataMatch ||
				null,

			sources:
				payload?.sources ||
				{},

			generatedAt:
				payload?.generatedAt ||
				null,

			league:
				league ||
				unavailableLeague()
		};
	}


	async function loadPlayer(
		playerId,
		season
	) {
		const token =
			++requestToken;


		loading = true;

		error = '';

		card = null;

		staticPlayerFile =
			null;


		try {
			/*
			 * ==================================================
			 * STEP ONE
			 *
			 * Load the pre-generated NFL Player File.
			 *
			 * This is a STATIC asset.
			 * No SvelteKit server endpoint.
			 * No Worker.
			 * No giant CSV parsing.
			 * ==================================================
			 */

			const response =
				await fetch(
					`/player-data/${encodeURIComponent(
						playerId
					)}.json`
				);


			if (!response.ok) {
				if (
					response.status ===
					404
				) {
					throw new Error(
						'This player has not been added to the Player File snapshot yet.'
					);
				}


				throw new Error(
					`Unable to load Player File (${response.status}).`
				);
			}


			const payload =
				await response.json();


			if (
				token !==
				requestToken
			) {
				return;
			}


			staticPlayerFile =
				payload;


			selectedSeason =
				resolveSeason(
					payload,
					season
				);


			/*
			 * Render immediately.
			 *
			 * League history deliberately starts
			 * unavailable so we never accidentally
			 * label somebody as a free agent while
			 * the secondary feed is still loading.
			 */
			card =
				buildSeasonCard(
					payload,
					selectedSeason,
					unavailableLeague()
				);


			/*
			 * NFL data is DONE.
			 *
			 * Drop the full-screen loading state now.
			 * League history loads independently below.
			 */
			loading =
				false;


			/*
			 * ==================================================
			 * STEP TWO
			 *
			 * Load Irving ownership/history separately.
			 *
			 * Failure here NEVER kills the Player File.
			 * ==================================================
			 */

			loadLeagueHistory(
				playerId,
				token
			);

		} catch (loadError) {
			if (
				token !==
				requestToken
			) {
				return;
			}


			card = null;

			staticPlayerFile =
				null;


			error =
				loadError?.message ||
				'Unable to load player data.';


			loading =
				false;
		}
	}


	async function loadLeagueHistory(
		playerId,
		token
	) {
		try {
			const response =
				await fetch(
					`/api/player-history/${encodeURIComponent(
						playerId
					)}`
				);


			if (!response.ok) {
				throw new Error(
					`League history request failed (${response.status}).`
				);
			}


			const league =
				await response.json();


			if (
				token !==
					requestToken ||
				!staticPlayerFile
			) {
				return;
			}


			/*
			 * Preserve the currently selected NFL season
			 * while attaching the newly loaded ICL data.
			 */
			card =
				buildSeasonCard(
					staticPlayerFile,
					selectedSeason,
					league
				);

		} catch (leagueError) {
			/*
			 * This is intentionally non-fatal.
			 *
			 * Stats/game logs remain completely usable.
			 */
			console.error(
				'Player league history failed:',
				leagueError
			);


			if (
				token !==
					requestToken ||
				!staticPlayerFile
			) {
				return;
			}


			card =
				buildSeasonCard(
					staticPlayerFile,
					selectedSeason,
					unavailableLeague()
				);
		}
	}


	function changeSeason(
		season
	) {
		const nextSeason =
			Number(
				season
			);


		if (
			!staticPlayerFile ||
			!Number.isFinite(
				nextSeason
			) ||
			nextSeason ===
				selectedSeason
		) {
			return;
		}


		selectedSeason =
			nextSeason;


		/*
		 * This is now instant.
		 *
		 * No fetch.
		 * No Worker.
		 * No nflverse request.
		 */
		card =
			buildSeasonCard(
				staticPlayerFile,
				nextSeason,
				card?.league ||
					unavailableLeague()
			);
	}


	function handleKeydown(
		event
	) {
		if (
			modal.open &&
			event.key ===
				'Escape'
		) {
			closePlayerModal();
		}
	}


	function heightLabel(
		value
	) {
		if (!value) {
			return '—';
		}


		const text =
			String(
				value
			).trim();


		/*
		 * Already formatted like:
		 * 5'11"
		 */
		if (
			text.includes(
				"'"
			)
		) {
			return text;
		}


		const inches =
			Number(
				text
			);


		if (
			!Number.isFinite(
				inches
			)
		) {
			return text;
		}


		const feet =
			Math.floor(
				inches /
					12
			);


		const remaining =
			inches %
			12;


		return `${feet}'${remaining}"`;
	}


	function fmt(
		value,
		digits = 1
	) {
		const number =
			Number(
				value
			);


		return Number.isFinite(
			number
		)
			? number.toFixed(
					digits
				)
			: '—';
	}


	function whole(
		value
	) {
		const number =
			Number(
				value
			);


		return Number.isFinite(
			number
		)
			? number.toFixed(
					0
				)
			: '—';
	}


	function money(
		value
	) {
		if (
			value == null
		) {
			return '—';
		}


		const number =
			Number(
				value
			);


		return `$${number.toFixed(
			number % 1
				? 2
				: 0
		)}`;
	}


	function historyDate(
		value
	) {
		const timestamp =
			Number(
				value
			);


		if (
			!Number.isFinite(
				timestamp
			) ||
			!timestamp
		) {
			return '';
		}


		return new Date(
			timestamp
		)
			.toLocaleDateString(
				'en-US',
				{
					month:
						'short',

					day:
						'2-digit',

					year:
						'numeric'
				}
			)
			.replace(
				',',
				''
			);
	}


	function historyIcon(
		type
	) {
		if (
			type ===
			'trade'
		) {
			return '⇄';
		}


		if (
			type ===
			'draft'
		) {
			return '★';
		}


		if (
			type ===
			'keeper'
		) {
			return '◆';
		}


		if (
			type ===
			'waiver'
		) {
			return '$';
		}


		if (
			type ===
			'drop'
		) {
			return '−';
		}


		return '+';
	}


	function historyClass(
		type
	) {
		return String(
			type ||
				'other'
		)
			.replace(
				/_/g,
				'-'
			);
	}


	function statusText(
		profile
	) {
		return (
			[
				profile?.status,
				profile?.injuryStatus
			]
				.filter(
					Boolean
				)
				.join(
					' · '
				) ||
			'Active roster status'
		);
	}


	function playerSubline(
		profile
	) {
		const team =
			profile?.team ||
			'FA';


		const number =
			profile?.number !=
			null
				? ` #${profile.number}`
				: '';


		return `${profile?.position || '—'} · ${team}${number}`;
	}

	function capitalTeamName(
  event,
  managerId
) {
  const id =
    String(
      managerId ||
      ''
    );


  if (
    id &&
    String(
      event?.fromTeam?.ownerId ||
      ''
    ) ===
      id
  ) {
    return (
      event.fromTeam
        .teamName ||
      'Unknown franchise'
    );
  }


  if (
    id &&
    String(
      event?.toTeam?.ownerId ||
      ''
    ) ===
      id
  ) {
    return (
      event.toTeam
        .teamName ||
      'Unknown franchise'
    );
  }


  return 'Unknown franchise';
}


function capitalDirection(
  event,
  capital
) {
  if (!capital) {
    return '';
  }


  const from =
    capitalTeamName(
      event,
      capital.fromManagerId
    );


  const to =
    capitalTeamName(
      event,
      capital.toManagerId
    );


  return `${from} → ${to}`;
}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if modal.open}
	<div
		class="player-modal-backdrop"
		role="presentation"
		on:click={closePlayerModal}
	>
		<section
			class="player-modal"
			role="dialog"
			aria-modal="true"
			aria-label={card?.profile?.name
				? `${card.profile.name} player file`
				: 'Player file'}
			on:click|stopPropagation
		>
			<header class="modal-topbar">
				<div class="modal-brand">
					<span class="icl-mark">ICL</span>

					<div class="modal-title">
						<span>Player File</span>

						<strong>
							{card?.profile?.name || 'Loading player…'}
						</strong>
					</div>
				</div>

				<div class="modal-collective">
					Irving Collective
				</div>

				<button
					type="button"
					class="modal-close"
					aria-label="Close player file"
					on:click={closePlayerModal}
				>
					×
				</button>
			</header>

			{#if loading && !card}
				<div class="modal-state">
					<div class="state-kicker">
						Irving Player Database
					</div>

					<h2>Pulling The Game Tape</h2>

					<div class="loading-bar">
						<span></span>
					</div>

					<p>
						Loading player profile and weekly stats.
					</p>
				</div>

			{:else if error}
				<div class="modal-state error-state">
					<div class="state-kicker">
						Player File
					</div>

					<h2>Feed Unavailable</h2>

					<p>
						{error}
					</p>

					<button
						type="button"
						class="retry-button"
						on:click={() =>
							loadPlayer(
								modal.playerId,
								selectedSeason
							)}
					>
						Try Again
					</button>
				</div>

			{:else if card}
				<section class="player-hero">
					<div class="portrait-bay">
						<div
							class="portrait-watermark"
							aria-hidden="true"
						>
							{card.profile.position}
						</div>

						<img
							src={card.profile.headshotUrl}
							alt={card.profile.name}
						/>

						<div class="position-label">
							{card.profile.position}
						</div>
					</div>

					<div class="hero-main">
						<div class="eyebrow">
							Irving Player Database
						</div>

						<h1>
							{card.profile.name}
						</h1>

						<div class="player-subline">
							{playerSubline(card.profile)}
						</div>

						<div class="bio-grid">
							<div>
								<span>Age</span>

								<strong>
									{card.profile.age ?? '—'}
								</strong>
							</div>

							<div>
								<span>Height</span>

								<strong>
									{heightLabel(card.profile.height) || '—'}
								</strong>
							</div>

							<div>
								<span>Weight</span>

								<strong>
									{card.profile.weight
										? `${card.profile.weight} lbs`
										: '—'}
								</strong>
							</div>

							<div>
								<span>Exp</span>

								<strong>
									{card.profile.yearsExp ?? '—'}
								</strong>
							</div>

							<div class="college">
								<span>College</span>

								<strong>
									{card.profile.college || '—'}
								</strong>
							</div>
						</div>

						<div
							class="status-line"
							class:injured={Boolean(
								card.profile.injuryStatus
							)}
						>
							<span class="status-dot"></span>

							{statusText(card.profile)}
						</div>
					</div>

					<aside class="irving-context">
						<div class="context-kicker">
							Current Irving Roster
						</div>

						{#if !irvingLeagueAvailable}
							<strong class="context-team unavailable">
								Roster Status Unavailable
							</strong>

							<small>
								League feed could not be loaded.
							</small>

						{:else if currentIrvingRoster?.rostered}
							<strong class="context-team">
								{currentIrvingRoster.teamName}
							</strong>

							<small>
								{currentIrvingRoster.managerName ||
									'Unknown manager'}
							</small>

						{:else}
							<strong class="context-team free-agent-label">
								Free Agent
							</strong>

							<small>
								Not currently rostered
							</small>
						{/if}

						{#if modal.context?.keeperEligible === false}
							<div class="keeper-note ineligible">
								<span>Keeper Status</span>

								<strong>
									Not Keeper Eligible
								</strong>
							</div>

						{:else if modal.context?.keeperCost != null}
							<div class="keeper-note">
								<span>Keeper Cost</span>

								<strong>
									{money(modal.context.keeperCost)}
								</strong>
							</div>
						{/if}

						{#if modal.context?.note}
							<p class="context-note">
								{modal.context.note}
							</p>
						{/if}
					</aside>

					<div
						class="hero-watermark"
						aria-hidden="true"
					>
						PLAYER FILE
					</div>
				</section>

				<section class="season-desk">
					<div class="season-heading">
						<div class="eyebrow">
							Game Log
						</div>

						<h2>
							{selectedSeason} Season
						</h2>
					</div>

					<div
						class="season-pills"
						aria-label="Player stats season selector"
					>
						{#each card.availableSeasons as season}
							<button
								type="button"
								class:active={Number(season) ===
									Number(selectedSeason)}
								on:click={() =>
									changeSeason(season)}
							>
								{season}
							</button>
						{/each}
					</div>
				</section>

				<section class="summary-strip">
					<div>
						<span>Games</span>

						<strong>
							{card.summary.games}
						</strong>
					</div>

					<div>
						<span>Half-PPR</span>

						<strong>
							{fmt(
								card.summary.fantasyPoints,
								1
							)}
						</strong>
					</div>

					<div>
						<span>FPTS/G</span>

						<strong>
							{fmt(
								card.summary.fantasyPointsPerGame,
								1
							)}
						</strong>
					</div>

					{#if card.profile.position === 'QB'}
						<div>
							<span>Pass Yds</span>

							<strong>
								{whole(
									card.summary.passingYards
								)}
							</strong>
						</div>

						<div>
							<span>Pass TD</span>

							<strong>
								{whole(
									card.summary.passingTds
								)}
							</strong>
						</div>
					{:else}
						<div>
							<span>Scrim Yds</span>

							<strong>
								{whole(
									card.summary.rushingYards +
										card.summary.receivingYards
								)}
							</strong>
						</div>

						<div>
							<span>TD</span>

							<strong>
								{whole(
									card.summary.rushingTds +
										card.summary.receivingTds
								)}
							</strong>
						</div>
					{/if}
				</section>

				<section class="game-log-shell">
					{#if card.games.length}
						<div class="game-log-scroll">
							<table>
								<thead>
									<tr>
										<th>WK</th>
										<th>OPP</th>
										<th class="fpts">FPTS</th>
										<th>CMP</th>
										<th>ATT</th>
										<th>PYD</th>
										<th>PTD</th>
										<th>INT</th>
										<th>RUSH</th>
										<th>RYD</th>
										<th>RTD</th>
										<th>REC</th>
										<th>TGT</th>
										<th>RECYD</th>
										<th>RECTD</th>
										<th>FL</th>
									</tr>
								</thead>

								<tbody>
									{#each card.games as game}
										<tr>
											<td>
												{game.week}
											</td>

											<td class="opp">
												{game.opponent || '—'}
											</td>

											<td class="fpts">
												<strong>
													{fmt(
														game.fantasyPoints,
														1
													)}
												</strong>
											</td>

											<td>
												{game.passing.completions ||
													'—'}
											</td>

											<td>
												{game.passing.attempts ||
													'—'}
											</td>

											<td>
												{game.passing.yards ||
													'—'}
											</td>

											<td>
												{game.passing.tds ||
													'—'}
											</td>

											<td>
												{game.passing.interceptions ||
													'—'}
											</td>

											<td>
												{game.rushing.attempts ||
													'—'}
											</td>

											<td>
												{game.rushing.yards ||
													'—'}
											</td>

											<td>
												{game.rushing.tds ||
													'—'}
											</td>

											<td>
												{game.receiving.receptions ||
													'—'}
											</td>

											<td>
												{game.receiving.targets ||
													'—'}
											</td>

											<td>
												{game.receiving.yards ||
													'—'}
											</td>

											<td>
												{game.receiving.tds ||
													'—'}
											</td>

											<td>
												{game.fumblesLost ||
													'—'}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

					{:else}
						<div class="no-games">
							<div class="no-games-year">
								{selectedSeason}
							</div>

							<div>
								<strong>
									No Regular-Season Game Log
								</strong>

								<p>
									No weekly stats were found for
									{selectedSeason}. If the season
									hasn't started yet, choose a
									previous season above.
								</p>
							</div>
						</div>
					{/if}
				</section>

				<section class="irving-history">
					<header class="history-header">
						<div>
							<div class="eyebrow">
								Irving Transaction History
							</div>

							<h2>
								Franchise Trail
							</h2>
						</div>

						<div class="history-count">
							<strong>
								{irvingHistory.length}
							</strong>

							<span>
								event{irvingHistory.length === 1
									? ''
									: 's'}
							</span>
						</div>
					</header>

					{#if !irvingLeagueAvailable}
						<div class="history-empty">
							<strong>
								League History Unavailable
							</strong>

							<span>
								The Irving transaction feed
								could not be loaded.
							</span>
						</div>

					{:else if irvingHistory.length}
						<div class="history-list">
							{#each irvingHistory as event (event.id)}
								<article class="history-row">
									<div
										class={`history-icon ${historyClass(
											event.type
										)}`}
										aria-hidden="true"
									>
										{historyIcon(event.type)}
									</div>

									<div class="history-event">
										<div class="history-event-top">
											<strong>
												{event.label}
											</strong>

											<span>
												{historyDate(
													event.timestamp
												)}
											</span>
										</div>

										<div class="history-copy">
											{#if event.type === 'trade'}
												<span>
													to
													<b>
														{event.toTeam
															?.teamName ||
															'Unknown franchise'}
													</b>

													{#if event.fromTeam?.teamName}
														from
														<b>
															{event.fromTeam
																.teamName}
														</b>
													{/if}
												</span>

												{#if event.toTeam?.managerName ||
													event.fromTeam?.managerName}
													<small>
														{#if event.toTeam?.managerName}
															{event.toTeam
																.managerName}
														{/if}

														{#if event.toTeam?.managerName &&
															event.fromTeam?.managerName}
															←
														{/if}

														{#if event.fromTeam?.managerName}
															{event.fromTeam
																.managerName}
														{/if}
													</small>
												{/if}

											{:else if event.type === 'draft'}
												<span>
													by
													<b>
														{event.team?.teamName ||
															'Unknown franchise'}
													</b>

													{#if event.amount != null}
														for
														<b>
															{money(
																event.amount
															)}
														</b>
													{/if}
												</span>

												{#if event.team?.managerName}
													<small>
														{event.team
															.managerName}
													</small>
												{/if}

											{:else if event.type === 'keeper'}
												<span>
													kept by
													<b>
														{event.team?.teamName ||
															'Unknown franchise'}
													</b>

													{#if event.amount != null}
														for
														<b>
															{money(
																event.amount
															)}
														</b>
													{/if}
												</span>

												{#if event.team?.managerName}
													<small>
														{event.team
															.managerName}
													</small>
												{/if}

											{:else if event.type === 'waiver'}
												<span>
													claimed by
													<b>
														{event.team?.teamName ||
															'Unknown franchise'}
													</b>

													{#if event.amount != null}
														for
														<b>
															{money(
																event.amount
															)}
															FAAB
														</b>
													{/if}
												</span>

												{#if event.week}
													<small>
														Week {event.week}

														{#if event.team?.managerName}
															·
															{event.team
																.managerName}
														{/if}
													</small>
												{/if}

											{:else if event.type === 'drop'}
												<span>
													by
													<b>
														{event.team?.teamName ||
															'Unknown franchise'}
													</b>
												</span>

												<small>
													{#if event.week}
														Week {event.week}
													{/if}

													{#if event.week &&
														event.team?.managerName}
														·
													{/if}

													{#if event.team?.managerName}
														{event.team
															.managerName}
													{/if}
												</small>

											{:else}
												<span>
													from Free Agency by
													<b>
														{event.team?.teamName ||
															'Unknown franchise'}
													</b>
												</span>

												<small>
													{#if event.week}
														Week {event.week}
													{/if}

													{#if event.week &&
														event.team?.managerName}
														·
													{/if}

													{#if event.team?.managerName}
														{event.team
															.managerName}
													{/if}
												</small>
											{/if}
										</div>

										{#if
											event.type === 'trade' &&
											event.draftCapital?.length
										}
											<div class="history-capital">
												{#each event.draftCapital as capital}
													<span
														class="history-capital-chip"
													>
														<b>
															{money(
																capital.amount
															)}
														</b>

														<em>
															{capital.futuresYear}
															draft capital
														</em>

														<small>
															{capitalDirection(
																event,
																capital
															)}
														</small>
													</span>
												{/each}
											</div>
										{/if}

										{#if event.assets?.length}
											<div class="history-assets">
												{#each event.assets as asset}
													<span
														class:incoming={asset.direction ===
															'in'}
														class:outgoing={asset.direction ===
															'out'}
													>
														<b>
															{asset.direction ===
															'in'
																? '+'
																: '−'}
														</b>

														{#if asset.kind === 'player'}
															{asset.shortName}
														{:else}
															{asset.label}
														{/if}
													</span>
												{/each}
											</div>
										{/if}
									</div>
								</article>
							{/each}
						</div>

					{:else}
						<div class="history-empty">
							<strong>
								No Irving Transactions Found
							</strong>

							<span>
								This player has no draft,
								trade, waiver, free-agent,
								keeper, or drop history in
								the available league archive.
							</span>
						</div>
					{/if}
				</section>

				<footer class="modal-footer">
					<span>
						Profile
						<strong>Sleeper</strong>
					</span>

					<span>
						Stats
						<strong>nflverse / nflfastR</strong>
					</span>

					<span>
						Scoring
						<strong>Half-PPR</strong>
					</span>
				</footer>
			{/if}
		</section>
	</div>
{/if}

<style>
	.player-modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 1000;

		display: grid;
		place-items: center;

		padding: 22px;

		background:
			rgba(3, 6, 6, 0.82);

		backdrop-filter:
			blur(9px);
	}


	/* ==================================================
	   MODAL SHELL
	   ================================================== */

	.player-modal {
		width:
			min(
				1240px,
				96vw
			);

		max-height:
			min(
				900px,
				94vh
			);

		overflow: auto;

		border:
			1px solid
			rgba(
				191,
				161,
				106,
				0.42
			);

		border-radius: 14px;

		background:
			#0b0f0e;

		box-shadow:
			0 28px 80px
				rgba(
					0,
					0,
					0,
					0.68
				);

		scrollbar-color:
			rgba(
				191,
				161,
				106,
				0.45
			)
			transparent;
	}


	.player-modal::-webkit-scrollbar {
		width: 9px;
	}


	.player-modal::-webkit-scrollbar-track {
		background: transparent;
	}


	.player-modal::-webkit-scrollbar-thumb {
		border-radius: 99px;

		background:
			rgba(
				191,
				161,
				106,
				0.35
			);
	}


	/* ==================================================
	   TOP BAR
	   ================================================== */

	.modal-topbar {
		position: sticky;
		top: 0;
		z-index: 10;

		min-height: 52px;

		display: grid;

		grid-template-columns:
			minmax(0, 1fr)
			auto
			52px;

		align-items: stretch;

		border-bottom:
			1px solid
			rgba(
				191,
				161,
				106,
				0.25
			);

		background:
			rgba(
				7,
				10,
				9,
				0.97
			);

		backdrop-filter:
			blur(10px);
	}


	.modal-brand {
		min-width: 0;

		display: flex;
		align-items: center;

		gap: 13px;

		padding-left: 13px;
	}


	.icl-mark {
		width: 36px;
		height: 36px;

		display: grid;
		place-items: center;

		flex: 0 0 auto;

		border:
			1px solid
			var(
				--brand-gold,
				#bfa16a
			);

		color:
			var(
				--brand-gold,
				#bfa16a
			);

		font-family:
			var(
				--font-display
			);

		font-size: 1.05rem;

		line-height: 1;
	}


	.modal-title {
		min-width: 0;

		display: flex;
		align-items: baseline;

		gap: 10px;
	}


	.modal-title span,
	.modal-collective,
	.state-kicker,
	.eyebrow,
	.context-kicker,
	.keeper-note span,
	.bio-grid span,
	.summary-strip span {
		font-size: 0.62rem;
		font-weight: 850;

		letter-spacing: 0.11em;

		text-transform: uppercase;
	}


	.modal-title span {
		color:
			var(
				--brand-gold,
				#bfa16a
			);
	}


	.modal-title strong {
		min-width: 0;

		overflow: hidden;

		color:
			var(
				--brand-ivory,
				#f1ede3
			);

		font-size: 0.84rem;

		text-overflow: ellipsis;
		white-space: nowrap;
	}


	.modal-collective {
		display: flex;
		align-items: center;

		padding: 0 17px;

		color:
			rgba(
				241,
				237,
				227,
				0.45
			);

		white-space: nowrap;
	}


	.modal-close {
		border: 0;

		border-left:
			1px solid
			rgba(
				191,
				161,
				106,
				0.22
			);

		background: transparent;

		color:
			var(
				--brand-ivory,
				#f1ede3
			);

		font-size: 1.75rem;

		cursor: pointer;

		transition:
			background 0.13s ease,
			color 0.13s ease;
	}


	.modal-close:hover {
		background:
			rgba(
				191,
				161,
				106,
				0.12
			);

		color:
			var(
				--brand-gold,
				#bfa16a
			);
	}


	/* ==================================================
	   LOADING / ERROR
	   ================================================== */

	.modal-state {
		min-height: 520px;

		display: grid;
		place-items: center;
		align-content: center;

		gap: 12px;

		padding: 40px;

		text-align: center;
	}


	.state-kicker,
	.eyebrow,
	.context-kicker {
		color:
			var(
				--brand-gold,
				#bfa16a
			);
	}


	.modal-state h2 {
		margin: 0;

		color:
			var(
				--brand-ivory,
				#f1ede3
			);

		font-family:
			var(
				--font-display
			);

		font-size:
			clamp(
				2.8rem,
				6vw,
				4.5rem
			);

		font-weight: 400;

		line-height: 0.9;

		text-transform: uppercase;
	}


	.modal-state p {
		max-width: 500px;

		margin: 0;

		color:
			rgba(
				241,
				237,
				227,
				0.58
			);

		line-height: 1.55;
	}


	.loading-bar {
		width:
			min(
				340px,
				70vw
			);

		height: 3px;

		overflow: hidden;

		margin: 5px 0;

		background:
			rgba(
				191,
				161,
				106,
				0.13
			);
	}


	.loading-bar span {
		display: block;

		width: 38%;
		height: 100%;

		background:
			var(
				--brand-gold,
				#bfa16a
			);

		animation:
			load-slide
			0.9s
			ease-in-out
			infinite
			alternate;
	}


	@keyframes load-slide {
		from {
			transform:
				translateX(-25%);
		}

		to {
			transform:
				translateX(190%);
		}
	}


	.retry-button {
		min-height: 38px;

		margin-top: 8px;
		padding: 0 15px;

		border:
			1px solid
			var(
				--brand-gold,
				#bfa16a
			);

		background:
			var(
				--brand-gold,
				#bfa16a
			);

		color: #101211;

		font: inherit;

		font-size: 0.68rem;
		font-weight: 850;

		text-transform: uppercase;

		cursor: pointer;
	}


	/* ==================================================
	   PLAYER HERO
	   ================================================== */

	.player-hero {
		position: relative;

		min-height: 290px;

		display: grid;

		grid-template-columns:
			260px
			minmax(0, 1fr)
			250px;

		overflow: hidden;

		border-bottom:
			1px solid
			rgba(
				191,
				161,
				106,
				0.22
			);

		background:
			linear-gradient(
				105deg,
				rgba(
					191,
					161,
					106,
					0.045
				),
				transparent
				46%
			),
			#111614;
	}


	.hero-watermark {
		position: absolute;

		right: -18px;
		bottom: -36px;

		color:
			rgba(
				191,
				161,
				106,
				0.018
			);

		font-family:
			var(
				--font-display
			);

		font-size:
			clamp(
				7rem,
				14vw,
				12rem
			);

		line-height: 0.8;

		pointer-events: none;
	}


	/* ==================================================
	   PORTRAIT
	   ================================================== */

	.portrait-bay {
		position: relative;

		min-height: 290px;

		overflow: hidden;

		border-right:
			1px solid
			rgba(
				191,
				161,
				106,
				0.16
			);

		background:
			radial-gradient(
				circle at 50% 47%,
				rgba(
					241,
					237,
					227,
					0.1
				),
				transparent 55%
			),
			#141918;
	}


	.portrait-bay img {
		position: absolute;

		left: 50%;
		bottom: -8px;

		width: 270px;
		height: 315px;

		max-width: none;

		object-fit: contain;
		object-position: center bottom;

		transform:
			translateX(-50%)
			scale(1.16);

		transform-origin:
			center bottom;

		filter:
			drop-shadow(
				0 18px 20px
				rgba(
					0,
					0,
					0,
					0.46
				)
			);
	}


	.portrait-watermark {
		position: absolute;

		left: 14px;
		top: 11px;

		color:
			rgba(
				191,
				161,
				106,
				0.07
			);

		font-family:
			var(
				--font-display
			);

		font-size: 7.5rem;

		line-height: 1;
	}


	.position-label {
		position: absolute;

		left: 17px;
		bottom: 15px;

		z-index: 2;

		padding:
			5px 8px;

		border:
			1px solid
			var(
				--brand-gold,
				#bfa16a
			);

		background:
			rgba(
				6,
				9,
				8,
				0.86
			);

		color:
			var(
				--brand-sand,
				#dbc392
			);

		font-size: 0.66rem;
		font-weight: 900;

		letter-spacing: 0.08em;

		text-transform: uppercase;
	}


	/* ==================================================
	   PLAYER INFO
	   ================================================== */

	.hero-main {
		position: relative;
		z-index: 2;

		align-self: center;

		min-width: 0;

		padding:
			28px 32px;
	}


	.hero-main h1 {
		max-width: 650px;

		margin: 6px 0 0;

		color:
			var(
				--brand-ivory,
				#f1ede3
			);

		font-family:
			var(
				--font-display
			);

		font-size:
			clamp(
				3.8rem,
				6vw,
				6rem
			);

		font-weight: 400;

		line-height: 0.84;

		letter-spacing: -0.025em;

		text-transform: uppercase;

		text-wrap: balance;
	}


	.player-subline {
		margin-top: 11px;

		color:
			var(
				--brand-sand,
				#dbc392
			);

		font-size: 0.9rem;
		font-weight: 800;
	}


	.bio-grid {
		display: grid;

		grid-template-columns:
			repeat(
				5,
				minmax(
					0,
					auto
				)
			);

		width: fit-content;

		margin-top: 26px;
	}


	.bio-grid > div {
		min-width: 90px;

		padding:
			0 16px;

		border-left:
			1px solid
			rgba(
				191,
				161,
				106,
				0.2
			);
	}


	.bio-grid > div:first-child {
		padding-left: 0;

		border-left: 0;
	}


	.bio-grid span {
		display: block;

		color:
			rgba(
				191,
				161,
				106,
				0.76
			);
	}


	.bio-grid strong {
		display: block;

		margin-top: 5px;

		color:
			var(
				--brand-ivory,
				#f1ede3
			);

		font-size: 1rem;

		white-space: nowrap;
	}


	.bio-grid .college {
		min-width: 140px;
	}


	.status-line {
		display: flex;
		align-items: center;

		gap: 7px;

		margin-top: 21px;

		color:
			rgba(
				241,
				237,
				227,
				0.58
			);

		font-size: 0.74rem;
	}


	.status-dot {
		width: 7px;
		height: 7px;

		border-radius: 50%;

		background:
			#7ea889;

		box-shadow:
			0 0 8px
				rgba(
					126,
					168,
					137,
					0.42
				);
	}


	.status-line.injured
	.status-dot {
		background:
			#bf776d;

		box-shadow:
			0 0 8px
				rgba(
					191,
					119,
					109,
					0.35
				);
	}


	/* ==================================================
	   IRVING CONTEXT
	   ================================================== */

	.irving-context {
		position: relative;
		z-index: 2;

		align-self: stretch;

		display: grid;
		align-content: center;

		gap: 5px;

		padding:
			24px 22px;

		border-left:
			1px solid
			rgba(
				191,
				161,
				106,
				0.2
			);

		background:
			rgba(
				5,
				8,
				7,
				0.34
			);
	}


	.context-team {
		margin-top: 5px;

		color:
			var(
				--brand-ivory,
				#f1ede3
			);

		font-size: 1.05rem;

		line-height: 1.2;
	}


	.context-team.unavailable {
		font-size: 0.82rem;

		text-transform: uppercase;
	}


	.irving-context > small {
		color:
			rgba(
				241,
				237,
				227,
				0.5
			);

		font-size: 0.7rem;
	}


	.free-agent-label {
		color:
			rgba(
				241,
				237,
				227,
				0.65
			);
	}


	.keeper-note {
		display: grid;

		gap: 3px;

		margin-top: 18px;
		padding-top: 13px;

		border-top:
			1px solid
			rgba(
				191,
				161,
				106,
				0.16
			);
	}


	.keeper-note span {
		color:
			rgba(
				191,
				161,
				106,
				0.7
			);
	}


	.keeper-note strong {
		color:
			var(
				--brand-sand,
				#dbc392
			);

		font-size: 0.88rem;
	}


	.keeper-note.ineligible strong {
		color:
			#c48077;
	}


	.context-note {
		margin: 10px 0 0;

		color:
			rgba(
				241,
				237,
				227,
				0.48
			);

		font-size: 0.67rem;

		font-style: italic;

		line-height: 1.45;
	}


	/* ==================================================
	   SEASON DESK
	   ================================================== */

	.season-desk {
		display: flex;

		justify-content: space-between;
		align-items: end;

		gap: 20px;

		padding:
			18px 24px
			13px;

		border-bottom:
			1px solid
			rgba(
				191,
				161,
				106,
				0.2
			);

		background:
			#090d0c;
	}


	.season-heading h2 {
		margin: 4px 0 0;

		color:
			var(
				--brand-ivory,
				#f1ede3
			);

		font-family:
			var(
				--font-display
			);

		font-size: 1.65rem;

		font-weight: 400;

		line-height: 1;

		text-transform: uppercase;
	}


	.season-pills {
		display: flex;

		flex-wrap: wrap;

		gap: 5px;
	}


	.season-pills button {
		min-width: 55px;
		min-height: 32px;

		padding:
			0 10px;

		border:
			1px solid
			rgba(
				191,
				161,
				106,
				0.25
			);

		background:
			transparent;

		color:
			rgba(
				241,
				237,
				227,
				0.55
			);

		font: inherit;

		font-size: 0.67rem;
		font-weight: 850;

		cursor: pointer;

		transition:
			color 0.12s ease,
			border-color 0.12s ease,
			background 0.12s ease;
	}


	.season-pills button:hover {
		border-color:
			rgba(
				191,
				161,
				106,
				0.7
			);

		color:
			var(
				--brand-ivory,
				#f1ede3
			);
	}


	.season-pills button.active {
		border-color:
			var(
				--brand-gold,
				#bfa16a
			);

		background:
			var(
				--brand-gold,
				#bfa16a
			);

		color:
			#101211;
	}


	/* ==================================================
	   SUMMARY STRIP
	   ================================================== */

	.summary-strip {
		display: grid;

		grid-template-columns:
			repeat(
				5,
				minmax(
					0,
					1fr
				)
			);

		border-bottom:
			1px solid
			rgba(
				191,
				161,
				106,
				0.2
			);

		background:
			#101513;
	}


	.summary-strip > div {
		min-height: 68px;

		display: grid;
		align-content: center;

		gap: 4px;

		padding:
			10px 18px;

		border-right:
			1px solid
			rgba(
				191,
				161,
				106,
				0.14
			);
	}


	.summary-strip > div:last-child {
		border-right: 0;
	}


	.summary-strip span {
		color:
			rgba(
				191,
				161,
				106,
				0.7
			);
	}


	.summary-strip strong {
		color:
			var(
				--brand-ivory,
				#f1ede3
			);

		font-family:
			var(
				--font-display
			);

		font-size: 1.7rem;

		font-weight: 400;

		line-height: 1;
	}


	/* ==================================================
	   GAME LOG
	   ================================================== */

	.game-log-shell {
		position: relative;

		min-height: 240px;

		background:
			#0d1210;
	}


	.game-log-scroll {
		overflow-x: auto;
	}


	table {
		width: 100%;

		min-width: 1050px;

		border-collapse: collapse;

		font-size: 0.74rem;
	}


	th,
	td {
		padding:
			10px 8px;

		border-right:
			1px solid
			rgba(
				191,
				161,
				106,
				0.08
			);

		border-bottom:
			1px solid
			rgba(
				191,
				161,
				106,
				0.1
			);

		text-align: center;
	}


	th:last-child,
	td:last-child {
		border-right: 0;
	}


	th {
		background:
			#090d0c;

		color:
			rgba(
				191,
				161,
				106,
				0.78
			);

		font-size: 0.57rem;
		font-weight: 850;

		letter-spacing: 0.07em;

		text-transform: uppercase;
	}


	td {
		color:
			rgba(
				241,
				237,
				227,
				0.73
			);
	}


	tbody tr:nth-child(even) {
		background:
			rgba(
				241,
				237,
				227,
				0.018
			);
	}


	tbody tr:hover {
		background:
			rgba(
				191,
				161,
				106,
				0.055
			);
	}


	th.fpts,
	td.fpts {
		border-left:
			1px solid
			rgba(
				191,
				161,
				106,
				0.25
			);

		border-right:
			1px solid
			rgba(
				191,
				161,
				106,
				0.25
			);

		background:
			rgba(
				191,
				161,
				106,
				0.045
			);
	}


	td.fpts strong {
		color:
			var(
				--brand-sand,
				#dbc392
			);
	}


	td.opp {
		color:
			var(
				--brand-ivory,
				#f1ede3
			);

		font-weight: 850;
	}


	.no-games {
		min-height: 240px;

		display: grid;

		grid-template-columns:
			auto
			minmax(
				0,
				520px
			);

		place-content: center;

		align-items: center;

		gap: 25px;

		padding: 35px;
	}


	.no-games-year {
		color:
			rgba(
				191,
				161,
				106,
				0.18
			);

		font-family:
			var(
				--font-display
			);

		font-size: 4.5rem;

		line-height: 1;
	}


	.no-games > div:last-child {
		display: grid;

		gap: 5px;
	}


	.no-games strong {
		color:
			var(
				--brand-ivory,
				#f1ede3
			);

		font-size: 0.95rem;
	}


	.no-games p {
		margin: 0;

		color:
			rgba(
				241,
				237,
				227,
				0.52
			);

		font-size: 0.75rem;

		line-height: 1.5;
	}


	/* ==================================================
	   FRANCHISE TRAIL
	   ================================================== */

	.irving-history {
		border-top:
			1px solid
			rgba(
				191,
				161,
				106,
				0.26
			);

		background:
			#0a0e0d;
	}


	.history-header {
		display: flex;

		justify-content: space-between;
		align-items: end;

		gap: 20px;

		padding:
			22px 24px
			15px;

		border-bottom:
			1px solid
			rgba(
				191,
				161,
				106,
				0.16
			);
	}


	.history-header h2 {
		margin: 4px 0 0;

		color:
			var(
				--brand-ivory,
				#f1ede3
			);

		font-family:
			var(
				--font-display
			);

		font-size: 2.2rem;

		font-weight: 400;

		line-height: 0.95;

		text-transform: uppercase;
	}


	.history-count {
		display: flex;

		align-items: baseline;

		gap: 5px;

		color:
			rgba(
				241,
				237,
				227,
				0.45
			);

		text-transform: uppercase;
	}


	.history-count strong {
		color:
			var(
				--brand-sand,
				#dbc392
			);

		font-family:
			var(
				--font-display
			);

		font-size: 1.8rem;

		font-weight: 400;
	}


	.history-count span {
		font-size: 0.57rem;
		font-weight: 850;

		letter-spacing: 0.07em;
	}


	.history-list {
		display: grid;
	}


	.history-row {
		display: grid;

		grid-template-columns:
			54px
			minmax(
				0,
				1fr
			);

		min-height: 74px;

		border-bottom:
			1px solid
			rgba(
				191,
				161,
				106,
				0.11
			);
	}


	.history-row:last-child {
		border-bottom: 0;
	}


	.history-icon {
		display: grid;
		place-items: center;

		border-right:
			1px solid
			rgba(
				191,
				161,
				106,
				0.12
			);

		color:
			rgba(
				241,
				237,
				227,
				0.55
			);

		font-family:
			var(
				--font-display
			);

		font-size: 1.35rem;
	}


	.history-icon.trade {
		color:
			#9ab3bd;
	}


	.history-icon.draft {
		color:
			var(
				--brand-gold,
				#bfa16a
			);
	}


	.history-icon.keeper {
		color:
			#c6a16c;
	}


	.history-icon.waiver {
		color:
			#82a68d;
	}


	.history-icon.free-agent {
		color:
			#8ca5a6;
	}


	.history-icon.drop {
		color:
			#b77d75;
	}


	.history-event {
		min-width: 0;

		display: grid;

		gap: 6px;

		padding:
			12px 15px;
	}


	.history-event-top {
		display: flex;

		justify-content: space-between;
		align-items: baseline;

		gap: 15px;
	}


	.history-event-top strong {
		color:
			var(
				--brand-ivory,
				#f1ede3
			);

		font-size: 0.72rem;
		font-weight: 850;

		letter-spacing: 0.02em;

		text-transform: uppercase;
	}


	.history-event-top span {
		flex: 0 0 auto;

		color:
			rgba(
				241,
				237,
				227,
				0.38
			);

		font-size: 0.64rem;

		text-transform: uppercase;
	}


	.history-copy {
		display: grid;

		gap: 2px;

		color:
			rgba(
				241,
				237,
				227,
				0.62
			);

		font-size: 0.82rem;
	line-height: 1.45;
	}


	.history-copy span {
		display: flex;

		flex-wrap: wrap;

		align-items: baseline;

		gap: 4px;
	}


	.history-copy b {
		color:
			var(
				--brand-ivory,
				#f1ede3
			);

		font-weight: 850;
	}


	.history-copy small {
		color:
			rgba(
				241,
				237,
				227,
				0.38
			);

		font-size: 0.69rem;
	}


	.history-capital {
		display: flex;

		flex-wrap: wrap;

		gap: 6px;

		margin-top: 3px;
	}


	.history-capital-chip {
		display: inline-flex;

		align-items: center;

		flex-wrap: wrap;

		gap: 5px;

		padding:
			4px 7px;

		border:
			1px solid
			rgba(
				191,
				161,
				106,
				0.28
			);

		background:
			rgba(
				191,
				161,
				106,
				0.045
			);

		font-size: 0.66rem;
	}


	.history-capital-chip b {
		color:
			var(
				--brand-gold,
				#dbc392
			);
	}


	.history-capital-chip em {
		color:
			rgba(
				241,
				237,
				227,
				0.68
			);

		font-style: normal;
		font-weight: 800;

		text-transform: uppercase;
	}


	.history-capital-chip small {
		color:
			rgba(
				241,
				237,
				227,
				0.36
			);
		font-size: 0.65rem;
	}


	.history-assets {
		display: flex;

		flex-wrap: wrap;

		gap: 5px;

		margin-top: 2px;
	}


	.history-assets span {
		display: inline-flex;

		align-items: center;

		gap: 4px;

		padding:
			3px 6px;

		border:
			1px solid
			rgba(
				241,
				237,
				227,
				0.08
			);

		background:
			rgba(
				241,
				237,
				227,
				0.018
			);

		color:
			rgba(
				241,
				237,
				227,
				0.62
			);

		font-size: 0.62rem;
		font-weight: 800;
	}


	.history-assets
	.incoming b {
		color:
			#82a68d;
	}


	.history-assets
	.outgoing b {
		color:
			#b77d75;
	}


	.history-empty {
		min-height: 120px;

		display: grid;
		place-items: center;
		align-content: center;

		gap: 5px;

		padding: 22px;

		text-align: center;
	}


	.history-empty strong {
		color:
			var(
				--brand-ivory,
				#f1ede3
			);

		font-size: 0.78rem;

		text-transform: uppercase;
	}


	.history-empty span {
		max-width: 520px;

		color:
			rgba(
				241,
				237,
				227,
				0.42
			);

		font-size: 0.7rem;

		line-height: 1.5;
	}


	/* ==================================================
	   FOOTER
	   ================================================== */

	.modal-footer {
		display: flex;

		flex-wrap: wrap;

		gap: 8px 24px;

		padding:
			10px 16px;

		border-top:
			1px solid
			rgba(
				191,
				161,
				106,
				0.13
			);

		background:
			#070a09;

		color:
			rgba(
				241,
				237,
				227,
				0.32
			);

		font-size: 0.57rem;
		font-weight: 700;

		letter-spacing: 0.05em;

		text-transform: uppercase;
	}


	.modal-footer strong {
		margin-left: 4px;

		color:
			rgba(
				241,
				237,
				227,
				0.52
			);
	}


	/* ==================================================
	   TABLET
	   ================================================== */

	@media (max-width: 980px) {
		.player-modal-backdrop {
			padding: 12px;
		}


		.player-modal {
			width:
				min(
					820px,
					100%
				);

			max-height:
				calc(
					100vh -
					24px
				);
		}


		.player-hero {
			grid-template-columns:
				215px
				minmax(
					0,
					1fr
				);
		}


		.portrait-bay {
			min-height: 275px;
		}


		.portrait-bay img {
			width: 235px;
			height: 285px;
		}


		.irving-context {
			grid-column:
				1 / -1;

			display: grid;

			grid-template-columns:
				minmax(
					0,
					1fr
				)
				auto;

			align-items: center;

			gap:
				4px 20px;

			padding:
				15px 20px;

			border-top:
				1px solid
				rgba(
					191,
					161,
					106,
					0.18
				);

			border-left: 0;
		}


		.irving-context
		.context-kicker,
		.irving-context
		.context-team,
		.irving-context
		> small,
		.irving-context
		.context-note {
			grid-column: 1;
		}


		.irving-context
		.keeper-note {
			grid-column: 2;
			grid-row:
				1 / span 3;

			margin-top: 0;
			padding:
				0 0 0 20px;

			border-top: 0;

			border-left:
				1px solid
				rgba(
					191,
					161,
					106,
					0.16
				);
		}


		.hero-main {
			padding:
				24px 25px;
		}


		.hero-main h1 {
			font-size:
				clamp(
					3.4rem,
					8vw,
					5rem
				);
		}


		.bio-grid {
			grid-template-columns:
				repeat(
					3,
					minmax(
						0,
						1fr
					)
				);

			width: 100%;

			gap: 15px 0;
		}


		.bio-grid .college {
			grid-column:
				span 2;
		}
	}


	/* ==================================================
	   MOBILE
	   ================================================== */

	@media (max-width: 640px) {
		.player-modal-backdrop {
			padding: 6px;
		}


		.player-modal {
			width: 100%;

			max-height:
				calc(
					100vh -
					12px
				);

			border-radius: 9px;
		}


		.modal-topbar {
			grid-template-columns:
				minmax(
					0,
					1fr
				)
				46px;
		}


		.modal-brand {
			padding-left: 9px;

			gap: 9px;
		}


		.icl-mark {
			width: 32px;
			height: 32px;

			font-size: 0.94rem;
		}


		.modal-title {
			display: grid;

			gap: 1px;
		}


		.modal-title span {
			font-size: 0.53rem;
		}


		.modal-title strong {
			font-size: 0.74rem;
		}


		.modal-collective {
			display: none;
		}


		.player-hero {
			display: grid;

			grid-template-columns:
				130px
				minmax(
					0,
					1fr
				);

			min-height: 225px;
		}


		.portrait-bay {
			min-height: 225px;
		}


		.portrait-bay img {
			left: 50%;
			bottom: -5px;

			width: 175px;
			height: 230px;

			transform:
				translateX(-50%)
				scale(1.16);
		}


		.portrait-watermark {
			left: 7px;
			top: 7px;

			font-size: 5rem;
		}


		.position-label {
			left: 9px;
			bottom: 9px;

			padding:
				4px 6px;

			font-size: 0.56rem;
		}


		.hero-main {
			padding:
				19px 14px;
		}


		.hero-main h1 {
			font-size:
				clamp(
					2.7rem,
					12vw,
					3.7rem
				);

			line-height: 0.86;
		}


		.player-subline {
			margin-top: 7px;

			font-size: 0.72rem;
		}


		.bio-grid {
			grid-template-columns:
				repeat(
					2,
					minmax(
						0,
						1fr
					)
				);

			gap: 10px 0;

			margin-top: 15px;
		}


		.bio-grid > div {
			min-width: 0;

			padding:
				0 9px;

			border-left:
				1px solid
				rgba(
					191,
					161,
					106,
					0.17
				);
		}


		.bio-grid > div:nth-child(odd) {
			padding-left: 0;

			border-left: 0;
		}


		.bio-grid .college {
			grid-column:
				1 / -1;

			padding-left: 0;

			border-left: 0;
		}


		.bio-grid span {
			font-size: 0.51rem;
		}


		.bio-grid strong {
			font-size: 0.77rem;
		}


		.status-line {
			margin-top: 13px;

			font-size: 0.64rem;
		}


		.irving-context {
			grid-template-columns:
				1fr;

			gap: 3px;

			padding:
				14px 16px;
		}


		.irving-context
		.context-kicker,
		.irving-context
		.context-team,
		.irving-context
		> small,
		.irving-context
		.context-note,
		.irving-context
		.keeper-note {
			grid-column: 1;
			grid-row: auto;
		}


		.irving-context
		.keeper-note {
			margin-top: 10px;

			padding:
				10px 0 0;

			border-top:
				1px solid
				rgba(
					191,
					161,
					106,
					0.15
				);

			border-left: 0;
		}


		.season-desk {
			display: grid;

			gap: 13px;

			padding:
				15px 16px
				12px;
		}


		.season-pills {
			width: 100%;
		}


		.season-pills button {
			flex: 1 1 auto;

			min-width: 48px;
		}


		.summary-strip {
			grid-template-columns:
				repeat(
					2,
					minmax(
						0,
						1fr
					)
				);
		}


		.summary-strip > div {
			min-height: 62px;

			border-bottom:
				1px solid
				rgba(
					191,
					161,
					106,
					0.1
				);
		}


		.summary-strip > div:nth-child(even) {
			border-right: 0;
		}


		.summary-strip > div:last-child {
			grid-column:
				1 / -1;

			border-bottom: 0;
		}


		.summary-strip strong {
			font-size: 1.45rem;
		}


		.no-games {
			grid-template-columns:
				1fr;

			gap: 6px;

			padding:
				30px 18px;

			text-align: center;
		}


		.no-games-year {
			font-size: 3.7rem;
		}


		.history-header {
			align-items: center;

			padding:
				18px 16px
				12px;
		}


		.history-header h2 {
			font-size: 1.8rem;
		}


		.history-row {
			grid-template-columns:
				42px
				minmax(
					0,
					1fr
				);
		}


		.history-event {
			padding:
				11px 10px;
		}


		.history-event-top {
			font-size: 0.78rem;
			align-items: flex-start;

			flex-direction: column;

			gap: 2px;
		}


		.history-capital-chip {
			align-items: flex-start;

			flex-direction: column;

			gap: 1px;
		}


		.modal-footer {
			gap: 5px 12px;

			padding:
				9px 11px;
		}
	}
</style>