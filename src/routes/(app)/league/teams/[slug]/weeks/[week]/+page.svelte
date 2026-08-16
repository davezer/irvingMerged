<script>
	import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';

	export let data;

	$: actualScore =
		Number(
			data.actualScore ||
				0
		);

	$: opponentScore =
		Number(
			data.opponent?.score ||
				0
		);

	$: optimalScore =
		Number(
			data.lineupSnapshot?.optimalScore ||
				0
		);

	$: lineupIQ =
		Number(
			data.lineupSnapshot?.lineupIQ ||
				0
		);

	$: benchSwing =
		Number(
			data.lineupSnapshot?.benchPoints ||
				0
		);

	$: resultLabel =
		!data.opponent
			? 'BYE'
			: actualScore >
					opponentScore
				? 'WIN'
				: actualScore <
						opponentScore
					? 'LOSS'
					: 'TIE';
</script>


<div class="page-stack">
	<LeagueSubnav
		season={data.season}
		active="teams"
	/>


	<section class="week-hero">
		<div class="week-hero-copy">
			<div class="eyebrow">
				Week {data.week} film room
			</div>

			<h1>
				{data.manager.liveTeamName}
			</h1>

			<p class="matchup-line">
				{data.manager.name}
				<span>vs</span>
				{data.opponent?.teamName ||
					'Bye'}
			</p>

			<div
				class={`result-chip result-${resultLabel.toLowerCase()}`}
			>
				{resultLabel}

				{#if data.opponent}
					<span>
						{actualScore.toFixed(2)}
						–
						{opponentScore.toFixed(2)}
					</span>
				{/if}
			</div>


			<div class="week-nav">
				{#if data.previousWeek}
					<a
						href={`/league/teams/${data.manager.slug}/weeks/${data.previousWeek}?season=${data.season}`}
					>
						← Week
						{data.previousWeek}
					</a>
				{/if}

				<a href={data.sections.team}>
					Franchise dossier
				</a>

				<a href={data.sections.dossier}>
					Manager dossier
				</a>

				{#if data.nextWeek}
					<a
						href={`/league/teams/${data.manager.slug}/weeks/${data.nextWeek}?season=${data.season}`}
					>
						Week
						{data.nextWeek} →
					</a>
				{/if}
			</div>
		</div>


		<div class="score-card">
			<div>
				<span>
					Actual
				</span>

				<strong>
					{actualScore.toFixed(2)}
				</strong>
			</div>

			<div>
				<span>
					Opponent
				</span>

				<strong>
					{data.opponent
						? opponentScore.toFixed(2)
						: '—'}
				</strong>
			</div>

			<div>
				<span>
					Optimal
				</span>

				<strong>
					{optimalScore.toFixed(2)}
				</strong>
			</div>

			<div>
				<span>
					Lineup IQ
				</span>

				<strong>
					{lineupIQ.toFixed(1)}%
				</strong>
			</div>

			<div>
				<span>
					Bench points
				</span>

				<strong>
					{benchSwing.toFixed(2)}
				</strong>
			</div>
		</div>
	</section>


	<section class="grid two-up">
		<article class="card lineup-card">
			<div class="section-head">
				<div>
					<div class="eyebrow">
						Game tape
					</div>

					<h2>
						Actual Starters
					</h2>
				</div>

				<span>
					{actualScore.toFixed(2)}
					pts
				</span>
			</div>

			<div class="stack">
				{#each data.lineupSnapshot?.actualStarterScores || [] as row}
					<div class="player-row">
						{#if row.player}
							<img
								src={row.player.photoUrl}
								alt={row.player.name}
							/>
						{:else}
							<div class="placeholder">
								?
							</div>
						{/if}

						<div>
							<strong>
								{row.player?.name ||
									row.playerId}
							</strong>

							<small>
								{row.player?.position ||
									'—'}
								·
								{row.player?.teamLabel ||
									row.player?.team ||
									'FA'}
							</small>
						</div>

						<span>
							{row.score.toFixed(2)}
						</span>
					</div>
				{/each}
			</div>
		</article>


		<article class="card lineup-card">
			<div class="section-head">
				<div>
					<div class="eyebrow">
						Perfect world
					</div>

					<h2>
						Optimal Lineup
					</h2>
				</div>

				<span>
					{optimalScore.toFixed(2)}
					pts
				</span>
			</div>

			<div class="stack">
				{#each data.lineupSnapshot?.optimalSlots || [] as row}
					<div class="player-row">
						<img
							src={row.player.photoUrl}
							alt={row.player.name}
						/>

						<div>
							<strong>
								{row.player.name}
							</strong>

							<small>
								{row.slot}
								·
								{row.player.position ||
									'—'}
								·
								{row.player.teamLabel ||
									row.player.team ||
									'FA'}
							</small>
						</div>

						<span>
							{row.score.toFixed(2)}
						</span>
					</div>
				{/each}
			</div>
		</article>
	</section>


	<section class="grid two-up">
		<article class="card">
			<div class="section-head">
				<div>
					<div class="eyebrow">
						Bench regret
					</div>

					<h2>
						Missed Ceiling
					</h2>
				</div>
			</div>

			<div class="stack">
				{#each data.lineupSnapshot?.topBenchCandidates || [] as row}
					<div class="player-row regret-row">
						<img
							src={row.player.photoUrl}
							alt={row.player.name}
						/>

						<div>
							<strong>
								{row.player.name}
							</strong>

							<small>
								{row.slot}
								upgrade ·
								{row.player.position ||
									'—'}
								·
								{row.player.teamLabel ||
									row.player.team ||
									'FA'}
							</small>
						</div>

						<span>
							{row.score.toFixed(2)}
						</span>
					</div>
				{/each}

				{#if !(data.lineupSnapshot?.topBenchCandidates || []).length}
					<div class="empty">
						No missed starters this week.
						Beautiful work.
					</div>
				{/if}
			</div>
		</article>


		<article class="card">
			<div class="section-head">
				<div>
					<div class="eyebrow">
						Across the field
					</div>

					<h2>
						Opponent
					</h2>
				</div>
			</div>

			{#if data.opponent}
				<div class="opponent-card">
					<div class="team-photo">
						{#if data.opponent.teamPhoto}
							<img
								src={data.opponent.teamPhoto}
								alt={data.opponent.teamName}
							/>
						{:else}
							<span>
								?
							</span>
						{/if}
					</div>

					<div>
						<strong>
							{data.opponent.teamName}
						</strong>

						<small>
							{data.opponent.managerName}
						</small>
					</div>

					<span>
						{data.opponent.score.toFixed(2)}
					</span>
				</div>

				<div class="link-row">
					<a href={data.sections.games}>
						Open matchup board
					</a>

					{#if data.opponent.managerSlug}
						<a
							href={`/league/teams/${data.opponent.managerSlug}?season=${data.season}`}
						>
							Opponent franchise
						</a>
					{/if}
				</div>

			{:else}

				<div class="empty">
					Bye week or missing opponent data.
				</div>

			{/if}
		</article>
	</section>
</div>


<style>
	.page-stack,
	.stack {
		display: grid;
		gap: 18px;
	}


	.page-stack {
		max-width: 1500px;
		margin: 0 auto;
		padding-bottom: 46px;
	}


	.eyebrow {
		color: var(--brand-gold);
		font-size: .61rem;
		font-weight: 800;
		letter-spacing: .16em;
		text-transform: uppercase;
	}


	/* =====================================================
	   HERO
	   ===================================================== */

	.week-hero {
		position: relative;
		display: grid;
		grid-template-columns:
			minmax(0,1fr)
			minmax(390px,.7fr);
		gap: 30px;
		overflow: hidden;
		padding: 28px;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		background:
			linear-gradient(
				120deg,
				rgba(191,161,106,.055),
				transparent 38%
			),
			var(--panel-strong);
		box-shadow: var(--shadow-panel);
	}


	.week-hero::after {
		content: 'FILM ROOM';
		position: absolute;
		right: 24px;
		bottom: -20px;
		color: rgba(191,161,106,.024);
		font-family: var(--font-display);
		font-size: clamp(5rem,10vw,9rem);
		line-height: 1;
		pointer-events: none;
	}


	.week-hero-copy,
	.score-card {
		position: relative;
		z-index: 1;
	}


	.week-hero h1 {
		margin: 7px 0 0;
		color: var(--brand-ivory);
		font-family: var(--font-display);
		font-size: clamp(3.5rem,7vw,6.7rem);
		font-weight: 400;
		line-height: .84;
	}


	.matchup-line {
		margin: 15px 0 0;
		color: var(--brand-sand);
		font-size: 1rem;
		font-weight: 750;
	}


	.matchup-line span {
		margin: 0 6px;
		color: var(--brand-stone);
		font-size: .72rem;
		text-transform: uppercase;
	}


	.result-chip {
		width: fit-content;
		display: flex;
		gap: 8px;
		margin-top: 13px;
		padding: 5px 8px;
		border: 1px solid var(--border);
		border-radius: 3px;
		color: var(--brand-ivory);
		font-size: .62rem;
		font-weight: 850;
		letter-spacing: .09em;
	}


	.result-chip span {
		color: var(--brand-stone);
	}


	.result-win {
		border-color: rgba(145,182,156,.48);
	}


	.result-loss {
		border-color: rgba(217,133,133,.48);
	}


	.result-tie,
	.result-bye {
		border-color: rgba(191,161,106,.35);
	}


	/* =====================================================
	   WEEK NAV
	   ===================================================== */

	.week-nav,
	.link-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}


	.week-nav {
		margin-top: 23px;
		padding-top: 15px;
		border-top: 1px solid rgba(191,161,106,.12);
	}


	.week-nav a,
	.link-row a {
		padding: 7px 9px;
		border: 1px solid rgba(191,161,106,.17);
		border-radius: 3px;
		color: var(--brand-sand);
		font-size: .61rem;
		font-weight: 750;
		letter-spacing: .05em;
		text-decoration: none;
		text-transform: uppercase;
	}


	.week-nav a:hover,
	.link-row a:hover {
		border-color: var(--brand-gold);
		color: var(--brand-gold);
	}


	/* =====================================================
	   SCORE CARD
	   ===================================================== */

	.score-card {
		display: grid;
		grid-template-columns:
			repeat(2,minmax(0,1fr));
		gap: 1px;
		overflow: hidden;
		align-self: stretch;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--border);
	}


	.score-card div {
		display: grid;
		align-content: center;
		gap: 5px;
		min-height: 92px;
		padding: 13px 15px;
		background: rgba(8,11,10,.94);
	}


	.score-card div:last-child {
		grid-column: 1 / -1;
	}


	.score-card span {
		color: var(--brand-stone);
		font-size: .57rem;
		font-weight: 800;
		letter-spacing: .12em;
		text-transform: uppercase;
	}


	.score-card strong {
		color: var(--brand-ivory);
		font-family: var(--font-display);
		font-size: 1.9rem;
		font-weight: 400;
		font-variant-numeric: tabular-nums;
	}


	/* =====================================================
	   CONTENT CARDS
	   ===================================================== */

	.grid.two-up {
		display: grid;
		grid-template-columns:
			repeat(2,minmax(0,1fr));
		gap: 16px;
	}


	.card {
		padding: 18px;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background:
			linear-gradient(
				180deg,
				rgba(255,255,255,.018),
				transparent
			),
			var(--panel);
		box-shadow: var(--shadow-panel);
	}


	.section-head {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 13px;
	}


	.section-head h2 {
		margin: 4px 0 0;
		color: var(--brand-ivory);
		font-family: var(--font-display);
		font-size: 1.85rem;
		font-weight: 400;
		line-height: 1;
	}


	.section-head > span {
		color: var(--brand-gold);
		font-family: var(--font-display);
		font-size: 1.15rem;
	}


	/* =====================================================
	   PLAYERS
	   ===================================================== */

	.player-row,
	.opponent-card {
		display: grid;
		grid-template-columns:
			38px
			minmax(0,1fr)
			auto;
		gap: 10px;
		align-items: center;
		padding: 9px 10px;
		border: 1px solid rgba(191,161,106,.10);
		border-radius: 4px;
		background: rgba(255,255,255,.012);
	}


	.player-row img,
	.placeholder,
	.team-photo {
		width: 38px;
		height: 38px;
		display: grid;
		place-items: center;
		overflow: hidden;
		border: 1px solid rgba(191,161,106,.18);
		border-radius: 3px;
		background: rgba(255,255,255,.025);
	}


	.player-row img {
		object-fit: contain;
	}


	.team-photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}


	.player-row strong,
	.opponent-card strong {
		display: block;
		color: var(--brand-ivory);
		font-size: .75rem;
	}


	.player-row small,
	.opponent-card small {
		display: block;
		margin-top: 2px;
		color: var(--muted);
		font-size: .62rem;
	}


	.player-row > span,
	.opponent-card > span {
		color: var(--brand-gold);
		font-family: var(--font-display);
		font-size: 1.22rem;
		font-variant-numeric: tabular-nums;
	}


	.regret-row {
		border-left: 2px solid rgba(217,133,133,.55);
	}


	.empty {
		padding: 13px;
		border: 1px solid rgba(191,161,106,.10);
		border-radius: 4px;
		background: rgba(255,255,255,.012);
		color: var(--muted);
	}


	.link-row {
		margin-top: 12px;
	}


	/* =====================================================
	   RESPONSIVE
	   ===================================================== */

	@media (max-width: 980px) {
		.week-hero {
			grid-template-columns: 1fr;
		}

		.score-card {
			grid-template-columns:
				repeat(3,minmax(0,1fr));
		}

		.score-card div:last-child {
			grid-column: auto;
		}
	}


	@media (max-width: 760px) {
		.grid.two-up {
			grid-template-columns: 1fr;
		}

		.week-hero {
			padding: 18px;
		}

		.week-hero::after {
			display: none;
		}
	}


	@media (max-width: 520px) {
		.score-card {
			grid-template-columns:
				1fr 1fr;
		}

		.score-card div:last-child {
			grid-column: 1 / -1;
		}
	}
</style>