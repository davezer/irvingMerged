<script>
  import { page } from '$app/stores';
  import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';

  export let data;

  const FALLBACK_SEASONS = [2026, 2025];
  let teamSelectValue = '';

  function formatTime(epoch) {
    if (!epoch) return 'Unknown time';
    return new Date(Number(epoch)).toLocaleString();
  }

  function normalize(value = '') {
    return String(value).toLowerCase().replace(/[_-]+/g, ' ').trim();
  }

  function txnKind(txn = {}) {
    const label = normalize(txn.typeLabel || txn.type || txn.transactionType || txn.status || '');

    if (label.includes('trade')) return 'trade';
    if (label.includes('waiver')) return 'waiver';
    if (label.includes('free')) return 'free-agent';
    if (label.includes('commish') || label.includes('commissioner')) return 'commish';

    return 'other';
  }

  function matchesType(txn, type) {
    if (!type || type === 'all') return true;
    return txnKind(txn) === type;
  }

  function countType(type) {
    return allTransactions.filter((txn) => matchesType(txn, type)).length;
  }

  function deriveTeamOptions(weeks = []) {
    const teams = new Map();

    for (const bucket of weeks || []) {
      for (const txn of bucket.items || []) {
        for (const team of txn.rosterCards || []) {
          const key = team.managerSlug || String(team.rosterId || team.teamName || '');
          if (!key || teams.has(key)) continue;
          teams.set(key, {
            rosterId: team.rosterId,
            teamName: team.teamName,
            managerName: team.managerName,
            teamPhoto: team.teamPhoto,
            initials: team.initials,
            managerSlug: team.managerSlug
          });
        }
      }
    }

    return [...teams.values()].sort((a, b) => a.teamName.localeCompare(b.teamName));
  }

  function buildHref({ season: nextSeason = season, weeks = selectedWeeksParam, team = filterTeamSlug, type = selectedType } = {}) {
    const params = new URLSearchParams();
    params.set('season', nextSeason);

    if (weeks) {
      params.set('weeks', Array.isArray(weeks) ? weeks.join(',') : String(weeks));
    }

    if (team) {
      params.set('team', team);
    }

    if (type && type !== 'all') {
      params.set('type', type);
    }

    return `?${params.toString()}`;
  }

  function seasonHref(option) {
    return buildHref({ season: Number(option), weeks: null });
  }

  function weekHref(week) {
    return buildHref({ weeks: week });
  }

  function allWeeksHref() {
    return buildHref({ weeks: availableWeeks.join(',') });
  }

  function teamFilterHref(team = null) {
    return buildHref({ team: team?.managerSlug || null });
  }

  function teamTransactionsHref(team) {
    return buildHref({ team: team?.managerSlug || null });
  }

  function clearTeamHref() {
    return buildHref({ team: null });
  }

  $: season = Number(data.season || new Date().getFullYear());
  $: availableWeeks = Array.isArray(data.availableWeeks) ? data.availableWeeks : [];
  $: selectedWeeks = Array.isArray(data.selectedWeeks) ? data.selectedWeeks : [];
  $: selectedWeeksParam = selectedWeeks.length ? selectedWeeks.join(',') : '';
  $: filterTeamSlug = data.filterTeam?.managerSlug || '';
  $: selectedType = normalize($page.url.searchParams.get('type') || 'all');
  $: teamSelectValue = filterTeamSlug;

  function teamDropdownChange(event) {
    const value = event.currentTarget.value;
    window.location.href = buildHref({ team: value || null });
  }

  $: availableSeasons = (Array.isArray(data.seasons) && data.seasons.length ? data.seasons : FALLBACK_SEASONS)
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => b - a);

  $: rawWeeks = Array.isArray(data.weeks) ? data.weeks : [];
  $: allTransactions = rawWeeks.flatMap((bucket) => bucket.items || []);
  $: teamOptions = Array.isArray(data.teamOptions) && data.teamOptions.length
    ? data.teamOptions
    : deriveTeamOptions(rawWeeks);

  $: filteredWeeks = rawWeeks
    .map((bucket) => ({
      ...bucket,
      items: (bucket.items || []).filter((txn) => matchesType(txn, selectedType))
    }))
    .filter((bucket) => bucket.items.length);

  $: filteredMoveCount = filteredWeeks.reduce((total, bucket) => total + bucket.items.length, 0);
  $: totalMoveCount = allTransactions.length;

  $: typeOptions = [
    { key: 'all', label: 'All', meta: 'Full feed', count: countType('all') },
    { key: 'waiver', label: 'Waivers', meta: 'Claims', count: countType('waiver') },
    { key: 'free-agent', label: 'Free agency', meta: 'FA adds', count: countType('free-agent') },
    { key: 'trade', label: 'Trades', meta: 'Deals', count: countType('trade') }
  ];

  $: activeTypeLabel = selectedType === 'all'
    ? 'All transaction types'
    : typeOptions.find((option) => option.key === selectedType)?.label || 'Filtered feed';
</script>

<div class="page-stack">
  <LeagueSubnav season={season} active="transactions" />

  <section class="page-head card">
    <div class="head-copy">
      <div class="eyebrow">Transactions</div>
      <h1>Wire room and movement log</h1>
      <p>Live Sleeper movement with Irving team identity, filtered by season, week, team, and transaction type.</p>
      <div class="source">{data.source}</div>
    </div>

    <aside class="season-box" aria-label="Season selector">
      <span>Season feed</span>
      <div class="season-pills">
        {#each availableSeasons as option}
          <a class:active={Number(option) === Number(season)} href={seasonHref(option)}>{option}</a>
        {/each}
      </div>
    </aside>

    <div class="filter-panel type-filter" aria-label="Transaction type filter">
      <div class="filter-label">Transaction type</div>
      <div class="type-pills">
        {#each typeOptions as option}
          <a
            class:selected={selectedType === option.key}
            class:zero={option.count === 0 && option.key !== 'all'}
            href={buildHref({ type: option.key })}
          >
            <strong>{option.label}</strong>
            <small>{option.count}</small>
          </a>
        {/each}
      </div>
    </div>

    <div class="filter-panel team-filter compact-team-filter" aria-label="Team filter">
      <div class="filter-row">
        <div>
          <div class="filter-label">Team feed</div>
          <p class="filter-hint">Choose one franchise or keep the full wire room open.</p>
        </div>

        {#if data.filterTeam}
          <a class="clear-filter" href={clearTeamHref()}>Clear team</a>
        {/if}
      </div>

      <div class="team-select-row">
        <label class="select-label" for="team-feed-select">Franchise</label>
        <div class="select-wrap">
          <select id="team-feed-select" bind:value={teamSelectValue} on:change={teamDropdownChange}>
            <option value="">All teams</option>
            {#each teamOptions as team (team.managerSlug || team.rosterId)}
              <option value={team.managerSlug}>{team.teamName}</option>
            {/each}
          </select>
        </div>

        {#if data.filterTeam}
          <div class="selected-team-pill" aria-label="Selected team">
            <span class="team-photo mini">
              {#if data.filterTeam.teamPhoto}
                <img src={data.filterTeam.teamPhoto} alt={data.filterTeam.teamName} />
              {:else}
                <span>{data.filterTeam.initials}</span>
              {/if}
            </span>
            <strong>{data.filterTeam.teamName}</strong>
          </div>
        {:else}
          <div class="selected-team-pill all-teams-pill" aria-label="Selected team">
            <span class="team-photo mini">IC</span>
            <strong>All teams</strong>
          </div>
        {/if}
      </div>
    </div>

    <div class="filter-panel week-filter" aria-label="Week filter">
      <div class="filter-label">Week feed</div>
      <div class="week-pills">
        {#each availableWeeks as week}
          <a class:selected={selectedWeeks.includes(week)} href={weekHref(week)}>W{week}</a>
        {/each}
        {#if availableWeeks.length}
          <a class:selected={selectedWeeks.length === availableWeeks.length} href={allWeeksHref()}>All</a>
        {/if}
      </div>
    </div>
  </section>

  {#if data.filterTeam}
    <section class="card filter-banner">
      <div class="team-pill big">
        <div class="team-photo">
          {#if data.filterTeam.teamPhoto}
            <img src={data.filterTeam.teamPhoto} alt={data.filterTeam.teamName} />
          {:else}
            <span>{data.filterTeam.initials}</span>
          {/if}
        </div>
        <div>
          <strong>{data.filterTeam.teamName}</strong>
          <small>{data.filterTeam.managerName}</small>
        </div>
      </div>

      <div class="link-row">
        <a href={`/league/teams/${data.filterTeam.managerSlug}?season=${season}`}>Open franchise</a>
        <a href={`/league/matchups?season=${season}&team=${data.filterTeam.managerSlug}`}>Recent games</a>
        <a href={clearTeamHref()}>Clear filter</a>
      </div>
    </section>
  {/if}

  {#if !data.hasData}
    <section class="card empty">
      <div class="eyebrow">No signal</div>
      <h2>No transaction data yet</h2>
      <p>We could not pull transaction data for this season/week/team selection.</p>
    </section>
  {:else if !filteredMoveCount}
    <section class="card empty">
      <div class="eyebrow">No matching moves</div>
      <h2>No transactions match this filter</h2>
      <p>{totalMoveCount} move{totalMoveCount === 1 ? '' : 's'} loaded, but none match the selected transaction type.</p>
    </section>
  {:else}
    <div class="feed-summary">
      <div>
        <div class="eyebrow">Live feed</div>
        <h2>{filteredMoveCount} move{filteredMoveCount === 1 ? '' : 's'}</h2>
      </div>
      <span>{data.filterTeam ? `${data.filterTeam.teamName} · ${activeTypeLabel}` : activeTypeLabel}</span>
    </div>

    {#each filteredWeeks as bucket (bucket.week)}
      <section class="week-stack">
        <div class="section-head">
          <div>
            <div class="eyebrow">Week {bucket.week}</div>
            <h2>{bucket.items.length} move{bucket.items.length === 1 ? '' : 's'}</h2>
          </div>
        </div>

        <div class="stack">
          {#each bucket.items as txn (txn.id)}
            <article class="card txn">
              <div class="txn-head">
                <div class="txn-title">
                  <div class={`type-pill type-${txnKind(txn)}`}>{txn.typeLabel}</div>
                  <h3>{txn.summaryLine}</h3>
                </div>
                <time class="timestamp" datetime={txn.createdAt ? new Date(Number(txn.createdAt)).toISOString() : undefined}>{formatTime(txn.createdAt)}</time>
              </div>

              <div class="meta-row">
                {#each txn.rosterCards as team (team.rosterId)}
                  <a class="team-pill" href={team.managerSlug ? `/league/teams/${team.managerSlug}?season=${season}` : `/league/transactions?season=${season}&rosterId=${team.rosterId}`}>
                    <div class="team-photo">
                      {#if team.teamPhoto}
                        <img src={team.teamPhoto} alt={team.teamName} />
                      {:else}
                        <span>{team.initials}</span>
                      {/if}
                    </div>
                    <span>{team.teamName}</span>
                  </a>
                {/each}
              </div>

              <div class="link-row compact">
                {#each txn.rosterCards as team (team.rosterId)}
                  <a href={team.managerSlug ? teamTransactionsHref(team) : `/league/transactions?season=${season}&rosterId=${team.rosterId}`}>Only {team.teamName}</a>
                {/each}
              </div>

              <div class="txn-grid">
                <div class="panel">
                  <div class="label">Adds</div>
                  {#if txn.addGroups.length}
                    {#each txn.addGroups as group (group.rosterId)}
                      <div class="club-group">
                        <div class="club-head">
                          <a class="team-link" href={group.managerSlug ? buildHref({ team: group.managerSlug }) : `/league/transactions?season=${season}&rosterId=${group.rosterId}`}>
                            <div class="team-photo small">
                              {#if group.teamPhoto}
                                <img src={group.teamPhoto} alt={group.teamName} />
                              {:else}
                                <span>{group.initials}</span>
                              {/if}
                            </div>
                            <strong>{group.teamName}</strong>
                          </a>
                        </div>
                        <div class="player-grid">
                          {#each group.players as player (player.id)}
                            <div class="player-chip">
                              <img src={player.photoUrl} alt={player.name} />
                              <div>
                                <strong>{player.name}</strong>
                                <small>{player.position || '—'} · {player.teamLabel || player.team || 'FA'}</small>
                              </div>
                            </div>
                          {/each}
                        </div>
                      </div>
                    {/each}
                  {:else}
                    <p>None</p>
                  {/if}
                </div>

                <div class="panel">
                  <div class="label">Drops</div>
                  {#if txn.dropGroups.length}
                    {#each txn.dropGroups as group (group.rosterId)}
                      <div class="club-group">
                        <div class="club-head">
                          <a class="team-link" href={group.managerSlug ? buildHref({ team: group.managerSlug }) : `/league/transactions?season=${season}&rosterId=${group.rosterId}`}>
                            <div class="team-photo small">
                              {#if group.teamPhoto}
                                <img src={group.teamPhoto} alt={group.teamName} />
                              {:else}
                                <span>{group.initials}</span>
                              {/if}
                            </div>
                            <strong>{group.teamName}</strong>
                          </a>
                        </div>
                        <div class="player-grid">
                          {#each group.players as player (player.id)}
                            <div class="player-chip">
                              <img src={player.photoUrl} alt={player.name} />
                              <div>
                                <strong>{player.name}</strong>
                                <small>{player.position || '—'} · {player.teamLabel || player.team || 'FA'}</small>
                              </div>
                            </div>
                          {/each}
                        </div>
                      </div>
                    {/each}
                  {:else}
                    <p>None</p>
                  {/if}
                </div>
              </div>

              {#if txn.draftPicks.length || txn.faabRows.length}
                <div class="txn-grid secondary">
                  <div class="panel compact-panel">
                    <div class="label">Draft assets</div>
                    {#if txn.draftPicks.length}
                      <div class="stack small-gap">
                        {#each txn.draftPicks as pick (pick.id)}
                          <div class="simple-row">
                            <strong>{pick.label}</strong>
                            <span>{pick.lineage}</span>
                          </div>
                        {/each}
                      </div>
                    {:else}
                      <p>None</p>
                    {/if}
                  </div>

                  <div class="panel compact-panel">
                    <div class="label">FAAB movement</div>
                    {#if txn.faabRows.length}
                      <div class="stack small-gap">
                        {#each txn.faabRows as row (row.rosterId)}
                          <div class="simple-row">
                            <strong>{row.teamName}</strong>
                            <span>${row.amount}</span>
                          </div>
                        {/each}
                      </div>
                    {:else}
                      <p>None</p>
                    {/if}
                  </div>
                </div>
              {/if}
            </article>
          {/each}
        </div>
      </section>
    {/each}
  {/if}
</div>

<style>
  .page-stack,
  .stack,
  .week-stack {
    display: grid;
    gap: 16px;
  }

  .page-stack {
    max-width: 1320px;
    margin: 0 auto;
    padding-bottom: 42px;
  }

  .card {
    border: 2px solid #070808;
    border-radius: 16px;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.11), rgba(255,255,255,0.025) 18%, rgba(0,0,0,0.14)),
      linear-gradient(180deg, var(--bug-gray), var(--bug-charcoal) 48%, var(--bug-black));
    box-shadow: var(--shadow-panel);
  }

  .page-head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 16px;
    padding: 20px;
    overflow: hidden;
  }

  .head-copy {
    min-width: 0;
  }

  .eyebrow,
  .label,
  .filter-label,
  .season-box > span {
    color: var(--bug-yellow);
    font-family: var(--font-score);
    font-size: 0.68rem;
    font-weight: 950;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    text-shadow: 0 2px 0 rgba(0,0,0,0.72);
  }

  h1,
  h2,
  h3,
  p {
    margin: 0;
  }

  h1 {
    margin-top: 12px;
    font-family: var(--font-display);
    font-size: clamp(2.3rem, 5vw, 4rem);
    line-height: 0.92;
    letter-spacing: -0.05em;
  }

  .page-head p {
    max-width: 68ch;
    margin-top: 14px;
    color: var(--muted);
    line-height: 1.45;
  }

  .source {
    margin-top: 10px;
    color: var(--muted);
  }

  .season-box {
    align-self: start;
    display: grid;
    gap: 10px;
    min-width: 198px;
    padding: 12px;
    border: 2px solid #111;
    border-radius: 5px;
    background: linear-gradient(180deg, #d9d9cf, #777d78 48%, #222826);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 0 rgba(0,0,0,0.55);
  }

  .season-box > span {
    color: #111;
    text-shadow: 0 1px 0 rgba(255,255,255,0.42);
  }

  .season-pills,
  .week-pills,
  .type-pills,
  .link-row,
  .meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .season-pills a,
  .week-pills a,
  .type-pills a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 32px;
    border: 2px solid #070808;
    border-radius: 6px;
    background: linear-gradient(180deg, #f4f2e6, #a8aaa4 48%, #454b49);
    color: #101111;
    font-family: var(--font-score);
    font-size: 0.72rem;
    font-weight: 950;
    line-height: 1;
    text-decoration: none;
    text-shadow: 0 1px 0 rgba(255,255,255,0.42);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -2px 0 rgba(0,0,0,0.34);
  }

  .season-pills a {
    min-width: 58px;
    padding: 0 11px;
  }

  .filter-panel {
    grid-column: 1 / -1;
    display: grid;
    gap: 9px;
    padding: 10px;
    border: 2px solid #070808;
    border-radius: 10px;
    background: linear-gradient(180deg, #303735, #111313);
  }

  .type-filter {
    margin-top: 4px;
  }

  .filter-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .clear-filter {
    color: var(--bug-yellow);
    font-size: 0.76rem;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
  }

  .clear-filter:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .type-pills a {
    gap: 8px;
    padding: 0 10px;
  }

  .type-pills a small {
    color: inherit;
    opacity: 0.72;
  }

  .compact-team-filter {
    gap: 12px;
  }

  .filter-hint {
    margin-top: 4px;
    color: var(--muted);
    font-size: 0.86rem;
  }

  .team-select-row {
    display: grid;
    grid-template-columns: auto minmax(240px, 420px) minmax(0, 1fr);
    gap: 10px;
    align-items: center;
  }

  .select-label {
    color: var(--muted);
    font-family: var(--font-score);
    font-size: 0.68rem;
    font-weight: 950;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .select-wrap {
    position: relative;
    min-width: 0;
  }

  .select-wrap::after {
    content: '▾';
    position: absolute;
    top: 50%;
    right: 12px;
    transform: translateY(-50%);
    color: #101111;
    font-family: var(--font-score);
    font-size: 0.72rem;
    pointer-events: none;
  }

  .select-wrap select {
    width: 100%;
    min-height: 38px;
    appearance: none;
    border: 2px solid #070808;
    border-radius: 6px;
    padding: 0 38px 0 12px;
    background: linear-gradient(180deg, #f4f2e6, #a8aaa4 48%, #454b49);
    color: #101111;
    font-family: var(--font-score);
    font-size: 0.76rem;
    font-weight: 950;
    line-height: 1;
    text-transform: uppercase;
    text-shadow: 0 1px 0 rgba(255,255,255,0.42);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -2px 0 rgba(0,0,0,0.34);
    cursor: pointer;
  }

  .select-wrap select:focus {
    outline: 2px solid var(--bug-yellow);
    outline-offset: 2px;
  }

  .selected-team-pill {
    justify-self: start;
    max-width: 100%;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 38px;
    padding: 4px 10px 4px 5px;
    border: 2px solid #070808;
    border-radius: 999px;
    background: linear-gradient(180deg, #303735, #111313);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.45);
  }

  .selected-team-pill strong {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.88rem;
  }

  .week-pills {
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .week-pills a {
    min-width: 46px;
    padding: 0 10px;
    white-space: nowrap;
  }

  .season-pills a:hover,
  .season-pills a.active,
  .week-pills a:hover,
  .week-pills a.selected,
  .type-pills a:hover,
  .type-pills a.selected {
    color: #fff;
    background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));
    text-shadow: 0 2px 0 #000;
  }

  .type-pills a.zero {
    opacity: 0.58;
  }

  .filter-banner {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    padding: 14px;
  }

  .feed-summary,
  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 12px;
  }

  .feed-summary h2,
  .section-head h2 {
    margin-top: 5px;
  }

  .feed-summary > span {
    color: var(--bug-yellow);
    font-family: var(--font-score);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .txn {
    display: grid;
    gap: 12px;
    padding: 14px;
  }

  .txn-head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 14px;
    align-items: start;
  }

  .txn-title {
    min-width: 0;
  }

  .type-pill {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 5px 9px;
    border: 1px solid #070808;
    border-radius: 999px;
    background: linear-gradient(180deg, #f4f2e6, #a8aaa4 48%, #454b49);
    color: #101111;
    font-family: var(--font-score);
    font-size: 0.63rem;
    font-weight: 950;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    text-shadow: 0 1px 0 rgba(255,255,255,0.42);
  }

  .txn h3 {
    margin-top: 8px;
    font-size: 1.06rem;
    line-height: 1.25;
  }

  .timestamp,
  .source,
  p,
  small {
    color: var(--muted);
  }

  .timestamp {
    white-space: nowrap;
    font-size: 0.86rem;
    text-align: right;
  }

  .team-pill,
  .team-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    color: inherit;
    text-decoration: none;
  }

  .team-pill {
    padding: 6px 9px;
    border: 1px solid #070808;
    border-radius: 999px;
    background: linear-gradient(180deg, #303735, #111313);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.45);
  }

  .team-pill.big {
    padding: 8px 12px;
  }

  .team-pill span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .team-photo {
    width: 30px;
    height: 30px;
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    overflow: hidden;
    border: 1px solid #070808;
    border-radius: 50%;
    background: var(--bug-cream);
    color: #111;
    font-family: var(--font-score);
    font-size: 0.68rem;
    font-weight: 950;
  }

  .team-photo.small,
  .team-photo.mini {
    width: 24px;
    height: 24px;
  }

  .team-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .link-row a,
  .team-link {
    color: var(--bug-yellow);
    font-weight: 900;
    text-decoration: none;
  }

  .link-row a:hover,
  .team-link:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .link-row.compact {
    margin-top: -2px;
    font-size: 0.84rem;
  }

  .txn-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .txn-grid.secondary {
    margin-top: -2px;
  }

  .panel {
    display: grid;
    gap: 10px;
    align-content: start;
    min-height: 0;
    padding: 12px;
    border: 2px solid #070808;
    border-radius: 12px;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)),
      linear-gradient(180deg, #303735, #111313);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.13), inset 0 -1px 0 rgba(0,0,0,0.5);
  }

  .compact-panel {
    padding: 10px;
  }

  .club-group,
  .player-grid {
    display: grid;
    gap: 8px;
  }

  .club-head {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .player-chip {
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 9px;
    align-items: center;
    min-width: 0;
    padding: 8px;
    border: 1px solid rgba(0,0,0,0.45);
    border-radius: 10px;
    background: rgba(255,255,255,0.045);
  }

  .player-chip img {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    object-fit: cover;
    background: rgba(255,255,255,0.08);
  }

  .player-chip div {
    min-width: 0;
  }

  .player-chip strong,
  .player-chip small {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .simple-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 10px;
    border-radius: 9px;
    background: rgba(255,255,255,0.045);
  }

  .simple-row span {
    color: var(--muted);
    text-align: right;
  }

  .small-gap {
    gap: 8px;
  }

  .empty {
    padding: 20px;
  }

  .empty h2 {
    margin-top: 8px;
  }

  @media (max-width: 1080px) {
    .team-select-row {
      grid-template-columns: 1fr;
      align-items: stretch;
    }

    .selected-team-pill {
      justify-self: start;
    }
  }

  @media (max-width: 960px) {
    .page-head,
    .txn-head,
    .txn-grid {
      grid-template-columns: 1fr;
    }

    .season-box {
      width: 100%;
      min-width: 0;
    }

    .timestamp {
      text-align: left;
      white-space: normal;
    }

    .filter-banner,
    .feed-summary,
    .section-head {
      display: grid;
    }
  }

  @media (max-width: 640px) {
    .page-stack {
      gap: 14px;
    }

    .page-head,
    .txn,
    .filter-banner,
    .empty {
      padding: 14px;
    }

    .type-pills a {
      flex: 1 1 132px;
    }

    .team-select-row {
      grid-template-columns: 1fr;
      align-items: stretch;
    }

    .selected-team-pill {
      justify-self: stretch;
    }
  }
</style>
