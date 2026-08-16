<script>
	import {
		getLeaderboardBreakdownComponent
	} from '$lib/games/leaderboard/index.js';

	import {
		eventDisplay
	} from '$lib/events/displayNames';

	import {
		page
	} from '$app/stores';


	export let data;


	let expanded =
		new Set();


	const ALL = 'all';


	let gameFilter =
		ALL;


	function toggleUser(
		userId
	) {
		const next =
			new Set(
				expanded
			);

		if (
			next.has(
				userId
			)
		) {
			next.delete(
				userId
			);
		} else {
			next.add(
				userId
			);
		}

		expanded =
			next;
	}


	function fmtDate(
		unix
	) {
		if (!unix) {
			return '';
		}

		return new Date(
			Number(unix) *
			1000
		).toLocaleDateString(
			'en-US',
			{
				month:
					'short',

				day:
					'numeric',

				year:
					'numeric'
			}
		);
	}


	function hasAnyBreakdown(
		ev
	) {
		return Boolean(
			ev?.totals ||
			ev?.breakdown
		);
	}


	function evIsPast(
		ev
	) {
		if (!ev?.start_at) {
			return false;
		}

		const now =
			Math.floor(
				Date.now() /
				1000
			);

		return (
			now >=
			Number(
				ev.start_at
			)
		);
	}


	function evStatusText(
		ev
	) {
		return evIsPast(ev)
			? 'Complete'
			: 'Upcoming';
	}


	function prettyGameLabel(
		type
	) {
		if (
			type ===
			'daytona'
		) {
			return 'Daytona';
		}

		if (
			type ===
			'madness'
		) {
			return 'Madness';
		}

		return (
			type
				?.charAt(0)
				.toUpperCase() +
			type?.slice(1)
		);
	}


	$: gameTypes =
		(() => {
			const types =
				new Set();

			for (
				const userId
				of Object.keys(
					data?.byUser ||
					{}
				)
			) {
				for (
					const ev
					of data.byUser[
						userId
					] || []
				) {
					if (
						ev?.type
					) {
						types.add(
							ev.type
						);
					}
				}
			}

			return Array.from(
				types
			);
		})();


	function pointsForUser(
		userId
	) {
		if (
			gameFilter ===
			ALL
		) {
			const row =
				(
					data?.totals ||
					[]
				).find(
					(row) =>
						row.user_id ===
						userId
				);

			return Number(
				row?.points ??
				0
			);
		}

		const events =
			data?.byUser?.[
				userId
			] || [];

		return events
			.filter(
				(ev) =>
					ev?.type ===
					gameFilter
			)
			.reduce(
				(
					sum,
					ev
				) =>
					sum +
					Number(
						ev?.points ??
							0
					),
				0
			);
	}


	$: filteredTotals =
		(() => {
			const base =
				(
					data?.totals ||
					[]
				).map(
					(row) => ({
						user_id:
							row.user_id,

						display_name:
							row.display_name,

						points:
							pointsForUser(
								row.user_id
							)
					})
				);

			base.sort(
				(a, b) =>
					b.points -
					a.points
			);

			let rank =
				0;

			let lastPoints =
				null;

			let seen =
				0;

			return base.map(
				(row) => {
					seen++;

					if (
						lastPoints ===
							null ||
						row.points !==
							lastPoints
					) {
						rank =
							seen;
					}

					lastPoints =
						row.points;

					return {
						...row,
						rank
					};
				}
			);
		})();


	$: top3 =
		filteredTotals.slice(
			0,
			3
		);


	$: leaderPoints =
		Number(
			filteredTotals?.[
				0
			]?.points ??
				0
		) || 1;


	function pct(
		points
	) {
		const value =
			Number(
				points ??
				0
			);

		return Math.max(
			0,
			Math.min(
				100,
				Math.round(
					(
						value /
						leaderPoints
					) *
						100
				)
			)
		);
	}


	const gamesNav = [
		{
			href:
				'/games',

			label:
				'Games Floor',

			meta:
				'Events'
		},
		{
			href:
				'/leaderboard',

			label:
				'Leaderboard',

			meta:
				'Offseason Board'
		}
	];


	$: currentPath =
		$page.url.pathname;


	function gamesNavActive(
		href
	) {
		if (
			href ===
			'/games'
		) {
			return (
				currentPath ===
					'/games' ||
				currentPath.startsWith(
					'/games/'
				)
			);
		}

		return (
			currentPath ===
				href ||
			currentPath.startsWith(
				`${href}/`
			)
		);
	}
</script>


<nav
	class="games-subnav"
	aria-label="Games navigation"
>
	<span class="games-bug">
		ICL
	</span>

	{#each gamesNav as item}
		<a
			class:active={gamesNavActive(
				item.href
			)}
			href={item.href}
		>
			<strong>
				{item.label}
			</strong>

			<small>
				{item.meta}
			</small>
		</a>
	{/each}
</nav>


<div class="leaderboard-page">

	<section class="hero">

		<div class="hero-copy">

			<div class="eyebrow">
				Irving Collective · Offseason Games
			</div>

			<h1>
				Leaderboard
			</h1>

			<p>
				Every bracket, race, pool, collapse,
				and completely unnecessary offseason competition
				feeds the same board.
			</p>

		</div>


		<div class="leader-callout">

			<span>
				Current Leader
			</span>

			{#if top3[0]}
				<strong>
					{top3[0].display_name}
				</strong>

				<div class="leader-score">
					{top3[0].points}
					<small>
						Irving Coin
					</small>
				</div>
			{:else}
				<strong>
					No leader yet
				</strong>
			{/if}

		</div>


		<div class="hero-bottom">

			<div class="hero-stat">
				<strong>
					{filteredTotals.length}
				</strong>

				<span>
					GMs on Board
				</span>
			</div>


			<div class="hero-stat">
				<strong>
					{gameTypes.length}
				</strong>

				<span>
					Game Types
				</span>
			</div>


			<div class="hero-stat updated">
				<strong>
					{data.updated_at
						? fmtDate(
								data.updated_at
							)
						: 'Recently'}
				</strong>

				<span>
					Last Updated
				</span>
			</div>


			<div class="filter-group">

				<span class="filter-label">
					View
				</span>

				<div class="filters">

					<button
						type="button"
						class:active={gameFilter ===
							ALL}
						on:click={() =>
							(gameFilter =
								ALL)}
					>
						Overall
					</button>

					{#each gameTypes as type}
						<button
							type="button"
							class:active={gameFilter ===
								type}
							on:click={() =>
								(gameFilter =
									type)}
						>
							{prettyGameLabel(
								type
							)}
						</button>
					{/each}

				</div>

			</div>

		</div>


		<div
			class="hero-watermark"
			aria-hidden="true"
		>
			GAMES
		</div>

	</section>


	{#if top3.length}
		<section class="podium-section">

			<div class="section-heading">

				<div>
					<div class="eyebrow">
						Front Runners
					</div>

					<h2>
						Top of the Board
					</h2>
				</div>

				<span>
					{gameFilter === ALL
						? 'Overall'
						: prettyGameLabel(
								gameFilter
							)}
				</span>

			</div>


			<div
				class={`podium podium-count-${top3.length}`}
			>

				{#each top3 as player}

					<button
						type="button"
						class="podium-card"
						class:champion={player.rank ===
							1}
						on:click={() =>
							toggleUser(
								player.user_id
							)}
						aria-expanded={expanded.has(
							player.user_id
						)}
					>

						<div class="podium-rank">
							{#if player.rank === 1}
								<span class="crown">
									♛
								</span>
							{:else}
								#{player.rank}
							{/if}
						</div>

						<div class="podium-person">

							<strong>
								{player.display_name}
							</strong>

							<span>
								{expanded.has(
									player.user_id
								)
									? 'Hide breakdown'
									: 'View breakdown'}
							</span>

						</div>

						<div class="podium-score">
							<strong>
								{player.points}
							</strong>

							<span>
								Irving Coin
							</span>
						</div>

					</button>

				{/each}

			</div>

		</section>
	{/if}


	<section class="standings-section">

		<div class="section-heading board-heading">

			<div>
				<div class="eyebrow">
					Offseason Ledger
				</div>

				<h2>
					Full Standings
				</h2>
			</div>

			<span>
				{filteredTotals.length}
				GMs
			</span>

		</div>


		<div class="leaderboard-table">

			<div class="table-head">

				<span>
					Rank
				</span>

				<span>
					GM
				</span>

				<span class="right">
					Irving Coin
				</span>

			</div>


			{#each filteredTotals as row}

				<div
					class="standing-row"
					class:leader={row.rank ===
						1}
				>

					<div class="rank">
						#{row.rank}
					</div>


					<button
						type="button"
						class="gm-button"
						class:open={expanded.has(
							row.user_id
						)}
						on:click={() =>
							toggleUser(
								row.user_id
							)}
						aria-expanded={expanded.has(
							row.user_id
						)}
					>
						<span class="chevron">
							›
						</span>

						<strong>
							{row.display_name}
						</strong>
					</button>


					<div class="score-cell">

						<div class="score-bar">
							<div
								class="score-fill"
								style={`width: ${pct(
									row.points
								)}%`}
							></div>
						</div>

						<strong>
							{row.points}
						</strong>

					</div>

				</div>


				{#if expanded.has(
					row.user_id
				)}
					<div class="breakdown-row">

						{#if data.byUser?.[
							row.user_id
						]?.length}

							<div class="event-list">

								{#each (
									gameFilter ===
									ALL
										? data.byUser[
												row.user_id
											]
										: (
												data.byUser[
													row.user_id
												] ||
												[]
											).filter(
												(ev) =>
													ev?.type ===
													gameFilter
											)
								) as ev (
									ev.event_id
								)}

									<article class="event-block">

										<div class="event-header">

											<div class="event-identity">

												{#if eventDisplay(
													ev
												).logo}
													<img
														src={eventDisplay(
															ev
														).logo}
														alt={`${eventDisplay(
															ev
														).title} logo`}
														loading="lazy"
													/>
												{/if}


												<div class="event-copy">

													<div class="event-meta">
														<span>
															{prettyGameLabel(
																ev.type
															)}
														</span>

														<span
															class:complete={evIsPast(
																ev
															)}
															class="event-status"
														>
															{evStatusText(
																ev
															)}
														</span>
													</div>

													<strong>
														{eventDisplay(
															ev
														).title}
													</strong>

												</div>

											</div>


											<div class="event-points">
												<strong>
													{ev.points}
												</strong>

												<span>
													Points
												</span>
											</div>

										</div>


										{#if hasAnyBreakdown(
											ev
										)}
											{@const Breakdown =
												getLeaderboardBreakdownComponent(
													ev.type
												)}

											{#if Breakdown}
												<div class="event-breakdown">

													<svelte:component
														this={Breakdown}
														ev={ev}
														row={ev}
														breakdown={ev.breakdown}
														totals={ev.totals}
														points={ev.points}
														teamLogoById={data.teamLogoById}
													/>

												</div>
											{:else}
												<div class="empty-breakdown">
													No breakdown renderer registered
													for {ev.type}.
												</div>
											{/if}
										{:else}
											<div class="empty-breakdown">
												No breakdown available.
											</div>
										{/if}

									</article>

								{/each}

							</div>

						{:else}
							<div class="empty-breakdown">
								No scored events yet.
							</div>
						{/if}

					</div>
				{/if}

			{/each}

		</div>

	</section>

</div>


<style>
	/* ==================================================
	   SUBNAV
	   ================================================== */

	.games-subnav {
		width: 100%;
		max-width: 1500px;

		display: flex;
		align-items: center;

		gap: 4px;

		margin:
			10px auto
			22px;

		padding:
			0 0 9px;

		border-bottom:
			1px solid
			var(--border);
	}


	.games-bug {
		width: 38px;
		height: 38px;

		display: grid;
		place-items: center;

		flex: 0 0 auto;

		margin-right: 16px;

		border:
			1px solid
			var(--brand-gold);

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size: 1.1rem;

		line-height: 1;
	}


	.games-subnav a {
		display: grid;

		gap: 2px;

		padding:
			8px 13px;

		border-bottom:
			1px solid
			transparent;

		color:
			var(--brand-stone);

		text-decoration: none;
	}


	.games-subnav a strong {
		font-size: .68rem;

		font-weight: 850;

		letter-spacing: .06em;

		text-transform: uppercase;
	}


	.games-subnav a small {
		color:
			rgba(157,155,145,.72);

		font-size: .56rem;

		letter-spacing: .08em;

		text-transform: uppercase;
	}


	.games-subnav a:hover,
	.games-subnav a.active {
		border-bottom-color:
			var(--brand-gold);

		color:
			var(--brand-sand);
	}


	.games-subnav a.active small {
		color:
			var(--brand-gold);
	}


	/* ==================================================
	   PAGE
	   ================================================== */

	.leaderboard-page {
		width: 100%;
		max-width: 1500px;

		display: grid;

		gap: 34px;

		margin: 0 auto;

		padding-bottom: 70px;
	}


	.eyebrow {
		color:
			var(--brand-gold);

		font-size: .64rem;

		font-weight: 850;

		letter-spacing: .12em;

		text-transform: uppercase;
	}


	/* ==================================================
	   HERO
	   ================================================== */

	.hero {
		position: relative;

		display: grid;

		grid-template-columns:
			minmax(0,1fr)
			290px;

		gap: 44px;

		overflow: hidden;

		padding:
			38px
			clamp(
				30px,
				4vw,
				54px
			)
			0;

		border:
			1px solid
			var(--border-strong);

		border-radius:
			var(--radius-lg);

		background:
			linear-gradient(
				120deg,
				rgba(191,161,106,.04),
				transparent 42%
			),
			var(--panel-strong);

		box-shadow:
			var(--shadow-panel);
	}


	.hero-copy {
		position: relative;

		z-index: 2;
	}


	.hero h1 {
		margin:
			8px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				4.5rem,
				8vw,
				7.5rem
			);

		font-weight: 400;

		line-height: .84;

		letter-spacing: -.025em;

		text-transform: uppercase;
	}


	.hero-copy p {
		max-width: 720px;

		margin:
			20px 0 0;

		color:
			var(--muted);

		font-size: .95rem;

		font-weight: 600;

		line-height: 1.6;
	}


	.leader-callout {
		position: relative;

		z-index: 2;

		align-self: center;

		display: grid;

		gap: 6px;

		padding:
			20px;

		border:
			1px solid
			rgba(191,161,106,.28);

		background:
			rgba(7,10,9,.55);
	}


	.leader-callout > span {
		color:
			var(--brand-gold);

		font-size: .61rem;

		font-weight: 850;

		letter-spacing: .1em;

		text-transform: uppercase;
	}


	.leader-callout > strong {
		color:
			var(--brand-ivory);

		font-size: 1rem;

		font-weight: 800;
	}


	.leader-score {
		display: flex;

		align-items: baseline;

		gap: 8px;

		margin-top: 8px;

		color:
			var(--brand-sand);

		font-family:
			var(--font-display);

		font-size: 2.5rem;

		line-height: 1;
	}


	.leader-score small {
		color:
			var(--brand-stone);

		font-family: inherit;

		font-size: .78rem;
	}


	.hero-bottom {
		position: relative;

		z-index: 2;

		grid-column:
			1 / -1;

		display: grid;

		grid-template-columns:
			130px
			130px
			180px
			minmax(0,1fr);

		align-items: stretch;

		margin-top: 6px;

		border-top:
			1px solid
			var(--border);
	}


	.hero-stat {
		display: grid;

		gap: 3px;

		align-content: center;

		min-height: 70px;

		padding:
			12px 16px;

		border-right:
			1px solid
			var(--border);
	}


	.hero-stat strong {
		color:
			var(--brand-sand);

		font-family:
			var(--font-display);

		font-size: 1.45rem;

		font-weight: 400;

		line-height: 1;
	}


	.hero-stat.updated strong {
		font-size: 1.1rem;
	}


	.hero-stat span {
		color:
			var(--brand-stone);

		font-size: .58rem;

		font-weight: 750;

		letter-spacing: .06em;

		text-transform: uppercase;
	}


	.filter-group {
		display: flex;

		align-items: center;

		justify-content: flex-end;

		gap: 14px;

		padding:
			12px 0
			12px 18px;
	}


	.filter-label {
		color:
			var(--brand-stone);

		font-size: .59rem;

		font-weight: 850;

		letter-spacing: .1em;

		text-transform: uppercase;
	}


	.filters {
		display: flex;

		flex-wrap: wrap;

		justify-content: flex-end;

		gap: 6px;
	}


	.filters button {
		min-height: 34px;

		cursor: pointer;

		padding:
			0 11px;

		border:
			1px solid
			var(--border-strong);

		border-radius: 2px;

		background:
			#0a0e0d;

		color:
			var(--brand-stone);

		font: inherit;

		font-size: .64rem;

		font-weight: 800;
	}


	.filters button:hover,
	.filters button.active {
		border-color:
			var(--brand-gold);

		color:
			var(--brand-charcoal);

		background:
			var(--brand-gold);
	}


	.hero-watermark {
		position: absolute;

		right: -20px;

		bottom: -52px;

		color:
			rgba(191,161,106,.018);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				10rem,
				18vw,
				16rem
			);

		line-height: 1;

		pointer-events: none;
	}


	/* ==================================================
	   SECTION HEADINGS
	   ================================================== */

	.section-heading {
		display: flex;

		justify-content: space-between;

		align-items: end;

		gap: 20px;

		padding-bottom: 13px;

		border-bottom:
			1px solid
			var(--border);
	}


	.section-heading h2 {
		margin:
			5px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				2.4rem,
				4vw,
				3.4rem
			);

		font-weight: 400;

		line-height: .95;

		text-transform: uppercase;
	}


	.section-heading > span {
		color:
			var(--brand-stone);

		font-size: .63rem;

		font-weight: 800;

		letter-spacing: .08em;

		text-transform: uppercase;
	}


	/* ==================================================
	   PODIUM
	   ================================================== */

	.podium-section {
		display: grid;

		gap: 14px;
	}


	.podium {
		display: grid;

		grid-template-columns:
			repeat(
				3,
				minmax(0,1fr)
			);

		gap: 10px;
	}


	.podium-count-2 {
		grid-template-columns:
			repeat(
				2,
				minmax(0,1fr)
			);
	}


	.podium-count-1 {
		grid-template-columns:
			minmax(
				0,
				1fr
			);
	}


	.podium-card {
		position: relative;

		min-width: 0;

		display: grid;

		grid-template-columns:
			54px
			minmax(0,1fr)
			auto;

		gap: 14px;

		align-items: center;

		padding:
			18px 19px;

		cursor: pointer;

		border:
			1px solid
			var(--border);

		border-radius:
			var(--radius-sm);

		background:
			var(--panel);

		color: inherit;

		text-align: left;

		transition:
			transform 120ms ease,
			border-color 120ms ease;
	}


	.podium-card:hover {
		transform:
			translateY(-2px);

		border-color:
			rgba(191,161,106,.44);
	}


	.podium-card.champion {
		border-color:
			rgba(191,161,106,.5);

		background:
			linear-gradient(
				110deg,
				rgba(191,161,106,.07),
				transparent 46%
			),
			var(--panel);
	}


	.podium-rank {
		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size: 1.55rem;

		line-height: 1;
	}


	.crown {
		font-size: 1.8rem;
	}


	.podium-person {
		min-width: 0;

		display: grid;

		gap: 4px;
	}


	.podium-person strong {
		overflow: hidden;

		color:
			var(--brand-ivory);

		font-size: .95rem;

		text-overflow: ellipsis;

		white-space: nowrap;
	}


	.podium-person span {
		color:
			var(--brand-stone);

		font-size: .68rem;
	}


	.podium-score {
		display: grid;

		justify-items: end;

		gap: 2px;
	}


	.podium-score strong {
		color:
			var(--brand-sand);

		font-family:
			var(--font-display);

		font-size: 2.1rem;

		font-weight: 400;

		line-height: 1;
	}


	.podium-score span {
		color:
			var(--brand-stone);

		font-size: .56rem;

		font-weight: 750;

		text-transform: uppercase;
	}


	/* ==================================================
	   FULL BOARD
	   ================================================== */

	.standings-section {
		display: grid;

		gap: 0;
	}


	.board-heading {
		margin-bottom: 0;
	}


	.leaderboard-table {
		width: 100%;
	}


	.table-head,
	.standing-row {
		display: grid;

		grid-template-columns:
			86px
			minmax(0,1fr)
			300px;

		align-items: center;
	}


	.table-head {
		min-height: 42px;

		padding:
			0 14px;

		border-bottom:
			1px solid
			var(--border-strong);

		color:
			var(--brand-stone);

		font-size: .6rem;

		font-weight: 850;

		letter-spacing: .09em;

		text-transform: uppercase;
	}


	.right {
		text-align: right;
	}


	.standing-row {
		min-height: 70px;

		padding:
			0 14px;

		border-bottom:
			1px solid
			var(--border);

		transition:
			background 120ms ease;
	}


	.standing-row:hover {
		background:
			rgba(191,161,106,.018);
	}


	.standing-row.leader {
		background:
			linear-gradient(
				90deg,
				rgba(191,161,106,.055),
				transparent 34%
			);
	}


	.standing-row.leader::before {
		content: '';

		position: absolute;
	}


	.rank {
		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size: 1.35rem;
	}


	.gm-button {
		min-width: 0;

		display: inline-flex;

		align-items: center;

		gap: 11px;

		justify-self: start;

		cursor: pointer;

		padding: 0;

		border: 0;

		background: transparent;

		color:
			var(--brand-ivory);

		font: inherit;
	}


	.gm-button strong {
		overflow: hidden;

		font-size: .86rem;

		text-overflow: ellipsis;

		white-space: nowrap;
	}


	.chevron {
		display: inline-block;

		color:
			var(--brand-gold);

		font-size: 1.2rem;

		transition:
			transform 120ms ease;
	}


	.gm-button.open .chevron {
		transform:
			rotate(90deg);
	}


	.score-cell {
		display: grid;

		grid-template-columns:
			minmax(
				80px,
				1fr
			)
			50px;

		align-items: center;

		gap: 14px;
	}


	.score-bar {
		height: 4px;

		overflow: hidden;

		background:
			rgba(191,161,106,.08);
	}


	.score-fill {
		height: 100%;

		background:
			var(--brand-gold);
	}


	.score-cell > strong {
		color:
			var(--brand-sand);

		font-family:
			var(--font-display);

		font-size: 1.3rem;

		font-weight: 400;

		text-align: right;
	}


	/* ==================================================
	   BREAKDOWN
	   ================================================== */

	.breakdown-row {
		padding:
			0 14px
			22px 100px;

		border-bottom:
			1px solid
			var(--border);

		animation:
			drop 140ms ease-out;
	}


	@keyframes drop {
		from {
			opacity: 0;

			transform:
				translateY(-5px);
		}

		to {
			opacity: 1;

			transform:
				translateY(0);
		}
	}


	.event-list {
		display: grid;
	}


	.event-block {
		padding:
			18px 0;

		border-bottom:
			1px solid
			var(--border);
	}


	.event-block:last-child {
		border-bottom: 0;
	}


	.event-header {
		display: flex;

		align-items: center;

		justify-content: space-between;

		gap: 20px;
	}


	.event-identity {
		min-width: 0;

		display: flex;

		align-items: center;

		gap: 14px;
	}


	.event-identity img {
		width: 54px;
		height: 54px;

		flex: 0 0 auto;

		object-fit: contain;

		border:
			1px solid
			var(--border-strong);

		background:
			#0a0e0d;
	}


	.event-copy {
		min-width: 0;

		display: grid;

		gap: 5px;
	}


	.event-meta {
		display: flex;

		flex-wrap: wrap;

		align-items: center;

		gap: 8px;
	}


	.event-meta > span:first-child {
		color:
			var(--brand-gold);

		font-size: .57rem;

		font-weight: 850;

		letter-spacing: .08em;

		text-transform: uppercase;
	}


	.event-status {
		padding:
			3px 6px;

		border:
			1px solid
			var(--border);

		color:
			var(--brand-stone);

		font-size: .52rem;

		font-weight: 750;

		text-transform: uppercase;
	}


	.event-status.complete {
		color:
			#92b89b;

		border-color:
			rgba(146,184,155,.35);
	}


	.event-copy > strong {
		color:
			var(--brand-ivory);

		font-size: .88rem;
	}


	.event-points {
		display: grid;

		justify-items: end;
	}


	.event-points strong {
		color:
			var(--brand-sand);

		font-family:
			var(--font-display);

		font-size: 1.55rem;

		font-weight: 400;

		line-height: 1;
	}


	.event-points span {
		margin-top: 2px;

		color:
			var(--brand-stone);

		font-size: .54rem;

		font-weight: 750;

		text-transform: uppercase;
	}


	.event-breakdown {
		margin-top: 14px;

		padding-top: 14px;

		border-top:
			1px solid
			rgba(191,161,106,.12);
	}


	.empty-breakdown {
		margin-top: 12px;

		color:
			var(--brand-stone);

		font-size: .72rem;
	}


	/* ==================================================
	   MOBILE
	   ================================================== */

	@media (max-width: 1000px) {

		.hero {
			grid-template-columns:
				1fr;
		}


		.leader-callout {
			max-width: 320px;
		}


		.hero-bottom {
			grid-template-columns:
				repeat(
					3,
					1fr
				);
		}


		.filter-group {
			grid-column:
				1 / -1;

			justify-content:
				flex-start;

			border-top:
				1px solid
				var(--border);

			padding:
				14px 0;
		}


		.filters {
			justify-content:
				flex-start;
		}


		.podium,
		.podium-count-2 {
			grid-template-columns:
				1fr;
		}


		.table-head,
		.standing-row {
			grid-template-columns:
				70px
				minmax(0,1fr)
				200px;
		}


		.breakdown-row {
			padding-left:
				84px;
		}

	}


	@media (max-width: 650px) {

		.games-subnav {
			overflow-x: auto;

			flex-wrap: nowrap;
		}


		.games-subnav a {
			flex: 0 0 auto;
		}


		.hero {
			padding:
				28px 21px 0;
		}


		.hero h1 {
			font-size:
				clamp(
					4rem,
					18vw,
					5.5rem
				);
		}


		.hero-bottom {
			grid-template-columns:
				1fr 1fr;
		}


		.hero-stat.updated {
			grid-column:
				1 / -1;

			border-top:
				1px solid
				var(--border);
		}


		.table-head {
			grid-template-columns:
				58px
				1fr
				75px;
		}


		.standing-row {
			grid-template-columns:
				58px
				1fr
				75px;

			padding:
				0 5px;
		}


		.score-cell {
			grid-template-columns:
				1fr;
		}


		.score-bar {
			display: none;
		}


		.breakdown-row {
			padding:
				0 5px
				18px 63px;
		}


		.event-header {
			align-items:
				flex-start;
		}


		.event-identity img {
			width: 44px;
			height: 44px;
		}

	}
</style>