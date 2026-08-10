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
</script>

<svelte:window on:keydown={handleKeydown} />

{#if modal.open}
	<div class="player-modal-backdrop" role="presentation" on:click={closePlayerModal}>
		<section
			class="player-modal"
			role="dialog"
			aria-modal="true"
			aria-label={card?.profile?.name ? `${card.profile.name} player card` : 'Player card'}
			on:click|stopPropagation
		>
			<header class="modal-topbar">
				<div class="modal-network">ICL</div>

				<div class="modal-title">
					<span>Player File</span>

					<strong>
						{card?.profile?.name || 'Loading player…'}
					</strong>
				</div>

				<button
					type="button"
					class="modal-close"
					aria-label="Close player card"
					on:click={closePlayerModal}
				>
					×
				</button>
			</header>

			{#if loading && !card}
				<div class="modal-state">
					<div class="loading-bar">
						<span></span>
					</div>

					<strong> Pulling the game tape… </strong>

					<span> Loading player profile and weekly stats. </span>
				</div>
			{:else if error}
				<div class="modal-state error-state">
					<strong> Player feed unavailable </strong>

					<span>
						{error}
					</span>

					<button type="button" on:click={() => loadPlayer(modal.playerId, selectedSeason)}>
						Try again
					</button>
				</div>
			{:else if card}
				<div class="player-hero icl-hero-shell">
					<div class="portrait-bay ">
						<img src={card.profile.headshotUrl} alt={card.profile.name} />

						<div class="position-bug">
							{card.profile.position}
						</div>
					</div>

					<div class="hero-main">
						<div class="eyebrow">Irving Player Database</div>

						<h2>
							{card.profile.name}
						</h2>

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
									{card.profile.weight ? `${card.profile.weight} lbs` : '—'}
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

						<div class="status-line" class:injured={Boolean(card.profile.injuryStatus)}>
							<span class="status-dot"></span>

							{statusText(card.profile)}
						</div>
					</div>

					<aside class="irving-context">

	<span>
		Current Irving roster
	</span>


	{#if !irvingLeagueAvailable}

		<strong>
			ROSTER STATUS UNAVAILABLE
		</strong>

		<small>
			League feed could not be loaded.
		</small>


	{:else if currentIrvingRoster?.rostered}

		<strong>
			{currentIrvingRoster.teamName}
		</strong>

		<small>
			{currentIrvingRoster.managerName ||
				'Unknown manager'}
		</small>


	{:else}

		<strong class="free-agent-label">
			FREE AGENT
		</strong>

		<small>
			Not currently rostered
		</small>

	{/if}


	{#if modal.context?.keeperEligible === false}

		<b class="context-ineligible">
			NOT KEEPER ELIGIBLE
		</b>


	{:else if modal.context?.keeperCost != null}

		<b>
			{money(
				modal.context.keeperCost
			)}
			keeper
		</b>

	{/if}


	{#if modal.context?.note}

		<em>
			{modal.context.note}
		</em>

	{/if}

</aside>
				</div>

				<div class="season-toolbar">
					<div>
						<span> Game log </span>

						<strong>
							{selectedSeason} season
						</strong>
					</div>

					<div class="season-pills" aria-label="Player stats season selector">
						{#each card.availableSeasons as season}
							<button
								type="button"
								class:active={Number(season) === Number(selectedSeason)}
								on:click={() => changeSeason(season)}
							>
								{season}
							</button>
						{/each}
					</div>
				</div>

				<div class="summary-strip">
					<div>
						<span>Games</span>
						<strong>
							{card.summary.games}
						</strong>
					</div>

					<div>
						<span>Half-PPR</span>
						<strong>
							{fmt(card.summary.fantasyPoints, 1)}
						</strong>
					</div>

					<div>
						<span>FPTS/G</span>
						<strong>
							{fmt(card.summary.fantasyPointsPerGame, 1)}
						</strong>
					</div>

					{#if card.profile.position === 'QB'}
						<div>
							<span>Pass Yds</span>
							<strong>
								{whole(card.summary.passingYards)}
							</strong>
						</div>

						<div>
							<span>Pass TD</span>
							<strong>
								{whole(card.summary.passingTds)}
							</strong>
						</div>
					{:else}
						<div>
							<span>Scrim Yds</span>
							<strong>
								{whole(card.summary.rushingYards + card.summary.receivingYards)}
							</strong>
						</div>

						<div>
							<span>TD</span>
							<strong>
								{whole(card.summary.rushingTds + card.summary.receivingTds)}
							</strong>
						</div>
					{/if}
				</div>

				<div class="game-log-shell">
					

					{#if card.games.length}
						<div class="game-log-scroll">
							<table>
								<thead>
									<tr>
										<th>WK</th>
										<th>OPP</th>

										<th class="fpts"> FPTS </th>

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
													{fmt(game.fantasyPoints, 1)}
												</strong>
											</td>

											<td>
												{game.passing.completions || '—'}
											</td>

											<td>
												{game.passing.attempts || '—'}
											</td>

											<td>
												{game.passing.yards || '—'}
											</td>

											<td>
												{game.passing.tds || '—'}
											</td>

											<td>
												{game.passing.interceptions || '—'}
											</td>

											<td>
												{game.rushing.attempts || '—'}
											</td>

											<td>
												{game.rushing.yards || '—'}
											</td>

											<td>
												{game.rushing.tds || '—'}
											</td>

											<td>
												{game.receiving.receptions || '—'}
											</td>

											<td>
												{game.receiving.targets || '—'}
											</td>

											<td>
												{game.receiving.yards || '—'}
											</td>

											<td>
												{game.receiving.tds || '—'}
											</td>

											<td>
												{game.fumblesLost || '—'}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<div class="no-games">
							<strong>
								No regular-season game log found for
								{selectedSeason}.
							</strong>

							<span> If the season has not started yet, switch to the previous season above. </span>
						</div>
					{/if}
				</div>
				<section class="irving-history">

	<header class="history-header">

		<div>
			<span>
				Irving transaction history
			</span>

			<strong>
				Franchise trail
			</strong>
		</div>


		<em>
			{irvingHistory.length}
			event{irvingHistory.length === 1 ? '' : 's'}
		</em>

	</header>


	{#if !irvingLeagueAvailable}

		<div class="history-empty">
			League history feed unavailable.
		</div>


	{:else if irvingHistory.length}

		<div class="history-list">

			{#each irvingHistory as event (event.id)}

				<div class="history-row">

					<div
						class={`history-icon ${historyClass(
							event.type
						)}`}
						aria-hidden="true"
					>
						{historyIcon(
							event.type
						)}
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
										{event.toTeam?.teamName ||
											'Unknown franchise'}
									</b>

									{#if event.fromTeam?.teamName}
										from
										<b>
											{event.fromTeam.teamName}
										</b>
									{/if}
								</span>


								{#if event.toTeam?.managerName || event.fromTeam?.managerName}

									<small>
										{#if event.toTeam?.managerName}
											{event.toTeam.managerName}
										{/if}

										{#if event.toTeam?.managerName && event.fromTeam?.managerName}
											←
										{/if}

										{#if event.fromTeam?.managerName}
											{event.fromTeam.managerName}
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
										{event.team.managerName}
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
										{event.team.managerName}
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
											· {event.team.managerName}
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

									{#if event.week && event.team?.managerName}
										·
									{/if}

									{#if event.team?.managerName}
										{event.team.managerName}
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

									{#if event.week && event.team?.managerName}
										·
									{/if}

									{#if event.team?.managerName}
										{event.team.managerName}
									{/if}
								</small>

							{/if}

						</div>


						{#if event.assets?.length}

							<div class="history-assets">

								{#each event.assets as asset}

									<span
										class:incoming={asset.direction === 'in'}
										class:outgoing={asset.direction === 'out'}
									>

										<b>
											{asset.direction === 'in'
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

				</div>

			{/each}

		</div>


	{:else}

		<div class="history-empty">

			<strong>
				No Irving transactions found.
			</strong>

			<span>
				This player has no draft,
				trade, waiver, free-agent,
				or drop history in the
				available league archive.
			</span>

		</div>

	{/if}

</section>

				<footer class="modal-footer">
					<span> Profile: Sleeper </span>

					<span> Stats: nflverse / nflfastR </span>

					<span> Fantasy points: Half-PPR </span>
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

		background: rgba(3, 7, 7, 0.78);

		backdrop-filter: blur(7px);
	}

	.icl-hero-shell {
		border-radius: 0 0 16px 16px;
	}

	.player-modal {
		width: min(1080px, 96vw);

		max-height: min(860px, 92vh);

		overflow: auto;

		border: 2px solid #050606;

		border-radius: 16px;


	}

	.modal-topbar {
		position: sticky;
		top: 0;
		z-index: 4;

		display: grid;

		grid-template-columns:
			64px
			minmax(0, 1fr)
			52px;

		align-items: stretch;

		border-bottom: 2px solid #050606;

		background: linear-gradient(180deg, #1a1e1c, #070808);
	}

	.modal-network {
		display: grid;

		place-items: center;

		background: linear-gradient(180deg, var(--bug-red, #c7192f), var(--bug-red-dark, #7f0e1b));

		border-right: 2px solid #050606;

		font-family: var(--font-score);

		font-weight: 950;
	}

	.modal-title {
		display: flex;

		align-items: baseline;

		gap: 10px;

		padding: 10px 14px;

		min-width: 0;
	}

	.modal-title span {
		color: var(--bug-yellow, #ffd34d);

		font-family: var(--font-score);

		font-size: 0.64rem;

		font-weight: 950;

		letter-spacing: 0.14em;

		text-transform: uppercase;

		white-space: nowrap;
	}

	.modal-title strong {
		overflow: hidden;

		text-overflow: ellipsis;

		white-space: nowrap;

		font-size: 0.95rem;
	}

	.modal-close {
		border: 0;

		border-left: 2px solid #050606;

		background: linear-gradient(180deg, #656d69, #202523);

		color: white;

		font-size: 1.8rem;

		cursor: pointer;
	}

	.modal-close:hover {
		background: linear-gradient(180deg, var(--bug-red, #c7192f), var(--bug-red-dark, #7f0e1b));
	}

	.modal-state {
		min-height: 430px;

		display: grid;

		place-items: center;

		align-content: center;

		gap: 10px;

		padding: 30px;

		text-align: center;

		color: rgba(255, 255, 255, 0.68);
	}

	.modal-state strong {
		color: white;

		font-size: 1.25rem;
	}

	.modal-state button {
		padding: 8px 12px;

		cursor: pointer;
	}

	.loading-bar {
		width: min(320px, 70vw);

		height: 8px;

		overflow: hidden;

		border: 1px solid #050606;

		border-radius: 99px;

		background: #111;
	}

	.loading-bar span {
		display: block;

		width: 42%;
		height: 100%;

		background: var(--bug-yellow, #ffd34d);

		animation: load-slide 1s ease-in-out infinite alternate;
	}

	@keyframes load-slide {
		from {
			transform: translateX(-25%);
		}

		to {
			transform: translateX(165%);
		}
	}

	.player-hero {
		display: grid;

		grid-template-columns:
			190px
			minmax(0, 1fr)
			220px;

		min-height: 230px;


		border-bottom: 2px solid #050606;
	}

	.portrait-bay {
		position: relative;

		display: grid;

		place-items: end center;

		overflow: hidden;

		border-right: 1px solid rgba(255, 255, 255, 0.08);

		background: radial-gradient(circle at 50% 42%, rgba(255, 255, 255, 0.18), transparent 46%);
	}

	.portrait-bay img {
		width: 178px;

		height: 208px;

		object-fit: contain;

		object-position: center bottom;

		filter: drop-shadow(0 15px 18px rgba(0, 0, 0, 0.48));
	}

	.position-bug {
		position: absolute;

		left: 0;
		bottom: 0;

		min-width: 58px;

		padding: 8px 12px;

		background: var(--bug-red, #c7192f);

		border-top: 2px solid #050606;

		border-right: 2px solid #050606;

		font-family: var(--font-score);

		font-weight: 950;

		text-align: center;
	}

	.hero-main {
		padding: 22px 24px;
	}

	.eyebrow,
	.season-toolbar span,
	.irving-context > span,
	.bio-grid span,
	.summary-strip span {
		color: var(--bug-yellow, #ffd34d);

		font-family: var(--font-score);

		font-size: 0.62rem;

		font-weight: 950;

		letter-spacing: 0.13em;

		text-transform: uppercase;
	}

	.hero-main h2 {
		margin: 5px 0 2px;

		font-family: var(--font-display);

		font-size: clamp(2.25rem, 4.8vw, 4.25rem);

		line-height: 0.92;

		letter-spacing: -0.045em;

		text-shadow: 0 3px 0 #000;
	}

	.player-subline {
		color: rgba(255, 255, 255, 0.75);

		font-family: var(--font-score);

		font-weight: 900;
	}

	.bio-grid {
		display: grid;

		grid-template-columns: repeat(5, minmax(0, auto));

		margin-top: 22px;
	}

	.bio-grid > div {
		padding: 0 13px;

		border-left: 1px solid rgba(255, 255, 255, 0.16);
	}

	.bio-grid > div:first-child {
		padding-left: 0;
		border-left: 0;
	}

	.bio-grid strong {
		display: block;

		margin-top: 3px;

		font-size: 1.05rem;

		white-space: nowrap;
	}

	.bio-grid .college {
		min-width: 150px;
	}

	.status-line {
		display: flex;

		align-items: center;

		gap: 7px;

		margin-top: 18px;

		color: rgba(255, 255, 255, 0.68);

		font-size: 0.78rem;
	}

	.status-dot {
		width: 8px;
		height: 8px;

		border-radius: 50%;

		background: var(--bug-green, #45a16a);
	}

	.status-line.injured .status-dot {
		background: #ff7d6b;
	}

	.irving-context {
		align-self: stretch;

		display: grid;

		align-content: center;

		gap: 5px;

		padding: 18px;

		border-left: 2px solid #050606;

		background: linear-gradient(180deg, rgba(255, 216, 77, 0.08), rgba(0, 0, 0, 0.18));
	}

	.irving-context strong {
		font-size: 1.05rem;
	}

	.irving-context small {
		color: rgba(255, 255, 255, 0.62);
	}

	.irving-context b {
		margin-top: 7px;

		color: var(--bug-yellow, #ffd34d);

		font-family: var(--font-score);

		font-size: 0.9rem;
	}

	.irving-context .context-ineligible {
		color: #ff7777;

		font-size: 0.72rem;
	}

	.irving-context em {
		color: rgba(255, 255, 255, 0.55);

		font-size: 0.72rem;

		font-style: normal;
	}

	.free-agent-label {
	color:
		rgba(
			255,
			255,
			255,
			.72
		) !important;
}

	.season-toolbar {
		display: flex;

		justify-content: space-between;

		align-items: center;

		gap: 14px;

		padding: 12px 16px;

		border-bottom: 1px solid rgba(255, 255, 255, 0.08);

		background: rgba(0, 0, 0, 0.16);
	}

	.season-toolbar > div:first-child {
		display: grid;
		gap: 2px;
	}

	.season-toolbar strong {
		font-size: 0.95rem;
	}

	.season-pills {
		display: flex;

		gap: 7px;

		flex-wrap: wrap;
	}

	.season-pills button {
		min-width: 55px;

		padding: 7px 10px;

		border: 1px solid #050606;

		border-radius: 7px;

		background: linear-gradient(180deg, #69716d, #242927);

		color: white;

		font-family: var(--font-score);

		font-weight: 950;

		cursor: pointer;
	}

	.season-pills button.active,
	.season-pills button:hover {
		background: linear-gradient(180deg, var(--bug-red, #c7192f), var(--bug-red-dark, #7f0e1b));
	}

	.summary-strip {
		display: grid;

		grid-template-columns: repeat(5, minmax(0, 1fr));

		border-bottom: 2px solid #050606;

		background: linear-gradient(180deg, #4d5551, #252a28);
	}

	.summary-strip > div {
		padding: 11px 14px;

		border-right: 1px solid rgba(255, 255, 255, 0.08);
	}

	.summary-strip > div:last-child {
		border-right: 0;
	}

	.summary-strip strong {
		display: block;

		margin-top: 3px;

		font-family: var(--font-score);

		font-size: 1.2rem;
	}

	.game-log-shell {
		position: relative;

		min-height: 230px;

		background: #171b1a;
	}

	.game-log-scroll {
		overflow-x: auto;
	}

	table {
		width: 100%;

		min-width: 1050px;

		border-collapse: collapse;

		font-size: 0.78rem;
	}

	th,
	td {
		padding: 9px 8px;

		text-align: center;

		border-right: 1px solid rgba(255, 255, 255, 0.065);

		border-bottom: 1px solid rgba(255, 255, 255, 0.065);
	}

	th {
		background: #282e2b;

		color: rgba(255, 255, 255, 0.72);

		font-family: var(--font-score);

		font-size: 0.62rem;

		letter-spacing: 0.04em;
	}

	tbody tr:nth-child(even) {
		background: rgba(255, 255, 255, 0.025);
	}

	tbody tr:hover {
		background: rgba(199, 25, 47, 0.11);
	}

	th.fpts,
	td.fpts {
		background: rgba(255, 216, 77, 0.09);
	}

	td.fpts strong {
		color: var(--bug-yellow, #ffd34d);

		font-family: var(--font-score);
	}

	td.opp {
		font-weight: 900;
	}

	.table-loading {
		position: absolute;

		z-index: 2;

		top: 0;
		right: 0;

		padding: 5px 10px;

		background: var(--bug-yellow, #ffd34d);

		color: #111;

		font-family: var(--font-score);

		font-size: 0.62rem;

		font-weight: 950;
	}

	.no-games {
		min-height: 230px;

		display: grid;

		place-items: center;

		align-content: center;

		gap: 6px;

		padding: 25px;

		text-align: center;

		color: rgba(255, 255, 255, 0.58);
	}

	.no-games strong {
		color: white;
	}
	.irving-history {
	border-top:
		2px solid
		#050606;

	background:
		linear-gradient(
			180deg,
			#252b29,
			#111413
		);
}


.history-header {
	display: flex;

	align-items:
		center;

	justify-content:
		space-between;

	gap: 16px;

	padding:
		13px
		16px;

	border-bottom:
		1px solid
		rgba(
			255,
			255,
			255,
			.08
		);

	background:
		rgba(
			0,
			0,
			0,
			.17
		);
}


.history-header > div {
	display: grid;
	gap: 2px;
}


.history-header span {
	color:
		var(
			--bug-yellow,
			#ffd34d
		);

	font-family:
		var(
			--font-score
		);

	font-size:
		.62rem;

	font-weight:
		950;

	letter-spacing:
		.12em;

	text-transform:
		uppercase;
}


.history-header strong {
	font-size:
		1rem;
}


.history-header em {
	color:
		rgba(
			255,
			255,
			255,
			.48
		);

	font-size:
		.68rem;

	font-style:
		normal;

	text-transform:
		uppercase;

	letter-spacing:
		.06em;
}


.history-list {
	display: grid;
}


.history-row {
	display: grid;

	grid-template-columns:
		52px
		minmax(
			0,
			1fr
		);

	min-height:
		70px;

	border-bottom:
		1px solid
		rgba(
			255,
			255,
			255,
			.07
		);
}


.history-row:last-child {
	border-bottom: 0;
}


.history-icon {
	display: grid;

	place-items:
		center;

	border-right:
		1px solid
		rgba(
			255,
			255,
			255,
			.07
		);

	color:
		rgba(
			255,
			255,
			255,
			.72
		);

	font-family:
		var(
			--font-score
		);

	font-size:
		1rem;

	font-weight:
		950;
}


.history-icon.trade {
	color:
		#8fc5ff;
}


.history-icon.draft {
	color:
		var(
			--bug-yellow,
			#ffd34d
		);
}


.history-icon.keeper {
	color:
		#ff9f55;
}


.history-icon.waiver {
	color:
		#72d89a;
}


.history-icon.free-agent {
	color:
		#73d5dc;
}


.history-icon.drop {
	color:
		#ff7d73;
}


.history-event {
	min-width: 0;

	display: grid;

	gap: 5px;

	padding:
		10px
		14px;
}


.history-event-top {
	display: flex;

	align-items:
		center;

	justify-content:
		space-between;

	gap: 12px;
}


.history-event-top strong {
	color:
		rgba(
			255,
			255,
			255,
			.9
		);

	font-family:
		var(
			--font-score
		);

	font-size:
		.67rem;

	letter-spacing:
		.04em;
}


.history-event-top span {
	color:
		rgba(
			255,
			255,
			255,
			.46
		);

	font-size:
		.63rem;

	text-transform:
		uppercase;
}


.history-copy {
	display: grid;

	gap: 2px;

	font-size:
		.78rem;

	color:
		rgba(
			255,
			255,
			255,
			.68
		);
}


.history-copy span {
	display: flex;

	flex-wrap:
		wrap;

	align-items:
		baseline;

	gap: 4px;
}


.history-copy b {
	color:
		white;

	font-weight:
		900;
}


.history-copy small {
	color:
		rgba(
			255,
			255,
			255,
			.45
		);

	font-size:
		.66rem;
}


.history-assets {
	display: flex;

	flex-wrap:
		wrap;

	gap: 6px;

	margin-top: 3px;
}


.history-assets span {
	display: inline-flex;

	align-items:
		center;

	gap: 4px;

	padding:
		3px
		7px;

	border:
		1px solid
		rgba(
			255,
			255,
			255,
			.08
		);

	border-radius:
		5px;

	background:
		rgba(
			0,
			0,
			0,
			.2
		);

	font-size:
		.65rem;

	font-weight:
		850;
}


.history-assets
.incoming b {
	color:
		#72d89a;
}


.history-assets
.outgoing b {
	color:
		#ff7d73;
}


.history-empty {
	min-height:
		90px;

	display: grid;

	place-items:
		center;

	align-content:
		center;

	gap: 4px;

	padding:
		18px;

	text-align:
		center;

	color:
		rgba(
			255,
			255,
			255,
			.48
		);

	font-size:
		.75rem;
}


.history-empty strong {
	color:
		rgba(
			255,
			255,
			255,
			.8
		);
}
	.modal-footer {
		display: flex;

		gap: 9px 18px;

		flex-wrap: wrap;

		padding: 9px 14px;

		border-top: 1px solid rgba(255, 255, 255, 0.08);

		background: #090b0a;

		color: rgba(255, 255, 255, 0.46);

		font-size: 0.64rem;

		text-transform: uppercase;

		letter-spacing: 0.05em;
	}

	@media (max-width: 900px) {
		.player-modal-backdrop {
			padding: 10px;
		}

		.player-modal {
			width: min(100%, 760px);

			max-height: 95vh;
		}

		.player-hero {
			grid-template-columns:
				160px
				minmax(0, 1fr);
		}

		.portrait-bay img {
			width: 150px;

			height: 190px;
		}

		.irving-context {
			grid-column: 1 / -1;

			border-left: 0;

			border-top: 2px solid #050606;
		}

		.bio-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));

			gap: 10px 0;
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
		10px;
}


.history-event-top {
	align-items:
		flex-start;

	flex-direction:
		column;

	gap: 2px;
}
	}

	@media (max-width: 620px) {
		.player-modal-backdrop {
			padding: 0;

			place-items: stretch;
		}

		.player-modal {
			width: 100%;

			max-height: 100vh;

			min-height: 100vh;

			border-radius: 0;
		}

		.player-hero {
			grid-template-columns:
				120px
				minmax(0, 1fr);

			min-height: 190px;
		}

		.portrait-bay img {
			width: 116px;

			height: 165px;
		}

		.hero-main {
			padding: 17px 15px;
		}

		.hero-main h2 {
			font-size: 2.35rem;
		}

		.bio-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));

			margin-top: 15px;
		}

		.bio-grid .college {
			min-width: 0;

			grid-column: 1 / -1;
		}

		.summary-strip {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.season-toolbar {
			align-items: flex-start;

			flex-direction: column;
		}
	}
</style>
