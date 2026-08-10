<script>
  import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';

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
          const haystack = `${player.name} ${player.position} ${player.nflTeamLabel} ${player.teamName} ${player.managerName}`.toLowerCase();
          return haystack.includes(normalizedQuery);
        })
        .slice(0, 8)
    : [];
  $: selectedPlayer = candidates.find((player) => String(player.id) === String(selectedPlayerId)) || null;
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
</script>

<svelte:head>
  <title>Keeper Desk · {data?.leagueName || 'Irving Champions League'}</title>
</svelte:head>

<div class="page-stack keeper-page">
  <LeagueSubnav season={data.season} active="keepers" />

  <section class="keeper-hero">
    <div class="hero-bug">
      <span class="network">ICN</span>
      <strong>Keeper Desk</strong>
    </div>

    <div class="hero-copy">
      <div class="eyebrow">{data.targetSeason} Front Office</div>
      <h1>Keep or Cut?</h1>
      <p>Every roster. Every eligible player. Every tax bill before somebody talks themselves into a terrible decision.</p>
    </div>

    <div class="season-box" aria-label="Keeper season selector">
      <span>Season feed</span>
      <div class="season-pills">
        {#each data.availableSeasons as season}
          <a class:active={Number(season) === Number(data.targetSeason)} href={seasonHref(season)}>{season}</a>
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
                <small>{player.position} · {player.nflTeamLabel} · {player.teamName}</small>
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
            <strong>{money(selectedPlayer.lastAcquisitionPrice ?? selectedPlayer.previousPrice)}</strong>
            <small>{selectedPlayer.lastAcquisitionLabel || selectedPlayer.priceOriginLabel} · {selectedPlayer.priceOriginSeason}</small>
          </div>
          <div>
            <span>Keeper floor</span>
            <strong>{money(selectedPlayer.floorBase)}</strong>
            <small>{selectedPlayer.floorApplied ? '$10 minimum applied' : 'No floor adjustment'}</small>
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
                {selectedPlayer.keeperStreak} prior keeper selection{selectedPlayer.keeperStreak === 1 ? '' : 's'} across all franchises
              </small>
            </div>

            <div>
              <span>Tax</span>
              <strong>{money(selectedPlayer.taxAmount)}</strong>
              <small>{money(selectedPlayer.floorBase)} × {selectedPlayer.taxPct}%</small>
            </div>
          {/if}
        </div>

        <div
	class="keeper-price"
	class:ineligible={selectedPlayer.keeperEligible === false}
>
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
        <span>Last acquisition price, keeper floor, career keeper tenure, tax rate, and projected keeper cost.</span>
      </div>
    {/if}
  </section>

  {#if !data.hasData}
    <section class="empty-card">
      <div class="bug-row"><span>ICN</span><strong>No keeper signal</strong></div>
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
                {#if team.teamPhoto}
                  <img src={team.teamPhoto} alt={team.teamName} />
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
              <strong>{team.cheapest.map((player) => `${player.shortName} ${money(player.keeperCost)}`).join(' · ')}</strong>
            </div>

            <div class="player-list">
              {#each team.players as player}
                <button type="button" class="player-row" on:click={() => choosePlayer(player)}>
                  <img src={player.photoUrl} alt="" />
                  <span class="player-copy">
                    <strong>{player.name}</strong>
                    <small>
                      {player.position} · {player.priceOriginLabel}
                      {#if player.movedByTrade} · TRADE{/if}
                    </small>
                  </span>
                  {#if player.keeperEligible === false}
                    <span class="keeper-ineligible-chip">
                      NOT KEEPER ELIGIBLE
                    </span>
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
      <div><b>Last add wins</b><span>The base price comes from the player's most recent priced acquisition: auction draft, waiver claim, or free-agent add.</span></div>
      <div><b>Waiver</b><span>A later waiver claim replaces an older draft/keeper price. The FAAB bid becomes the new base, with a $10 minimum.</span></div>
      <div><b>Trade</b><span>A trade does not reset anything. Both the current acquisition price and keeper tenure follow the player.</span></div>
      <div><b>Auction reset</b><span>A normal return to the auction draft creates a new acquisition price and resets the keeper-tax clock.</span></div>
    </div>
    <p class="rounding-note"><b>Example:</b> drafted for $40, dropped, then claimed for $20 → the keeper base is $20, not $40. The keeper tax is applied to that $20 base.</p>
    <p class="rounding-note"><b>Rounding:</b> the final keeper price always rounds up to the next whole dollar.</p>
    {#if data.stats.estimatedPriceCount}
      <p class="warning">{data.stats.estimatedPriceCount} player{data.stats.estimatedPriceCount === 1 ? '' : 's'} could not be tied to an exact {data.sourceSeason} price event, so the desk used the minimum/historical fallback. Those rows are worth auditing before keeper deadline.</p>
    {/if}
  </section>
</div>

<style>
  .page-stack {
    display: grid;
    gap: 20px;
    max-width: 1500px;
    margin: 0 auto;
    padding-bottom: 48px;
  }

  .keeper-hero,
  .calculator-card,
  .desk-card,
  .method-card,
  .empty-card,
  .rule-strip article,
  .team-card {
    border: 2px solid #070808;
    background:
      linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.025) 18%, rgba(0,0,0,.18)),
      linear-gradient(180deg, var(--bug-gray, #5f6763), var(--bug-charcoal, #252b2a) 48%, var(--bug-black, #101313));
    box-shadow: var(--shadow-panel, 0 12px 30px rgba(0,0,0,.35));
  }

  .keeper-hero {
    position: relative;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 22px;
    align-items: stretch;
    overflow: hidden;
    border-radius: 18px;
    background:
      linear-gradient(90deg, rgba(199,25,47,.28), transparent 34%),
      repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 4px),
      linear-gradient(180deg, #626965, #292e2c 45%, #101312);
  }

  .hero-bug {
    align-self: start;
    display: grid;
    grid-template-columns: 58px 1fr;
    min-width: 245px;
    border-right: 2px solid #070808;
    border-bottom: 2px solid #070808;
    background: linear-gradient(180deg, #171a19, #050606);
    color: var(--bug-yellow, #ffd34d);
    font-family: var(--font-score);
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: .14em;
  }

  .hero-bug .network,
  .bug-row span {
    display: grid;
    place-items: center;
    min-height: 42px;
    padding: 0 12px;
    border-right: 2px solid #070808;
    background: linear-gradient(180deg, var(--bug-red, #c7192f), var(--bug-red-dark, #7f0e1b));
    color: white;
    letter-spacing: 0;
  }

  .hero-bug strong {
    display: flex;
    align-items: center;
    padding: 0 14px;
  }

  .hero-copy {
    align-self: center;
    padding: 24px 0 28px;
  }

  .eyebrow,
  .season-box > span,
  .calculator-head > span,
  .team-filter label {
    color: var(--bug-yellow, #ffd34d);
    font-family: var(--font-score);
    font-size: .68rem;
    font-weight: 950;
    letter-spacing: .16em;
    text-transform: uppercase;
  }

  h1,
  h2,
  h3,
  p { margin-top: 0; }

  h1 {
    margin: 7px 0 10px;
    font-family: var(--font-display);
    font-size: clamp(3rem, 6vw, 5.8rem);
    line-height: .88;
    letter-spacing: -.06em;
    text-shadow: 0 3px 0 #000;
  }

  .hero-copy p {
    max-width: 64ch;
    margin-bottom: 0;
    color: rgba(247,245,235,.78);
  }

  .season-box {
    align-self: center;
    justify-self: end;
    display: grid;
    gap: 9px;
    margin-right: 16px;
    padding: 10px 12px 12px;
    border: 2px solid #070808;
    border-radius: 8px;
    background: linear-gradient(180deg, #eeeeea, #c7cbc7 16%, #8b918d 52%, #3d4340 100%);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.85), inset 0 -2px 0 rgba(0,0,0,.45), 0 4px 10px rgba(0,0,0,.35);
  }

  .season-box > span { color: #090a0a; text-shadow: 0 1px 0 rgba(255,255,255,.65); }
  .season-pills { display: flex; gap: 8px; flex-wrap: wrap; }
  .season-pills a {
    display: grid;
    place-items: center;
    min-width: 56px;
    min-height: 34px;
    padding: 5px 10px;
    border: 2px solid #070808;
    border-radius: 8px;
    background: linear-gradient(180deg, #777e7a, #343938 48%, #151717);
    color: white;
    font-family: var(--font-score);
    font-size: .72rem;
    font-weight: 950;
    text-decoration: none;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.25), inset 0 -2px 0 rgba(0,0,0,.55);
  }
  .season-pills a.active,
  .season-pills a:hover { background: linear-gradient(180deg, var(--bug-red, #c7192f), var(--bug-red-dark, #7f0e1b)); }

  .rule-strip {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  .rule-strip article {
    min-height: 92px;
    display: grid;
    align-content: center;
    gap: 3px;
    padding: 14px 16px;
    border-radius: 14px;
  }
  .rule-strip span { color: var(--bug-yellow, #ffd34d); font-family: var(--font-score); font-size: .62rem; font-weight: 950; letter-spacing: .14em; text-transform: uppercase; }
  .rule-strip strong { font-family: var(--font-score); font-size: 1.35rem; }
  .rule-strip small { color: rgba(255,255,255,.65); }

  .calculator-card,
  .desk-card,
  .method-card,
  .empty-card { border-radius: 18px; padding: 22px; }

  .calculator-head,
  .desk-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 18px;
  }
  .calculator-head h2,
  .desk-head h2 { margin: 3px 0 0; font-size: 1.55rem; }
  .calculator-head > span { margin-top: 5px; }

  .search-shell { position: relative; max-width: 850px; }
  .search-shell > label { display: block; margin-bottom: 7px; color: rgba(255,255,255,.68); font-size: .76rem; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; }
  .search-control {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
    padding: 7px;
    border: 2px solid #070808;
    border-radius: 12px;
    background: linear-gradient(180deg, #e8e9e5, #9da39f 60%, #686f6b);
  }
  .search-control input {
    min-width: 0;
    border: 0;
    outline: 0;
    padding: 11px 12px;
    border-radius: 7px;
    background: #0b0e0d;
    color: white;
    font: inherit;
    font-size: 1rem;
    box-shadow: inset 0 2px 7px rgba(0,0,0,.72);
  }
  .search-control button,
  .search-result,
  .player-row {
    cursor: pointer;
  }
  .search-control button {
    border: 2px solid #070808;
    border-radius: 7px;
    padding: 0 14px;
    background: linear-gradient(180deg, #6f7672, #252a28);
    color: white;
    font-family: var(--font-score);
    font-weight: 900;
    text-transform: uppercase;
  }

  .search-results {
    position: absolute;
    z-index: 20;
    left: 0;
    right: 0;
    top: calc(100% + 5px);
    display: grid;
    gap: 4px;
    padding: 7px;
    border: 2px solid #070808;
    border-radius: 12px;
    background: #151918;
    box-shadow: 0 15px 30px rgba(0,0,0,.55);
  }
  .search-result {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    width: 100%;
    padding: 8px 10px;
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 9px;
    background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.015));
    color: white;
    text-align: left;
  }
  .search-result:hover { background: rgba(199,25,47,.18); }
  .search-result img { width: 40px; height: 40px; object-fit: contain; }
  .search-result span { min-width: 0; }
  .search-result strong,
  .search-result small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .search-result small { color: rgba(255,255,255,.62); margin-top: 2px; }
  .search-result b { color: var(--bug-yellow, #ffd34d); font-family: var(--font-score); }
  .no-results { padding: 12px; color: rgba(255,255,255,.65); }

  .calculator-idle {
    min-height: 170px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 6px;
    margin-top: 18px;
    border: 1px dashed rgba(255,255,255,.14);
    border-radius: 14px;
    color: rgba(255,255,255,.62);
    text-align: center;
  }
  .calculator-idle strong { color: white; font-size: 1.05rem; }

  .receipt {
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr) 240px;
    gap: 16px;
    margin-top: 20px;
    padding-top: 18px;
    border-top: 1px solid rgba(255,255,255,.1);
  }
  .receipt-player,
  .receipt-math,
  .keeper-price,
  .history-rail {
    border: 2px solid #070808;
    border-radius: 14px;
    background: rgba(0,0,0,.20);
  }
  .receipt-player {
    display: grid;
    grid-template-columns: 72px 1fr;
    gap: 12px;
    align-items: center;
    padding: 15px;
  }
  .receipt-player img { width: 72px; height: 72px; object-fit: contain; filter: drop-shadow(0 5px 8px rgba(0,0,0,.4)); }
  .receipt-player span,
  .receipt-player small { color: rgba(255,255,255,.62); }
  .receipt-player h3 { margin: 3px 0; font-size: 1.15rem; }
  .receipt-player strong,
  .receipt-player small { display: block; }

  .receipt-math {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    overflow: hidden;
  }
  .receipt-math > div { display: grid; align-content: center; gap: 3px; min-height: 110px; padding: 12px 14px; border-right: 1px solid rgba(255,255,255,.08); }
  .receipt-math > div:last-child { border-right: 0; }
  .receipt-math span,
  .keeper-price span,
  .history-rail > span { color: var(--bug-yellow, #ffd34d); font-family: var(--font-score); font-size: .61rem; font-weight: 950; text-transform: uppercase; letter-spacing: .12em; }
  .receipt-math strong { font-family: var(--font-score); font-size: 1.15rem; }
  .receipt-math small { color: rgba(255,255,255,.6); }

  .keeper-price {
    display: grid;
    align-content: center;
    padding: 16px;
    background:
      linear-gradient(180deg, rgba(255,216,77,.09), rgba(0,0,0,.08)),
      rgba(0,0,0,.2);
  }
  .keeper-price strong { margin: 5px 0 2px; color: var(--bug-yellow, #ffd34d); font-family: var(--font-display); font-size: 2.6rem; line-height: .9; text-shadow: 0 2px 0 #000; }
  .keeper-price small { color: rgba(255,255,255,.65); line-height: 1.35; }

  .history-rail { grid-column: 1 / -1; padding: 12px 14px; }
  .history-rail > div { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
  .history-rail b { padding: 6px 9px; border-radius: 7px; background: rgba(255,255,255,.06); font-size: .78rem; }
  .history-rail b.current { background: rgba(199,25,47,.26); color: white; }

  .team-filter { display: grid; gap: 6px; min-width: 235px; }
  .team-filter select {
    border: 2px solid #070808;
    border-radius: 8px;
    padding: 9px 11px;
    background: linear-gradient(180deg, #767d79, #272c2a);
    color: white;
    font: inherit;
    font-weight: 800;
  }

  .team-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px; }
  .team-card { overflow: hidden; border-radius: 15px; }
  .team-card > header {
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr) auto;
    gap: 11px;
    align-items: center;
    padding: 12px 14px;
    border-bottom: 2px solid #070808;
    background: linear-gradient(180deg, #171a19, #070808);
  }
  .team-logo { width: 48px; height: 48px; display: grid; place-items: center; overflow: hidden; border: 2px solid #070808; border-radius: 50%; background: #e6e0d5; color: #111; font-family: var(--font-score); font-size: .65rem; font-weight: 950; }
  .team-logo img { width: 100%; height: 100%; object-fit: cover; }
  .team-card header h3 { margin: 0; font-size: 1.02rem; }
  .team-card header span { color: rgba(255,255,255,.62); font-size: .78rem; }
  .team-card header b { display: grid; place-items: center; min-width: 34px; height: 30px; border-radius: 7px; background: var(--bug-yellow, #ffd34d); color: #111; font-family: var(--font-score); }

  .team-summary { display: grid; gap: 2px; padding: 9px 14px; border-bottom: 1px solid rgba(255,255,255,.07); background: rgba(0,0,0,.13); }
  .team-summary span { color: var(--bug-yellow, #ffd34d); font-family: var(--font-score); font-size: .58rem; font-weight: 950; text-transform: uppercase; letter-spacing: .12em; }
  .team-summary strong { font-size: .78rem; color: rgba(255,255,255,.75); }

  .player-list { display: grid; }
  .player-row {
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr) auto 72px;
    gap: 9px;
    align-items: center;
    width: 100%;
    min-height: 54px;
    padding: 7px 12px;
    border: 0;
    border-bottom: 1px solid rgba(255,255,255,.065);
    background: rgba(0,0,0,.08);
    color: white;
    text-align: left;
  }
  .player-row:last-child { border-bottom: 0; }
  .player-row:hover { background: rgba(199,25,47,.14); }
  .player-row img { width: 36px; height: 36px; object-fit: contain; }
  .player-copy { min-width: 0; }
  .player-copy strong,
  .player-copy small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .player-copy small { margin-top: 2px; color: rgba(255,255,255,.58); font-size: .7rem; }
  .tax-chip { padding: 4px 6px; border: 1px solid rgba(255,216,77,.25); border-radius: 6px; background: rgba(255,216,77,.08); color: var(--bug-yellow, #ffd34d); font-family: var(--font-score); font-size: .62rem; font-weight: 950; }
  .keeper-ineligible-chip {
	grid-column: 3 / 5;
	justify-self: end;
	padding: 5px 8px;
	border: 1px solid rgba(255, 95, 95, .45);
	border-radius: 6px;
	background: rgba(150, 20, 20, .22);
	color: #ff7777;
	font-family: var(--font-score);
	font-size: .61rem;
	font-weight: 950;
	letter-spacing: .05em;
	white-space: nowrap;
}

.ineligible-search {
	color: #ff7777 !important;
	font-family: var(--font-score);
	font-size: .7rem;
	white-space: nowrap;
}

.receipt-ineligible {
	grid-column: span 2;
	background: rgba(130, 15, 15, .12);
}

.receipt-ineligible strong {
	color: #ff7777;
}

.keeper-price.ineligible {
	background:
		linear-gradient(180deg, rgba(180, 25, 25, .12), rgba(0,0,0,.08)),
		rgba(0,0,0,.2);
}

.keeper-price.ineligible strong {
	color: #ff7777;
	font-size: 1.55rem;
	line-height: 1.05;
}
  .player-row > b { justify-self: end; color: var(--bug-yellow, #ffd34d); font-family: var(--font-score); }

  .method-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 10px; margin-top: 12px; }
  .method-grid > div { display: grid; gap: 4px; padding: 12px; border: 1px solid rgba(255,255,255,.07); border-radius: 10px; background: rgba(0,0,0,.15); }
  .method-grid b { color: var(--bug-yellow, #ffd34d); }
  .method-grid span { color: rgba(255,255,255,.68); font-size: .82rem; }
  .warning { margin: 14px 0 0; padding: 10px 12px; border-left: 3px solid #f0b84d; background: rgba(240,184,77,.08); color: rgba(255,255,255,.78); }

  .empty-card { color: rgba(255,255,255,.68); }
  .bug-row { display: inline-grid; grid-template-columns: auto auto; border: 2px solid #070808; border-radius: 7px; overflow: hidden; background: #080909; color: var(--bug-yellow, #ffd34d); font-family: var(--font-score); text-transform: uppercase; }
  .bug-row strong { padding: 8px 11px; }

  @media (max-width: 1150px) {
    .keeper-hero { grid-template-columns: auto 1fr; }
    .season-box { grid-column: 1 / -1; justify-self: start; margin: 0 16px 16px; }
    .receipt { grid-template-columns: 1fr 1fr; }
    .receipt-math { grid-column: 1 / -1; order: 3; }
    .history-rail { order: 4; }
  }

  @media (max-width: 900px) {
    .rule-strip,
    .team-grid,
    .method-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
    .hero-bug { min-width: 200px; }
    .receipt-math { grid-template-columns: repeat(2, minmax(0,1fr)); }
  }

  @media (max-width: 650px) {
    .keeper-hero { grid-template-columns: 1fr; }
    .hero-bug { justify-self: start; }
    .hero-copy { padding: 4px 16px 10px; }
    .season-box { grid-column: auto; }
    .receipt-ineligible {
	grid-column: span 1;
}

.keeper-ineligible-chip {
	grid-column: 3;
}
    .rule-strip,
    .team-grid,
    .method-grid,
    .receipt { grid-template-columns: 1fr; }
    .receipt-math { grid-template-columns: 1fr; }
    .receipt-math > div { border-right: 0; border-bottom: 1px solid rgba(255,255,255,.08); }
    .receipt-math > div:last-child { border-bottom: 0; }
    .calculator-head,
    .desk-head { display: grid; }
    .team-filter { min-width: 0; width: 100%; }
    .player-row { grid-template-columns: 34px minmax(0,1fr) auto; }
    .tax-chip { display: none; }
    .player-row > b { grid-column: 3; }
  }
</style>
