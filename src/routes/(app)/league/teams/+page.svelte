<script>
  import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';
  export let data;

  const fmt = (value, digits = 2) => {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(digits) : Number(0).toFixed(digits);
  };

  function moneyNumber(value) {
    if (value == null || value === '—') return null;
    const cleaned = String(value).replace(/[^0-9.-]/g, '');
    const number = Number(cleaned);
    return Number.isFinite(number) ? number : null;
  }

  function moneyLabel(value) {
    const amount = moneyNumber(value);
    if (amount == null) return '—';
    return `$${amount.toLocaleString('en-US', {
      maximumFractionDigits: amount % 1 ? 2 : 0
    })}`;
  }

  function draftDollarClass(value) {
    const amount = moneyNumber(value);
    if (amount == null) return 'money-neutral';
    if (amount < 100) return 'money-low';
    if (amount > 199) return 'money-high';
    return 'money-mid';
  }

  $: cards = data.cards || [];
  $: season = data.season || new Date().getFullYear();

  const FALLBACK_SEASONS = [2026, 2025];

$: availableSeasons = (Array.isArray(data.seasons) && data.seasons.length
  ? data.seasons
  : FALLBACK_SEASONS
)
  .map(Number)
  .filter(Number.isFinite)
  .sort((a, b) => b - a);

function seasonHref(option) {
  return `?season=${option}`;
}
</script>

<div class="page-stack">
  <LeagueSubnav season={season} active="teams" />

  <section class="directory-hero icl-hero-shell pad-md">
  <div class="hero-copy">
    <div class="bug-label">Franchises</div>
    <h1>The Teams</h1>
    <p>Find out more about who runs each franchise.</p>
  </div>

  <div class="season-box" aria-label="Season selector">
    <span>Season feed</span>

    <div class="season-pills">
      {#each availableSeasons as option}
        <a
          class:active={Number(option) === Number(season)}
          href={seasonHref(option)}
        >
          {option}
        </a>
      {/each}
    </div>
  </div>
</section>

  <div class="grid">
    {#each cards as card}
      <article class="team-card">
        <a class="cover" href={card.quickLinks.team} aria-label={`Open ${card.teamName}`}>
          <img src={card.teamPhoto} alt={card.teamName} />
        </a>

        <div class="content">
          <div class="scorebug-row">
            <span>{card.currentRank ? `#${card.currentRank}` : '—'}</span>
            <strong>{card.teamName}</strong>
            <em>{card.currentRecord}</em>
          </div>

          <h3><a href={card.quickLinks.team}>{card.managerName}</a></h3>

          <div class="bug-stats" aria-label="Current season snapshot">
            <span>{fmt(card.currentPoints)} PF</span>
            <span>{fmt(card.currentPointDiff)} DIFF</span>
            <span class={`draft-money-pill ${draftDollarClass(card.futureDraftDollars)}`}>
              Draft {moneyLabel(card.futureDraftDollars)}
            </span>
          </div>

          <div class="link-row">
            <a href={card.quickLinks.team}>Franchise page</a>
            <a href={card.quickLinks.games}>Games</a>
            <a href={card.quickLinks.moves}>Moves</a>
          </div>
        </div>
      </article>
    {/each}
  </div>
</div>

<style>
	/* =========================================================
	   IRVING COLLECTIVE — TEAMS DIRECTORY
	   ========================================================= */

	.page-stack {
		display: grid;
		gap: 20px;
	}


	/* =========================================================
	   HERO
	   ========================================================= */

	.directory-hero {
		position: relative;

		display: grid;
		grid-template-columns:
			minmax(0, 1fr)
			auto;

		align-items: center;

		gap: 28px;

		min-height: 190px;

		padding: 26px 28px;

		border:
			1px solid
			var(--border-strong) !important;

		border-radius:
			var(--radius-lg);

		background:
			linear-gradient(
				120deg,
				rgba(191,161,106,.055),
				transparent 38%
			),
			var(--panel-strong) !important;

		box-shadow:
			var(--shadow-panel) !important;

		overflow: hidden;
	}


	.directory-hero::after {
		content: 'FRANCHISES';

		position: absolute;

		right: 26px;
		bottom: -18px;

		color:
			rgba(191,161,106,.024);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				5rem,
				11vw,
				9rem
			);

		line-height: 1;

		letter-spacing: .04em;

		pointer-events: none;
	}


	.hero-copy {
		position: relative;

		z-index: 1;

		min-width: 0;
	}


	.bug-label {
		display: inline-flex;

		align-items: center;

		min-height: 24px;

		padding:
			4px 8px;

		border:
			1px solid
			var(--brand-gold);

		border-radius: 3px;

		background:
			transparent !important;

		color:
			var(--brand-gold) !important;

		font-family:
			var(--font-body);

		font-size: .61rem;

		font-weight: 700;

		letter-spacing: .15em;

		text-transform: uppercase;

		box-shadow: none;
	}


	.directory-hero h1 {
		margin:
			10px 0 7px;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				3.7rem,
				6vw,
				6.2rem
			);

		font-weight: 400;

		line-height: .88;

		letter-spacing: .015em;

		text-shadow: none;
	}


	.directory-hero p {
		max-width: 62ch;

		margin: 0;

		color:
			var(--muted);

		font-size: .92rem;

		font-weight: 500;

		line-height: 1.55;
	}


	/* =========================================================
	   SEASON SELECTOR
	   ========================================================= */

	.season-box {
		position: relative;

		z-index: 2;

		display: grid;

		gap: 9px;

		min-width: 180px;

		padding:
			12px 14px;

		border:
			1px solid
			var(--border-strong);

		border-radius:
			var(--radius-sm);

		background:
			rgba(13,16,15,.78);

		box-shadow: none;
	}


	.season-box > span {
		color:
			var(--brand-gold);

		font-family:
			var(--font-body);

		font-size: .61rem;

		font-weight: 700;

		text-transform: uppercase;

		letter-spacing: .16em;

		text-shadow: none;
	}


	.season-pills {
		display: flex;

		flex-wrap: wrap;

		gap: 6px;
	}


	.season-pills a {
		display: inline-flex;

		align-items: center;

		justify-content: center;

		min-width: 54px;

		min-height: 32px;

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

		font-size: .67rem;

		font-weight: 700;

		letter-spacing: .08em;

		text-decoration: none;

		text-shadow: none;

		box-shadow: none;

		transition:
			border-color 130ms ease,
			color 130ms ease,
			background 130ms ease;
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


	/* =========================================================
	   DIRECTORY GRID
	   ========================================================= */

	.grid {
		display: grid;

		grid-template-columns:
			repeat(
				3,
				minmax(0,1fr)
			);

		gap: 16px;
	}


	/* =========================================================
	   TEAM CARD
	   ========================================================= */

	.team-card {
		position: relative;

		display: grid;

		grid-template-columns:
			118px
			minmax(0,1fr);

		gap: 16px;

		overflow: hidden;

		min-height: 150px;

		padding: 14px;

		border:
			1px solid
			var(--border) !important;

		border-radius:
			var(--radius-md);

		background:
			linear-gradient(
				180deg,
				rgba(255,255,255,.018),
				transparent 26%
			),
			var(--panel) !important;

		box-shadow:
			var(--shadow-panel) !important;

		transition:
			border-color 140ms ease,
			transform 140ms ease;
	}


	.team-card:hover {
		border-color:
			rgba(191,161,106,.46) !important;

		transform:
			translateY(-2px);
	}


	.team-card::before {
		content: '';

		position: absolute;

		top: 14px;
		bottom: 14px;
		left: 0;

		width: 2px;

		background:
			var(--brand-gold);

		opacity: 0;

		transition:
			opacity 140ms ease;
	}


	.team-card:hover::before {
		opacity: .65;
	}


	/* =========================================================
	   TEAM LOGO
	   ========================================================= */

	.cover {
		display: block;

		align-self: start;
	}


	.cover img {
		display: block;

		width: 118px;

		height: 118px;

		object-fit: cover;

		border:
			1px solid
			rgba(191,161,106,.30);

		border-radius:
			4px;

		background:
			var(--brand-ivory);

		box-shadow:
			0 10px 22px
			rgba(0,0,0,.24);
	}


	/* =========================================================
	   CONTENT
	   ========================================================= */

	.content {
		min-width: 0;

		display: grid;

		align-content: start;

		gap: 10px;
	}


	/* =========================================================
	   TEAM IDENTITY ROW
	   ========================================================= */

	.scorebug-row {
		display: grid;

		grid-template-columns:
			auto
			minmax(0,1fr)
			auto;

		align-items: center;

		gap: 10px;

		min-width: 0;

		padding-bottom: 9px;

		border-bottom:
			1px solid
			rgba(191,161,106,.16);

		background: transparent;

		font-family:
			var(--font-body);

		text-transform: uppercase;

		overflow: visible;
	}


	.scorebug-row span {
		display: inline-flex;

		align-items: center;

		justify-content: center;

		min-width: 31px;

		padding:
			4px 6px;

		border:
			1px solid
			rgba(191,161,106,.28);

		border-radius: 3px;

		background:
			transparent;

		color:
			var(--brand-gold);

		font-size: .66rem;

		font-weight: 800;
	}


	.scorebug-row strong {
		min-width: 0;

		overflow: hidden;

		color:
			var(--brand-ivory);

		font-size: .74rem;

		font-weight: 800;

		letter-spacing: .035em;

		text-overflow: ellipsis;

		white-space: nowrap;
	}


	.scorebug-row em {
		display: inline-flex;

		align-items: center;

		justify-content: center;

		min-width: 42px;

		padding:
			4px 6px;

		border:
			1px solid
			rgba(191,161,106,.16);

		border-radius: 3px;

		background:
			transparent;

		color:
			var(--brand-sand);

		font-size: .68rem;

		font-style: normal;

		font-weight: 700;
	}


	/* =========================================================
	   MANAGER
	   ========================================================= */

	h3 {
		margin: 0;
	}


	h3 a {
		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size: 1.45rem;

		font-weight: 400;

		letter-spacing: .02em;

		text-decoration: none;
	}


	h3 a:hover {
		color:
			var(--brand-gold);
	}


	/* =========================================================
	   STATS
	   ========================================================= */

	.bug-stats {
		display: flex;

		flex-wrap: wrap;

		gap: 6px;
	}


	.bug-stats span {
		padding:
			5px 7px;

		border:
			1px solid
			rgba(191,161,106,.14);

		border-radius: 3px;

		background:
			rgba(255,255,255,.018);

		color:
			var(--brand-sand);

		font-family:
			var(--font-body);

		font-size: .61rem;

		font-weight: 700;

		letter-spacing: .025em;

		text-shadow: none;

		box-shadow: none;
	}


	/* =========================================================
	   DRAFT MONEY
	   ========================================================= */

	.bug-stats span.draft-money-pill {
		min-width: 82px;

		margin-left: 1px;

		border:
			1px solid
			rgba(191,161,106,.22) !important;

		background:
			rgba(191,161,106,.045) !important;

		color:
			var(--brand-gold) !important;

		text-align: center;

		text-shadow: none !important;

		box-shadow: none !important;
	}


	.bug-stats span.draft-money-pill.money-low {
		border-color:
			rgba(185,90,90,.40) !important;

		color:
			#d98585 !important;

		background:
			rgba(155,71,71,.07) !important;
	}


	.bug-stats span.draft-money-pill.money-mid {
		border-color:
			rgba(191,161,106,.34) !important;

		color:
			var(--brand-gold) !important;

		background:
			rgba(191,161,106,.055) !important;
	}


	.bug-stats span.draft-money-pill.money-high {
		border-color:
			rgba(111,150,125,.42) !important;

		color:
			#91b69c !important;

		background:
			rgba(111,150,125,.065) !important;
	}


	.bug-stats span.draft-money-pill.money-neutral {
		border-color:
			rgba(143,145,142,.24) !important;

		color:
			var(--brand-stone) !important;

		background:
			rgba(143,145,142,.04) !important;
	}


	/* =========================================================
	   LINKS
	   ========================================================= */

	.link-row {
		display: flex;

		flex-wrap: wrap;

		gap: 12px;

		padding-top: 2px;
	}


	.link-row a {
		position: relative;

		color:
			var(--brand-sand) !important;

		font-family:
			var(--font-body);

		font-size: .62rem;

		font-weight: 700;

		letter-spacing: .08em;

		text-decoration: none;

		text-transform: uppercase;
	}


	.link-row a::after {
		content: '';

		position: absolute;

		left: 0;
		right: 0;
		bottom: -3px;

		height: 1px;

		background:
			var(--brand-gold);

		transform:
			scaleX(0);

		transform-origin:
			left;

		transition:
			transform 130ms ease;
	}


	.link-row a:hover {
		color:
			var(--brand-gold) !important;

		text-decoration: none;
	}


	.link-row a:hover::after {
		transform:
			scaleX(1);
	}


	/* =========================================================
	   RESPONSIVE
	   ========================================================= */

	@media (
		max-width: 1150px
	) {
		.grid {
			grid-template-columns:
				repeat(
					2,
					minmax(0,1fr)
				);
		}
	}


	@media (
		max-width: 800px
	) {
		.directory-hero {
			grid-template-columns:
				1fr;

			align-items: start;
		}


		.directory-hero::after {
			display: none;
		}


		.season-box {
			width: 100%;

			min-width: 0;
		}


		.grid {
			grid-template-columns:
				1fr;
		}
	}


	@media (
		max-width: 560px
	) {
		.team-card {
			grid-template-columns:
				94px
				minmax(0,1fr);

			gap: 12px;

			padding: 11px;
		}


		.cover img {
			width: 94px;

			height: 94px;
		}


		.scorebug-row {
			grid-template-columns:
				auto
				minmax(0,1fr);

			gap: 7px;
		}


		.scorebug-row em {
			grid-column:
				1 / -1;

			justify-self: start;
		}


		h3 a {
			font-size: 1.2rem;
		}


		.link-row {
			gap: 9px;
		}
	}


	@media (
		max-width: 400px
	) {
		.team-card {
			grid-template-columns:
				1fr;
		}


		.cover img {
			width: 100px;

			height: 100px;
		}
	}
</style>