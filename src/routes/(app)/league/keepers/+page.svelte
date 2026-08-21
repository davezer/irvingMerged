<script>
	import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';
	import { openPlayerModal } from '$lib/stores/playerModal.js';

	export let data;

	let query = '';
	let teamFilter = '';
	let selectedPlayerId = '';

	const money = (value) => `$${Number(value || 0).toFixed(Number(value || 0) % 1 ? 2 : 0)}`;

	$: normalizedQuery = query.trim().toLowerCase();
	$: candidates = data?.candidates || [];
	$: teams = data?.teams || [];
	$: searchResults = normalizedQuery
		? candidates
				.filter((player) => {
					const haystack =
						`${player.name} ${player.position} ${player.nflTeamLabel} ${player.teamName} ${player.managerName}`.toLowerCase();
					return haystack.includes(normalizedQuery);
				})
				.slice(0, 8)
		: [];
	$: selectedPlayer =
		candidates.find((player) => String(player.id) === String(selectedPlayerId)) || null;
	$: visibleTeams = teamFilter ? teams.filter((team) => team.managerSlug === teamFilter) : teams;

	function choosePlayer(player) {
		selectedPlayerId = String(player.id);
		query = player.name;
	}

	function handleSearchInput(event) {
		const nextQuery = event.currentTarget.value;

		query = nextQuery;

		// If the user starts typing again after selecting a player,
		// release the old selection so autocomplete results can reopen.
		const currentPlayer = candidates.find(
			(player) => String(player.id) === String(selectedPlayerId)
		);

		if (
			currentPlayer &&
			nextQuery.trim().toLowerCase() !== currentPlayer.name.trim().toLowerCase()
		) {
			selectedPlayerId = '';
		}
	}

	function clearSearch() {
		query = '';
		selectedPlayerId = '';
	}

	function seasonHref(season) {
		return `/league/keepers?season=${season}`;
	}

	function taxLabel(player) {
		return `+${player.taxPct}%`;
	}

	function ordinal(value) {
		const number = Number(value || 1);
		const mod100 = number % 100;
		if (mod100 >= 11 && mod100 <= 13) return `${number}th`;
		if (number % 10 === 1) return `${number}st`;
		if (number % 10 === 2) return `${number}nd`;
		if (number % 10 === 3) return `${number}rd`;
		return `${number}th`;
	}

	function yearLabel(player) {
		return `${ordinal(player.keeperSelectionNumber)} keeper selection`;
	}

	function openPlayerProfile(player) {
		openPlayerModal(player.id, {
			/*
			 * For 2026 keeper decisions we want
			 * the latest completed 2025 season
			 * to open first.
			 */
			season: data.sourceSeason,

			context: {
				teamName: player.teamName,

				managerName: player.managerName,

				keeperEligible: player.keeperEligible,

				keeperCost: player.keeperCost,

				note:
					player.keeperEligible === false ? player.keeperIneligibleReason : player.priceOriginLabel
			}
		});
	}
</script>

<svelte:head>
	<title>Keeper Desk · {data?.leagueName || 'Irving Championship League'}</title>
</svelte:head>

<div class="page-stack keeper-page">
	<LeagueSubnav season={data.season} active="keepers" />

	<section class="keeper-hero icl-hero-shell pad-md">
		<div class="hero-copy">
			<div class="eyebrow">{data.targetSeason} Front Office</div>
			<h1>Keep or Cut?</h1>
			<p>
				Every roster. Every eligible player. Every tax bill before somebody talks themselves into a
				terrible decision.
			</p>
		</div>

		<div class="season-box" aria-label="Keeper season selector">
			<span>Season feed</span>
			<div class="season-pills">
				{#each data.availableSeasons as season}
					<a class:active={Number(season) === Number(data.targetSeason)} href={seasonHref(season)}
						>{season}</a
					>
				{/each}
			</div>
		</div>
	</section>

	<section class="rule-strip" aria-label="Keeper rules summary">
		<article>
			<span>Keeper limit</span>
			<strong>{data.rules.maxKeepers}</strong>
			<small>per franchise</small>
		</article>
		<article>
			<span>Price floor</span>
			<strong>{money(data.rules.minimumBase)}</strong>
			<small>before tax</small>
		</article>
		<article>
			<span>First keeper tax</span>
			<strong>+{data.rules.taxStepPct}%</strong>
			<small>compounds annually</small>
		</article>
		<article>
			<span>Price source</span>
			<strong>{data.sourceSeason}</strong>
			<small>draft + transaction ledger</small>
		</article>
	</section>

	<section class="calculator-card">
		<div class="calculator-head">
			<div>
				<div class="eyebrow">Keeper cost calculator</div>
				<h2>Run the receipt</h2>
			</div>
			<span>{data.stats.candidateCount} rostered players indexed</span>
		</div>

		<div class="search-shell">
			<label for="keeper-player-search">Player search</label>
			<div class="search-control">
				<input
					id="keeper-player-search"
					type="search"
					value={query}
					on:input={handleSearchInput}
					placeholder="Start typing a player name…"
					autocomplete="off"
				/>
				{#if query}
					<button type="button" on:click={clearSearch}>Clear</button>
				{/if}
			</div>

			{#if normalizedQuery && !selectedPlayer}
				<div class="search-results">
					{#each searchResults as player}
						<button type="button" class="search-result" on:click={() => choosePlayer(player)}>
							<img src={player.photoUrl} alt="" />

							<span>
								<strong>{player.name}</strong>
								<small>
									{player.position} · {player.nflTeamLabel} · {player.teamName}
								</small>
							</span>

							<b>{money(player.keeperCost)}</b>
						</button>
					{/each}

					{#if !searchResults.length}
						<div class="no-results">No keeper candidate matches that search.</div>
					{/if}
				</div>
			{/if}
		</div>

		{#if selectedPlayer}
			<div class="receipt">
				<div class="receipt-player">
					<img src={selectedPlayer.photoUrl} alt={selectedPlayer.name} />
					<div>
						<span>{selectedPlayer.position} · {selectedPlayer.nflTeamLabel}</span>
						<h3>{selectedPlayer.name}</h3>
						<strong>{selectedPlayer.teamName}</strong>
						<small>{selectedPlayer.managerName}</small>
					</div>
				</div>

				<div class="receipt-math">
					<div>
						<span>Last acquisition</span>
						<strong
							>{money(selectedPlayer.lastAcquisitionPrice ?? selectedPlayer.previousPrice)}</strong
						>
						<small
							>{selectedPlayer.lastAcquisitionLabel || selectedPlayer.priceOriginLabel} · {selectedPlayer.priceOriginSeason}</small
						>
					</div>
					<div>
						<span>Keeper floor</span>
						<strong>{money(selectedPlayer.floorBase)}</strong>
						<small
							>{selectedPlayer.floorApplied ? '$10 minimum applied' : 'No floor adjustment'}</small
						>
					</div>
					{#if selectedPlayer.keeperEligible === false}
						<div class="receipt-ineligible">
							<span>Keeper status</span>
							<strong>NOT KEEPER ELIGIBLE</strong>
							<small>{selectedPlayer.keeperIneligibleReason}</small>
						</div>
					{:else}
						<div>
							<span>{yearLabel(selectedPlayer)}</span>
							<strong>{taxLabel(selectedPlayer)}</strong>
							<small>
								{selectedPlayer.keeperStreak} prior keeper selection{selectedPlayer.keeperStreak ===
								1
									? ''
									: 's'} across all franchises
							</small>
						</div>

						<div>
							<span>Tax</span>
							<strong>{money(selectedPlayer.taxAmount)}</strong>
							<small>{money(selectedPlayer.floorBase)} × {selectedPlayer.taxPct}%</small>
						</div>
					{/if}
				</div>

				<div class="keeper-price" class:ineligible={selectedPlayer.keeperEligible === false}>
					{#if selectedPlayer.keeperEligible === false}
						<span>{data.targetSeason} keeper status</span>
						<strong>NOT ELIGIBLE</strong>
						<small>
							{selectedPlayer.keeperIneligibleReason}
						</small>
					{:else}
						<span>{data.targetSeason} keeper price</span>
						<strong>{money(selectedPlayer.keeperCost)}</strong>
						<small>
							{#if selectedPlayer.movedByTrade}
								Price and keeper tenure both follow the player through trades.
							{:else if selectedPlayer.firstKeeperSelection}
								First keeper selection in the current keeper cycle.
							{:else}
								Returning keeper with compounded tax.
							{/if}
						</small>
					{/if}
				</div>

				{#if selectedPlayer.keeperHistory.length}
					<div class="history-rail">
						<span>Keeper history</span>
						<div>
							{#each [...selectedPlayer.keeperHistory].reverse() as item}
								<b>{item.season} · {money(item.amount)}</b>
							{/each}
							{#if selectedPlayer.keeperEligible === false}
								<b class="current">{data.targetSeason} · NOT ELIGIBLE</b>
							{:else}
								<b class="current">{data.targetSeason} · {money(selectedPlayer.keeperCost)}</b>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<div class="calculator-idle">
				<strong>Search a player to see the full keeper receipt.</strong>
				<span
					>Last acquisition price, keeper floor, career keeper tenure, tax rate, and projected
					keeper cost.</span
				>
			</div>
		{/if}
	</section>

	{#if !data.hasData}
		<section class="empty-card">
			<div class="bug-row"><span>ICL</span><strong>No keeper signal</strong></div>
			<h2>No keeper candidates were found.</h2>
			<p>The desk needs a prior-season roster plus Sleeper draft/transaction history.</p>
		</section>
	{:else}
		<section class="desk-card">
			<div class="desk-head">
				<div>
					<div class="eyebrow">League-wide keeper board</div>
					<h2>{data.targetSeason} Keeper Candidates</h2>
				</div>

				<div class="team-filter">
					<label for="keeper-team-filter">Franchise</label>
					<select id="keeper-team-filter" bind:value={teamFilter}>
						<option value="">All franchises</option>
						{#each teams as team}
							<option value={team.managerSlug}>{team.teamName}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="team-grid">
				{#each visibleTeams as team}
					<article class="team-card">
						<header>
							<div class="team-logo">
								{#if team.teamChiclet || team.teamPhoto}
									<img src={team.teamChiclet || team.teamPhoto} alt={team.teamName} />
								{:else}
									<span>{team.initials}</span>
								{/if}
							</div>
							<div>
								<h3>{team.teamName}</h3>
								<span>{team.managerName}</span>
							</div>
							<b>{team.playerCount}</b>
						</header>

						<div class="team-summary">
							<span>2 cheapest</span>
							<strong
								>{team.cheapest
									.map((player) => `${player.shortName} ${money(player.keeperCost)}`)
									.join(' · ')}</strong
							>
						</div>

						<div class="player-list">
							{#each team.players as player}
								<button
									type="button"
									class="player-row"
									data-player-id={player.id}
									data-player-season={data.sourceSeason || data.season}
									aria-label={`Open ${player.name} player file`}
								>
									<img src={player.photoUrl} alt="" />
									<span class="player-copy">
										<strong>{player.name}</strong>
										<small>
											{player.position} · {player.priceOriginLabel}
											{#if player.movedByTrade}
												· TRADE{/if}
										</small>
									</span>
									{#if player.keeperEligible === false}
										<span class="keeper-ineligible-chip"> NOT KEEPER ELIGIBLE </span>
									{:else}
										<span class="tax-chip">+{player.taxPct}%</span>
										{#if player.keeperEligible === false}
											<b class="ineligible-search">NOT ELIGIBLE</b>
										{:else}
											<b>{money(player.keeperCost)}</b>
										{/if}
									{/if}
								</button>
							{/each}
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/if}

	<section class="method-card">
		<div class="eyebrow">How the desk calculates it</div>
		<div class="method-grid">
			<div>
				<b>Last add wins</b><span
					>The base price comes from the player's most recent priced acquisition: auction draft,
					waiver claim, or free-agent add.</span
				>
			</div>
			<div>
				<b>Waiver</b><span
					>A later waiver claim replaces an older draft/keeper price. The FAAB bid becomes the new
					base, with a $10 minimum.</span
				>
			</div>
			<div>
				<b>Trade</b><span
					>A trade does not reset anything. Both the current acquisition price and keeper tenure
					follow the player.</span
				>
			</div>
			<div>
				<b>Auction reset</b><span
					>A normal return to the auction draft creates a new acquisition price and resets the
					keeper-tax clock.</span
				>
			</div>
		</div>
		<p class="rounding-note">
			<b>Example:</b> drafted for $40, dropped, then claimed for $20 → the keeper base is $20, not $40.
			The keeper tax is applied to that $20 base.
		</p>
		<p class="rounding-note">
			<b>Rounding:</b> the final keeper price always rounds up to the next whole dollar.
		</p>
		{#if data.stats.estimatedPriceCount}
			<p class="warning">
				{data.stats.estimatedPriceCount} player{data.stats.estimatedPriceCount === 1 ? '' : 's'} could
				not be tied to an exact {data.sourceSeason} price event, so the desk used the minimum/historical
				fallback. Those rows are worth auditing before keeper deadline.
			</p>
		{/if}
	</section>
</div>

<style>
	/* =========================================================
	   IRVING COLLECTIVE — KEEPER DESK
	   ========================================================= */

	.page-stack {
		display: grid;
		gap: 20px;

		max-width: 1500px;

		margin: 0 auto;

		padding-bottom: 56px;
	}

	/* =========================================================
	   SHARED SURFACES
	   ========================================================= */

	.calculator-card,
	.desk-card,
	.method-card,
	.empty-card,
	.rule-strip article,
	.team-card {
		border: 1px solid var(--border) !important;

		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.022), transparent 24%), var(--panel) !important;

		box-shadow: var(--shadow-panel) !important;
	}

	.calculator-card,
	.desk-card,
	.method-card,
	.empty-card {
		padding: 24px;

		border-radius: var(--radius-lg);
	}

	/* =========================================================
	   HERO
	   ========================================================= */

	.keeper-hero {
		position: relative;

		display: grid;

		grid-template-columns:
			minmax(0, 1fr)
			auto;

		gap: 32px;

		align-items: center;

		overflow: hidden;

		min-height: 220px;

		border-radius: var(--radius-lg);
	}

	.keeper-hero::after {
		content: 'KEEPER DESK';

		position: absolute;

		right: 30px;
		bottom: -22px;

		z-index: 0;

		color: rgba(191, 161, 106, 0.025);

		font-family: var(--font-display);

		font-size: clamp(5rem, 12vw, 10rem);

		line-height: 1;

		letter-spacing: 0.04em;

		pointer-events: none;
	}

	.hero-copy {
		position: relative;

		z-index: 1;

		align-self: center;

		padding: 24px 0;
	}

	.eyebrow,
	.season-box > span,
	.calculator-head > span,
	.team-filter label {
		color: var(--brand-gold) !important;

		font-family: var(--font-body);

		font-size: 0.64rem;

		font-weight: 700;

		letter-spacing: 0.17em;

		text-transform: uppercase;

		text-shadow: none;
	}

	h1,
	h2,
	h3,
	p {
		margin-top: 0;
	}

	h1 {
		margin: 7px 0 12px;

		color: var(--brand-ivory);

		font-family: var(--font-display);

		font-size: clamp(3.8rem, 7vw, 6.8rem);

		font-weight: 400;

		line-height: 0.88;

		letter-spacing: 0.015em;

		text-shadow: none;
	}

	.hero-copy p {
		max-width: 68ch;

		margin-bottom: 0;

		color: var(--muted);

		font-size: 0.96rem;

		line-height: 1.6;
	}

	/* =========================================================
	   SEASON SELECTOR
	   ========================================================= */

	.season-box {
		position: relative;

		z-index: 2;

		align-self: center;

		justify-self: end;

		display: grid;

		gap: 9px;

		min-width: 180px;

		padding: 12px 14px;

		border: 1px solid var(--border-strong);

		border-radius: var(--radius-sm);

		background: rgba(13, 16, 15, 0.78);

		box-shadow: none;
	}

	.season-pills {
		display: flex;

		gap: 6px;

		flex-wrap: wrap;
	}

	.season-pills a {
		position: relative;

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

		transition:
			color 130ms ease,
			border-color 130ms ease,
			background 130ms ease;
	}

	.season-pills a:hover {
		border-color: var(--brand-gold);

		color: var(--brand-ivory);
	}

	.season-pills a.active {
		border-color: var(--brand-gold);

		background: var(--brand-gold);

		color: var(--brand-charcoal);
	}

	/* =========================================================
	   RULE STRIP
	   ========================================================= */

	.rule-strip {
		display: grid;

		grid-template-columns: repeat(4, minmax(0, 1fr));

		gap: 12px;
	}

	.rule-strip article {
		position: relative;

		min-height: 96px;

		display: grid;

		align-content: center;

		gap: 4px;

		padding: 15px 17px;

		border-radius: var(--radius-md);
	}

	.rule-strip article::before {
		content: '';

		position: absolute;

		top: 14px;
		bottom: 14px;
		left: 0;

		width: 2px;

		background: var(--brand-gold);

		opacity: 0.68;
	}

	.rule-strip span {
		color: var(--brand-gold);

		font-family: var(--font-body);

		font-size: 0.59rem;

		font-weight: 700;

		letter-spacing: 0.14em;

		text-transform: uppercase;
	}

	.rule-strip strong {
		color: var(--brand-ivory);

		font-family: var(--font-display);

		font-size: 1.7rem;

		font-weight: 400;

		line-height: 1;
	}

	.rule-strip small {
		color: var(--muted-2);
	}

	/* =========================================================
	   SECTION HEADS
	   ========================================================= */

	.calculator-head,
	.desk-head {
		display: flex;

		justify-content: space-between;

		align-items: flex-start;

		gap: 16px;

		margin-bottom: 20px;
	}

	.calculator-head h2,
	.desk-head h2 {
		margin: 4px 0 0;

		color: var(--brand-ivory);

		font-family: var(--font-display);

		font-size: 2rem;

		font-weight: 400;

		letter-spacing: 0.02em;

		line-height: 1;
	}

	.calculator-head > span {
		margin-top: 5px;
	}

	/* =========================================================
	   SEARCH
	   ========================================================= */

	.search-shell {
		position: relative;

		max-width: 850px;
	}

	.search-shell > label {
		display: block;

		margin-bottom: 7px;

		color: var(--brand-sand);

		font-size: 0.7rem;

		font-weight: 700;

		text-transform: uppercase;

		letter-spacing: 0.1em;
	}

	.search-control {
		display: grid;

		grid-template-columns:
			minmax(0, 1fr)
			auto;

		gap: 7px;

		padding: 6px;

		border: 1px solid var(--border-strong);

		border-radius: var(--radius-md);

		background: var(--brand-charcoal-2);
	}

	.search-control input {
		min-width: 0;

		padding: 12px 13px;

		border: 1px solid rgba(191, 161, 106, 0.12);

		border-radius: 4px;

		outline: 0;

		background: #0c0f0e;

		color: var(--brand-ivory);

		font: inherit;

		font-size: 0.95rem;

		box-shadow: none;
	}

	.search-control input:focus {
		border-color: var(--brand-gold);

		box-shadow: 0 0 0 2px rgba(191, 161, 106, 0.09);
	}

	.search-control input::placeholder {
		color: var(--brand-stone);
	}

	.search-control button,
	.search-result,
	.player-row {
		cursor: pointer;
	}

	.search-control button {
		padding: 0 14px;

		border: 1px solid var(--border);

		border-radius: 4px;

		background: transparent;

		color: var(--brand-sand);

		font-family: var(--font-body);

		font-size: 0.66rem;

		font-weight: 700;

		letter-spacing: 0.08em;

		text-transform: uppercase;
	}

	.search-control button:hover {
		border-color: var(--brand-gold);

		color: var(--brand-gold);
	}

	/* =========================================================
	   SEARCH RESULTS
	   ========================================================= */

	.search-results {
		position: absolute;

		z-index: 20;

		left: 0;
		right: 0;

		top: calc(100% + 6px);

		display: grid;

		gap: 3px;

		padding: 6px;

		border: 1px solid var(--border-strong);

		border-radius: var(--radius-md);

		background: var(--brand-charcoal);

		box-shadow: 0 18px 38px rgba(0, 0, 0, 0.55);
	}

	.search-result {
		display: grid;

		grid-template-columns:
			40px
			minmax(0, 1fr)
			auto;

		gap: 11px;

		align-items: center;

		width: 100%;

		padding: 9px 10px;

		border: 1px solid transparent;

		border-radius: 4px;

		background: transparent;

		color: var(--brand-ivory);

		text-align: left;
	}

	.search-result:hover {
		border-color: rgba(191, 161, 106, 0.3);

		background: rgba(191, 161, 106, 0.055);
	}

	.search-result img {
		width: 40px;

		height: 40px;

		object-fit: contain;
	}

	.search-result span {
		min-width: 0;
	}

	.search-result strong,
	.search-result small {
		display: block;

		overflow: hidden;

		text-overflow: ellipsis;

		white-space: nowrap;
	}

	.search-result strong {
		color: var(--brand-ivory);
	}

	.search-result small {
		margin-top: 2px;

		color: var(--muted-2);
	}

	.search-result b {
		color: var(--brand-gold);

		font-family: var(--font-body);
	}

	.no-results {
		padding: 12px;

		color: var(--muted);
	}

	/* =========================================================
	   CALCULATOR IDLE
	   ========================================================= */

	.calculator-idle {
		min-height: 170px;

		display: grid;

		place-items: center;

		align-content: center;

		gap: 7px;

		margin-top: 20px;

		border: 1px dashed rgba(191, 161, 106, 0.24);

		border-radius: var(--radius-md);

		color: var(--muted);

		text-align: center;
	}

	.calculator-idle strong {
		color: var(--brand-ivory);

		font-size: 1rem;
	}

	/* =========================================================
	   RECEIPT
	   ========================================================= */

	.receipt {
		display: grid;

		grid-template-columns:
			260px
			minmax(0, 1fr)
			240px;

		gap: 14px;

		margin-top: 22px;

		padding-top: 20px;

		border-top: 1px solid var(--border);
	}

	.receipt-player,
	.receipt-math,
	.keeper-price,
	.history-rail {
		border: 1px solid rgba(191, 161, 106, 0.22);

		border-radius: var(--radius-md);

		background: rgba(0, 0, 0, 0.14);
	}

	.receipt-player {
		display: grid;

		grid-template-columns: 72px 1fr;

		gap: 13px;

		align-items: center;

		padding: 15px;
	}

	.receipt-player img {
		width: 72px;

		height: 72px;

		object-fit: contain;

		filter: drop-shadow(0 5px 8px rgba(0, 0, 0, 0.35));
	}

	.receipt-player span,
	.receipt-player small {
		color: var(--muted-2);
	}

	.receipt-player h3 {
		margin: 3px 0;

		font-size: 1.45rem;
	}

	.receipt-player strong,
	.receipt-player small {
		display: block;
	}

	.receipt-player strong {
		color: var(--brand-sand);
	}

	.receipt-math {
		display: grid;

		grid-template-columns: repeat(4, minmax(0, 1fr));

		overflow: hidden;
	}

	.receipt-math > div {
		display: grid;

		align-content: center;

		gap: 4px;

		min-height: 110px;

		padding: 12px 14px;

		border-right: 1px solid rgba(191, 161, 106, 0.12);
	}

	.receipt-math > div:last-child {
		border-right: 0;
	}

	.receipt-math span,
	.keeper-price span,
	.history-rail > span {
		color: var(--brand-gold);

		font-family: var(--font-body);

		font-size: 0.59rem;

		font-weight: 700;

		text-transform: uppercase;

		letter-spacing: 0.13em;
	}

	.receipt-math strong {
		color: var(--brand-ivory);

		font-family: var(--font-body);

		font-size: 1.1rem;

		font-weight: 800;
	}

	.receipt-math small {
		color: var(--muted-2);
	}

	/* =========================================================
	   KEEPER PRICE
	   ========================================================= */

	.keeper-price {
		position: relative;

		display: grid;

		align-content: center;

		padding: 17px;

		border-color: rgba(191, 161, 106, 0.46);

		background:
			linear-gradient(135deg, rgba(191, 161, 106, 0.1), transparent 55%), rgba(0, 0, 0, 0.14);
	}

	.keeper-price::after {
		content: '';

		position: absolute;

		top: 14px;
		bottom: 14px;
		left: 0;

		width: 2px;

		background: var(--brand-gold);
	}

	.keeper-price strong {
		margin: 6px 0 3px;

		color: var(--brand-gold);

		font-family: var(--font-display);

		font-size: 3rem;

		font-weight: 400;

		line-height: 0.9;

		letter-spacing: 0.02em;

		text-shadow: none;
	}

	.keeper-price small {
		color: var(--muted);

		line-height: 1.4;
	}

	/* =========================================================
	   HISTORY
	   ========================================================= */

	.history-rail {
		grid-column: 1 / -1;

		padding: 12px 14px;
	}

	.history-rail > div {
		display: flex;

		gap: 7px;

		flex-wrap: wrap;

		margin-top: 8px;
	}

	.history-rail b {
		padding: 6px 9px;

		border: 1px solid rgba(191, 161, 106, 0.14);

		border-radius: 3px;

		background: rgba(255, 255, 255, 0.025);

		color: var(--brand-sand);

		font-size: 0.75rem;
	}

	.history-rail b.current {
		border-color: var(--brand-gold);

		background: rgba(191, 161, 106, 0.08);

		color: var(--brand-gold);
	}

	/* =========================================================
	   FRANCHISE FILTER
	   ========================================================= */

	.team-filter {
		display: grid;

		gap: 6px;

		min-width: 235px;
	}

	.team-filter select {
		color-scheme: dark;

		padding: 9px 11px;

		border: 1px solid var(--border-strong);

		border-radius: 4px;

		background: var(--brand-charcoal);

		color: var(--brand-ivory);

		font: inherit;

		font-size: 0.78rem;

		font-weight: 700;
	}

	.team-filter select:focus {
		outline: 1px solid var(--brand-gold);

		outline-offset: 2px;
	}

	/* =========================================================
	   TEAM GRID
	   ========================================================= */

	.team-grid {
		display: grid;

		grid-template-columns: repeat(2, minmax(0, 1fr));

		gap: 15px;
	}

	.team-card {
		overflow: hidden;

		border-radius: var(--radius-md);
	}

	.team-card > header {
		display: grid;

		grid-template-columns:
			52px
			minmax(0, 1fr)
			auto;

		gap: 12px;

		align-items: center;

		padding: 13px 14px;

		border-bottom: 1px solid var(--border);

		background: rgba(0, 0, 0, 0.16);
	}

	.team-logo {
		width: 48px;

		height: 48px;

		display: grid;

		place-items: center;

		overflow: hidden;

		border-radius: 4px;

		color: var(--brand-charcoal);

		font-family: var(--font-body);

		font-size: 0.62rem;

		font-weight: 800;
	}

	.team-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

	.team-card header h3 {
		margin: 0;

		font-size: 1.35rem;
	}

	.team-card header span {
		color: var(--muted-2);

		font-size: 0.75rem;
	}

	.team-card header b {
		display: grid;

		place-items: center;

		min-width: 36px;

		height: 30px;

		padding: 0 7px;

		border: 1px solid var(--border-strong);

		border-radius: 3px;

		background: transparent;

		color: var(--brand-gold);

		font-family: var(--font-body);

		font-size: 0.7rem;

		font-weight: 800;
	}

	.team-summary {
		display: grid;

		gap: 3px;

		padding: 10px 14px;

		border-bottom: 1px solid rgba(191, 161, 106, 0.1);

		background: rgba(0, 0, 0, 0.09);
	}

	.team-summary span {
		color: var(--brand-gold);

		font-family: var(--font-body);

		font-size: 0.56rem;

		font-weight: 700;

		text-transform: uppercase;

		letter-spacing: 0.13em;
	}

	.team-summary strong {
		color: var(--brand-sand);

		font-size: 0.77rem;
	}

	/* =========================================================
	   PLAYER ROWS
	   ========================================================= */

	.player-list {
		display: grid;
	}

	.player-row {
		display: grid;

		grid-template-columns:
			38px
			minmax(0, 1fr)
			auto
			72px;

		gap: 9px;

		align-items: center;

		width: 100%;

		min-height: 55px;

		padding: 7px 12px;

		border: 0 !important;

		border-bottom: 1px solid rgba(191, 161, 106, 0.09) !important;

		border-radius: 0;

		background: transparent !important;

		color: var(--brand-ivory);

		text-align: left;

		box-shadow: none !important;
		position: relative;
	}

	.player-row::before {
		content: '';

		position: absolute;

		top: 8px;
		bottom: 8px;
		left: 0;

		width: 2px;

		background: var(--brand-gold);

		opacity: 0;

		transition: opacity 120ms ease;
	}

	.player-row:hover::before {
		opacity: 0.7;
	}

	.player-row:last-child {
		border-bottom: 0 !important;
	}

	.player-row:hover {
		background: rgba(191, 161, 106, 0.05) !important;
	}

	.player-row img {
		width: 36px;

		height: 36px;

		object-fit: contain;
	}

	.player-copy {
		min-width: 0;
	}

	.player-copy strong,
	.player-copy small {
		display: block;

		overflow: hidden;

		text-overflow: ellipsis;

		white-space: nowrap;
	}

	.player-copy strong {
		color: var(--brand-ivory);
	}

	.player-copy small {
		margin-top: 2px;

		color: var(--muted-2);

		font-size: 0.68rem;
	}

	.player-row > b {
		justify-self: end;

		color: var(--brand-gold);

		font-family: var(--font-body);

		font-weight: 800;
	}

	.tax-chip {
		padding: 4px 6px;

		border: 1px solid rgba(191, 161, 106, 0.3);

		border-radius: 3px;

		background: rgba(191, 161, 106, 0.055);

		color: var(--brand-gold);

		font-family: var(--font-body);

		font-size: 0.59rem;

		font-weight: 700;
	}

	/* =========================================================
	   INELIGIBLE / ERROR STATES
	   Red stays because this is actually semantic.
	   ========================================================= */

	.keeper-ineligible-chip {
		grid-column: 3 / 5;

		justify-self: end;

		padding: 5px 8px;

		border: 1px solid rgba(185, 90, 90, 0.48);

		border-radius: 3px;

		background: rgba(155, 71, 71, 0.12);

		color: #d98585;

		font-family: var(--font-body);

		font-size: 0.58rem;

		font-weight: 700;

		letter-spacing: 0.06em;

		white-space: nowrap;
	}

	.ineligible-search {
		color: #d98585 !important;

		font-family: var(--font-body);

		font-size: 0.68rem;

		white-space: nowrap;
	}

	.receipt-ineligible {
		grid-column: span 2;

		background: rgba(155, 71, 71, 0.08);
	}

	.receipt-ineligible strong {
		color: #d98585;
	}

	.keeper-price.ineligible {
		border-color: rgba(185, 90, 90, 0.34);

		background:
			linear-gradient(135deg, rgba(155, 71, 71, 0.09), transparent 55%), rgba(0, 0, 0, 0.14);
	}

	.keeper-price.ineligible::after {
		background: #b95a5a;
	}

	.keeper-price.ineligible strong {
		color: #d98585;

		font-size: 1.75rem;

		line-height: 1.05;
	}

	/* =========================================================
	   METHOD / EXPLANATION
	   ========================================================= */

	.method-grid {
		display: grid;

		grid-template-columns: repeat(4, minmax(0, 1fr));

		gap: 10px;

		margin-top: 14px;
	}

	.method-grid > div {
		position: relative;

		display: grid;

		gap: 5px;

		padding: 13px;

		border: 1px solid rgba(191, 161, 106, 0.13);

		border-radius: var(--radius-sm);

		background: rgba(0, 0, 0, 0.1);
	}

	.method-grid b {
		color: var(--brand-gold);
	}

	.method-grid span {
		color: var(--muted);

		font-size: 0.8rem;

		line-height: 1.45;
	}

	.rounding-note {
		margin: 13px 0 0;

		color: var(--muted);

		font-size: 0.82rem;

		line-height: 1.5;
	}

	.rounding-note b {
		color: var(--brand-sand);
	}

	.warning {
		margin: 14px 0 0;

		padding: 10px 12px;

		border-left: 2px solid var(--brand-gold);

		background: rgba(191, 161, 106, 0.055);

		color: var(--muted);
	}

	/* =========================================================
	   EMPTY
	   ========================================================= */

	.empty-card {
		color: var(--muted);
	}

	.bug-row {
		display: inline-grid;

		grid-template-columns: auto auto;

		overflow: hidden;

		border: 1px solid var(--border-strong);

		border-radius: 3px;

		background: var(--brand-charcoal);

		color: var(--brand-gold);

		font-family: var(--font-body);

		font-size: 0.65rem;

		font-weight: 700;

		text-transform: uppercase;

		letter-spacing: 0.08em;
	}

	.bug-row span {
		display: grid;

		place-items: center;

		padding: 8px 10px;

		border-right: 1px solid var(--border-strong);

		background: transparent;

		color: var(--brand-gold);
	}

	.bug-row strong {
		padding: 8px 11px;
	}

	/* =========================================================
	   RESPONSIVE
	   ========================================================= */

	@media (max-width: 1150px) {
		.keeper-hero {
			grid-template-columns:
				minmax(0, 1fr)
				auto;
		}

		.receipt {
			grid-template-columns: 1fr 1fr;
		}

		.receipt-math {
			grid-column: 1 / -1;

			order: 3;
		}

		.history-rail {
			order: 4;
		}
	}

	@media (max-width: 900px) {
		.rule-strip,
		.team-grid,
		.method-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.receipt-math {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 650px) {
		.keeper-hero {
			grid-template-columns: 1fr;
		}

		.keeper-hero::after {
			display: none;
		}

		.hero-copy {
			padding: 8px 0 4px;
		}

		.season-box {
			justify-self: start;

			width: 100%;
		}

		.receipt-ineligible {
			grid-column: span 1;
		}

		.keeper-ineligible-chip {
			grid-column: 3;
		}

		.rule-strip,
		.team-grid,
		.method-grid,
		.receipt {
			grid-template-columns: 1fr;
		}

		.receipt-math {
			grid-template-columns: 1fr;
		}

		.receipt-math > div {
			border-right: 0;

			border-bottom: 1px solid rgba(191, 161, 106, 0.12);
		}

		.receipt-math > div:last-child {
			border-bottom: 0;
		}

		.calculator-head,
		.desk-head {
			display: grid;
		}

		.team-filter {
			min-width: 0;

			width: 100%;
		}

		.player-row {
			grid-template-columns:
				34px
				minmax(0, 1fr)
				auto;
		}

		.tax-chip {
			display: none;
		}

		.player-row > b {
			grid-column: 3;
		}
	}
</style>
