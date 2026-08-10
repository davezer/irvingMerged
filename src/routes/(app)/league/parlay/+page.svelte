<script>
  import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';

  export let data;

  let query = '';
  let teamFilter = '';
  let resultFilter = '';
  let categoryFilter = '';
  let pageSize = '50';
  let page = 1;

  $: rows = data?.rows || [];
  $: normalizedQuery = query.trim().toLowerCase();
  $: filteredRows = rows.filter((row) => {
    if (teamFilter && row.team !== teamFilter) return false;
    if (resultFilter && row.result !== resultFilter) return false;
    if (categoryFilter && row.category !== categoryFilter) return false;

    if (normalizedQuery) {
      const haystack = `${row.team} ${row.date} ${row.bet} ${row.result} ${row.category}`.toLowerCase();
      if (!haystack.includes(normalizedQuery)) return false;
    }

    return true;
  });

  $: numericPageSize = pageSize === 'all' ? Math.max(filteredRows.length, 1) : Number(pageSize);
  $: totalPages = Math.max(1, Math.ceil(filteredRows.length / numericPageSize));
  $: if (page > totalPages) page = totalPages;
  $: startIndex = (page - 1) * numericPageSize;
  $: visibleRows = pageSize === 'all'
    ? filteredRows
    : filteredRows.slice(startIndex, startIndex + numericPageSize);

  function seasonHref(season) {
    return season ? `/league/parlay?season=${season}` : '/league/parlay';
  }

  function resultClass(result) {
    const value = String(result || '').toLowerCase();
    if (value === 'win') return 'win';
    if (value === 'loss') return 'loss';
    if (value === 'push') return 'push';
    if (value === 'pending') return 'pending';
    return 'neutral';
  }

  function resetFilters() {
    query = '';
    teamFilter = '';
    resultFilter = '';
    categoryFilter = '';
    page = 1;
  }

  function filterChanged() {
    page = 1;
  }
</script>

<svelte:head>
  <title>Parlay Desk · Irving Champions League</title>
</svelte:head>

<div class="page-stack parlay-page">
  <!-- <LeagueSubnav season={data.requestedSeason} active="parlay" /> -->

  <section class="parlay-hero icl-hero-shell pad-md">
      <div class="hero-copy">
      <div class="eyebrow">Group Action Archive</div>
      <h1>Parlay Detail</h1>
      <!-- <p>Every pick. Every sweat. Every receipt.</p> -->
    </div>


  </section>

  <section class="stat-strip" aria-label="Parlay summary">
    <article>
      <span>Total picks</span>
      <strong>{data.stats.total}</strong>
      <small>{data.stats.pushes} push{data.stats.pushes === 1 ? '' : 'es'}{data.stats.pending ? ` · ${data.stats.pending} pending` : ''}</small>
    </article>
    <article>
      <span>Wins</span>
      <strong>{data.stats.wins}</strong>
      <small>graded winners</small>
    </article>
    <article>
      <span>Losses</span>
      <strong>{data.stats.losses}</strong>
      <small>graded losses</small>
    </article>
    <article class="hit-rate">
      <span>Hit rate</span>
      <strong>{data.stats.hitRate.toFixed(1)}%</strong>
      <small>pushes excluded</small>
    </article>
  </section>

  <section class="desk-card">
    <div class="desk-head">
      <div>
        <div class="eyebrow">Historical ledger</div>
        <h2>{data.requestedSeason || 'All-Time'} Parlay Board</h2>
      </div>
      
    </div>

    {#if data.error}
      <div class="signal-error">
        <strong>Parlay feed unavailable</strong>
        <span>{data.error}</span>
      </div>
    {:else}
      <div class="filter-grid">
        <label class="search-filter">
          <span>Search</span>
          <input
            type="search"
            bind:value={query}
            on:input={filterChanged}
            placeholder="Pick, team, category…"
            autocomplete="off"
          />
        </label>

        <label>
          <span>Franchise</span>
          <select bind:value={teamFilter} on:change={filterChanged}>
            <option value="">All franchises</option>
            {#each data.teamOptions as team}
              <option value={team}>{team}</option>
            {/each}
          </select>
        </label>

        <label>
          <span>Result</span>
          <select bind:value={resultFilter} on:change={filterChanged}>
            <option value="">All results</option>
            {#each data.resultOptions as result}
              <option value={result}>{result}</option>
            {/each}
          </select>
        </label>

        <label>
          <span>Category</span>
          <select bind:value={categoryFilter} on:change={filterChanged}>
            <option value="">All categories</option>
            {#each data.categoryOptions as category}
              <option value={category}>{category}</option>
            {/each}
          </select>
        </label>
      </div>

      <div class="table-toolbar">
        <div>
          <strong>{filteredRows.length}</strong>
          <span>of {rows.length} picks shown</span>
        </div>

        <div class="toolbar-actions">
          {#if query || teamFilter || resultFilter || categoryFilter}
            <button type="button" on:click={resetFilters}>Clear filters</button>
          {/if}

          <label>
            <span>Show</span>
            <select bind:value={pageSize} on:change={() => (page = 1)}>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="all">All</option>
            </select>
          </label>
        </div>
      </div>

      {#if !data.hasData}
        <div class="empty-state">
          <strong>No parlay picks found for this season.</strong>
          <span>Try another season or switch the season feed to All.</span>
        </div>
      {:else if !filteredRows.length}
        <div class="empty-state">
          <strong>No picks match those filters.</strong>
          <button type="button" on:click={resetFilters}>Clear filters</button>
        </div>
      {:else}
        <div class="table-shell">
          <table>
            <thead>
              <tr>
                <th>GM Team</th>
                <th>Date</th>
                <th>Group Parlay Bet</th>
                <th>Result</th>
                <th>Bet Category</th>
              </tr>
            </thead>
            <tbody>
              {#each visibleRows as row (row.id)}
                <tr>
                  <td class="team-cell">{row.team}</td>
                  <td class="date-cell">{row.date || '—'}</td>
                  <td class="bet-cell">{row.bet}</td>
                  <td><span class={`result-pill ${resultClass(row.result)}`}>{row.result}</span></td>
                  <td class="category-cell">{row.category}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        {#if pageSize !== 'all' && totalPages > 1}
          <div class="pagination">
            <button type="button" disabled={page <= 1} on:click={() => (page -= 1)}>Previous</button>
            <span>Page <strong>{page}</strong> of {totalPages}</span>
            <button type="button" disabled={page >= totalPages} on:click={() => (page += 1)}>Next</button>
          </div>
        {/if}
      {/if}
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

   .desk-card,
  .stat-strip article {
    border: 2px solid #070808;
    box-shadow: var(--shadow-panel, 0 12px 30px rgba(0,0,0,.35));
  }

  .parlay-hero {
    position: relative;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 22px;
    align-items: stretch;
    overflow: hidden;
    border-radius: 18px;
  }

  .hero-bug {
    align-self: start;
    display: grid;
    grid-template-columns: 58px 1fr;
    min-width: 230px;
    border-right: 2px solid #070808;
    border-bottom: 2px solid #070808;
    background: linear-gradient(180deg, #171a19, #050606);
    color: var(--bug-yellow, #ffd34d);
    font-family: var(--font-score);
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: .14em;
  }

  .hero-bug .network {
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
  .feed-note span,
  .filter-grid label > span,
  .toolbar-actions label > span,
  .stat-strip span {
    color: var(--bug-yellow, #ffd34d);
    font-family: var(--font-score);
    font-size: .68rem;
    font-weight: 950;
    letter-spacing: .16em;
    text-transform: uppercase;
  }

  h1,
  h2,
  p { margin-top: 0; }

  h1 {
    margin: 7px 0 8px;
    font-family: var(--font-display);
    font-size: clamp(3rem, 6vw, 5.8rem);
    line-height: .88;
    letter-spacing: -.06em;
    text-shadow: 0 3px 0 #000;
  }

  .hero-copy p {
    margin-bottom: 0;
    color: rgba(247,245,235,.78);
    font-size: 1rem;
  }

  .season-box {
    align-self: center;
    justify-self: end;
    display: grid;
    gap: 9px;
    max-width: 280px;
    margin-right: 16px;
    padding: 10px 12px 12px;
    border: 2px solid #070808;
    border-radius: 8px;
    background: linear-gradient(180deg, #eeeeea, #c7cbc7 16%, #8b918d 52%, #3d4340 100%);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.85), inset 0 -2px 0 rgba(0,0,0,.45), 0 4px 10px rgba(0,0,0,.35);
  }

  .season-box > span { color: #090a0a; text-shadow: 0 1px 0 rgba(255,255,255,.65); }
  .season-pills { display: flex; gap: 7px; flex-wrap: wrap; }

  .season-pills a {
    display: grid;
    place-items: center;
    min-width: 54px;
    min-height: 34px;
    padding: 5px 9px;
    border: 2px solid #070808;
    border-radius: 8px;
    background: linear-gradient(180deg, #777e7a, #343938 48%, #151717);
    color: white;
    font-family: var(--font-score);
    font-size: .72rem;
    font-weight: 950;
    text-decoration: none;
    text-transform: uppercase;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.25), inset 0 -2px 0 rgba(0,0,0,.55);
  }

  .season-pills a.active,
  .season-pills a:hover {
    background: linear-gradient(180deg, var(--bug-red, #c7192f), var(--bug-red-dark, #7f0e1b));
  }

  .stat-strip {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .stat-strip article {
    min-height: 94px;
    display: grid;
    align-content: center;
    gap: 3px;
    padding: 14px 16px;
    border-radius: 14px;
    background:
      linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.025) 18%, rgba(0,0,0,.18)),
      linear-gradient(180deg, var(--bug-gray, #5f6763), var(--bug-charcoal, #252b2a) 48%, var(--bug-black, #101313));
  }

  .stat-strip strong {
    font-family: var(--font-score);
    font-size: 1.55rem;
    line-height: 1.05;
  }

  .stat-strip small { color: rgba(255,255,255,.62); }
  .stat-strip .hit-rate strong { color: var(--bug-yellow, #ffd34d); }

  .desk-card {
    padding: 22px;
    border-radius: 18px;
    background:
      linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.025) 18%, rgba(0,0,0,.18)),
      linear-gradient(180deg, var(--bug-gray, #5f6763), var(--bug-charcoal, #252b2a) 48%, var(--bug-black, #101313));
  }

  .desk-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 18px;
    margin-bottom: 18px;
  }

  .desk-head h2 { margin: 4px 0 0; font-size: 1.6rem; }

  .feed-note {
    display: grid;
    gap: 3px;
    text-align: right;
  }
  .feed-note strong { color: rgba(255,255,255,.78); font-size: .82rem; }

  .filter-grid {
    display: grid;
    grid-template-columns: minmax(260px, 1.4fr) repeat(3, minmax(160px, .7fr));
    gap: 10px;
    padding: 12px;
    border: 2px solid #070808;
    border-radius: 14px;
    background: linear-gradient(180deg, #d8dbd5, #929894 55%, #575e5b);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.72), inset 0 -2px 0 rgba(0,0,0,.35);
  }

  .filter-grid label,
  .toolbar-actions label {
    display: grid;
    gap: 6px;
  }

  .filter-grid label > span,
  .toolbar-actions label > span {
    color: #171918;
    text-shadow: 0 1px 0 rgba(255,255,255,.55);
  }

  .filter-grid input,
  .filter-grid select,
  .toolbar-actions select {
    width: 100%;
    min-height: 40px;
    border: 2px solid #070808;
    border-radius: 7px;
    padding: 7px 10px;
    outline: 0;
    background: linear-gradient(180deg, #343a38, #111514);
    color: white;
    font: inherit;
    box-shadow: inset 0 2px 6px rgba(0,0,0,.45);
  }

  .table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 14px;
    margin: 14px 0 10px;
  }

  .table-toolbar > div:first-child {
    display: flex;
    align-items: baseline;
    gap: 6px;
    color: rgba(255,255,255,.65);
  }

  .table-toolbar > div:first-child strong {
    color: var(--bug-yellow, #ffd34d);
    font-family: var(--font-score);
    font-size: 1rem;
  }

  .toolbar-actions {
    display: flex;
    align-items: end;
    gap: 10px;
  }

  .toolbar-actions label { min-width: 88px; }

  button {
    cursor: pointer;
    border: 2px solid #070808;
    border-radius: 7px;
    padding: 9px 12px;
    background: linear-gradient(180deg, #6f7672, #252a28);
    color: white;
    font-family: var(--font-score);
    font-size: .72rem;
    font-weight: 950;
    text-transform: uppercase;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.22), inset 0 -2px 0 rgba(0,0,0,.45);
  }
  button:hover:not(:disabled) { filter: brightness(1.12); }
  button:disabled { opacity: .35; cursor: default; }

  .table-shell {
    overflow-x: auto;
    border: 2px solid #070808;
    border-radius: 13px;
    background: #101313;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.07);
  }

  table {
    width: 100%;
    min-width: 900px;
    border-collapse: collapse;
  }

  thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    padding: 10px 13px;
    border-bottom: 2px solid #070808;
    background: linear-gradient(180deg, #f2f1e8, #b8bdb8 52%, #747b77);
    color: #101211;
    font-family: var(--font-score);
    font-size: .72rem;
    font-weight: 950;
    text-align: left;
    text-transform: uppercase;
    letter-spacing: .04em;
    text-shadow: 0 1px 0 rgba(255,255,255,.65);
  }

  tbody tr {
    background:
      repeating-linear-gradient(0deg, rgba(255,255,255,.014) 0 1px, transparent 1px 4px),
      linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.015));
  }

  tbody tr:nth-child(even) { background-color: rgba(0,0,0,.12); }
  tbody tr:hover { background-color: rgba(199,25,47,.14); }

  td {
    padding: 10px 13px;
    border-bottom: 1px solid rgba(255,255,255,.085);
    color: rgba(255,255,255,.86);
    vertical-align: middle;
  }

  tbody tr:last-child td { border-bottom: 0; }
  .team-cell { min-width: 220px; color: white; font-weight: 850; }
  .date-cell { width: 130px; white-space: nowrap; color: rgba(255,255,255,.72); }
  .bet-cell { min-width: 240px; font-weight: 750; }
  .category-cell { min-width: 170px; color: rgba(255,255,255,.72); }

  .result-pill {
    display: inline-grid;
    place-items: center;
    min-width: 68px;
    min-height: 28px;
    padding: 3px 8px;
    border: 1px solid #070808;
    border-radius: 6px;
    font-family: var(--font-score);
    font-size: .68rem;
    font-weight: 950;
    text-transform: uppercase;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.22), inset 0 -2px 0 rgba(0,0,0,.35);
  }
select {
	color: var(--bug-white);
}

select option,
select optgroup {
	color: #111;
	background: #fff;
}
  .result-pill.win { background: linear-gradient(180deg, #2f9c61, #145734); color: white; }
  .result-pill.loss { background: linear-gradient(180deg, #d44350, #7f111d); color: white; }
  .result-pill.push { background: linear-gradient(180deg, #f0cf58, #a57a14); color: #111; }
  .result-pill.pending { background: linear-gradient(180deg, #5d7ba0, #293f5d); color: white; }
  .result-pill.neutral { background: linear-gradient(180deg, #6f7773, #303634); color: white; }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    margin-top: 14px;
  }
  .pagination span { color: rgba(255,255,255,.68); }
  .pagination strong { color: var(--bug-yellow, #ffd34d); }

  .empty-state,
  .signal-error {
    min-height: 170px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 7px;
    margin-top: 14px;
    padding: 22px;
    border: 1px dashed rgba(255,255,255,.18);
    border-radius: 13px;
    color: rgba(255,255,255,.65);
    text-align: center;
  }

  .empty-state strong,
  .signal-error strong { color: white; font-size: 1.05rem; }
  .signal-error strong { color: #ff7883; }

  @media (max-width: 1050px) {
    .parlay-hero { grid-template-columns: 1fr auto; }
    .hero-bug { grid-column: 1 / -1; justify-self: start; }
    .hero-copy { padding-left: 18px; }
    .filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .search-filter { grid-column: 1 / -1; }
  }

  @media (max-width: 760px) {
    .page-stack { gap: 14px; }
    .parlay-hero { grid-template-columns: 1fr; }
    .hero-copy { padding: 16px 16px 0; }
    .season-box { justify-self: stretch; margin: 0 14px 14px; max-width: none; }
    .stat-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .desk-card { padding: 14px; }
    .desk-head,
    .table-toolbar { align-items: stretch; flex-direction: column; }
    .feed-note { text-align: left; }
    .filter-grid { grid-template-columns: 1fr; }
    .search-filter { grid-column: auto; }
    .toolbar-actions { justify-content: space-between; }
  }

  @media (max-width: 480px) {
    .stat-strip { grid-template-columns: 1fr; }
    .toolbar-actions { align-items: stretch; flex-direction: column; }
  }
</style>
