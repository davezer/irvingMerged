<script>
	export let season;
	export let active = 'league';

	const seasonParam = season ? `?season=${season}` : '';

	const items = [
		{
			key: 'league',
			label: 'League',
			href: '/league'
		},
		{
			key: 'standings',
			label: 'Standings',
			href: `/league/standings${seasonParam}`
		},
		{
			key: 'teams',
			label: 'Teams',
			href: `/league/teams${seasonParam}`
		},
		{
			key: 'rosters',
			label: 'Rosters',
			href: `/league/rosters${seasonParam}`
		},
		{
			key: 'matchups',
			label: 'Matchups',
			href: `/league/matchups${seasonParam}`
		},
		{
			key: 'transactions',
			label: 'Transactions',
			href: `/league/transactions${seasonParam}`
		},
		{
			key: 'drafts',
			label: 'Drafts',
			href: `/league/drafts${seasonParam}`
		},
		{
			key: 'keepers',
			label: 'Keeper Calculator',
			href: `/league/keepers${seasonParam}`
		}
	];
</script>

<nav class="league-subnav" aria-label="League navigation">
	<div class="subnav-inner">
		<div class="league-mark">
			<span class="monogram"> ICL </span>
		</div>

		<div class="nav-links">
			{#each items as item}
				<a class:active={active === item.key} href={item.href}>
					{item.label}
				</a>
			{/each}
		</div>

		{#if season}
			<div class="season-chip">
				<span> Season </span>

				<strong>
					{season}
				</strong>
			</div>
		{/if}
	</div>
</nav>

<style>
	/* ======================================================
	   IRVING COLLECTIVE — LEAGUE SUBNAV
	   ====================================================== */

	.league-subnav {
		position: relative;

		width: 100%;

		border-top: 1px solid rgba(191, 161, 106, 0.22);

		border-bottom: 1px solid rgba(191, 161, 106, 0.32);

		background: rgba(15, 18, 17, 0.96);

		box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2);
	}

	.subnav-inner {
		display: grid;

		grid-template-columns:
			auto
			minmax(0, 1fr)
			auto;

		align-items: center;

		gap: 22px;

		width: 100%;

		padding: 8px 12px;
	}

	/* ======================================================
	   LEFT BRAND MARK
	   ====================================================== */

	.league-mark {
		display: inline-flex;

		align-items: center;

		gap: 10px;

		flex: 0 0 auto;
	}

	.monogram {
		display: grid;

		place-items: center;

		width: 34px;

		height: 34px;

		border: 1px solid var(--brand-gold);

		color: var(--brand-gold);

		background: var(--brand-charcoal);

		font-family: var(--font-display);

		font-size: 1rem;

		line-height: 1;

		letter-spacing: 0.04em;
	}

	.division-label {
		color: var(--brand-sand);

		font-family: var(--font-body);

		font-size: 0.62rem;

		font-weight: 700;

		letter-spacing: 0.15em;

		text-transform: uppercase;
	}

	/* ======================================================
	   LINKS
	   ====================================================== */

	.nav-links {
		display: flex;

		align-items: center;

		gap: 3px;

		min-width: 0;

	
	}

	.nav-links::-webkit-scrollbar {
		display: none;
	}

	.nav-links a {
		position: relative;

		display: inline-flex;

		align-items: center;

		justify-content: center;

		flex: 0 0 auto;

		min-height: 38px;

		padding: 0 10px;

		border: 0;

		background: transparent;

		color: rgba(242, 236, 226, 0.6);

		font-family: var(--font-body);

		font-size: 0.64rem;

		font-weight: 650;

		line-height: 1;

		letter-spacing: 0.075em;

		text-decoration: none;

		text-transform: uppercase;

		white-space: nowrap;

		transition: color 140ms ease;
	}

	.nav-links a::after {
		content: '';

		position: absolute;

		left: 10px;

		right: 10px;

		bottom: 2px;

		height: 1px;

		background: var(--brand-gold);

		transform: scaleX(0);

		transform-origin: center;

		transition: transform 140ms ease;
	}

	.nav-links a:hover {
		color: var(--brand-ivory);
	}

	.nav-links a:hover::after {
		transform: scaleX(0.45);
	}

	.nav-links a.active {
		color: var(--brand-gold);
	}

	.nav-links a.active::after {
		transform: scaleX(1);
	}

	/* ======================================================
	   SEASON
	   ====================================================== */

	.season-chip {
		display: flex;

		align-items: center;

		gap: 8px;

		flex: 0 0 auto;

		padding: 6px 9px;

		border: 1px solid rgba(191, 161, 106, 0.34);

		background: rgba(191, 161, 106, 0.055);
	}

	.season-chip span {
		color: var(--brand-stone);

		font-family: var(--font-body);

		font-size: 0.52rem;

		font-weight: 600;

		letter-spacing: 0.13em;

		text-transform: uppercase;
	}

	.season-chip strong {
		color: var(--brand-gold);

		font-family: var(--font-display);

		font-size: 1.05rem;

		font-weight: 400;

		line-height: 1;

		letter-spacing: 0.04em;
	}

	.league-subnav-links a:nth-child(n + 6) {
	border-top:
		1px solid
		rgba(191, 161, 106, 0.08);
}

	/* ======================================================
	   RESPONSIVE
	   ====================================================== */

	@media (max-width: 900px) {
		.subnav-inner {
			grid-template-columns:
				auto
				minmax(0, 1fr)
				auto;

			gap: 12px;
		}

		.division-label {
			display: none;
		}

		.nav-links a {
			padding: 0 8px;
		}
	}

@media (max-width: 760px) {
	.subnav-inner {
		display: grid;

		grid-template-columns:
			46px
			minmax(0, 1fr);

		align-items: stretch;

		gap: 10px;

		padding: 7px 10px;
	}

	.league-mark {
		display: grid;
		place-items: center;

		align-self: stretch;

		padding-right: 10px;

		border-right:
			1px solid
			rgba(191, 161, 106, 0.22);
	}

	.monogram {
		width: 30px;
		height: 30px;

		font-size: 0.9rem;
	}

	.season-chip {
		display: none;
	}

	.nav-links {
		display: grid;

		grid-template-columns:
			repeat(10, minmax(0, 1fr));

		align-items: center;

		width: 100%;

		column-gap: 2px;
	row-gap: 1px;

		overflow: visible;
	}

	.nav-links a {
		grid-column: span 2;

		display: flex;
		align-items: center;
		justify-content: center;

		min-width: 0;
		min-height: 30px;

		padding: 0 2px;

		font-size: 0.55rem;
		letter-spacing: 0.045em;

		text-align: center;
		white-space: nowrap;
	}

	/* Center the three links on row two */

	.nav-links a:nth-child(6) {
	/* Transactions */
	grid-column: 2 / span 3;
}

.nav-links a:nth-child(7) {
	/* Drafts */
	grid-column: 5 / span 2;
}

.nav-links a:nth-child(8) {
	/* Keeper Calculator */
	grid-column: 7 / span 3;

	.nav-links a::after {
		left: 5px;
		right: 5px;
		bottom: 1px;
	}
}

@media (max-width: 650px) {
	.subnav-inner {
		grid-template-columns:
			42px
			minmax(0, 1fr);

		gap: 7px;

		padding: 6px 7px;
	}

	.league-mark {
		padding-right: 7px;
	}

	.monogram {
		width: 28px;
		height: 28px;

		font-size: 0.82rem;
	}

	.nav-links a {
		min-height: 28px;

		padding: 0 1px;

		font-size: 0.52rem;
		letter-spacing: 0.025em;
	}
}
}
</style>
