<script>
  import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';
  export let data;
  const FALLBACK_SEASONS = [
	2026,
	2025
];

$: season =
	Number(
		data.season ||
		new Date().getFullYear()
	);

$: availableSeasons =
	(
		Array.isArray(
			data.seasons
		) &&
		data.seasons.length
			? data.seasons
			: FALLBACK_SEASONS
	)
		.map(Number)
		.filter(Number.isFinite)
		.sort(
			(a, b) =>
				b - a
		);

function seasonHref(
	option
) {
	return `?season=${option}`;
}

  function isWinner(matchup, side) {
    return matchup?.winner && matchup.winner === side?.rosterId;
  }
</script>

<div class="page-stack">
  <LeagueSubnav
	season={season}
	active="matchups"
/>
 <div class="hero card">
	<div class="hero-main">
		<div class="hero-copy">
			<div class="eyebrow">
				Matchups
			</div>

			<h1>
				Weekly Scoreboard
			</h1>

			<p>
				Every matchup, every score, and every bad decision across the league.
			</p>
		</div>

		<div
			class="season-box"
			aria-label="Season selector"
		>
			<span>
				Season feed
			</span>

			<div class="season-pills">
				{#each availableSeasons as option}
					<a
						class:active={
							Number(option) ===
							Number(season)
						}
						href={seasonHref(option)}
					>
						{option}
					</a>
				{/each}
			</div>
		</div>
	</div>

	<div class="week-nav-row">
      {#if data.previousWeek}
	<a
		class="nav-pill"
		href={`?season=${season}&week=${data.previousWeek}`}
	>
		← Week {data.previousWeek}
	</a>
{/if}
      <div class="week-links">
        {#each data.availableWeeks as week}
	<a
		class:selected={
			week ===
			data.selectedWeek
		}
		href={`?season=${season}&week=${week}`}
	>
		Week {week}
	</a>
{/each}
      </div>
      {#if data.nextWeek}
	<a
		class="nav-pill"
		href={`?season=${season}&week=${data.nextWeek}`}
	>
		Week {data.nextWeek} →
	</a>
{/if}
    </div>
  </div>

  {#if !data.hasData}
  <div class="card empty">

    {#if !data.regularSeasonStarted}

      <h2>
        The season hasn't started yet
      </h2>

      <p>
        Week 1 matchups will appear here
        once the NFL regular season begins.
      </p>

    {:else}

      <h2>
        No matchup data yet
      </h2>

      <p>
        We could not pull matchup data for
        this league/week selection.
      </p>

    {/if}

  </div>
  {:else}
    {#if data.highlights}
      <section class="highlight-grid">
        <div class="card">
          <div class="eyebrow">Week {data.week.week}</div>
          <h3>Highest combined score</h3>
          <p>{data.highlights.highestCombined.left.teamName} vs {data.highlights.highestCombined.right.teamName}</p>
          <strong>{data.highlights.highestCombined.totalScore.toFixed(2)} total points</strong>
        </div>
        <div class="card">
          <div class="eyebrow">Tightest sweat</div>
          <h3>{data.highlights.closestGame.left.teamName} vs {data.highlights.closestGame.right.teamName}</h3>
          <p>{data.highlights.closestGame.margin.toFixed(2)} point margin</p>
          <strong>{data.highlights.closestGame.winnerName || 'Draw'}</strong>
        </div>
        <div class="card">
          <div class="eyebrow">Largest blowout</div>
          <h3>{data.highlights.biggestBlowout.winnerName || 'Dead heat'}</h3>
          <p>{data.highlights.biggestBlowout.margin.toFixed(2)} point margin</p>
          <strong>Week {data.week.week}</strong>
        </div>
      </section>
    {/if}

    <section class="stack">
      <div class="section-head">
        <div>
          <div class="eyebrow">Week {data.week.week}</div>
          <h2>Week {data.week.week} Matchups</h2>
        </div>
      </div>

      <div class="matchup-grid">
        {#each data.week.matchups as matchup (`week-${data.week.week}-${matchup.matchupId}`)}
          <article class="card matchup-card">
            {#each [matchup.left, matchup.right] as side, index (`${matchup.matchupId}-${side?.rosterId || index}`)}
              <div class:winning={isWinner(matchup, side)} class="team-row">
                <div class="team-main">
                  <div class="team-photo">
                    {#if side?.teamPhoto}
                      <img src={side.teamPhoto} alt={side.teamName} />
                    {:else}
                      <span>{side?.initials || '?'}</span>
                    {/if}
                  </div>
                  <div>
                    <strong>{side?.teamName || 'Bye / TBD'}</strong>
                    <small>{side?.managerName || 'Waiting on opponent'} · {side?.recordLabel || '—'}</small>
                  </div>
                </div>
                <div class="score">{side ? side.score.toFixed(2) : '—'}</div>
              </div>

              {#if side?.starters?.length}
                <div class="starter-strip">
                  {#each side.starters as starter (`${side.rosterId}-${starter.id}`)}
                    <div class="starter-chip">
                      <img src={starter.photoUrl} alt={starter.name} />
                      <span>{starter.shortName}</span>
                    </div>
                  {/each}
                </div>
              {/if}
            {/each}
          </article>
        {/each}
      </div>
    </section>

    {#if data.rivalryCards.length}
      <section class="stack">
        <div class="section-head">
          <div>
            <div class="eyebrow">Season rivalry scan</div>
            <h2>Head-to-head pressure points</h2>
          </div>
        </div>
        <div class="rivalry-grid">
          {#each data.rivalryCards as rivalry (rivalry.key)}
            <article class="card rivalry-card">
              <strong>{rivalry.leftTeamName} vs {rivalry.rightTeamName}</strong>
              <p>{rivalry.leftWins}-{rivalry.rightWins} across {rivalry.meetings} meeting{rivalry.meetings === 1 ? '' : 's'}.</p>
              <div class="meta-row">
                <span>Leader: {rivalry.leader}</span>
                <span>Closest margin: {rivalry.closestMargin?.toFixed(2) ?? '—'}</span>
              </div>
            </article>
          {/each}
        </div>
      </section>
    {/if}

    {#if data.playoffBoard.length}
      <section class="stack">
        <div class="section-head">
          <div>
            <div class="eyebrow">Playoff path</div>
            <h2>Bracket board</h2>
          </div>
        </div>
        <div class="playoff-grid">
          {#each data.playoffBoard as week (week.week)}
            <div class="card playoff-week">
              <div class="eyebrow">Week {week.week}</div>
              <div class="stack mini-stack">
                {#each week.games as game (`${week.week}-${game.matchupId}`)}
                  <div class="playoff-game">
                    <strong>{game.left.teamName}</strong>
                    <span>{game.left.score.toFixed(2)}</span>
                    <strong>{game.right.teamName}</strong>
                    <span>{game.right.score.toFixed(2)}</span>
                    <small>{game.winnerName || 'Draw'}</small>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  {/if}
</div>

<style>
	/* =========================================================
	   IRVING COLLECTIVE — MATCHUPS
	   ========================================================= */

	.page-stack,
	.stack {
		display: grid;
		gap: 18px;
	}


	/* =========================================================
	   SHARED CARDS
	   ========================================================= */

	.card {
		border:
			1px solid
			var(--border) !important;

		border-radius:
			var(--radius-md) !important;

		background:
			linear-gradient(
				180deg,
				rgba(255,255,255,.018),
				transparent 24%
			),
			var(--panel) !important;

		box-shadow:
			var(--shadow-panel) !important;

		color:
			var(--brand-ivory) !important;
	}


	.eyebrow {
		color:
			var(--brand-gold) !important;

		font-family:
			var(--font-body);

		font-size: .61rem;

		font-weight: 700;

		letter-spacing: .16em;

		text-transform: uppercase;

		text-shadow: none;
	}


	h1,
	h2,
	h3 {
		color:
			var(--brand-ivory);

		text-shadow: none;
	}


	h1,
	h2 {
		font-family:
			var(--font-display);

		font-weight: 400;

		letter-spacing: .02em;
	}


	/* =========================================================
	   HERO
	   ========================================================= */

	.hero {
		position: relative;

		overflow: hidden;

		min-height: 220px;

		padding:
			30px 28px 24px !important;

		border-color:
			var(--border-strong) !important;

		background:
			linear-gradient(
				120deg,
				rgba(191,161,106,.055),
				transparent 38%
			),
			var(--panel-strong) !important;
	}


	.hero::after {
		content: 'MATCHUPS';

		position: absolute;

		right: 26px;

		bottom: -24px;

		color:
			rgba(191,161,106,.024);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				5rem,
				12vw,
				10rem
			);

		line-height: 1;

		letter-spacing: .04em;

		pointer-events: none;
	}


	.hero > * {
		position: relative;

		z-index: 1;
	}
.hero-main {
	position:
		relative;

	z-index:
		2;

	display:
		grid;

	grid-template-columns:
		minmax(0,1fr)
		auto;

	align-items:
		center;

	gap:
		30px;
}


.hero-copy {
	min-width: 0;
}


/* =========================================================
   SEASON SELECTOR
   ========================================================= */

.season-box {
	display:
		grid;

	gap:
		9px;

	min-width:
		180px;

	padding:
		12px 14px;

	border:
		1px solid
		var(--border-strong);

	border-radius:
		var(--radius-sm);

	background:
		rgba(13,16,15,.78);
}


.season-box > span {
	color:
		var(--brand-gold);

	font-family:
		var(--font-body);

	font-size:
		.61rem;

	font-weight:
		700;

	letter-spacing:
		.16em;

	text-transform:
		uppercase;
}


.season-pills {
	display:
		flex;

	flex-wrap:
		wrap;

	gap:
		6px;
}


.season-pills a {
	display:
		inline-flex;

	align-items:
		center;

	justify-content:
		center;

	min-width:
		54px;

	min-height:
		32px;

	padding:
		5px 9px;

	border:
		1px solid
		rgba(191,161,106,.18);

	border-radius:
		3px;

	background:
		transparent;

	color:
		var(--brand-stone);

	font-family:
		var(--font-body);

	font-size:
		.67rem;

	font-weight:
		700;

	letter-spacing:
		.08em;

	text-decoration:
		none;

	transition:
		color 120ms ease,
		border-color 120ms ease,
		background 120ms ease;
}


.season-pills a:hover {
	border-color:
		var(--brand-gold);

	color:
		var(--brand-ivory);
}


.season-pills a.active {
	border-color:
		var(--brand-gold);

	background:
		var(--brand-gold);

	color:
		var(--brand-charcoal);
}

	.hero h1 {
		margin:
			9px 0 12px;

		font-size:
			clamp(
				3.8rem,
				7vw,
				6.8rem
			);

		line-height: .88;
	}


	.hero p {
		max-width: 68ch;

		margin: 0;

		color:
			var(--muted);

		font-size: .94rem;

		line-height: 1.55;
	}


	/* =========================================================
	   WEEK NAVIGATION
	   ========================================================= */

	.week-nav-row {
		display: grid;

		grid-template-columns:
			auto
			minmax(0,1fr)
			auto;

		gap: 14px;

		align-items: center;

		margin-top: 26px;

		padding-top: 15px;

		border-top:
			1px solid
			rgba(191,161,106,.14);
	}


	.week-links {
		display: flex;

		flex-wrap: wrap;

		gap: 6px;
	}


	.week-links a,
	.nav-pill {
		display: inline-flex;

		align-items: center;

		justify-content: center;

		min-height: 31px;

		padding:
			5px 9px;

		border:
			1px solid
			rgba(191,161,106,.18);

		border-radius: 3px;

		background:
			transparent;

		color:
			var(--brand-stone);

		font-family:
			var(--font-body);

		font-size: .64rem;

		font-weight: 700;

		letter-spacing: .05em;

		text-decoration: none;

		transition:
			color 120ms ease,
			border-color 120ms ease,
			background 120ms ease;
	}


	.week-links a:hover,
	.nav-pill:hover {
		border-color:
			var(--brand-gold);

		color:
			var(--brand-ivory);
	}


	.week-links a.selected {
		border-color:
			var(--brand-gold);

		background:
			var(--brand-gold);

		color:
			var(--brand-charcoal);
	}


	.nav-pill {
		color:
			var(--brand-sand);
	}


	/* =========================================================
	   EMPTY STATE
	   ========================================================= */

	.empty {
		position: relative;

		min-height: 150px;

		display: grid;

		align-content: center;

		gap: 7px;

		padding:
			24px !important;

		border-left:
			2px solid
			var(--brand-gold) !important;
	}


	.empty h2 {
		margin: 0;

		font-size: 2rem;
	}


	.empty p {
		margin: 0;

		color:
			var(--muted);
	}


	/* =========================================================
	   SECTION HEADS
	   ========================================================= */

	.section-head {
		display: flex;

		align-items: end;

		justify-content:
			space-between;

		gap: 18px;

		padding:
			4px 2px 0;
	}


	.section-head h2 {
		margin:
			4px 0 0;

		font-size:
			2.1rem;

		line-height: 1;
	}


	/* =========================================================
	   WEEK HIGHLIGHTS
	   ========================================================= */

	.highlight-grid {
		display: grid;

		grid-template-columns:
			repeat(
				3,
				minmax(0,1fr)
			);

		gap: 14px;
	}


	.highlight-grid > .card {
		position: relative;

		min-height: 140px;

		padding:
			18px 19px 17px !important;
	}


	.highlight-grid > .card::before {
		content: '';

		position: absolute;

		top: 15px;
		bottom: 15px;
		left: 0;

		width: 2px;

		background:
			var(--brand-gold);

		opacity: .68;
	}


	.highlight-grid h3 {
		margin:
			6px 0 7px;

		font-family:
			var(--font-display);

		font-size: 1.55rem;

		font-weight: 400;

		line-height: 1;
	}


	.highlight-grid p {
		margin:
			0 0 12px;

		color:
			var(--muted);

		line-height: 1.4;
	}


	.highlight-grid strong {
		color:
			var(--brand-gold);

		font-family:
			var(--font-body);

		font-size: .78rem;

		font-weight: 800;
	}


	/* =========================================================
	   MATCHUP GRID
	   ========================================================= */

	.matchup-grid {
		display: grid;

		grid-template-columns:
			repeat(
				2,
				minmax(0,1fr)
			);

		gap: 14px;
	}


	.matchup-card {
		display: grid;

		gap: 0;

		overflow: hidden;

		padding: 0 !important;
	}


	/* =========================================================
	   TEAM SCORE ROW
	   ========================================================= */

	.team-row {
		position: relative;

		display: flex;

		align-items: center;

		justify-content:
			space-between;

		gap: 18px;

		min-height: 82px;

		padding:
			13px 15px;

		border-bottom:
			1px solid
			rgba(191,161,106,.10);

		background:
			transparent;
	}


	.team-row.winning {
		background:
			linear-gradient(
				90deg,
				rgba(191,161,106,.075),
				transparent 52%
			);
	}


	.team-row.winning::before {
		content: '';

		position: absolute;

		top: 10px;
		bottom: 10px;
		left: 0;

		width: 2px;

		background:
			var(--brand-gold);
	}


	.team-main {
		display: flex;

		align-items: center;

		gap: 12px;

		min-width: 0;
	}


	.team-main > div:last-child {
		min-width: 0;
	}


	.team-main strong {
		display: block;

		overflow: hidden;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-body);

		font-size: .86rem;

		font-weight: 800;

		text-overflow: ellipsis;

		white-space: nowrap;
	}


	.team-row small {
		display: block;

		margin-top: 3px;

		color:
			var(--brand-stone);

		font-size: .67rem;
	}
.team-row .score {
	color:
		var(--brand-sand);
}

.team-row.winning .score {
	color:
		var(--brand-gold);
}

.team-row:not(.winning) {
	opacity: .88;
}

	/* =========================================================
	   TEAM LOGO
	   ========================================================= */

	.team-photo {
		width: 50px;

		height: 50px;

		flex:
			0 0 50px;

		display: grid;

		place-items: center;

		overflow: hidden;


		border-radius: 4px;

		
		color:
			var(--brand-charcoal);

		font-family:
			var(--font-body);

		font-size: .65rem;

		font-weight: 800;
	}


	.team-photo img {
		width: 100%;

		height: 100%;

		object-fit: cover;
	}


	/* =========================================================
	   SCORE
	   ========================================================= */

	.score {
		flex:
			0 0 auto;

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size:
			2rem;

		font-weight: 400;

		line-height: 1;

		letter-spacing: .02em;

		font-variant-numeric:
			tabular-nums;
	}


	/* =========================================================
	   STARTERS
	   ========================================================= */

	.starter-strip {
		display: flex;

		flex-wrap: wrap;

		gap: 5px;

		padding:
			9px 12px 11px;

		border-bottom:
			1px solid
			rgba(191,161,106,.08);

		background:
			rgba(0,0,0,.10);
	}


	.starter-chip {
		display: inline-flex;

		align-items: center;

		gap: 6px;

		padding:
			4px 7px;

		border:
			1px solid
			rgba(191,161,106,.12);

		border-radius: 3px;

		background:
			rgba(255,255,255,.015);

		color:
			var(--brand-sand);

		font-family:
			var(--font-body);

		font-size: .58rem;

		font-weight: 650;
	}


	.starter-chip img {
		width: 23px;

		height: 23px;

		border-radius: 0;

		object-fit: contain;

		background: transparent;
	}


	/* =========================================================
	   RIVALRIES
	   ========================================================= */

	.rivalry-grid {
		display: grid;

		grid-template-columns:
			repeat(
				3,
				minmax(0,1fr)
			);

		gap: 14px;
	}


	.rivalry-card {
		position: relative;

		padding:
			18px !important;
	}


	.rivalry-card strong {
		display: block;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size: 1.45rem;

		font-weight: 400;

		line-height: 1.05;
	}


	.rivalry-card p {
		margin:
			8px 0 0;

		color:
			var(--muted);

		line-height: 1.45;
	}


	.meta-row {
		display: grid;

		grid-template-columns:
			1fr
			1fr;

		gap: 8px;

		margin-top: 15px;

		padding-top: 11px;

		border-top:
			1px solid
			rgba(191,161,106,.12);

		color:
			var(--brand-stone);

		font-family:
			var(--font-body);

		font-size: .65rem;
	}


	/* =========================================================
	   PLAYOFF BOARD
	   ========================================================= */

	.playoff-grid {
		display: grid;

		grid-template-columns:
			repeat(
				3,
				minmax(0,1fr)
			);

		gap: 14px;
	}


	.playoff-week {
		display: grid;

		gap: 13px;

		padding:
			18px !important;
	}


	.mini-stack {
		margin-top: 0;
	}


	.playoff-game {
		display: grid;

		grid-template-columns:
			minmax(0,1fr)
			auto;

		gap:
			6px 12px;

		padding:
			11px 0;

		border-bottom:
			1px solid
			rgba(191,161,106,.11);

		background:
			transparent;
	}


	.playoff-game:last-child {
		border-bottom: 0;
	}


	.playoff-game strong {
		overflow: hidden;

		color:
			var(--brand-ivory);

		font-size: .72rem;

		text-overflow: ellipsis;

		white-space: nowrap;
	}


	.playoff-game span {
		color:
			var(--brand-gold);

		font-weight: 800;

		font-variant-numeric:
			tabular-nums;
	}


	.playoff-game small {
		grid-column:
			1 / -1;

		color:
			var(--brand-stone);

		font-size: .62rem;
	}


	/* =========================================================
	   RESPONSIVE
	   ========================================================= */

	@media (
		max-width: 1100px
	) {
		.highlight-grid,
		.rivalry-grid,
		.playoff-grid {
			grid-template-columns:
				1fr;
		}


		.matchup-grid {
			grid-template-columns:
				1fr;
		}


		.week-nav-row {
			grid-template-columns:
				1fr;
		}


		.nav-pill {
			width:
				fit-content;
		}
	}


	@media (
		max-width: 650px
	) {
		.hero {
			padding:
				22px 18px !important;
		}

.hero-main {
	grid-template-columns:
		1fr;
}


.season-box {
	width:
		100%;

	min-width:
		0;
}
		.hero::after {
			display: none;
		}


		.team-row {
			min-height: 72px;

			padding:
				11px 12px;
		}


		.team-photo {
			width: 42px;

			height: 42px;

			flex-basis: 42px;
		}


		.score {
			font-size: 1.65rem;
		}


		.meta-row {
			grid-template-columns:
				1fr;
		}
	}
</style>
