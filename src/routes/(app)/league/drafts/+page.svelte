<script>
	import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';

	export let data;

	let draft;
	let archive;

	$: draft = data?.draft;
	$: archive = data?.archive || [];

	const money = (value) => Number(value || 0).toFixed(0);

	const money2 = (value) => Number(value || 0).toFixed(2);

	$: season = Number(data?.season || new Date().getFullYear());

	$: teamBoards = draft?.teamBoards || [];

	$: maxRosterRows = Math.max(
		0,
		...teamBoards.map((team) => team.allPicks?.length || team.picks?.length || 0)
	);

	$: draftRows = Array.from({ length: maxRosterRows }, (_, index) => index);

	$: topBuys = draft?.topPicks?.slice(0, 10) || [];

	$: hasPickRows = Boolean(draft && teamBoards.length && maxRosterRows);

	$: positionEconomy = draft?.positionEconomy || [];

	$: priceBands = draft?.priceBands || [];

	/*
	 * ========================================================
	 * AUCTION SUMMARY
	 * ========================================================
	 */

	$: allPicks = teamBoards.flatMap((team) => team.allPicks || team.picks || []);

	$: totalPicks = allPicks.length;

	$: totalSpend = allPicks.reduce((total, pick) => total + Number(pick?.amount || 0), 0);

	$: averageBid = totalPicks ? totalSpend / totalPicks : 0;

	$: highestBid = allPicks.reduce(
		(highest, pick) => Math.max(highest, Number(pick?.amount || 0)),
		0
	);

	$: teamSpendRows = teamBoards
		.map((team) => ({
			...team,

			spend: (team.allPicks || team.picks || []).reduce(
				(total, pick) => total + Number(pick?.amount || 0),
				0
			),

			pickCount: (team.allPicks || team.picks || []).length
		}))
		.sort((a, b) => b.spend - a.spend);

	$: biggestSpender = teamSpendRows[0] || null;

	$: lightestSpender = teamSpendRows.length ? teamSpendRows[teamSpendRows.length - 1] : null;

	function amountClass(amount) {
		const value = Number(amount || 0);

		if (value >= 50) {
			return 'pick-elite';
		}

		if (value >= 40) {
			return 'pick-premium';
		}

		if (value >= 25) {
			return 'pick-core';
		}

		if (value >= 10) {
			return 'pick-mid';
		}

		return 'pick-cheap';
	}

	function playerLine(pick) {
		const pos = pick?.player?.position || 'FLEX';

		const team = pick?.player?.teamLabel || pick?.player?.team || 'FA';

		return `${pos} · ${team}`;
	}

	function playerPhoto(pick) {
		return pick?.player?.photoUrl || '/managers/question.jpg';
	}

	function seasonHref(nextSeason) {
		return `/league/drafts?season=` + encodeURIComponent(nextSeason);
	}
</script>

<div class="page-stack draft-page">
	<LeagueSubnav {season} active="drafts" />

	<!-- =====================================================
	     HERO
	===================================================== -->

	<section class="draft-hero icl-hero-shell" aria-label="Draft archive">
		<div class="hero-copy">
			<div class="eyebrow">Irving auction archive</div>

			<h1>The Draft Room</h1>

			<p>
				Every dollar. Every overpay. Every bargain. The complete Irving auction board and draft
				economy for {season}.
			</p>
		</div>

		<aside class="season-box" aria-label="Season selector">
			<span> Season feed </span>

			<div class="season-pills">
				{#each archive as item}
					<a class:active={Number(item.season) === Number(season)} href={seasonHref(item.season)}>
						{item.season}
					</a>
				{/each}
			</div>
		</aside>

		<div class="hero-stats">
			<div>
				<span> Players sold </span>

				<strong>
					{totalPicks}
				</strong>
			</div>

			<div>
				<span> Room spend </span>

				<strong>
					${money(totalSpend)}
				</strong>
			</div>

			<div>
				<span> Average bid </span>

				<strong>
					${money2(averageBid)}
				</strong>
			</div>

			<div>
				<span> High bid </span>

				<strong>
					${money(highestBid)}
				</strong>
			</div>
		</div>
	</section>

	{#if !draft}
		<section class="card empty-state">
			<div class="eyebrow">No signal</div>

			<h2>No draft data available</h2>

			<p>We could not pull a Sleeper draft for this season.</p>
		</section>
	{:else}
		<!-- =================================================
		     AUCTION BOARD
		================================================== -->

		<section class="draft-board-card">
			<header class="board-head">
				<div>
					<div class="eyebrow">Sleeper auction archive</div>

					<h2>
						{season} Auction Board
					</h2>

					<p>Every franchise. Every pick. The full auction room at a glance.</p>
				</div>

				<div class="board-key" aria-label="Bid color key">
					<span class="key elite"> $50+ </span>

					<span class="key premium"> $40–$49 </span>

					<span class="key core"> $25–$39 </span>

					<span class="key mid"> $10–$24 </span>

					<span class="key cheap"> Under $10 </span>
				</div>
			</header>

			{#if hasPickRows}
				<div class="board-scroll">
					<div class="draft-board" style={`--team-count:${teamBoards.length || 1}`}>
						{#each teamBoards as team (team.teamName)}
							<a
								class="draft-team-head"
								href={team.managerSlug
									? `/league/teams/${team.managerSlug}?season=${season}`
									: `/league/teams?season=${season}`}
							>
								<div class="team-logo">
	{#if team.teamChiclet || team.teamPhoto}
		<img
			src={team.teamChiclet || team.teamPhoto}
			alt={team.teamName}
		/>
	{:else}
		<span>
			{team.teamName.slice(0, 2)}
		</span>
	{/if}
</div>

								<strong>
									{team.teamName}
								</strong>

								<small>
									{team.managerName}
								</small>
							</a>
						{/each}

						{#each draftRows as rowIndex}
							{#each teamBoards as team (team.teamName + '-' + rowIndex)}
								{@const pick = team.allPicks?.[rowIndex]}

								{#if pick}
									<article
										class={`draft-pick ${amountClass(pick.amount)}`}
										data-player-id={pick.player.id}
										data-player-season={season}
										role="button"
										tabindex="0"
										aria-label={`Open ${pick.player.name} player card`}
									>
										<div class="price">
											${money(pick.amount)}
										</div>

										<img src={playerPhoto(pick)} alt={pick.player?.name || 'Player'} />

										<div class="pick-copy">
											<strong>
												{pick.player?.name || 'Unknown Player'}
											</strong>

											<small>
												{playerLine(pick)}
											</small>
										</div>
									</article>
								{:else}
									<div class="draft-empty" aria-hidden="true"></div>
								{/if}
							{/each}
						{/each}
					</div>
				</div>
			{:else}
				<div class="no-board">
					<strong>
						No picks have landed for
						{season} yet.
					</strong>

					<p>Flip to a completed season above to see the full auction board.</p>
				</div>
			{/if}
		</section>

		<!-- =================================================
		     MONEY DESK
		================================================== -->

		<section class="money-strip">
			<article>
				<span> Biggest spender </span>

				<strong>
					{biggestSpender?.teamName || '—'}
				</strong>

				<small>
					{biggestSpender ? `$${money(biggestSpender.spend)} spent` : 'No data'}
				</small>
			</article>

			<article>
				<span> Lightest spender </span>

				<strong>
					{lightestSpender?.teamName || '—'}
				</strong>

				<small>
					{lightestSpender ? `$${money(lightestSpender.spend)} spent` : 'No data'}
				</small>
			</article>

			<article>
				<span> Auction peak </span>

				<strong>
					${money(highestBid)}
				</strong>

				<small> Highest winning bid </small>
			</article>
		</section>

		<!-- =================================================
		     ANALYTICS
		================================================== -->

		<section class="analytics-grid">
			<article class="card studio-card">
				<div class="section-head">
					<div>
						<div class="eyebrow">Draft desk</div>

						<h3>Most Expensive Buys</h3>
					</div>

					<span> Top 10 </span>
				</div>

				<div class="expensive-list">
					{#each topBuys as pick, index (pick.id)}
						<div
							class="expensive-row"
							data-player-id={pick.player.id}
							data-player-season={season}
							role="button"
							tabindex="0"
							aria-label={`Open ${pick.player.name} player card`}
						>
							<div class="rank">
								{index + 1}
							</div>

							<img src={playerPhoto(pick)} alt={pick.player?.name || 'Player'} />

							<div class="expensive-copy">
								<strong>
									{pick.player?.name}
								</strong>

								<small>
									{pick.teamName}
								</small>
							</div>

							<b>
								${money(pick.amount)}
							</b>
						</div>
					{/each}

					{#if !topBuys.length}
						<div class="empty">No expensive buys yet.</div>
					{/if}
				</div>
			</article>

			<article class="card studio-card">
				<div class="section-head">
					<div>
						<div class="eyebrow">Market share</div>

						<h3>Position Economy</h3>
					</div>

					<span> Avg bid </span>
				</div>

				<div class="position-table">
					{#each positionEconomy as row (row.position)}
						<div>
							<strong>
								{row.position}
							</strong>

							<span>
								{row.picks}
								picks
							</span>

							<span>
								${money(row.spend)}
								spent
							</span>

							<b>
								${money2(row.averageSpend)}
							</b>
						</div>
					{/each}

					{#if !positionEconomy.length}
						<div class="empty">No position economy data yet.</div>
					{/if}
				</div>
			</article>
		</section>

		<!-- =================================================
		     BID BANDS
		================================================== -->

		<section class="card studio-card">
			<div class="section-head">
				<div>
					<div class="eyebrow">Room spending</div>

					<h3>Bid Bands</h3>
				</div>

				<span> How the room spent its money </span>
			</div>

			<div class="bands-grid">
				{#each priceBands as band (band.label)}
					<div class="band-card">
						<strong>
							{band.label}
						</strong>

						<span>
							{band.picks}
							picks
						</span>

						<b>
							${money(band.spend)}
						</b>
					</div>
				{/each}
			</div>
		</section>
	{/if}
</div>

<style>
	/* =========================================================
	   IRVING COLLECTIVE — THE DRAFT ROOM
	   ========================================================= */

	.page-stack {
		display: grid;
		gap: 18px;
		max-width: 1500px;
		margin: 0 auto;
		padding-bottom: 48px;
	}

	/* =========================================================
	   COMMON
	   ========================================================= */

	.card,
	.draft-board-card {
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.018), transparent 24%), var(--panel);
		box-shadow: var(--shadow-panel);
	}

	.eyebrow {
		color: var(--brand-gold);
		font-family: var(--font-body);
		font-size: 0.61rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	h1,
	h2,
	h3,
	p {
		margin: 0;
	}

	h1,
	h2,
	h3 {
		color: var(--brand-ivory);
		font-family: var(--font-display);
		font-weight: 400;
		letter-spacing: 0.01em;
		text-shadow: none;
	}

	p {
		color: var(--muted);
		line-height: 1.55;
	}

	/* =========================================================
	   HERO
	   ========================================================= */

	.draft-hero {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 22px 30px;
		overflow: hidden;
		padding: 28px !important;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		background:
			linear-gradient(120deg, rgba(191, 161, 106, 0.055), transparent 40%), var(--panel-strong);
		box-shadow: var(--shadow-panel);
	}

	.draft-hero::after {
		content: 'DRAFT ROOM';
		position: absolute;
		right: 24px;
		top: 42px;
		color: rgba(191, 161, 106, 0.025);
		font-family: var(--font-display);
		font-size: clamp(5rem, 10vw, 9rem);
		line-height: 0.9;
		letter-spacing: 0.02em;
		pointer-events: none;
	}

	.hero-copy,
	.season-box,
	.hero-stats {
		position: relative;
		z-index: 1;
	}

	.hero-copy {
		max-width: 780px;
	}

	.hero-copy h1 {
		margin-top: 7px;
		font-size: clamp(3.6rem, 7vw, 7rem);
		line-height: 0.82;
		letter-spacing: -0.025em;
		text-transform: uppercase;
	}

	.hero-copy p {
		max-width: 670px;
		margin-top: 18px;
		font-size: 0.96rem;
	}

	/* =========================================================
	   SEASON
	   ========================================================= */

	.season-box {
		align-self: start;
		min-width: 180px;
		padding: 14px;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: rgba(7, 10, 10, 0.7);
	}

	.season-box > span {
		display: block;
		margin-bottom: 10px;
		color: var(--brand-gold);
		font-size: 0.61rem;
		font-weight: 800;
		letter-spacing: 0.15em;
		text-transform: uppercase;
	}

	.season-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 7px;
	}

	.season-pills a {
		padding: 8px 13px;
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text);
		background: rgba(255, 255, 255, 0.025);
		font-family: var(--font-score);
		font-size: 0.78rem;
		text-decoration: none;
		transition:
			background 0.15s ease,
			color 0.15s ease,
			border-color 0.15s ease;
	}

	.season-pills a:hover {
		border-color: var(--brand-gold);
		color: var(--brand-gold);
	}

	.season-pills a.active {
		border-color: var(--brand-gold);
		color: #111;
		background: var(--brand-gold);
	}

	/* =========================================================
	   HERO STATS
	   ========================================================= */

	.hero-stats {
		grid-column: 1 / -1;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 1px;
		margin-top: 4px;
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--border);
	}

	.hero-stats > div {
		display: grid;
		gap: 5px;
		padding: 14px 16px;
		background: rgba(9, 12, 12, 0.94);
	}

	.hero-stats span {
		color: var(--muted);
		font-size: 0.59rem;
		font-weight: 800;
		letter-spacing: 0.13em;
		text-transform: uppercase;
	}

	.hero-stats strong {
		color: var(--brand-ivory);
		font-family: var(--font-display);
		font-size: 1.65rem;
		font-weight: 400;
	}

	/* =========================================================
	   BOARD
	   ========================================================= */

	.draft-board-card {
		overflow: hidden;
	}

	.board-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 24px;
		padding: 18px 20px;
		border-bottom: 1px solid var(--border);
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent), var(--panel);
	}

	.board-head h2 {
		margin-top: 3px;
		font-size: 2rem;
	}

	.board-head p {
		margin-top: 7px;
		font-size: 0.78rem;
	}

	.board-key {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 6px;
	}

	.key {
		display: inline-flex;
		align-items: center;
		padding: 5px 8px;
		border-radius: 3px;
		color: #0a0b0b;
		font-size: 0.59rem;
		font-weight: 900;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.key.elite {
		background: #70c8bd;
	}

	.key.premium {
		background: #f47ca7;
	}

	.key.core {
		background: #a9cff2;
	}

	.key.mid {
		background: #ffd5a8;
	}

	.key.cheap {
		background: #cfd4cc;
	}

	/* =========================================================
	   IMPORTANT:
	   DESKTOP BOARD SCROLLS NOW.
	   NO MORE 14 TEAMS CRUSHED INTO 90PX.
	   ========================================================= */

	/* =========================================================
   FULL AUCTION ROOM

   Desktop intentionally shows all 14 franchises at once.
   ========================================================= */

	.board-scroll {
		width: 100%;
		overflow: hidden;
	}

	.draft-board {
		display: grid;

		grid-template-columns: repeat(var(--team-count), minmax(0, 1fr));

		width: 100%;

		min-width: 0;

		background: #0c1010;
	}

	.draft-board > * {
		min-width: 0;
	}
	.draft-team-head {
		position: sticky;

		top: 0;

		z-index: 3;

		display: grid;

		justify-items: center;

		align-content: center;

		gap: 4px;

		min-width: 0;

		min-height: 105px;

		padding: 8px 4px;

		border-right: 1px solid var(--border);

		border-bottom: 1px solid var(--border);

		color: var(--brand-ivory);

		background: linear-gradient(180deg, #242a28, #111514);

		text-align: center;

		text-decoration: none;
	}

	.draft-team-head:hover {
		color: var(--brand-gold);

		background: linear-gradient(180deg, #303734, #151a18);
	}

	.team-logo {
		width: clamp(32px, 2.5vw, 42px);

		height: clamp(32px, 2.5vw, 42px);

		display: grid;

		place-items: center;

		overflow: hidden;

		color: #111;

		font-family: var(--font-score);
	}

.team-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
	.draft-team-head strong {
		display: -webkit-box;

		max-width: 100%;

		overflow: hidden;

		color: var(--brand-ivory);

		font-size: clamp(0.51rem, 0.66vw, 0.68rem);

		line-height: 1.02;

		-webkit-box-orient: vertical;

		-webkit-line-clamp: 2;

		overflow-wrap: anywhere;
	}

	.draft-team-head small {
		display: block;

		max-width: 100%;

		overflow: hidden;

		color: var(--muted);

		font-size: clamp(0.43rem, 0.53vw, 0.56rem);

		line-height: 1;

		text-overflow: ellipsis;

		white-space: nowrap;
	}

	/* =========================================================
	   PICK CELLS
	   ========================================================= */
	.draft-pick,
	.draft-empty {
		min-width: 0;

		min-height: 72px;

		border-right: 1px solid var(--border);

		border-bottom: 1px solid var(--border);
	}

	.draft-pick {
		position: relative;

		display: grid;

		grid-template-columns:
			clamp(18px, 1.55vw, 25px)
			minmax(0, 1fr);

		grid-template-rows:
			auto
			1fr;

		gap: 3px 5px;

		padding: 6px 4px 6px 6px;

		overflow: hidden;

		color: var(--brand-ivory);

		background: #121716;

		cursor: pointer;

		transition: background 120ms ease;
	}

	.draft-pick:hover {
		z-index: 2;

		background: #1b211f;

		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
	}

	.draft-pick::before {
		content: '';

		position: absolute;

		top: 0;
		bottom: 0;
		left: 0;

		width: 2px;

		background: var(--bid-color);
	}
	.draft-pick .price {
		grid-column: 1 / -1;

		color: var(--bid-color);

		font-family: var(--font-score);

		font-size: clamp(0.55rem, 0.62vw, 0.68rem);

		font-weight: 900;
	}

	.draft-pick img {
		width: clamp(18px, 1.55vw, 25px);

		height: clamp(18px, 1.55vw, 25px);

		align-self: start;

		object-fit: contain;

		filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.38));
	}

	.pick-copy {
		min-width: 0;

		display: grid;

		align-content: start;

		gap: 2px;
	}
	.pick-copy strong {
		display: -webkit-box;

		min-width: 0;

		overflow: hidden;

		color: var(--brand-ivory);

		font-size: clamp(0.47rem, 0.57vw, 0.6rem);

		line-height: 1.04;

		-webkit-box-orient: vertical;

		-webkit-line-clamp: 2;
	}

	.pick-copy small {
		display: -webkit-box;

		min-width: 0;

		overflow: hidden;

		color: var(--muted);

		font-size: clamp(0.4rem, 0.48vw, 0.5rem);

		font-weight: 600;

		line-height: 1.04;

		-webkit-box-orient: vertical;

		-webkit-line-clamp: 2;
	}

	.draft-empty {
		background: rgba(255, 255, 255, 0.012);
	}
	.pick-elite {
		--bid-color: #70c8bd;
	}

	.pick-premium {
		--bid-color: #f47ca7;
	}

	.pick-core {
		--bid-color: #a9cff2;
	}

	.pick-mid {
		--bid-color: #ffd5a8;
	}

	.pick-cheap {
		--bid-color: #cfd4cc;
	}

	.draft-empty {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.012), transparent);
	}

	/* =========================================================
	   MONEY STRIP
	   ========================================================= */

	.money-strip {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 12px;
	}

	.money-strip article {
		display: grid;
		gap: 5px;
		padding: 15px 16px;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--panel);
	}

	.money-strip span {
		color: var(--brand-gold);
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.money-strip strong {
		color: var(--brand-ivory);
		font-family: var(--font-display);
		font-size: 1.35rem;
		font-weight: 400;
	}

	.money-strip small {
		color: var(--muted);
		font-size: 0.67rem;
	}

	/* =========================================================
	   ANALYTICS
	   ========================================================= */

	.analytics-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 16px;
	}

	.studio-card {
		padding: 20px;
	}

	.section-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 16px;
		margin-bottom: 14px;
	}

	.section-head h3 {
		margin-top: 4px;
		font-size: 1.55rem;
	}

	.section-head > span {
		color: var(--muted);
		font-size: 0.59rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	/* =========================================================
	   EXPENSIVE BUYS
	   ========================================================= */

	.expensive-list {
		display: grid;
		gap: 7px;
	}

	.expensive-row {
		display: grid;
		grid-template-columns:
			28px
			38px
			minmax(0, 1fr)
			auto;
		gap: 10px;
		align-items: center;
		padding: 8px 10px;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.018);
		cursor: pointer;
	}

	.expensive-row:hover {
		background: rgba(255, 255, 255, 0.04);
	}

	.expensive-row .rank {
		color: var(--brand-gold);
		font-family: var(--font-score);
		font-size: 0.72rem;
	}

	.expensive-row img {
		width: 38px;
		height: 38px;
		object-fit: contain;
	}

	.expensive-copy {
		min-width: 0;
		display: grid;
		gap: 2px;
	}

	.expensive-copy strong {
		color: var(--brand-ivory);
		font-size: 0.79rem;
	}

	.expensive-copy small {
		overflow: hidden;
		color: var(--muted);
		font-size: 0.64rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.expensive-row > b {
		color: var(--brand-gold);
		font-family: var(--font-score);
		font-size: 0.85rem;
	}

	/* =========================================================
	   POSITION ECONOMY
	   ========================================================= */

	.position-table {
		display: grid;
		gap: 7px;
	}

	.position-table > div {
		display: grid;
		grid-template-columns:
			55px
			1fr
			auto
			72px;
		gap: 12px;
		align-items: center;
		padding: 10px 11px;
		border-bottom: 1px solid var(--border);
	}

	.position-table strong {
		color: var(--brand-gold);
		font-family: var(--font-score);
	}

	.position-table span {
		color: var(--muted);
		font-size: 0.7rem;
	}

	.position-table b {
		color: var(--brand-ivory);
		font-family: var(--font-score);
		text-align: right;
	}

	/* =========================================================
	   BID BANDS
	   ========================================================= */

	.bands-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 10px;
	}

	.band-card {
		display: grid;
		gap: 5px;
		padding: 14px;
		border: 1px solid var(--border);
		border-radius: 7px;
		background: rgba(255, 255, 255, 0.018);
	}

	.band-card strong {
		color: var(--brand-ivory);
		font-size: 0.8rem;
	}

	.band-card span {
		color: var(--muted);
		font-size: 0.65rem;
	}

	.band-card b {
		color: var(--brand-gold);
		font-family: var(--font-display);
		font-size: 1.4rem;
		font-weight: 400;
	}

	/* =========================================================
	   EMPTY
	   ========================================================= */

	.no-board,
	.empty,
	.empty-state {
		padding: 24px;
		color: var(--muted);
	}

	.empty-state h2 {
		margin-top: 5px;
	}

	/* =========================================================
	   RESPONSIVE
	   ========================================================= */

	@media (max-width: 1050px) {
		.draft-hero {
			grid-template-columns: 1fr;
		}

		.season-box {
			width: fit-content;
		}

		.hero-stats {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.analytics-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 760px) {
		.page-stack {
			gap: 14px;
		}

		.draft-hero {
			padding: 20px !important;
		}

		.hero-copy h1 {
			font-size: clamp(3rem, 16vw, 5rem);
		}

		.board-head {
			display: grid;
		}

		.board-key {
			justify-content: flex-start;
		}

		.money-strip,
		.bands-grid {
			grid-template-columns: 1fr;
		}

		.position-table > div {
			grid-template-columns:
				55px
				1fr
				auto;
		}

		.position-table > div b {
			grid-column: 2 / -1;
			text-align: left;
		}
	}

	@media (max-width: 520px) {
		.hero-stats {
			grid-template-columns: 1fr 1fr;
		}

		.expensive-row {
			grid-template-columns:
				24px
				34px
				minmax(0, 1fr)
				auto;
		}
	}
</style>
