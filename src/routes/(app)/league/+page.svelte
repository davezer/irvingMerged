<script>
	import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';
	export let data;

	function moveTypeClass(type) {
	const value = String(type || '').toLowerCase();

	if (value.includes('trade')) return 'trade';
	if (value.includes('waiver')) return 'waiver';
	if (value.includes('free')) return 'free-agent';

	return 'other';
}

function moveTypeLabel(type) {
	const value = String(type || '').replace(/_/g, ' ').trim();

	if (!value) return 'TRANSACTION';

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
			String(team.teamName || '').toLowerCase() ===
			String(name || '').trim().toLowerCase()
	);
}

function moveTeams(move) {
	const names = String(move.summary || '')
		.split(/\s*↔\s*/)
		.map((name) => name.trim())
		.filter(Boolean);

	return names.map((name) => {
		const team = findMoveTeam(name);

		return {
			name,
			photo: team?.teamPhoto || null,
			initials: team?.initials || teamInitials(name)
		};
	});
}
</script>

<div class="page-stack">
	<LeagueSubnav season={data.season || new Date().getFullYear()} active="league" />
	<section class="league-hero">
		<div class="league-hero-bar">
			<span class="hero-network">ICN</span>
			<strong>League Central</strong>
			<span class="hero-season">
				<i class="live-dot" aria-hidden="true"></i>
				{data.season || new Date().getFullYear()} Season Feed
			</span>
		</div>

		<div class="league-hero-body">
			<div class="league-hero-copy">
				<div class="eyebrow">Irving Champions League</div>
				<h1>{data.leagueName}</h1>

				<div class="league-manifesto">
					<strong>Fourteen franchises. One trophy. Zero sympathy.</strong>
					<p>Every week leaves receipts. Wins, losses, bad beats, and worse decisions.</p>
				</div>
			</div>

			<div class="league-hero-stats" aria-label="League pulse">
				<div class="league-hero-stat">
					<span>Top seed</span>
					<strong>{data.pulse?.topSeed?.teamName || '—'}</strong>
					<small>{data.pulse?.topSeed?.recordLabel || 'No record yet'}</small>
				</div>

				<div class="league-hero-stat">
					<span>Hottest offense</span>
					<strong>{data.pulse?.hottest?.teamName || '—'}</strong>
					<small>{data.pulse?.hottest?.points != null ? `${Number(data.pulse.hottest.points).toFixed(2)} PF` : 'No data yet'}</small>
				</div>

				<div class="league-hero-stat">
					<span>Most active</span>
					<strong>{data.activityLeaders[0]?.teamName || '—'}</strong>
					<small>{data.activityLeaders[0] ? `${data.activityLeaders[0].activityCount} logged moves` : 'No movement yet'}</small>
				</div>

				<div class="league-hero-stat">
					<span>Draft room</span>
					<strong>{data.draft ? `${data.draft.teams} teams` : 'Archive ready'}</strong>
					<small>{data.draft ? `${data.draft.rounds} rounds • ${String(data.draft.status || '').replace(/_/g, ' ')}` : 'Sleeper-powered archive'}</small>
				</div>
			</div>
		</div>
	</section>

	<section class="grid two-up">
		<div class="card">
			<div class="section-head">
				<h2>Top of the board</h2>
				<a href={`/league/standings?season=${data.season}`}>Full standings</a>
			</div>
			<div class="stack">
				{#each data.topBoard as row}
					<a
						class="row"
						href={row.slug
							? `/league/teams/${row.slug}?season=${data.season}`
							: `/league/standings?season=${data.season}`}
					>
						<span class="rank">#{row.rank}</span>
						<div class="identity">
							<div class="photo">
								{#if row.teamPhoto}
									<img src={row.teamPhoto} alt={row.teamName} />
								{:else}
									<span> {row.initials}</span>
								{/if}
							</div>
							<div><strong>{row.teamName}</strong><small> {row.managerName}</small></div>
						</div>
						<span>{row.recordLabel}</span>
					</a>
				{/each}
			</div>
		</div>

		<div class="card">
			<div class="section-head">
				<h2>Week {data.selectedWeek} spotlight</h2>
				<a href={`/league/matchups?season=${data.season}&week=${data.selectedWeek}`}
					>Open matchups</a
				>
			</div>
			{#if data.spotlightMatchup}
				<div class="spotlight-card">
					<div class="matchup-team">
						<div class="photo">
							{#if data.spotlightMatchup.left.teamPhoto}<img
									src={data.spotlightMatchup.left.teamPhoto}
									alt={data.spotlightMatchup.left.teamName}
								/>{:else}<span> {data.spotlightMatchup.left.initials}</span>{/if}
						</div>
						<div>
							<strong>{data.spotlightMatchup.left.teamName}</strong><small>
								{data.spotlightMatchup.left.managerName}</small
							>
						</div>
						<span>{data.spotlightMatchup.leftScore.toFixed(2)}</span>
					</div>
					<div class="matchup-team">
						<div class="photo">
							{#if data.spotlightMatchup.right.teamPhoto}<img
									src={data.spotlightMatchup.right.teamPhoto}
									alt={data.spotlightMatchup.right.teamName}
								/>{:else}<span>{data.spotlightMatchup.right.initials}</span>{/if}
						</div>
						<div>
							<strong>{data.spotlightMatchup.right.teamName}</strong><small
								>{data.spotlightMatchup.right.managerName}</small
							>
						</div>
						<span>{data.spotlightMatchup.rightScore.toFixed(2)}</span>
					</div>
					<div class="spotlight-meta">
						<span>{data.spotlightMatchup.totalScore.toFixed(2)} combined</span>
						<span>{data.spotlightMatchup.margin.toFixed(2)} margin</span>
						<strong>{data.spotlightMatchup.winnerName}</strong>
					</div>
				</div>
			{:else}
				<div class="story">
					<strong>No featured matchup yet</strong>
					<p>Once current-week matchup data lands, this panel highlights the juiciest board.</p>
				</div>
			{/if}
		</div>
	</section>

	<section class="grid two-up">
		<div class="card movement-card">
	<div class="section-head">
		<h2>Recent movement</h2>

		<a
			href={`/league/transactions?season=${data.season}&weeks=${data.availableWeeks.slice(-4).join(',')}`}
		>
			Full wire room
		</a>
	</div>

	<div class="movement-stack">
		{#each data.recentMoves as move}
			<a
				class="movement-row"
				href={`/league/transactions?season=${data.season}&weeks=${move.week}`}
			>
				<div class="movement-meta">
					<span class={`movement-type ${moveTypeClass(move.type)}`}>
						{moveTypeLabel(move.type)}
					</span>

					<span class="movement-week">WEEK {move.week}</span>
				</div>

				<div class="movement-teams">
					{#each moveTeams(move) as team, index}
						{#if index > 0}
							<span class="movement-swap">↔</span>
						{/if}

						<div class="movement-team">
							<div class="movement-logo">
								{#if team.photo}
									<img src={team.photo} alt={team.name} />
								{:else}
									<span>{team.initials}</span>
								{/if}
							</div>

							<strong>{team.name}</strong>
						</div>
					{/each}
				</div>

				<span class="movement-arrow">›</span>
			</a>
		{/each}

		{#if !data.recentMoves.length}
			<div class="movement-empty">
				<strong>No movement yet</strong>
				<p>The league wire room will populate here as Sleeper transactions roll in.</p>
			</div>
		{/if}
	</div>
</div>

		<div class="card">
			<div class="section-head">
				<h2>Front-office heat check</h2>
				<a
					href={`/league/transactions?season=${data.season}&weeks=${data.availableWeeks.slice(-4).join(',')}`}
					>Activity log</a
				>
			</div>
			<div class="stack">
				{#each data.activityLeaders as row}
					<a
						class="activity-row"
						href={row.slug
							? `/league/transactions?season=${data.season}&team=${row.slug}`
							: `/league/transactions?season=${data.season}&rosterId=${row.rosterId}`}
					>
						<div class="activity-identity">
							<div class="activity-logo">
								{#if row.teamPhoto}
									<img src={row.teamPhoto} alt={row.teamName} />
								{:else}
									<span>{row.initials}</span>
								{/if}
							</div>

							<div class="activity-copy">
								<strong>{row.teamName}</strong>
								<small>{row.managerName}</small>
							</div>
						</div>

						<span class="activity-count">{row.activityCount} moves</span>
					</a>
				{/each}
				{#if !data.activityLeaders.length}
					<div class="story">
						<strong>Quiet room so far</strong>
						<p>As soon as trades and wire pickups hit, this turns into a live activity ladder.</p>
					</div>
				{/if}
			</div>
		</div>
	</section>

	<!-- <section class="card">
		<div class="section-head">
			<h2>Featured dossiers</h2>
			<a href={`/league/teams?season=${data.season}`}>All teams</a>
		</div>
		<div class="featured-grid">
			{#each data.featuredManagers as manager}
				<article class="featured-card">
					<div class="identity">
						<div class="photo large">
							{#if manager.teamPhoto}<img
									src={manager.teamPhoto}
									alt={manager.teamName}
								/>{:else}<span>{manager.initials}</span>{/if}
						</div>
						<div>
							<strong>{manager.teamName}</strong>
							<small>{manager.managerName} · {manager.recordLabel}</small>
						</div>
					</div>
					<p>{manager.bio}</p>
					<div class="chip-row">
						<span>#{manager.rank}</span>
						<span>{manager.points.toFixed(2)} PF</span>
						<span>{manager.pointDiff.toFixed(2)} diff</span>
					</div>
					<div class="link-row">
						<a href={manager.dossierHref}>Franchise</a>
						<a href={manager.gamesHref}>Games</a>
						<a href={manager.movesHref}>Moves</a>
					</div>
				</article>
			{/each}
		</div>
	</section> -->
</div>

<style>
	.page-stack {
		display: grid;
		gap: 24px;
	}
	.card {
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 24px;
		padding: 24px;
	}
	.hero {
		display: grid;
		grid-template-columns: 1.1fr 0.9fr;
		gap: 24px;
		align-items: start;
	}
	.hero-stats,
	.action-grid,
	.stack,
	.featured-grid {
		display: grid;
		gap: 12px;
	}
	.hero-stats {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	.mini,
	.story,
	.row,
	.featured-card,
	.spotlight-card,
	.action {
		background: rgba(255, 255, 255, 0.03);
		border-radius: 16px;
		padding: 14px;
		text-decoration: none;
		color: inherit;
	}
	.mini.stat {
		display: grid;
		gap: 6px;
	}
	.mini.stat span,
	.eyebrow {
		color: #d6b15e;
		text-transform: uppercase;
		letter-spacing: 0.18em;
		font-size: 11px;
	}
	.action-grid {
		grid-template-columns: repeat(5, minmax(0, 1fr));
	}
	.action {
		display: grid;
		gap: 6px;
	}
	.grid.two-up {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 24px;
	}
	.section-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}
	.section-head a,
	.link-row a {
		color: #d6b15e;
		text-decoration: none;
	}
	.story p,
	.source,
	.row small,
	.featured-card p {
		margin: 0.45rem 0 0;
		color: rgba(255, 255, 255, 0.7);
	}
	.row {
		display: grid;
		grid-template-columns: 52px 1fr auto;
		align-items: center;
		gap: 12px;
	}
	.rank {
		font-weight: 700;
		color: #d6b15e;
	}
	.identity {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.photo {
		width: 42px;
		height: 42px;
		border-radius: 50%;
		overflow: hidden;
		display: grid;
		place-items: center;
		background: rgba(255, 255, 255, 0.06);
		font-weight: 800;
	}
	.photo.large {
		width: 56px;
		height: 56px;
	}
	.photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.spotlight-card {
		display: grid;
		gap: 12px;
	}
	.matchup-team {
		display: grid;
		grid-template-columns: 42px 1fr auto;
		gap: 12px;
		align-items: center;
		padding: 12px;
		border-radius: 14px;
		background: rgba(255, 255, 255, 0.04);
	}
	.spotlight-meta {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		color: rgba(255, 255, 255, 0.72);
	}
	.featured-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	.featured-card {
		display: grid;
		gap: 12px;
	}
	.chip-row,
	.link-row {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.chip-row span {
		padding: 7px 10px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.06);
		color: rgba(255, 255, 255, 0.84);
	}
	.source {
		margin-top: 12px;
	}
	.move-card strong {
		display: block;
	}

	.activity-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 18px;

		min-height: 74px;
		padding: 10px 16px;

		border: 1px solid #070808;
		border-radius: 16px;

		background: linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.015));

		color: var(--bug-white);
		text-decoration: none;

		transition:
			background 0.15s ease,
			transform 0.15s ease;
	}

	.activity-row:hover {
		background:
			linear-gradient(90deg, rgba(199, 25, 47, 0.18), transparent 45%),
			linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.025));

		transform: translateY(-1px);
	}

	.activity-identity {
		display: grid;
		grid-template-columns: 46px minmax(0, 1fr);
		align-items: center;
		gap: 12px;
		min-width: 0;
	}

	.activity-logo {
		width: 46px;
		height: 46px;

		display: grid;
		place-items: center;

		overflow: hidden;
		flex-shrink: 0;

		border: 2px solid #070808;
		border-radius: 50%;

		background: #e8e2d4;
		color: #111;

		font-family: var(--font-score);
		font-size: 0.7rem;
		font-weight: 900;
	}

	.activity-logo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.activity-copy {
		display: grid;
		gap: 3px;
		min-width: 0;
	}

	.activity-copy strong {
		display: block;

		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;

		font-family: var(--font-score);
		font-size: 1rem;
		line-height: 1.1;
		color: var(--bug-white);
	}

	.activity-copy small {
		display: block;

		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;

		color: var(--muted);
		font-size: 0.78rem;
	}

	.activity-count {
		white-space: nowrap;

		color: var(--bug-yellow);
		font-family: var(--font-score);
		font-size: 0.82rem;
		font-weight: 950;
		text-transform: uppercase;
	}

	.movement-stack {
	display: grid;
	gap: 12px;
}

.movement-row {
	position: relative;
	display: grid;
	grid-template-columns: 128px minmax(0, 1fr) 20px;
	align-items: center;
	gap: 14px;

	min-height: 74px;
	padding: 10px 14px;

	overflow: hidden;

	border: 1px solid #070808;
	border-radius: 16px;

	background:
		repeating-linear-gradient(
			0deg,
			rgba(255, 255, 255, 0.018) 0 1px,
			transparent 1px 4px
		),
		linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.08),
			rgba(255, 255, 255, 0.015)
		);

	color: var(--bug-white);
	text-decoration: none;

	box-shadow:
		inset 0 1px 0 rgba(255,255,255,.08),
		inset 0 -1px 0 rgba(0,0,0,.4);

	transition:
		transform .15s ease,
		background .15s ease;
}

.movement-row:hover {
	transform: translateY(-1px);

	background:
		linear-gradient(
			90deg,
			rgba(199,25,47,.16),
			transparent 45%
		),
		linear-gradient(
			180deg,
			rgba(255,255,255,.10),
			rgba(255,255,255,.025)
		);
}


/* LEFT-SIDE TRANSACTION INFO */

.movement-meta {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 6px;
}

.movement-type {
	display: inline-flex;
	align-items: center;

	min-height: 23px;
	padding: 4px 8px;

	border: 1px solid #070808;
	border-radius: 5px;

	font-family: var(--font-score);
	font-size: .66rem;
	font-weight: 950;
	line-height: 1;
	letter-spacing: .05em;

	text-transform: uppercase;

	box-shadow:
		inset 0 1px 0 rgba(255,255,255,.22),
		0 2px 3px rgba(0,0,0,.25);
}

.movement-type.trade {
	background: linear-gradient(180deg, #e4bd43, #8b6412);
	color: #090909;
}

.movement-type.waiver {
	background: linear-gradient(
		180deg,
		var(--bug-red),
		var(--bug-red-dark)
	);
	color: #fff;
}

.movement-type.free-agent {
	background: linear-gradient(180deg, #d8ddd9, #777d79);
	color: #090909;
}

.movement-type.other {
	background: linear-gradient(180deg, #6c7470, #282d2b);
	color: #fff;
}

.movement-week {
	padding-left: 2px;

	color: var(--muted);
	font-family: var(--font-score);
	font-size: .68rem;
	font-weight: 900;
	letter-spacing: .12em;
}


/* TEAM AREA */

.movement-teams {
	display: flex;
	align-items: center;
	gap: 12px;
	min-width: 0;
}

.movement-team {
	display: flex;
	align-items: center;
	gap: 9px;
	min-width: 0;
}

.movement-logo {
	width: 42px;
	height: 42px;
	flex: 0 0 42px;

	display: grid;
	place-items: center;

	overflow: hidden;

	border: 2px solid #070808;
	border-radius: 50%;

	background: #e8e2d4;
	color: #111;

	font-family: var(--font-score);
	font-size: .62rem;
	font-weight: 950;

	box-shadow:
		inset 0 1px 0 rgba(255,255,255,.4),
		0 3px 6px rgba(0,0,0,.3);
}

.movement-logo img {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.movement-team strong {
	overflow: hidden;
	text-overflow: ellipsis;

	color: var(--bug-white);
	font-family: var(--font-score);
	font-size: .92rem;
	font-weight: 950;
	line-height: 1.05;
}

.movement-swap {
	flex: 0 0 auto;

	color: var(--bug-yellow);
	font-family: var(--font-score);
	font-size: 1.3rem;
	font-weight: 950;

	text-shadow: 0 2px 0 #000;
}

.movement-arrow {
	justify-self: end;

	color: var(--bug-yellow);
	font-family: var(--font-score);
	font-size: 1.65rem;
	font-weight: 950;

	opacity: .65;

	transition:
		transform .15s ease,
		opacity .15s ease;
}

.movement-row:hover .movement-arrow {
	transform: translateX(3px);
	opacity: 1;
}


/* EMPTY STATE */

.movement-empty {
	padding: 18px;

	border: 1px solid #070808;
	border-radius: 14px;

	background: rgba(0,0,0,.18);
}

.movement-empty strong {
	font-family: var(--font-score);
}

.movement-empty p {
	margin: 5px 0 0;
	color: var(--muted);
}


/* LEAGUE HERO */
.league-hero {
	position: relative;
	overflow: hidden;
	border: 2px solid #070808;
	border-radius: 20px;
	background:
		linear-gradient(90deg, rgba(164, 22, 42, 0.32), transparent 46%),
		repeating-linear-gradient(0deg, rgba(255,255,255,.02) 0 1px, transparent 1px 4px),
		linear-gradient(180deg, #5f6763, #2a302d 44%, #101312);
	box-shadow: inset 0 1px 0 rgba(255,255,255,.18), 0 12px 32px rgba(0,0,0,.35);
}

.league-hero-bar {
	display: grid;
	grid-template-columns: auto 1fr auto;
	align-items: stretch;
	min-height: 42px;
	border-bottom: 2px solid #070808;
	background: linear-gradient(180deg, #191c1b, #060707);
	font-family: var(--font-score);
	text-transform: uppercase;
}

.hero-network {
	display: grid;
	place-items: center;
	padding: 8px 14px;
	border-right: 2px solid #070808;
	background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));
	color: #fff;
	font-weight: 950;
	letter-spacing: .04em;
}

.league-hero-bar > strong {
	display: flex;
	align-items: center;
	padding: 8px 14px;
	color: var(--bug-yellow);
	font-size: .78rem;
	font-weight: 950;
	letter-spacing: .15em;
}

.hero-season {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 14px;
	border-left: 2px solid #070808;
	background: linear-gradient(180deg, #dadbd3, #7f8581 52%, #363b39);
	color: #111;
	font-size: .68rem;
	font-weight: 950;
	letter-spacing: .1em;
	white-space: nowrap;
}

.live-dot {
	width: 7px;
	height: 7px;
	border-radius: 50%;
	background: #24d36b;
	box-shadow: 0 0 8px rgba(36,211,107,.75);
}

.league-hero-body {
	position: relative;
	display: grid;
	grid-template-columns: minmax(0, 1.12fr) minmax(420px, .88fr);
	gap: 28px;
	align-items: center;
	min-height: 235px;
	padding: 24px;
}

.league-hero-body::before {
	content: '';
	position: absolute;
	inset: 0;
	pointer-events: none;
	background: radial-gradient(circle at 8% 50%, rgba(199,25,47,.2), transparent 34%);
}

.league-hero-copy,
.league-hero-stats {
	position: relative;
	z-index: 1;
}

.league-hero-copy {
	display: grid;
	align-content: center;
	gap: 8px;
	min-width: 0;
}

.league-hero h1 {
	margin: 0;
	max-width: 760px;
	color: var(--bug-white);
	font-family: var(--font-display);
	font-size: clamp(2.8rem, 5vw, 5.2rem);
	font-weight: 950;
	line-height: .9;
	letter-spacing: -.045em;
	text-shadow: 0 3px 0 #000, 0 8px 18px rgba(0,0,0,.42);
}

.league-manifesto {
	margin-top: 14px;
	padding: 4px 0 4px 14px;
	border-left: 4px solid var(--bug-yellow);
}

.league-manifesto strong {
	display: block;
	color: #fff;
	font-family: var(--font-score);
	font-size: clamp(.95rem, 1.35vw, 1.16rem);
	font-weight: 950;
}

.league-manifesto p {
	margin: 5px 0 0;
	max-width: 660px;
	color: rgba(247,245,235,.72);
	font-size: .88rem;
	line-height: 1.4;
}

.league-hero-stats {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px;
}

.league-hero-stat {
	position: relative;
	display: grid;
	align-content: center;
	gap: 4px;
	min-height: 86px;
	padding: 13px 15px 13px 18px;
	overflow: hidden;
	border: 1px solid rgba(0,0,0,.78);
	border-radius: 15px;
	background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(0,0,0,.18));
	box-shadow: inset 0 1px 0 rgba(255,255,255,.09), 0 3px 8px rgba(0,0,0,.2);
}

.league-hero-stat::before {
	content: '';
	position: absolute;
	inset: 0 auto 0 0;
	width: 4px;
	background: linear-gradient(180deg, #f5dc69, #b88419);
}

.league-hero-stat > span {
	color: var(--bug-yellow);
	font-family: var(--font-score);
	font-size: .63rem;
	font-weight: 950;
	letter-spacing: .14em;
	text-transform: uppercase;
}

.league-hero-stat strong {
	display: block;
	overflow: hidden;
	color: #fff;
	font-family: var(--font-score);
	font-size: .98rem;
	font-weight: 950;
	line-height: 1.1;
	text-overflow: ellipsis;
	white-space: nowrap;
	text-shadow: 0 2px 0 #000;
}

.league-hero-stat small {
	overflow: hidden;
	color: rgba(247,245,235,.68);
	font-size: .76rem;
	text-overflow: ellipsis;
	white-space: nowrap;
}

/* MOBILE */
@media (max-width: 1000px) {
	.league-hero-body { grid-template-columns: 1fr; }
}

@media (max-width: 720px) {
	.movement-row { grid-template-columns: 1fr auto; gap: 10px; }
	.movement-meta { grid-column: 1; flex-direction: row; align-items: center; }
	.movement-teams { grid-column: 1 / -1; flex-wrap: wrap; }
	.movement-arrow { grid-column: 2; grid-row: 1; }
	.movement-logo { width: 36px; height: 36px; flex-basis: 36px; }
}

@media (max-width: 600px) {
	.league-hero-bar { grid-template-columns: auto 1fr; }
	.hero-season { grid-column: 1 / -1; justify-content: center; border-top: 2px solid #070808; border-left: 0; }
	.league-hero-body { padding: 18px; }
	.league-hero h1 { font-size: clamp(2.5rem, 13vw, 4rem); }
	.league-hero-stats { grid-template-columns: 1fr; }
}

@media (max-width: 1100px) {
		.action-grid,
		.featured-grid,
		.hero-stats {
			grid-template-columns: 1fr 1fr;
		}
	}
	@media (max-width: 860px) {
		.hero,
		.grid.two-up,
		.action-grid,
		.featured-grid,
		.hero-stats {
			grid-template-columns: 1fr;
		}
		.row {
			grid-template-columns: 1fr;
		}
		.matchup-team {
			grid-template-columns: 42px 1fr auto;
		}
	}
</style>
