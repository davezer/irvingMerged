<script>
	import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';

	export let data;

	const FALLBACK_SEASONS = [2026, 2025];

	$: standings = data.standings || [];
	$: season = data.season || new Date().getFullYear();
	$: topSeed = data.pulse?.topSeed || standings[0] || null;
	$: averagePoints = data.pulse?.averagePoints || 0;
	$: hottest = data.pulse?.hottest || null;
	$: teamCount = standings.length;

	const fmt = (value, digits = 2) => Number(value || 0).toFixed(digits);

	const pct = (value) => `${(Number(value || 0) * 100).toFixed(1)}%`;

	$: availableSeasons = (
		Array.isArray(data.seasons) && data.seasons.length ? data.seasons : FALLBACK_SEASONS
	)
		.map(Number)
		.filter(Number.isFinite)
		.sort((a, b) => b - a);

	function buildHref({ nextSeason = season } = {}) {
		const params = new URLSearchParams();
		params.set('season', String(nextSeason));

		return `/league/standings?${params.toString()}`;
	}

	function teamHref(row) {
		return row.slug
			? `/league/teams/${row.slug}?season=${season}`
			: `/league/teams?season=${season}`;
	}

	function trendClass(row) {
		const diff = Number(row.pointDiff || 0);

		if (diff > 0) return 'good';
		if (diff < 0) return 'bad';

		return 'even';
	}
</script>

<div class="page-stack">
	<LeagueSubnav {season} active="standings" />

	<section class="studio-header icl-hero-shell pad-md" aria-label="Standings header">
		<div class="header-copy">
			<h1>Standings Desk</h1>
		</div>

		<div class="standings-season-box icl-hero-shell pad-md" aria-label="Season selector">
			<span class="standings-season-label">Season Feed</span>

			<div class="standings-season-pills">
				{#each availableSeasons as option}
					<a
						class:active={Number(option) === Number(season)}
						href={`/league/standings?season=${option}`}
					>
						{option}
					</a>
				{/each}
			</div>
		</div>
	</section>

	{#if !data.hasData}
		<section class="studio-card empty-state">
			<div class="bug-row"><span>ICL</span><strong>No Signal</strong></div>
			<h2>No standings data yet</h2>
			<p>We could not pull Sleeper standings for this season.</p>
		</section>
	{:else}
		<!-- <section class="studio-strip" aria-label="Standings summary">
      

      <article>
        <span>Best point diff</span>
        <strong>{hottest?.teamName || '—'}</strong>
        <small>{hottest ? `${fmt(hottest.pointDiff)} diff` : 'No data yet'}</small>
      </article>

      <article>
        <span>Teams on board</span>
        <strong>{teamCount}</strong>
        <small>Full franchise field</small>
      </article>
    </section> -->

		<section class="standings-board icl-hero-shell pad-md" aria-label="Full league standings">
			<div class="board-topper">
				<div>
					<div class="eyebrow">League Table</div>

					<h2>Current Standings</h2>
				</div>

				<div class="board-note">
					{teamCount} franchises
				</div>
			</div>

			<div class="table-shell">
				<table>
					<thead>
						<tr>
							<th class="rank-col">Rank</th>
							<th class="team-col">Franchise</th>
							<th>Manager</th>
							<th>Record</th>
							<th>PF</th>
							<th>PA</th>
							<th>Diff</th>
							<th>Win %</th>
							<!-- <th>Back</th> -->
							<!-- <th>Tier</th> -->
						</tr>
					</thead>
					<tbody>
						{#each standings as row}
							<tr class:leader={row.rank === 1}>
								<td class="rank-cell">#{row.rank}</td>
								<td class="team-cell">
									<a class="team-inline" href={teamHref(row)}>
										<span class="inline-photo">
											{#if row.teamChiclet || row.teamPhoto}
												<img src={row.teamChiclet || row.teamPhoto} alt={row.teamName} />
											{:else}
												<span>{row.initials}</span>
											{/if}
										</span>
										<span class="team-copy">
											<strong>{row.teamName}</strong>
											<!-- <small>{row.branded ? 'Franchise feed' : 'Sleeper feed'}</small> -->
										</span>
									</a>
								</td>
								<td>{row.managerName}</td>
								<td><strong class="record-text">{row.recordLabel}</strong></td>
								<td class="num">{fmt(row.points)}</td>
								<td class="num">{fmt(row.pointsAgainst)}</td>
								<td class={`num diff ${trendClass(row)}`}>{fmt(row.pointDiff)}</td>
								<td class="num">{pct(row.pct)}</td>
								<!-- <td class="num">{fmt(row.pointsBehind)}</td> -->
								<!-- <td><span class="tier-chip">{row.tier}</span></td> -->
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}
</div>

<style>
	/* =========================================================
	   IRVING COLLECTIVE — STANDINGS
	   ========================================================= */

	.page-stack {
		display: grid;
		gap: 18px;
	}

	/* =========================================================
	   HERO
	   ========================================================= */

	.studio-header {
		position: relative;

		display: grid;

		grid-template-columns:
			minmax(0, 1fr)
			auto;

		align-items: center;

		gap: 28px;

		min-height: 190px;

		padding: 26px 28px;

		overflow: hidden;

		border: 1px solid var(--border-strong) !important;

		border-radius: var(--radius-lg);

		background:
			linear-gradient(120deg, rgba(191, 161, 106, 0.055), transparent 38%), var(--panel-strong) !important;

		box-shadow: var(--shadow-panel) !important;
	}

	.studio-header::after {
		content: 'STANDINGS';

		position: absolute;

		right: 28px;

		bottom: -19px;

		color: rgba(191, 161, 106, 0.024);

		font-family: var(--font-display);

		font-size: clamp(5rem, 12vw, 10rem);

		line-height: 1;

		letter-spacing: 0.04em;

		pointer-events: none;
	}

	.header-copy {
		position: relative;

		z-index: 1;

		padding: 0;
	}

	h1 {
		margin: 0;

		color: var(--brand-ivory);

		font-family: var(--font-display);

		font-size: clamp(3.8rem, 7vw, 6.8rem);

		font-weight: 400;

		line-height: 0.88;

		letter-spacing: 0.015em;

		text-shadow: none;
	}

	.eyebrow,
	.board-note {
		color: var(--brand-gold);

		font-family: var(--font-body);

		font-size: 0.62rem;

		font-weight: 700;

		letter-spacing: 0.16em;

		text-transform: uppercase;
	}

	/* =========================================================
	   SEASON SELECTOR
	   ========================================================= */

	.standings-season-box {
		position: relative;

		z-index: 2;

		align-self: center;

		justify-self: end;

		display: grid;

		gap: 9px;

		min-width: 180px;

		margin: 0;

		padding: 12px 14px;

		border: 1px solid var(--border-strong) !important;

		border-radius: var(--radius-sm);

		background: rgba(13, 16, 15, 0.78) !important;

		box-shadow: none !important;
	}

	.standings-season-label {
		color: var(--brand-gold);

		font-family: var(--font-body);

		font-size: 0.61rem;

		font-weight: 700;

		letter-spacing: 0.16em;

		text-transform: uppercase;

		text-shadow: none;
	}

	.standings-season-pills {
		display: flex;

		gap: 6px;

		flex-wrap: wrap;
	}

	.standings-season-pills a {
		display: grid;

		place-items: center;

		min-width: 54px;

		min-height: 32px;

		padding: 5px 9px;

		border: 1px solid rgba(191, 161, 106, 0.18);

		border-radius: 3px;

		background: transparent;

		color: var(--brand-stone);

		font-family: var(--font-body);

		font-size: 0.67rem;

		font-weight: 700;

		letter-spacing: 0.08em;

		text-decoration: none;

		text-shadow: none;

		box-shadow: none;

		transition:
			border-color 130ms ease,
			color 130ms ease,
			background 130ms ease;
	}

	.standings-season-pills a:hover {
		border-color: var(--brand-gold);

		color: var(--brand-ivory);
	}

	.standings-season-pills a.active {
		border-color: var(--brand-gold);

		background: var(--brand-gold);

		color: var(--brand-charcoal);
	}

	/* =========================================================
	   STANDINGS BOARD
	   ========================================================= */

	.standings-board {
		overflow: hidden;

		padding: 0 !important;

		border: 1px solid var(--border) !important;

		border-radius: var(--radius-lg);

		background: var(--panel) !important;

		box-shadow: var(--shadow-panel) !important;
	}

	.board-topper {
		display: flex;

		align-items: end;

		justify-content: space-between;

		gap: 18px;

		padding: 20px 22px 17px;

		border-bottom: 1px solid var(--border);

		background: linear-gradient(180deg, rgba(255, 255, 255, 0.018), transparent);
	}

	.board-topper h2 {
		margin: 4px 0 0;

		color: var(--brand-ivory);

		font-family: var(--font-display);

		font-size: 2rem;

		font-weight: 400;

		line-height: 1;

		letter-spacing: 0.02em;
	}

	.board-note {
		padding-bottom: 2px;

		color: var(--brand-stone);
	}

	/* =========================================================
	   TABLE
	   ========================================================= */

	.table-shell {
		overflow-x: auto;

		background: transparent;
	}

	table {
		width: 100%;
		min-width: 1000px;

		border-collapse: collapse;

		table-layout: fixed;

		font-variant-numeric: tabular-nums;
	}

	th,
	td {
		padding: 10px 12px;

		border-bottom: 1px solid rgba(191, 161, 106, 0.1);

		text-align: left;

		vertical-align: middle;
	}
	th:nth-child(1),
	td:nth-child(1) {
		width: 58px;

		text-align: center;
	}

	/* Franchise */
	th:nth-child(2),
	td:nth-child(2) {
		width: 34%;
	}

	/* Manager */
	th:nth-child(3),
	td:nth-child(3) {
		width: 18%;
	}

	/* Record */
	th:nth-child(4),
	td:nth-child(4) {
		width: 9%;
	}
	th:nth-child(n + 4),
	td:nth-child(n + 4) {
		text-align: right;
	}
	th:nth-child(4),
	td:nth-child(4) {
		text-align: center;
	}

	/* PF */
	th:nth-child(5),
	td:nth-child(5) {
		width: 8%;
	}

	/* PA */
	th:nth-child(6),
	td:nth-child(6) {
		width: 8%;
	}

	/* Diff */
	th:nth-child(7),
	td:nth-child(7) {
		width: 8%;
	}

	/* Win % */
	th:nth-child(8),
	td:nth-child(8) {
		width: 9%;
	}

	/* =========================================================
	   TABLE HEADER
	   ========================================================= */

	th {
		position: sticky;

		top: 0;

		z-index: 3;

		padding-top: 9px;

		padding-bottom: 9px;

		border-bottom: 1px solid var(--border-strong);

		background: #101312;

		color: var(--brand-stone);

		font-family: var(--font-body);

		font-size: 0.58rem;

		font-weight: 700;

		letter-spacing: 0.13em;

		text-transform: uppercase;

		text-shadow: none;
	}

	/* =========================================================
	   ROWS
	   ========================================================= */

	tbody tr {
		position: relative;

		background: transparent;

		transition: background 120ms ease;
	}

	tbody tr:nth-child(even) {
		background: rgba(255, 255, 255, 0.012);
	}

	tbody tr:hover {
		background: rgba(191, 161, 106, 0.045);
	}

	tbody tr.leader {
		background: linear-gradient(90deg, rgba(191, 161, 106, 0.07), transparent 34%);
	}

	tbody tr.leader td:first-child {
		box-shadow: inset 2px 0 0 var(--brand-gold);
	}

	/* =========================================================
	   RANK
	   ========================================================= */

	.rank-cell {
		color: var(--brand-gold);

		font-family: var(--font-body);

		font-size: 0.77rem;

		font-weight: 800;

		text-shadow: none;
	}

	/* =========================================================
	   FRANCHISE
	   ========================================================= */

	.team-col {
		min-width: 0;
	}

	.team-inline {
		display: flex;

		align-items: center;

		gap: 11px;

		color: var(--brand-ivory);

		text-decoration: none;
	}

	.team-inline:hover strong {
		color: var(--brand-gold);
	}

	.inline-photo {
		width: 38px;

		height: 38px;

		flex: 0 0 38px;

		display: grid;

		place-items: center;

		overflow: hidden;

		border-radius: 4px;

		color: var(--brand-charcoal);

		font-family: var(--font-body);

		font-size: 0.7rem;

		font-weight: 800;

		box-shadow: none;
	}

	.inline-photo img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.team-copy {
		display: grid;

		gap: 2px;

		min-width: 0;
	}

	.team-copy strong {
		overflow: hidden;

		color: var(--brand-ivory);

		font-size: 0.84rem;

		font-weight: 800;

		text-overflow: ellipsis;

		white-space: nowrap;
	}

	/* =========================================================
	   BODY DATA
	   ========================================================= */

	td {
		color: var(--brand-sand);

		font-family: var(--font-body);

		font-size: 0.78rem;
	}

	.record-text {
		color: var(--brand-ivory);

		font-family: var(--font-body);

		font-weight: 800;

		text-shadow: none;
	}

	.num {
		color: var(--brand-sand);

		font-family: var(--font-body);

		font-weight: 600;

		text-align: right;

		white-space: nowrap;

		text-shadow: none;
	}

	.diff.good {
		color: #91b69c;
	}

	.diff.bad {
		color: #d98585;
	}

	.diff.even {
		color: var(--brand-stone);
	}

	/* =========================================================
	   EMPTY STATE
	   ========================================================= */

	.studio-card {
		border: 1px solid var(--border) !important;

		background: var(--panel) !important;

		box-shadow: var(--shadow-panel) !important;
	}

	.empty-state {
		display: grid;

		gap: 10px;

		padding: 24px;

		border-radius: var(--radius-lg);
	}

	.empty-state h2,
	.empty-state p {
		margin: 0;
	}

	.empty-state p {
		color: var(--muted);
	}

	.bug-row {
		display: inline-flex;

		width: max-content;

		align-items: center;

		overflow: hidden;

		border: 1px solid var(--border-strong);

		border-radius: 3px;

		background: var(--brand-charcoal);

		color: var(--brand-gold);

		font-family: var(--font-body);

		font-size: 0.62rem;

		font-weight: 700;

		letter-spacing: 0.1em;

		text-transform: uppercase;
	}

	.bug-row span {
		display: grid;

		place-items: center;

		min-height: 30px;

		padding: 0 9px;

		border-right: 1px solid var(--border-strong);

		background: transparent;

		color: var(--brand-gold);
	}

	.bug-row strong {
		padding: 7px 10px;
	}

	/* =========================================================
	   OPTIONAL / FUTURE SUMMARY CARDS
	   ========================================================= */

	.studio-strip {
		display: grid;

		grid-template-columns: repeat(4, minmax(0, 1fr));

		gap: 12px;
	}

	.studio-strip article {
		min-height: 104px;

		display: grid;

		align-content: space-between;

		gap: 12px;

		padding: 14px 16px;

		border: 1px solid var(--border);

		border-radius: var(--radius-md);

		background: var(--panel);

		box-shadow: var(--shadow-panel);
	}

	.studio-strip span {
		color: var(--brand-gold);

		font-family: var(--font-body);

		font-size: 0.6rem;

		font-weight: 700;

		letter-spacing: 0.14em;

		text-transform: uppercase;
	}

	.studio-strip strong {
		display: block;

		color: var(--brand-ivory);

		font-family: var(--font-display);

		font-size: clamp(1.5rem, 3vw, 2.5rem);

		font-weight: 400;

		line-height: 0.92;

		text-shadow: none;
	}

	.studio-strip small {
		color: var(--muted);
	}

	/* =========================================================
	   RESPONSIVE
	   ========================================================= */

	@media (max-width: 960px) {
		.studio-header {
			grid-template-columns: 1fr;
		}

		.studio-header::after {
			display: none;
		}

		.standings-season-box {
			justify-self: start;

			width: 100%;
		}

		.studio-strip {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 640px) {
		.board-topper {
			align-items: start;

			flex-direction: column;
		}

		.studio-strip {
			grid-template-columns: 1fr;
		}
	}
</style>
