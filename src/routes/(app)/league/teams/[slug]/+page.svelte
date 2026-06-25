<script>
  import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';

  export let data;

  const PREVIEW_LIMIT = 5;

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

  $: futureDraftLabel = moneyLabel(draftMoney.value);
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
      label: 'All-time official record',
      value: allTimeOfficial.recordLabel || '—',
      note: allTimeOfficial.recordLabel ? `${pct(allTimeOfficial.pct)} win pct` : 'Sleeper ledger'
    },
    {
      label: 'All-time PF',
      value: fmt(allTimeOfficial.pointsFor),
      note: `${fmt(allTimeOfficial.pointsAgainst)} PA`
    },
    {
      label: 'All-time point diff',
      value: fmt(allTimeOfficial.pointDiff),
      note: `${allTimeOfficial.seasons || 0} Sleeper season${Number(allTimeOfficial.seasons || 0) === 1 ? '' : 's'}`
    },
    {
      label: 'H2H matchup record',
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
    { label: 'Current rank', value: manager.currentRank ? `#${manager.currentRank}` : '—', note: 'Live Sleeper' },
    { label: 'Record', value: manager.recordLabel || '—', note: `Season ${data.season}` },
    { label: 'Points for', value: fmt(manager.pointsFor), note: `${fmt(manager.pointsAgainst)} PA` }
  ];

  $: recentMatchups = data.recentMatchups || [];
  $: recentMoves = data.recentMoves || [];
  $: visibleRecentMatchups = recentMatchups.slice(0, PREVIEW_LIMIT);
  $: extraRecentMatchups = recentMatchups.slice(PREVIEW_LIMIT);
  $: visibleRecentMoves = recentMoves.slice(0, PREVIEW_LIMIT);
  $: extraRecentMoves = recentMoves.slice(PREVIEW_LIMIT);
</script>

<div class="page-stack">
  <LeagueSubnav season={data.season} active="teams" />

  <section class="hero-card">
    <div class="logo-wrap">
      <img class="team-logo" src={teamLogo} alt={teamName} />
    </div>

    <div class="hero-copy">
      <div class="hero-kicker">
        <div class="eyebrow">Franchise profile</div>
        <span>Season {data.season}</span>
      </div>

      <div class="title-block">
        <h1>{teamName}</h1>
        <p class="philosophy">{teamPhilosophy}</p>
      </div>

      <div class="manager-block">
        <h2>{managerName}</h2>
        <p>{teamBio}</p>
      </div>

      <dl class="mini-facts">
        <div class="future-dollars">
          <dt>Future Draft Dollars</dt>
          <dd class={draftDollarClass(draftMoney.value)}>{futureDraftLabel}</dd>
        </div>
        <div><dt>Fantasy start</dt><dd>{manager.fantasyStart || '—'}</dd></div>
        <div><dt>Preferred NFL team</dt><dd>{nflLabel(manager.favoriteTeam)}</dd></div>
        <div><dt>Location</dt><dd>{manager.location || '—'}</dd></div>
      </dl>

      <section class="stat-grid" aria-label="Current season summary">
        {#each topStats as stat}
          <article class="stat-card">
            <div class="label">{stat.label}</div>
            <strong>{stat.value}</strong>
            <small>{stat.note}</small>
          </article>
        {/each}
      </section>

      <div class="quick-links">
        {#if sections.moves}<a href={sections.moves}>Move log</a>{/if}
        {#if sections.games}<a href={sections.games}>Games</a>{/if}
        {#if sections.drafts}<a href={sections.drafts}>Draft archive</a>{/if}
        {#if sections.standings}<a href={sections.standings}>Standings</a>{/if}
        {#if data.managerNav?.all}<a href={data.managerNav.all}>All franchises</a>{/if}
      </div>
    </div>
  </section>

  <section class="identity-shelf" aria-label="Franchise identity">
    {#each identityCards as card}
      {#if card.href}
        <a class="identity-card" href={card.href}>
          <span>{card.label}</span>
          {#if card.image}<img src={card.image} alt={card.title} />{/if}
          <strong>{card.title}</strong>
          <small>{card.meta}</small>
        </a>
      {:else}
        <article class="identity-card">
          <span>{card.label}</span>
          {#if card.image}<img src={card.image} alt={card.title} />{/if}
          <strong>{card.title}</strong>
          <small>{card.meta}</small>
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
      <small>{allTime.source || 'Sleeper career rollup'}</small>
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
          <div class="history-head"><span>Season</span><span>Finish</span><span>Record</span><span>PF</span></div>
          {#each allTime.seasons || [] as season}
            <div class="history-row">
              <span>{season.season}</span>
              <span>#{season.rank}</span>
              <span>{season.recordLabel}</span>
              <span>{fmt(season.points)}</span>
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
                <small>{item.game.season} Week {item.game.week} · {item.game.result}{item.game.result !== 'Tie' && item.game.result !== 'Bye' ? ` by ${Math.abs(item.game.margin).toFixed(2)}` : ''}</small>
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
          <a class="line-item" href={`/league/teams/${teamSlug}/weeks/${row.week}?season=${data.season}`}>
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
                <a class="line-item" href={`/league/teams/${teamSlug}/weeks/${row.week}?season=${data.season}`}>
                  <strong>Week {row.week} · {row.result}</strong>
                  <small>{row.opponentTeam}</small>
                  <span>{gameScore(row)}</span>
                </a>
              {/each}
            </div>
          </details>
        {/if}

        {#if !recentMatchups.length}
          <div class="empty">No recent matchup data available.</div>
        {/if}
      </div>
    </article>

    <article class="card">
      <div class="card-title-row">
        <h3>Recent moves</h3>
        {#if recentMoves.length}<small>{recentMoves.length} sampled</small>{/if}
      </div>

      <div class="stack">
        {#each visibleRecentMoves as move}
          <a class="line-item" href={sections.moves}>
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
                <a class="line-item" href={sections.moves}>
                  <strong>Week {move.week} · {move.type}</strong>
                  <small>{moveCounterparties(move)}</small>
                  <span>{move.addCount || 0} add / {move.dropCount || 0} drop</span>
                </a>
              {/each}
            </div>
          </details>
        {/if}

        {#if !recentMoves.length}
          <div class="empty">No recent move data available.</div>
        {/if}
      </div>
    </article>
  </section>
</div>

<style>
  :global(body) {
    background:
      radial-gradient(circle at top right, rgba(0, 179, 255, 0.08), transparent 34rem),
      radial-gradient(circle at top left, rgba(214, 177, 94, 0.06), transparent 30rem),
      #050607;
  }

  .page-stack {
    --gold: #f1cb70;
    --gold-soft: rgba(241, 203, 112, 0.14);
    --blue-soft: rgba(0, 179, 255, 0.1);
    --panel: rgba(255, 255, 255, 0.045);
    --panel-strong: rgba(255, 255, 255, 0.072);
    --line: rgba(255, 255, 255, 0.09);
    --muted: rgba(255, 255, 255, 0.65);
    --muted-strong: rgba(255, 255, 255, 0.78);

    display: grid;
    gap: 20px;
    max-width: 1180px;
    margin: 0 auto;
    padding: 4px 0 44px;
  }

  .hero-card,
  .card,
  .identity-card,
  .stat-card {
    position: relative;
    border: 1px solid var(--line);
    background:
      linear-gradient(145deg, rgba(255, 255, 255, 0.064), rgba(255, 255, 255, 0.018)),
      radial-gradient(circle at top right, rgba(0, 179, 255, 0.045), transparent 22rem);
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.32);
    border-radius: 24px;
  }

  .hero-card {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 30px;
    align-items: center;
    overflow: hidden;
    padding: 22px;
  }

  .hero-card::before {
    content: '';
    position: absolute;
    inset: -45%;
    background:
      radial-gradient(circle at 10% 20%, rgba(241, 203, 112, 0.17), transparent 26rem),
      radial-gradient(circle at 80% 4%, rgba(0, 179, 255, 0.12), transparent 22rem);
    pointer-events: none;
  }

  .hero-card::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(0, 0, 0, 0.18), transparent 38%);
    pointer-events: none;
  }

  .logo-wrap,
  .hero-copy {
    position: relative;
    z-index: 1;
  }

  .logo-wrap {
    display: grid;
    place-items: center;
  }

  .team-logo {
    width: 220px;
    height: 220px;
    object-fit: cover;
    border-radius: 22px;
    background: #f5efe4;
    box-shadow:
      0 18px 50px rgba(0, 0, 0, 0.35),
      inset 0 0 0 1px rgba(0, 0, 0, 0.24);
  }

  .hero-copy {
    display: grid;
    gap: 14px;
    min-width: 0;
  }

  .hero-kicker,
  .card-head,
  .card-title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 14px;
  }

  .hero-kicker span,
  .card-title-row small {
    color: var(--muted);
    font-size: 0.82rem;
  }

  .eyebrow,
  .label,
  .identity-card span,
  .mini-stat span,
  .moment-row span {
    color: var(--gold);
    font-size: 0.68rem;
    font-weight: 900;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }

  .title-block {
    display: grid;
    gap: 8px;
  }

  h1,
  h2,
  h3,
  h4,
  p {
    margin: 0;
  }

  h1 {
    font-size: clamp(2.4rem, 5vw, 4.35rem);
    line-height: 0.95;
    letter-spacing: -0.06em;
    text-wrap: balance;
  }

  h2 {
    color: rgba(255, 255, 255, 0.9);
    font-size: 1.4rem;
  }

  h3 {
    font-size: 1.22rem;
  }

  .philosophy {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.86rem;
    font-weight: 900;
  }

  .manager-block {
    display: grid;
    gap: 8px;
  }

  .manager-block p,
  .facts dt,
  .mini-facts dt,
  small {
    color: var(--muted);
  }

  .manager-block p {
    max-width: 88ch;
    line-height: 1.45;
  }

  .mini-facts,
  .facts {
    display: grid;
    gap: 0;
  }

  .mini-facts {
    margin-top: 4px;
  }

  .mini-facts div,
  .facts div {
    display: grid;
    grid-template-columns: 180px minmax(0, 1fr);
    gap: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding: 9px 0;
  }

  .mini-facts div:first-child,
  .facts div:first-child {
    padding-top: 0;
  }

  .mini-facts dd,
  .facts dd {
    margin: 0;
    color: rgba(255, 255, 255, 0.92);
    font-weight: 700;
  }

  .future-dollars dd {
    font-size: 1.08rem;
    font-weight: 950;
  }

  .draft-money-low { color: #ff4b4b; }
  .draft-money-mid { color: #ffd84d; }
  .draft-money-high { color: #35d06f; }
  .draft-money-neutral { color: var(--muted); }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-top: 8px;
  }

  .stat-card {
    padding: 17px 18px;
    border-radius: 20px;
  }

  .stat-card strong,
  .card-head strong {
    display: block;
    color: #fff;
    font-size: 1.65rem;
    line-height: 1;
    margin: 8px 0 4px;
    text-shadow: 0 2px 0 rgba(0, 0, 0, 0.45);
  }

  .stat-card small,
  .mini-stat small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .quick-links {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px 14px;
    margin-top: 2px;
  }

  .quick-links a {
    color: var(--gold);
    text-decoration: none;
  }

  .quick-links a:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
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
    display: grid;
    gap: 9px;
    justify-items: center;
    min-height: 174px;
    padding: 20px 18px;
    color: inherit;
    text-align: center;
    text-decoration: none;
    transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
  }

  .identity-card:hover {
    transform: translateY(-2px);
    border-color: rgba(241, 203, 112, 0.34);
    background: linear-gradient(145deg, rgba(241, 203, 112, 0.08), rgba(255, 255, 255, 0.025));
  }

  .identity-card img {
    width: 78px;
    height: 78px;
    object-fit: contain;
    border-radius: 50%;
    filter: drop-shadow(0 12px 22px rgba(0, 0, 0, 0.34));
  }

  .identity-card strong {
    font-size: 1rem;
  }

  .identity-card small {
    max-width: 20ch;
  }

  .card {
    padding: 22px;
  }

  .grid.two-up {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .all-time-card {
    display: grid;
    gap: 18px;
  }

  .card-head {
    margin-bottom: 2px;
  }

  .card-head > small {
    max-width: 52ch;
    text-align: right;
  }

  .card-head strong {
    color: var(--gold);
    margin: 0;
  }

  .all-time-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
  }

  .mini-stat,
  .moment-row,
  .line-item,
  .empty {
    border: 1px solid rgba(255, 255, 255, 0.065);
    background: rgba(255, 255, 255, 0.038);
    border-radius: 16px;
  }

  .mini-stat {
    padding: 14px;
  }

  .mini-stat strong {
    display: block;
    font-size: 1.35rem;
    line-height: 1.05;
    margin: 8px 0 4px;
  }

  .all-time-lower {
    margin-top: 2px;
  }

  .ledger-panel {
    border: 1px solid rgba(255, 255, 255, 0.055);
    background: rgba(0, 0, 0, 0.18);
    border-radius: 20px;
    padding: 16px;
  }

  .ledger-panel h4 {
    margin-bottom: 12px;
    font-size: 1rem;
  }

  .history-table,
  .stack {
    display: grid;
    gap: 10px;
  }

  .history-head,
  .history-row {
    display: grid;
    grid-template-columns: 90px 110px 1fr auto;
    gap: 12px;
    align-items: center;
    border-radius: 14px;
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.035);
  }

  .history-head {
    color: var(--gold);
    font-size: 0.72rem;
    font-weight: 850;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .moment-row {
    display: grid;
    gap: 4px;
    padding: 12px;
  }

  .moment-row strong {
    font-size: 1rem;
  }

  .line-item,
  .empty {
    padding: 12px 14px;
  }

  .line-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 4px 14px;
    color: inherit;
    text-decoration: none;
    transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
  }

  .line-item:hover {
    transform: translateY(-1px);
    border-color: rgba(241, 203, 112, 0.22);
    background: rgba(241, 203, 112, 0.055);
  }

  .line-item strong,
  .line-item small {
    min-width: 0;
  }

  .line-item small {
    grid-column: 1;
  }

  .line-item span {
    grid-column: 2;
    grid-row: 1 / 3;
    align-self: center;
    color: var(--gold);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .empty {
    color: var(--muted);
  }

  .more-list {
    margin-top: 2px;
  }

  .more-list summary {
    cursor: pointer;
    list-style: none;
    border: 1px solid rgba(241, 203, 112, 0.16);
    border-radius: 14px;
    background: var(--gold-soft);
    color: var(--gold);
    font-weight: 900;
    padding: 11px 13px;
  }

  .more-list summary::-webkit-details-marker {
    display: none;
  }

  .more-list summary:hover {
    background: rgba(241, 203, 112, 0.19);
  }

  .overflow-stack {
    display: grid;
    gap: 10px;
    max-height: 360px;
    overflow-y: auto;
    margin-top: 10px;
    padding-right: 6px;
  }

  .overflow-stack::-webkit-scrollbar {
    width: 8px;
  }

  .overflow-stack::-webkit-scrollbar-track {
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.04);
  }

  .overflow-stack::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: rgba(241, 203, 112, 0.35);
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
    .hero-card,
    .grid.two-up,
    .mini-facts div,
    .facts div,
    .history-head,
    .history-row {
      grid-template-columns: 1fr;
    }

    .hero-card {
      gap: 18px;
      text-align: left;
    }

    .team-logo {
      width: min(260px, 100%);
      height: auto;
      aspect-ratio: 1 / 1;
    }

    .stat-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .card-head,
    .hero-kicker,
    .card-title-row {
      align-items: flex-start;
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
    .page-stack {
      gap: 14px;
      padding-bottom: 28px;
    }

    .hero-card,
    .card,
    .stat-card,
    .identity-card {
      border-radius: 18px;
      padding: 16px;
    }

    .hero-kicker,
    .card-head,
    .card-title-row {
      display: grid;
      gap: 6px;
    }

    .stat-grid,
    .all-time-grid,
    .identity-shelf {
      grid-template-columns: 1fr;
    }

    h1 {
      font-size: clamp(2.2rem, 14vw, 3.25rem);
    }
  }
</style>
