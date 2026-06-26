<script>
  import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';

  export let data;

  const PREVIEW_LIMIT = 5;
  const FALLBACK_SEASONS = [2026, 2025];

  const fmt = (value, digits = 2) => {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(digits) : Number(0).toFixed(digits);
  };

  const upper = (value) => String(value || '—').toUpperCase();

  function pct(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '—';
    return number.toFixed(3).replace(/^0/, '');
  }

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

    if (amount == null) return 'draft-money-neutral';
    if (amount < 100) return 'draft-money-low';
    if (amount > 200) return 'draft-money-high';

    return 'draft-money-mid';
  }

  function nflLabel(code) {
    const labels = {
      nyg: 'New York Giants',
      mia: 'Miami Dolphins',
      pit: 'Pittsburgh Steelers',
      ne: 'New England Patriots',
      gb: 'Green Bay Packers',
      cle: 'Cleveland Browns',
      tb: 'Tampa Bay Buccaneers',
      kc: 'Kansas City Chiefs'
    };

    return labels[String(code || '').toLowerCase()] || upper(code);
  }

  function personaIcon(persona) {
    return persona ? `/${persona}.png` : '/managers/question.jpg';
  }

  function serviceIcon(value) {
    return value ? `/${value}.png` : '/RookieWatch.png';
  }

  function serviceTitle(value) {
    if (!value) return 'Rookie Watch';

    const text = String(value).trim();
    return text.toLowerCase().includes('year') ? text : `${text} Years`;
  }

  function gameScore(row) {
    return `${fmt(row?.score)} – ${fmt(row?.oppScore)}`;
  }

  function moveCounterparties(move) {
    return move?.counterparties?.length ? move.counterparties.join(' • ') : 'Solo move';
  }

  function abbr(value) {
    const words = String(value || '')
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    if (!words.length) return 'IC';
    if (words.length === 1) return words[0].slice(0, 3).toUpperCase();

    return words
      .slice(0, 3)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  function seasonHref(option) {
    return `?season=${Number(option)}`;
  }

  $: season = Number(data.season || new Date().getFullYear());
  $: availableSeasons = (Array.isArray(data.seasons) && data.seasons.length
    ? data.seasons
    : FALLBACK_SEASONS
  )
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => b - a);

  $: manager = data.manager || {};
  $: franchise = data.franchise || {};
  $: career = data.career || {};
  $: draftMoney = data.draftMoney || {};
  $: allTime = data.allTime || {};
  $: rival = data.rival || null;
  $: sections = data.sections || {};
  $: lineupAnalytics = data.lineupAnalytics || {};
  $: tradeProfile = data.tradeProfile || {};
  $: moveProfile = data.moveProfile || {};

  $: teamName = franchise.teamName || manager.liveTeamName || 'Franchise';
  $: teamLogo = franchise.teamPhoto || manager.photo || '/managers/question.jpg';
  $: teamSlug = franchise.slug || manager.slug || data.slug || '';
  $: managerName = franchise.managerName || manager.name || 'Unknown manager';
  $: teamBio = franchise.bio || manager.bio || 'No franchise bio loaded yet.';
  $: teamPhilosophy = manager.philosophy || franchise.philosophy || 'Win first. Explain later.';
  $: teamAbbr = abbr(teamName);

  $: futureDraftLabel = moneyLabel(draftMoney.value);
  $: futureDraftClass = draftDollarClass(draftMoney.value);
  $: careerTitleYears = allTime.titleYears || [];
  $: careerTitleCount = allTime.totalTitles ?? career.titles ?? 0;
  $: legacyTitleYears = allTime.legacyTitleYears || career.historicalTitleYears || [];

  $: identityCards = [
    {
      label: 'Persona',
      title: manager.persona || 'Unclassified',
      meta: 'Manager archetype',
      image: personaIcon(manager.persona)
    },
    {
      label: 'Service',
      title: serviceTitle(manager.yearsOfService),
      meta: manager.fantasyStart ? `Since ${manager.fantasyStart}` : 'No start year',
      image: serviceIcon(manager.yearsOfService)
    },
    {
      label: 'Legacy',
      title: manager.championship?.league || 'No legacy titles',
      meta: legacyTitleYears.length ? legacyTitleYears.join(', ') : 'Pre-merge history',
      image: legacyTitleYears.length ? '/Irving.png' : null
    },
    {
      label: 'Rival',
      title: rival?.name || manager.rival?.name || 'TBD',
      meta: rival?.teamName || 'Circle the matchup',
      image: rival?.image || manager.rival?.image || '/managers/question.jpg',
      href: rival?.href
    }
  ];

  $: allTimeOfficial = allTime.official || {};
  $: allTimeH2h = allTime.h2h || {};
  $: allTimeCards = [
    {
      label: 'Official record',
      value: allTimeOfficial.recordLabel || '—',
      note: allTimeOfficial.recordLabel ? `${pct(allTimeOfficial.pct)} win pct` : 'Sleeper ledger'
    },
    {
      label: 'All-time PF',
      value: fmt(allTimeOfficial.pointsFor),
      note: `${fmt(allTimeOfficial.pointsAgainst)} PA`
    },
    {
      label: 'Point diff',
      value: fmt(allTimeOfficial.pointDiff),
      note: `${allTimeOfficial.seasons || 0} Sleeper season${Number(allTimeOfficial.seasons || 0) === 1 ? '' : 's'}`
    },
    {
      label: 'H2H record',
      value: allTimeH2h.recordLabel || '—',
      note: `${allTimeH2h.gamesPlayed || 0} weekly matchups`
    },
    {
      label: 'Career titles',
      value: String(careerTitleCount),
      note: careerTitleYears.length ? careerTitleYears.join(', ') : 'Legacy + Sleeper ledger'
    }
  ];

  $: allTimeMoments = [
    { label: 'Best week', game: allTimeH2h.bestScore },
    { label: 'Biggest win', game: allTimeH2h.biggestWin },
    { label: 'Worst week', game: allTimeH2h.worstScore },
    { label: 'Worst loss', game: allTimeH2h.worstLoss }
  ];

  $: topStats = [
    { label: 'Rank', value: manager.currentRank ? `#${manager.currentRank}` : '—', note: 'Live Sleeper' },
    { label: 'Record', value: manager.recordLabel || '—', note: `Season ${season}` },
    { label: 'PF', value: fmt(manager.pointsFor), note: `${fmt(manager.pointsAgainst)} PA` }
  ];

  $: recentMatchups = data.recentMatchups || [];
  $: recentMoves = data.recentMoves || [];
  $: visibleRecentMatchups = recentMatchups.slice(0, PREVIEW_LIMIT);
  $: extraRecentMatchups = recentMatchups.slice(PREVIEW_LIMIT);
  $: visibleRecentMoves = recentMoves.slice(0, PREVIEW_LIMIT);
  $: extraRecentMoves = recentMoves.slice(PREVIEW_LIMIT);
</script>

<div class="page-stack">
  <LeagueSubnav season={season} active="teams" />

  <section class="franchise-broadcast">
    <div class="broadcast-header">
      <span class="network-label">ICN FantasyCast</span>
      <strong>{teamName}</strong>

      <nav class="season-switcher" aria-label="Season selector">
        <span class="season-box-label">Season Feed</span>
        <div class="season-pills">
          {#each availableSeasons as option}
            <a class:active={Number(option) === Number(season)} href={seasonHref(option)}>
              {option}
            </a>
          {/each}
        </div>
      </nav>
    </div>

    <div class="main-bug">
      <div class="logo-bay">
        <img class="team-logo" src={teamLogo} alt={teamName} />
      </div>

      <div class="scorebug-body">
        <div class="score-lines">
          <div class="score-line home">
            <span>{teamAbbr}</span>
            <strong>{teamName}</strong>
            <em>{manager.currentRank ? `#${manager.currentRank}` : '—'}</em>
          </div>
          <div class="score-line away">
            <span>GM</span>
            <strong>{managerName}</strong>
            <em>{manager.recordLabel || '0-0'}</em>
          </div>
        </div>

        <div class="meta-strip">
          <span>Rank {manager.currentRank ? `#${manager.currentRank}` : '—'}</span>
          <span>Record {manager.recordLabel || '0-0'}</span>
          <span>PF {fmt(manager.pointsFor)}</span>
          <span>PA {fmt(manager.pointsAgainst)}</span>
          
        </div>

        <div class="story-box">
          <div>
            <div class="eyebrow">Franchise profile</div>
            <h1>{teamName}</h1>
            <p class="philosophy">{teamPhilosophy}</p>
          </div>
          <p>{teamBio}</p>
        </div>

        <dl class="mini-facts">
          <div class="future-dollars">
            <dt>Future Draft $</dt>
            <dd class={`draft-money-pill ${futureDraftClass}`}>{futureDraftLabel}</dd>
          </div>
          <div>
            <dt>Fantasy start</dt>
            <dd>{manager.fantasyStart || '—'}</dd>
          </div>
          <div>
            <dt>NFL tie</dt>
            <dd>{nflLabel(manager.favoriteTeam)}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{manager.location || '—'}</dd>
          </div>
        </dl>
      </div>
    </div>

    <!-- <section class="stat-grid" aria-label="Current season summary">
      {#each topStats as stat}
        <article class="stat-card">
          <div class="label">{stat.label}</div>
          <strong>{stat.value}</strong>
          <small>{stat.note}</small>
        </article>
      {/each}
    </section> -->

    <div class="quick-links">
      {#if sections.moves}<a href={sections.moves}>Move log</a>{/if}
      {#if sections.games}<a href={sections.games}>Games</a>{/if}
      {#if sections.drafts}<a href={sections.drafts}>Draft archive</a>{/if}
      {#if sections.standings}<a href={sections.standings}>Standings</a>{/if}
      {#if data.managerNav?.all}<a href={data.managerNav.all}>All franchises</a>{/if}
    </div>
  </section>

  <section class="identity-shelf" aria-label="Franchise identity">
    {#each identityCards as identityCard}
      {#if identityCard.href}
        <a class="identity-card" href={identityCard.href}>
          <span>{identityCard.label}</span>
          {#if identityCard.image}<img src={identityCard.image} alt={identityCard.title} />{/if}
          <strong>{identityCard.title}</strong>
          <small>{identityCard.meta}</small>
        </a>
      {:else}
        <article class="identity-card">
          <span>{identityCard.label}</span>
          {#if identityCard.image}<img src={identityCard.image} alt={identityCard.title} />{/if}
          <strong>{identityCard.title}</strong>
          <small>{identityCard.meta}</small>
        </article>
      {/if}
    {/each}
  </section>

  <section class="card all-time-card">
    <div class="card-head">
      <div>
        <div class="eyebrow">Franchise ledger</div>
        <h3>All-time records</h3>
      </div>
      <!-- <small>{allTime.source || 'Sleeper career rollup'}</small> -->
    </div>

    <div class="all-time-grid">
      {#each allTimeCards as stat}
        <article class="mini-stat">
          <span>{stat.label}</span>
          <strong>{stat.value}</strong>
          <small>{stat.note}</small>
        </article>
      {/each}
    </div>

    <div class="grid two-up all-time-lower">
      <article class="ledger-panel">
        <h4>Season ledger</h4>
        <div class="history-table compact">
          <div class="history-head">
            <span>Season</span>
            <span>Finish</span>
            <span>Record</span>
            <span>PF</span>
          </div>
          {#each allTime.seasons || [] as seasonRow}
            <div class="history-row">
              <span>{seasonRow.season}</span>
              <span>#{seasonRow.rank}</span>
              <span>{seasonRow.recordLabel}</span>
              <span>{fmt(seasonRow.points)}</span>
            </div>
          {/each}
          {#if !(allTime.seasons || []).length}<div class="empty">No linked Sleeper seasons found yet.</div>{/if}
        </div>
      </article>

      <article class="ledger-panel">
        <h4>All-time moments</h4>
        <div class="stack">
          {#each allTimeMoments as item}
            <div class="moment-row">
              <span>{item.label}</span>
              {#if item.game}
                <strong>{fmt(item.game.score)} vs {item.game.opponentTeam}</strong>
                <small>
                  {item.game.season} Week {item.game.week} · {item.game.result}{item.game.result !== 'Tie' && item.game.result !== 'Bye' ? ` by ${Math.abs(item.game.margin).toFixed(2)}` : ''}
                </small>
              {:else}
                <strong>—</strong>
                <small>No matchup data yet</small>
              {/if}
            </div>
          {/each}
        </div>
      </article>
    </div>
  </section>

  <section class="grid two-up">
    <article class="card">
      <div class="card-head">
        <div>
          <div class="eyebrow">Command center</div>
          <h3>Lineup audit</h3>
        </div>
        <strong>{fmt(lineupAnalytics.averageLineupIQ, 1)}%</strong>
      </div>
      <dl class="facts">
        <div><dt>Average lineup IQ</dt><dd>{fmt(lineupAnalytics.averageLineupIQ, 1)}%</dd></div>
        <div><dt>Average hit rate</dt><dd>{fmt(lineupAnalytics.averageHitRate, 1)}%</dd></div>
        <div><dt>Bench points lost</dt><dd>{fmt(lineupAnalytics.totalBenchPoints)}</dd></div>
        <div><dt>Worst efficiency week</dt><dd>{lineupAnalytics.worstWeek ? `Week ${lineupAnalytics.worstWeek.week}` : '—'}</dd></div>
      </dl>
    </article>

    <article class="card">
      <div class="card-head">
        <div>
          <div class="eyebrow">Market profile</div>
          <h3>Trades & waivers</h3>
        </div>
        <strong>{moveProfile.totalMoves || 0}</strong>
      </div>
      <dl class="facts">
        <div><dt>Trade style</dt><dd>{tradeProfile.marketStyle || 'Quiet market'}</dd></div>
        <div><dt>Total trades</dt><dd>{tradeProfile.tradeCount || 0}</dd></div>
        <div><dt>Favorite partner</dt><dd>{tradeProfile.favoritePartner ? `${tradeProfile.favoritePartner} (${tradeProfile.favoritePartnerCount})` : '—'}</dd></div>
        <div><dt>Moves sampled</dt><dd>{moveProfile.totalMoves || 0} total · {moveProfile.waivers || 0} waivers · {moveProfile.freeAgents || 0} FA</dd></div>
      </dl>
    </article>
  </section>

  <section class="grid two-up">
    <article class="card">
      <div class="card-title-row">
        <h3>Recent games</h3>
        {#if recentMatchups.length}<small>{recentMatchups.length} sampled</small>{/if}
      </div>
      <div class="stack">
        {#each visibleRecentMatchups as row}
          <a class="line-item" href={`/league/teams/${teamSlug}/weeks/${row.week}?season=${season}`}>
            <strong>Week {row.week} · {row.result}</strong>
            <small>{row.opponentTeam}</small>
            <span>{gameScore(row)}</span>
          </a>
        {/each}

        {#if extraRecentMatchups.length}
          <details class="more-list">
            <summary>Show {extraRecentMatchups.length} more game{extraRecentMatchups.length === 1 ? '' : 's'}</summary>
            <div class="overflow-stack">
              {#each extraRecentMatchups as row}
                <a class="line-item" href={`/league/teams/${teamSlug}/weeks/${row.week}?season=${season}`}>
                  <strong>Week {row.week} · {row.result}</strong>
                  <small>{row.opponentTeam}</small>
                  <span>{gameScore(row)}</span>
                </a>
              {/each}
            </div>
          </details>
        {/if}

        {#if !recentMatchups.length}<div class="empty">No recent matchup data available.</div>{/if}
      </div>
    </article>

    <article class="card">
      <div class="card-title-row">
        <h3>Recent moves</h3>
        {#if recentMoves.length}<small>{recentMoves.length} sampled</small>{/if}
      </div>
      <div class="stack">
        {#each visibleRecentMoves as move}
          <a class="line-item" href={sections.moves || '#'}>
            <strong>Week {move.week} · {move.type}</strong>
            <small>{moveCounterparties(move)}</small>
            <span>{move.addCount || 0} add / {move.dropCount || 0} drop</span>
          </a>
        {/each}

        {#if extraRecentMoves.length}
          <details class="more-list">
            <summary>Show {extraRecentMoves.length} more move{extraRecentMoves.length === 1 ? '' : 's'}</summary>
            <div class="overflow-stack">
              {#each extraRecentMoves as move}
                <a class="line-item" href={sections.moves || '#'}>
                  <strong>Week {move.week} · {move.type}</strong>
                  <small>{moveCounterparties(move)}</small>
                  <span>{move.addCount || 0} add / {move.dropCount || 0} drop</span>
                </a>
              {/each}
            </div>
          </details>
        {/if}

        {#if !recentMoves.length}<div class="empty">No recent move data available.</div>{/if}
      </div>
    </article>
  </section>
</div>

<style>
  .page-stack {
    display: grid;
    gap: 20px;
    max-width: 1180px;
    margin: 0 auto;
    padding-bottom: 44px;
  }

  .franchise-broadcast {
    overflow: hidden;
    border: 2px solid #070808;
    border-radius: 16px;
    background: linear-gradient(180deg, #5f6763, #252b2a 48%, #101313);
    box-shadow: var(--shadow-bug);
  }

  .broadcast-header {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: stretch;
    border-bottom: 2px solid #070808;
    background: linear-gradient(180deg, #171a19, #070808);
    font-family: var(--font-score);
    text-transform: uppercase;
  }

  .network-label {
    display: inline-flex;
    align-items: center;
    padding: 9px 12px;
    background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));
    color: white;
    white-space: nowrap;
  }

  .broadcast-header > strong {
    min-width: 0;
    display: flex;
    align-items: center;
    padding: 9px 12px;
    overflow: hidden;
    color: var(--bug-yellow);
    letter-spacing: 0.1em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .season-switcher {
    align-self: stretch;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-left: 2px solid #070808;
    background: linear-gradient(180deg, #d9d9cf, #777d78 48%, #222826);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.45),
      inset 0 -2px 0 rgba(0,0,0,0.55);
  }

  .season-box-label {
    color: #111;
    font-family: var(--font-score);
    font-size: 0.64rem;
    font-weight: 950;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    text-shadow: 0 1px 0 rgba(255,255,255,0.42);
    white-space: nowrap;
  }

  .season-pills {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;
  }

  .season-pills a {
    min-width: 54px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 7px 10px;
    border: 2px solid #070808;
    border-radius: 5px;
    background: linear-gradient(180deg, #f4f2e6, #a8aaa4 48%, #454b49);
    color: #101111;
    font-family: var(--font-score);
    font-size: 0.74rem;
    font-weight: 950;
    line-height: 1;
    text-decoration: none;
    text-shadow: 0 1px 0 rgba(255,255,255,0.42);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.65),
      inset 0 -2px 0 rgba(0,0,0,0.34);
  }

  .season-pills a:hover,
  .season-pills a.active {
    color: #fff;
    background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));
    text-shadow: 0 2px 0 #000;
  }

  .main-bug {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 22px;
    padding: 22px;
    background:
      radial-gradient(circle at 14% 12%, rgba(247,201,72,0.13), transparent 22rem),
      linear-gradient(90deg, rgba(0,0,0,0.16), transparent 38%);
  }

  .logo-bay {
    display: grid;
    place-items: center;
  }

  .team-logo {
    width: 220px;
    height: 220px;
    object-fit: cover;
    border: 3px solid #070808;
    border-radius: 9px;
    background: var(--bug-silver);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.45),
      0 16px 40px rgba(0,0,0,0.45);
  }

  .scorebug-body,
  .story-box,
  .mini-facts,
  .stack,
  .facts {
    display: grid;
    gap: 12px;
  }

  .score-lines {
    overflow: hidden;
    border: 2px solid #070808;
    border-radius: 8px;
    box-shadow: var(--shadow-bug);
  }

  .score-line {
    min-height: 55px;
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr) 96px;
    align-items: stretch;
    border-bottom: 2px solid #070808;
    background: #0b0d0d;
    font-family: var(--font-score);
  }

  .score-line:last-child {
    border-bottom: 0;
  }

  .score-line span {
    display: grid;
    place-items: center;
    background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));
    color: white;
  }

  .score-line.away span {
    background: linear-gradient(180deg, var(--bug-blue), #0b315e);
  }

  .score-line strong {
    min-width: 0;
    display: flex;
    align-items: center;
    overflow: hidden;
    padding: 0 12px;
    color: white;
    font-size: clamp(1rem, 2vw, 1.4rem);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .score-line em {
    display: grid;
    place-items: center;
    background: linear-gradient(180deg, #f5f4ea, #b9bcb5 52%, #6d7470);
    color: #111;
    font-size: 1.35rem;
    font-style: normal;
  }

  .meta-strip {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    overflow: hidden;
    border: 2px solid #070808;
    border-radius: 7px;
    background: linear-gradient(180deg, #f5f4ea, #c9cac1 50%, #818782);
    color: #111;
    font-family: var(--font-score);
    font-size: 0.72rem;
    text-transform: uppercase;
  }

  .meta-strip span {
    overflow: hidden;
    padding: 8px 10px;
    border-right: 1px solid rgba(0,0,0,0.34);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .meta-strip span:last-child {
    border-right: 0;
  }

  .story-box h1 {
    margin: 3px 0 0;
    font-size: clamp(2.4rem, 5vw, 4.8rem);
    line-height: 0.92;
  }

  .story-box p {
    margin: 0;
    color: rgba(247,245,235,0.82);
    line-height: 1.48;
    
  }

  .philosophy {
    color: white !important;
    font-weight: 900;
    padding-top: 13px;
  }

  .mini-facts,
  .facts {
    gap: 0;
  }

  .mini-facts div,
  .facts div {
    display: grid;
    grid-template-columns: 170px minmax(0, 1fr);
    gap: 12px;
    padding: 9px 0;
    border-bottom: 1px solid rgba(247,245,235,0.15);
  }

  .mini-facts dt,
  .facts dt {
    color: var(--muted);
  }

  .mini-facts dd,
  .facts dd {
    margin: 0;
    color: white;
    font-weight: 850;
  }

  .future-dollars .draft-money-pill {
    width: fit-content;
    min-width: 76px;
    padding: 4px 10px;
    border: 2px solid #050606;
    border-radius: 5px;
    background: linear-gradient(180deg, #fffef2 0%, #daded5 48%, #8c948e 100%);
    color: #080909;
    font-family: var(--font-score);
    font-size: 0.86rem;
    font-weight: 950;
    line-height: 1;
    text-align: center;
    text-shadow: none;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.85),
      inset 0 -2px 0 rgba(0,0,0,0.32),
      0 2px 0 rgba(0,0,0,0.55);
  }

  .future-dollars .draft-money-low {
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.85),
      inset 0 -2px 0 rgba(0,0,0,0.32),
      0 2px 0 rgba(0,0,0,0.55),
      0 0 0 1px rgba(200,16,46,0.55),
      0 0 12px rgba(200,16,46,0.75);
  }

  .future-dollars .draft-money-mid {
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.85),
      inset 0 -2px 0 rgba(0,0,0,0.32),
      0 2px 0 rgba(0,0,0,0.55),
      0 0 0 1px rgba(247,201,72,0.65),
      0 0 12px rgba(247,201,72,0.75);
  }

  .future-dollars .draft-money-high {
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.85),
      inset 0 -2px 0 rgba(0,0,0,0.32),
      0 2px 0 rgba(0,0,0,0.55),
      0 0 0 1px rgba(47,157,89,0.65),
      0 0 12px rgba(47,157,89,0.8);
  }

  .future-dollars .draft-money-neutral {
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.85),
      inset 0 -2px 0 rgba(0,0,0,0.32),
      0 2px 0 rgba(0,0,0,0.55),
      0 0 8px rgba(180,185,178,0.38);
  }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    padding: 0 22px 18px;
  }

  .stat-card,
  .identity-card,
  .card {
    border-radius: 12px;
    padding: 16px;
  }

  .stat-card strong,
  .card-head strong {
    display: block;
    margin: 7px 0 3px;
    font-family: var(--font-score);
    font-size: 1.75rem;
    line-height: 1;
  }

  .quick-links {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    padding: 0 22px 22px;
  }

  .quick-links a {
    border: 1px solid #070808;
    border-radius: 5px;
    padding: 8px 10px;
    background: linear-gradient(180deg, #f5f4ea, #b9bcb5 52%, #6d7470);
    color: #111 !important;
    font-family: var(--font-score);
    font-size: 0.72rem;
    text-decoration: none;
    text-transform: uppercase;
  }

  .identity-shelf,
  .grid.two-up {
    display: grid;
    gap: 18px;
  }

  .identity-shelf {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .identity-card {
    min-height: 168px;
    display: grid;
    justify-items: center;
    gap: 9px;
    color: inherit;
    text-align: center;
    text-decoration: none;
  }

  .identity-card img {
    width: 78px;
    height: 78px;
    object-fit: contain;
    border-radius: 50%;
    filter: drop-shadow(0 12px 18px rgba(0,0,0,0.42));
  }

  .identity-card strong {
    font-size: 1rem;
  }

  .identity-card small {
    max-width: 22ch;
  }

  .card-head,
  .card-title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 14px;
  }

  .card-head h3,
  .card-title-row h3 {
    margin: 0;
  }

  .card-head > small {
    max-width: 52ch;
    text-align: right;
  }

  .all-time-card,
  .history-table,
  .stack {
    display: grid;
    gap: 10px;
  }

  .all-time-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
  }

  .mini-stat {
    border-radius: 9px;
    padding: 14px;
  }

  .mini-stat strong {
    display: block;
    margin: 8px 0 4px;
    font-family: var(--font-score);
    font-size: 1.35rem;
  }

  .all-time-lower {
    margin-top: 8px;
  }

  .grid.two-up {
    grid-template-columns: 1fr 1fr;
  }

  .ledger-panel {
    border: 1px solid #070808;
    border-radius: 10px;
    padding: 14px;
    background: linear-gradient(180deg, #303735, #111313);
  }

  .ledger-panel h4 {
    margin: 0 0 12px;
  }

  .history-head,
  .history-row {
    display: grid;
    grid-template-columns: 90px 110px 1fr auto;
    align-items: center;
    gap: 12px;
    border-radius: 7px;
    padding: 10px 12px;
  }

  .moment-row,
  .line-item,
  .empty {
    border-radius: 8px;
    padding: 12px;
  }

  .moment-row {
    display: grid;
    gap: 4px;
  }

  .line-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 4px 14px;
    color: inherit;
    text-decoration: none;
  }

  .line-item small {
    grid-column: 1;
  }

  .line-item span {
    grid-column: 2;
    grid-row: 1 / 3;
    align-self: center;
    white-space: nowrap;
  }

  .more-list summary {
    cursor: pointer;
    list-style: none;
    border: 1px solid #070808;
    border-radius: 7px;
    padding: 10px 12px;
    background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));
    color: white;
    font-family: var(--font-score);
    text-transform: uppercase;
  }

  .more-list summary::-webkit-details-marker {
    display: none;
  }

  .overflow-stack {
    display: grid;
    gap: 10px;
    max-height: 360px;
    overflow-y: auto;
    margin-top: 10px;
    padding-right: 6px;
  }

  @media (max-width: 1080px) {
    .identity-shelf {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .all-time-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 860px) {
    .main-bug,
    .grid.two-up,
    .mini-facts div,
    .facts div,
    .history-head,
    .history-row {
      grid-template-columns: 1fr;
    }

    .logo-bay {
      justify-items: start;
    }

    .team-logo {
      width: min(220px, 100%);
      height: auto;
      aspect-ratio: 1;
    }

    .meta-strip {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .stat-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .card-head > small {
      text-align: left;
    }

    .line-item {
      grid-template-columns: 1fr;
    }

    .line-item span {
      grid-column: auto;
      grid-row: auto;
    }
  }

  @media (max-width: 620px) {
    .broadcast-header {
      grid-template-columns: 1fr;
    }

    .season-switcher {
      border-top: 2px solid #070808;
      border-left: 0;
      justify-content: space-between;
    }

    .main-bug,
    .franchise-broadcast .stat-grid,
    .quick-links {
      padding: 14px;
    }

    .stat-grid,
    .all-time-grid,
    .identity-shelf {
      grid-template-columns: 1fr;
    }

    .score-line {
      grid-template-columns: 48px minmax(0, 1fr) 72px;
    }

    .story-box h1 {
      font-size: clamp(2.2rem, 14vw, 3.4rem);
    }
  }
</style>
