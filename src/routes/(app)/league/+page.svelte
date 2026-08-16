<script>
	import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';

	export let data;


	function moveTypeClass(type) {
		const value =
			String(type || '')
				.toLowerCase();

		if (value.includes('trade'))
			return 'trade';

		if (value.includes('waiver'))
			return 'waiver';

		if (value.includes('free'))
			return 'free-agent';

		return 'other';
	}


	function moveTypeLabel(type) {
		const value =
			String(type || '')
				.replace(/_/g, ' ')
				.trim();

		if (!value)
			return 'TRANSACTION';

		return value.toUpperCase();
	}


	function teamInitials(name) {
		return String(name || '')
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 3)
			.map((word) => word[0])
			.join('')
			.toUpperCase();
	}


	function findMoveTeam(name) {
		const pool = [
			...(data.topBoard || []),
			...(data.activityLeaders || []),
			...(data.featuredManagers || [])
		];

		return pool.find(
			(team) =>
				String(
					team.teamName || ''
				).toLowerCase() ===
				String(name || '')
					.trim()
					.toLowerCase()
		);
	}


	function moveTeams(move) {
		const names =
			String(move.summary || '')
				.split(/\s*↔\s*/)
				.map((name) => name.trim())
				.filter(Boolean);

		return names.map(
			(name) => {
				const team =
					findMoveTeam(name);

				return {
					name,
					photo:
						team?.teamPhoto ||
						null,
					initials:
						team?.initials ||
						teamInitials(
							name
						)
				};
			}
		);
	}


	$: season =
		Number(
			data.season ||
				new Date().getFullYear()
		);

	$: availableWeeks =
		Array.isArray(
			data.availableWeeks
		)
			? data.availableWeeks
			: [];

	$: recentWeekQuery =
		availableWeeks
			.slice(-4)
			.join(',');

	$: wireRoomHref =
		recentWeekQuery
			? `/league/transactions?season=${season}&weeks=${recentWeekQuery}`
			: `/league/transactions?season=${season}`;

	$: topBoard =
		data.topBoard || [];

	$: activityLeaders =
		data.activityLeaders || [];

	$: recentMoves =
		data.recentMoves || [];
</script>


<div class="page-stack">

	<LeagueSubnav
		season={season}
		active="league"
	/>


	<!-- ==================================================
	     LEAGUE HERO
	     ================================================== -->

	<section class="league-hero">

		<div class="hero-copy">

			<div class="eyebrow">
				League headquarters
			</div>

			<h1>
				{data.leagueName}
			</h1>

			<div class="manifesto">
				<strong>
					Fourteen franchises.
					One trophy.
					Zero sympathy.
				</strong>

				<p>
					Every week leaves receipts.
					Wins, losses, bad beats,
					and worse decisions.
				</p>
			</div>

		</div>


		<div
			class="league-pulse"
			aria-label="League pulse"
		>

			<article class="pulse-card">
				<span>
					Top seed
				</span>

				<strong>
					{data.pulse?.topSeed
						?.teamName ||
						'—'}
				</strong>

				<small>
					{data.pulse?.topSeed
						?.recordLabel ||
						'No record yet'}
				</small>
			</article>


			<article class="pulse-card">
				<span>
					Hottest offense
				</span>

				<strong>
					{data.pulse?.hottest
						?.teamName ||
						'—'}
				</strong>

				<small>
					{data.pulse?.hottest
						?.points != null
						? `${Number(
								data.pulse
									.hottest
									.points
							).toFixed(
								2
							)} PF`
						: 'No data yet'}
				</small>
			</article>


			<article class="pulse-card">
				<span>
					Most active
				</span>

				<strong>
					{activityLeaders[0]
						?.teamName ||
						'—'}
				</strong>

				<small>
					{activityLeaders[0]
						? `${activityLeaders[0].activityCount} logged moves`
						: 'No movement yet'}
				</small>
			</article>


			<article class="pulse-card">
				<span>
					Draft room
				</span>

				<strong>
					{data.draft
						? `${data.draft.teams} teams`
						: 'Archive ready'}
				</strong>

				<small>
					{data.draft
						? `${data.draft.rounds} rounds · ${String(
								data.draft
									.status ||
									''
							).replace(
								/_/g,
								' '
							)}`
						: 'Sleeper-powered archive'}
				</small>
			</article>

		</div>

	</section>


	<!-- ==================================================
	     STANDINGS + MATCHUP SPOTLIGHT
	     ================================================== -->

	<section class="primary-grid">

		<article class="panel standings-panel">

			<header class="section-head">

				<div>
					<div class="eyebrow">
						League table
					</div>

					<h2>
						Top of the Board
					</h2>
				</div>

				<a
					href={`/league/standings?season=${season}`}
				>
					Full standings →
				</a>

			</header>


			<div class="standings-list">

				{#each topBoard as row}

					<a
						class="standing-row"
						href={row.slug
							? `/league/teams/${row.slug}?season=${season}`
							: `/league/standings?season=${season}`}
					>

						<span class="rank">
							#{row.rank}
						</span>


						<div class="team-logo">

							{#if row.teamPhoto}

								<img
									src={row.teamPhoto}
									alt={row.teamName}
								/>

							{:else}

								<span>
									{row.initials}
								</span>

							{/if}

						</div>


						<div class="standing-identity">

							<strong>
								{row.teamName}
							</strong>

							<small>
								{row.managerName}
							</small>

						</div>


						<strong class="record">
							{row.recordLabel}
						</strong>

					</a>

				{/each}

			</div>

		</article>


		<article class="panel spotlight-panel">

			<header class="section-head">

				<div>
					<div class="eyebrow">
						Matchup desk
					</div>

					<h2>
						Week {data.selectedWeek}
						Spotlight
					</h2>
				</div>

				<a
					href={`/league/matchups?season=${season}&week=${data.selectedWeek}`}
				>
					Open matchups →
				</a>

			</header>


			{#if data.spotlightMatchup}

				<div class="spotlight">

					<div class="spotlight-team">

						<div class="spotlight-logo">

							{#if data.spotlightMatchup.left.teamPhoto}

								<img
									src={data.spotlightMatchup.left.teamPhoto}
									alt={data.spotlightMatchup.left.teamName}
								/>

							{:else}

								<span>
									{data.spotlightMatchup.left.initials}
								</span>

							{/if}

						</div>


						<div class="spotlight-team-copy">

							<strong>
								{data.spotlightMatchup.left.teamName}
							</strong>

							<small>
								{data.spotlightMatchup.left.managerName}
							</small>

						</div>


						<span class="spotlight-score">
							{data.spotlightMatchup.leftScore.toFixed(
								2
							)}
						</span>

					</div>


					<div class="versus">
						VS
					</div>


					<div class="spotlight-team">

						<div class="spotlight-logo">

							{#if data.spotlightMatchup.right.teamPhoto}

								<img
									src={data.spotlightMatchup.right.teamPhoto}
									alt={data.spotlightMatchup.right.teamName}
								/>

							{:else}

								<span>
									{data.spotlightMatchup.right.initials}
								</span>

							{/if}

						</div>


						<div class="spotlight-team-copy">

							<strong>
								{data.spotlightMatchup.right.teamName}
							</strong>

							<small>
								{data.spotlightMatchup.right.managerName}
							</small>

						</div>


						<span class="spotlight-score">
							{data.spotlightMatchup.rightScore.toFixed(
								2
							)}
						</span>

					</div>


					<div class="spotlight-footer">

						<div>
							<span>
								Combined
							</span>

							<strong>
								{data.spotlightMatchup.totalScore.toFixed(
									2
								)}
							</strong>
						</div>

						<div>
							<span>
								Margin
							</span>

							<strong>
								{data.spotlightMatchup.margin.toFixed(
									2
								)}
							</strong>
						</div>

						<div>
							<span>
								Winner
							</span>

							<strong>
								{data.spotlightMatchup.winnerName ||
									'Draw'}
							</strong>
						</div>

					</div>

				</div>

			{:else}

				<div class="empty-state matchup-empty">

					<div class="empty-mark">
						W{data.selectedWeek}
					</div>

					<div>
						<strong>
							No featured matchup yet
						</strong>

						<p>
							Once current-week matchup
							data lands, the juiciest
							game on the board shows
							up here.
						</p>
					</div>

				</div>

			{/if}

		</article>

	</section>


	<!-- ==================================================
	     TRANSACTIONS + ACTIVITY
	     ================================================== -->

	<section class="market-grid">

		<article class="panel movement-panel">

			<header class="section-head">

				<div>
					<div class="eyebrow">
						Transaction wire
					</div>

					<h2>
						Recent Movement
					</h2>
				</div>

				<a href={wireRoomHref}>
					Full wire room →
				</a>

			</header>


			<div class="movement-stack">

				{#each recentMoves as move}

					<a
						class="movement-row"
						href={`/league/transactions?season=${season}&weeks=${move.week}`}
					>

						<div class="movement-meta">

							<span
								class={`movement-type ${moveTypeClass(
									move.type
								)}`}
							>
								{moveTypeLabel(
									move.type
								)}
							</span>

							<span class="movement-week">
								WEEK {move.week}
							</span>

						</div>


						<div class="movement-teams">

							{#each moveTeams(move) as team, index}

								{#if index > 0}

									<span class="movement-swap">
										↔
									</span>

								{/if}


								<div class="movement-team">

									<div class="movement-logo">

										{#if team.photo}

											<img
												src={team.photo}
												alt={team.name}
											/>

										{:else}

											<span>
												{team.initials}
											</span>

										{/if}

									</div>

									<strong>
										{team.name}
									</strong>

								</div>

							{/each}

						</div>


						<span class="movement-arrow">
							›
						</span>

					</a>

				{/each}


				{#if !recentMoves.length}

					<div class="empty-state">

						<div>
							<strong>
								Quiet wire room
							</strong>

							<p>
								Trades, waiver claims,
								and free-agent moves
								will appear here as
								they happen.
							</p>
						</div>

					</div>

				{/if}

			</div>

		</article>


		<article class="panel activity-panel">

			<header class="section-head">

				<div>
					<div class="eyebrow">
						Front offices
					</div>

					<h2>
						Heat Check
					</h2>
				</div>

				<a href={wireRoomHref}>
					Activity log →
				</a>

			</header>


			<div class="activity-list">

				{#each activityLeaders as row, index}

					<a
						class="activity-row"
						href={row.slug
							? `/league/transactions?season=${season}&team=${row.slug}`
							: `/league/transactions?season=${season}&rosterId=${row.rosterId}`}
					>

						<span class="activity-rank">
							{index + 1}
						</span>


						<div class="activity-logo">

							{#if row.teamPhoto}

								<img
									src={row.teamPhoto}
									alt={row.teamName}
								/>

							{:else}

								<span>
									{row.initials}
								</span>

							{/if}

						</div>


						<div class="activity-copy">

							<strong>
								{row.teamName}
							</strong>

							<small>
								{row.managerName}
							</small>

						</div>


						<span class="activity-count">
							{row.activityCount}
						</span>

					</a>

				{/each}


				{#if !activityLeaders.length}

					<div class="empty-state">

						<div>
							<strong>
								Quiet room so far
							</strong>

							<p>
								Once the front offices
								start making moves,
								the activity ladder
								will populate here.
							</p>
						</div>

					</div>

				{/if}

			</div>

		</article>

	</section>

</div>


<style>
	/* =====================================================
	   PAGE
	   ===================================================== */

	.page-stack {
		width: 100%;
		max-width: 1500px;
		display: grid;
		gap: 20px;
		margin: 0 auto;
		padding-bottom: 48px;
	}


	.eyebrow {
		color:
			var(--brand-gold);

		font-family:
			var(--font-body);

		font-size:
			.61rem;

		font-weight:
			800;

		letter-spacing:
			.16em;

		text-transform:
			uppercase;
	}


	/* =====================================================
	   LEAGUE HERO
	   ===================================================== */

	.league-hero {
		position: relative;

		display: grid;

		grid-template-columns:
			minmax(0,1.1fr)
			minmax(420px,.9fr);

		gap: 44px;

		align-items: center;

		overflow: hidden;

		min-height: 280px;

		padding: 34px;

		border:
			1px solid
			var(--border-strong);

		border-radius:
			var(--radius-lg);

		background:
			linear-gradient(
				120deg,
				rgba(
					191,
					161,
					106,
					.06
				),
				transparent 38%
			),
			var(--panel-strong);

		box-shadow:
			var(--shadow-panel);
	}


	.league-hero::after {
		content:
			'IRVING';

		position: absolute;

		left: 22px;

		bottom: -30px;

		color:
			rgba(
				191,
				161,
				106,
				.025
			);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				7rem,
				14vw,
				13rem
			);

		line-height: 1;

		pointer-events:
			none;
	}


	.hero-copy,
	.league-pulse {
		position: relative;
		z-index: 1;
	}


	.hero-copy h1 {
		max-width: 850px;

		margin:
			8px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				4rem,
				6.7vw,
				7.6rem
			);

		font-weight: 400;

		line-height:
			.82;

		letter-spacing:
			-.02em;

		text-shadow:
			none;
	}


	.manifesto {
		max-width: 720px;

		margin-top: 26px;

		padding-left: 16px;

		border-left:
			2px solid
			var(--brand-gold);
	}


	.manifesto strong {
		display: block;

		color:
			var(--brand-ivory);

		font-size:
			clamp(
				1rem,
				1.6vw,
				1.25rem
			);

		font-weight: 850;
	}


	.manifesto p {
		margin:
			5px 0 0;

		color:
			var(--muted);

		line-height: 1.5;
	}


	/* =====================================================
	   LEAGUE PULSE
	   ===================================================== */

	.league-pulse {
		display: grid;

		grid-template-columns:
			repeat(
				2,
				minmax(0,1fr)
			);

		gap: 10px;
	}


	.pulse-card {
		position: relative;

		min-width: 0;

		display: grid;

		align-content: center;

		gap: 5px;

		min-height: 98px;

		padding:
			15px 16px;

		border:
			1px solid
			var(--border);

		border-radius:
			var(--radius-sm);

		background:
			rgba(
				8,
				11,
				10,
				.74
			);
	}


	.pulse-card::before {
		content: '';

		position: absolute;

		top: 13px;
		bottom: 13px;
		left: 0;

		width: 2px;

		background:
			var(--brand-gold);
	}


	.pulse-card > span {
		color:
			var(--brand-gold);

		font-size:
			.57rem;

		font-weight:
			800;

		letter-spacing:
			.14em;

		text-transform:
			uppercase;
	}


	.pulse-card strong {
		overflow: hidden;

		color:
			var(--brand-ivory);

		font-size:
			.9rem;

		font-weight:
			800;

		line-height: 1.2;

		text-overflow:
			ellipsis;

		white-space:
			nowrap;
	}


	.pulse-card small {
		overflow: hidden;

		color:
			var(--muted);

		font-size:
			.68rem;

		text-overflow:
			ellipsis;

		white-space:
			nowrap;
	}


	/* =====================================================
	   PANELS
	   ===================================================== */

	.primary-grid,
	.market-grid {
		display: grid;
		gap: 18px;
	}


	.primary-grid {
		grid-template-columns:
			minmax(0,1fr)
			minmax(0,.95fr);
	}


	.market-grid {
		grid-template-columns:
			minmax(0,1.35fr)
			minmax(340px,.65fr);
	}


	.panel {
		min-width: 0;

		padding: 20px;

		border:
			1px solid
			var(--border);

		border-radius:
			var(--radius-md);

		background:
			linear-gradient(
				180deg,
				rgba(
					255,
					255,
					255,
					.018
				),
				transparent
			),
			var(--panel);

		box-shadow:
			var(--shadow-panel);
	}


	.section-head {
		display: flex;

		align-items: flex-end;

		justify-content:
			space-between;

		gap: 18px;

		margin-bottom: 17px;

		padding-bottom: 13px;

		border-bottom:
			1px solid
			rgba(
				191,
				161,
				106,
				.11
			);
	}


	.section-head h2 {
		margin:
			4px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				1.7rem,
				3vw,
				2.25rem
			);

		font-weight: 400;

		line-height: 1;
	}


	.section-head a {
		flex: 0 0 auto;

		color:
			var(--brand-sand);

		font-size:
			.69rem;

		font-weight:
			800;

		text-decoration:
			none;
	}


	.section-head a:hover {
		color:
			var(--brand-gold);
	}


	/* =====================================================
	   STANDINGS
	   ===================================================== */

	.standings-list {
		display: grid;
		gap: 7px;
	}


	.standing-row {
		display: grid;

		grid-template-columns:
			42px
			42px
			minmax(0,1fr)
			auto;

		align-items: center;

		gap: 11px;

		min-height: 66px;

		padding:
			8px 11px;

		border:
			1px solid
			rgba(
				191,
				161,
				106,
				.10
			);

		border-radius:
			4px;

		background:
			rgba(
				255,
				255,
				255,
				.012
			);

		color: inherit;

		text-decoration:
			none;
	}


	.standing-row:hover {
		border-color:
			rgba(
				191,
				161,
				106,
				.38
			);

		background:
			rgba(
				191,
				161,
				106,
				.025
			);
	}


	.rank {
		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size:
			1.2rem;

		text-align:
			center;
	}


	.team-logo,
	.activity-logo,
	.spotlight-logo,
	.movement-logo {
		display: grid;

		place-items: center;

		overflow: hidden;

		background:
			var(--brand-ivory);
	}


	.team-logo {
		width: 42px;
		height: 42px;

		border-radius:
			4px;
	}


	.team-logo img,
	.activity-logo img,
	.spotlight-logo img,
	.movement-logo img {
		width: 100%;
		height: 100%;

		object-fit:
			cover;
	}


	.team-logo > span,
	.activity-logo > span,
	.spotlight-logo > span,
	.movement-logo > span {
		color:
			var(--brand-charcoal);

		font-size:
			.57rem;

		font-weight:
			900;
	}


	.standing-identity {
		min-width: 0;

		display: grid;

		gap: 3px;
	}


	.standing-identity strong {
		overflow: hidden;

		color:
			var(--brand-ivory);

		font-size:
			.81rem;

		text-overflow:
			ellipsis;

		white-space:
			nowrap;
	}


	.standing-identity small {
		color:
			var(--muted);

		font-size:
			.67rem;
	}


	.record {
		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			1.12rem;

		font-weight: 400;

		font-variant-numeric:
			tabular-nums;
	}


	/* =====================================================
	   MATCHUP SPOTLIGHT
	   ===================================================== */

	.spotlight {
		display: grid;
		gap: 9px;
	}


	.spotlight-team {
		display: grid;

		grid-template-columns:
			60px
			minmax(0,1fr)
			auto;

		align-items: center;

		gap: 14px;

		min-height: 84px;

		padding:
			11px 13px;

		border:
			1px solid
			rgba(
				191,
				161,
				106,
				.13
			);

		border-radius:
			5px;

		background:
			rgba(
				255,
				255,
				255,
				.012
			);
	}


	.spotlight-logo {
		width: 60px;
		height: 60px;

		border-radius:
			4px;
	}


	.spotlight-team-copy {
		min-width: 0;

		display: grid;
		gap: 4px;
	}


	.spotlight-team-copy strong {
		color:
			var(--brand-ivory);

		font-size:
			.86rem;
	}


	.spotlight-team-copy small {
		color:
			var(--muted);

		font-size:
			.68rem;
	}


	.spotlight-score {
		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size:
			2rem;

		font-variant-numeric:
			tabular-nums;
	}


	.versus {
		justify-self: center;

		margin:
			-3px 0;

		color:
			var(--brand-stone);

		font-size:
			.57rem;

		font-weight:
			850;

		letter-spacing:
			.15em;
	}


	.spotlight-footer {
		display: grid;

		grid-template-columns:
			repeat(
				3,
				minmax(0,1fr)
			);

		gap: 1px;

		margin-top: 7px;

		overflow: hidden;

		border:
			1px solid
			var(--border);

		border-radius:
			4px;

		background:
			var(--border);
	}


	.spotlight-footer div {
		display: grid;

		gap: 4px;

		padding:
			10px 11px;

		background:
			rgba(
				8,
				11,
				10,
				.94
			);
	}


	.spotlight-footer span {
		color:
			var(--brand-stone);

		font-size:
			.53rem;

		font-weight:
			800;

		letter-spacing:
			.1em;

		text-transform:
			uppercase;
	}


	.spotlight-footer strong {
		overflow: hidden;

		color:
			var(--brand-ivory);

		font-size:
			.72rem;

		text-overflow:
			ellipsis;

		white-space:
			nowrap;
	}


	/* =====================================================
	   EMPTY STATES
	   ===================================================== */

	.empty-state {
		min-height: 120px;

		display: flex;

		align-items: center;

		gap: 16px;

		padding: 18px;

		border:
			1px solid
			rgba(
				191,
				161,
				106,
				.11
			);

		border-radius:
			5px;

		background:
			rgba(
				255,
				255,
				255,
				.012
			);
	}


	.matchup-empty {
		min-height: 230px;
	}


	.empty-mark {
		flex: 0 0 auto;

		display: grid;
		place-items: center;

		width: 62px;
		height: 62px;

		border:
			1px solid
			var(--brand-gold);

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size:
			1.5rem;
	}


	.empty-state strong {
		color:
			var(--brand-ivory);
	}


	.empty-state p {
		max-width: 50ch;

		margin:
			4px 0 0;

		color:
			var(--muted);

		line-height: 1.45;
	}


	/* =====================================================
	   MOVEMENT
	   ===================================================== */

	.movement-stack {
		display: grid;
		gap: 8px;
	}


	.movement-row {
		display: grid;

		grid-template-columns:
			105px
			minmax(0,1fr)
			22px;

		align-items: center;

		gap: 13px;

		min-height: 67px;

		padding:
			9px 11px;

		border:
			1px solid
			rgba(
				191,
				161,
				106,
				.10
			);

		border-radius:
			4px;

		background:
			rgba(
				255,
				255,
				255,
				.012
			);

		color: inherit;

		text-decoration:
			none;
	}


	.movement-row:hover {
		border-color:
			rgba(
				191,
				161,
				106,
				.38
			);

		background:
			rgba(
				191,
				161,
				106,
				.025
			);
	}


	.movement-meta {
		display: grid;
		gap: 4px;
	}


	.movement-type {
		width: fit-content;

		padding:
			4px 6px;

		border:
			1px solid
			var(--border);

		border-radius:
			2px;

		color:
			var(--brand-sand);

		font-size:
			.51rem;

		font-weight:
			850;

		letter-spacing:
			.08em;
	}


	.movement-type.trade {
		border-color:
			rgba(
				191,
				161,
				106,
				.45
			);

		color:
			var(--brand-gold);
	}


	.movement-type.waiver {
		border-color:
			rgba(
				96,
				110,
				121,
				.6
			);
	}


	.movement-type.free-agent {
		color:
			var(--brand-stone);
	}


	.movement-week {
		color:
			var(--muted);

		font-size:
			.55rem;

		font-weight:
			750;

		letter-spacing:
			.08em;
	}


	.movement-teams {
		min-width: 0;

		display: flex;

		align-items: center;

		flex-wrap: wrap;

		gap: 9px;
	}


	.movement-team {
		min-width: 0;

		display: flex;

		align-items: center;

		gap: 8px;
	}


	.movement-logo {
		flex: 0 0 34px;

		width: 34px;
		height: 34px;

		border-radius:
			3px;
	}


	.movement-team strong {
		overflow: hidden;

		color:
			var(--brand-ivory);

		font-size:
			.72rem;

		text-overflow:
			ellipsis;

		white-space:
			nowrap;
	}


	.movement-swap {
		color:
			var(--brand-gold);

		font-size:
			.9rem;
	}


	.movement-arrow {
		justify-self: end;

		color:
			var(--brand-gold);

		font-size:
			1.25rem;

		transition:
			transform
			120ms ease;
	}


	.movement-row:hover
	.movement-arrow {
		transform:
			translateX(2px);
	}


	/* =====================================================
	   HEAT CHECK
	   ===================================================== */

	.activity-list {
		display: grid;
		gap: 7px;
	}


	.activity-row {
		display: grid;

		grid-template-columns:
			24px
			38px
			minmax(0,1fr)
			auto;

		align-items: center;

		gap: 9px;

		min-height: 61px;

		padding:
			8px 10px;

		border:
			1px solid
			rgba(
				191,
				161,
				106,
				.10
			);

		border-radius:
			4px;

		background:
			rgba(
				255,
				255,
				255,
				.012
			);

		color: inherit;

		text-decoration:
			none;
	}


	.activity-row:hover {
		border-color:
			rgba(
				191,
				161,
				106,
				.36
			);
	}


	.activity-rank {
		color:
			var(--brand-stone);

		font-family:
			var(--font-display);

		font-size:
			1rem;

		text-align:
			center;
	}


	.activity-logo {
		width: 38px;
		height: 38px;

		border-radius:
			4px;
	}


	.activity-copy {
		min-width: 0;

		display: grid;
		gap: 2px;
	}


	.activity-copy strong {
		overflow: hidden;

		color:
			var(--brand-ivory);

		font-size:
			.72rem;

		text-overflow:
			ellipsis;

		white-space:
			nowrap;
	}


	.activity-copy small {
		overflow: hidden;

		color:
			var(--muted);

		font-size:
			.61rem;

		text-overflow:
			ellipsis;

		white-space:
			nowrap;
	}


	.activity-count {
		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size:
			1.25rem;

		font-variant-numeric:
			tabular-nums;
	}


	/* =====================================================
	   RESPONSIVE
	   ===================================================== */

	@media (max-width: 1050px) {

		.league-hero,
		.primary-grid,
		.market-grid {
			grid-template-columns:
				1fr;
		}


		.league-pulse {
			max-width: none;
		}

	}


	@media (max-width: 680px) {

		.league-hero {
			padding: 20px;
		}


		.league-hero::after {
			display: none;
		}


		.league-pulse {
			grid-template-columns:
				1fr;
		}


		.panel {
			padding: 15px;
		}


		.section-head {
			align-items:
				flex-start;

			flex-direction:
				column;
		}


		.standing-row {
			grid-template-columns:
				34px
				38px
				minmax(0,1fr)
				auto;
		}


		.team-logo {
			width: 38px;
			height: 38px;
		}


		.spotlight-team {
			grid-template-columns:
				48px
				minmax(0,1fr)
				auto;
		}


		.spotlight-logo {
			width: 48px;
			height: 48px;
		}


		.spotlight-score {
			font-size: 1.5rem;
		}


		.spotlight-footer {
			grid-template-columns:
				1fr;
		}


		.movement-row {
			grid-template-columns:
				1fr
				auto;
		}


		.movement-meta {
			grid-column: 1;
		}


		.movement-teams {
			grid-column:
				1 / -1;
		}


		.movement-arrow {
			grid-column: 2;
			grid-row: 1;
		}

	}


	@media (max-width: 470px) {

		.standing-row {
			grid-template-columns:
				32px
				38px
				minmax(0,1fr);
		}


		.standing-row .record {
			grid-column: 3;
		}


		.activity-row {
			grid-template-columns:
				20px
				36px
				minmax(0,1fr);
		}


		.activity-count {
			grid-column: 3;
			font-size: 1rem;
		}

	}
</style>