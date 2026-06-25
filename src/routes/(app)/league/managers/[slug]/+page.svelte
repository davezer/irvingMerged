<script>
  import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';

  export let data;

  const fmtNumber = (value, digits = 2) => Number(value || 0).toFixed(digits);
  const fmtMoney = (value) => {
    if (value == null || value === '' || Number.isNaN(Number(value))) return '—';
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(Number(value));
  };
  const fmtEpoch = (epoch) => epoch ? new Date(Number(epoch)).toLocaleDateString() : '—';
  const assetForLabel = (label) => label ? `/${String(label).trim()}.png` : null;
  const yearsLabel = (value) => {
    if (!value) return null;
    const normalized = String(value).toLowerCase();
    if (normalized.includes('twenty')) return '20 Years';
    if (normalized.includes('ten')) return '10 Years';
    return String(value);
  };
  const fantasySince = (value) => {
    if (!value) return null;
    return `Since '${String(value).slice(-2)}`;
  };

  $: manager = data.manager || {};
  $: draftMoneyValue = data.draftMoney?.value ?? null;
  $: draftMoneyTone = draftMoneyValue == null ? 'neutral' : Number(draftMoneyValue) < 100 ? 'danger' : Number(draftMoneyValue) > 200 ? 'bonus' : 'safe';
  $: legacyYears = manager.championship?.years ? String(manager.championship.years) : '';
  $: legacyLeague = manager.championship?.league || 'Legacy';
  $: personaIcon = assetForLabel(manager.persona);
  $: serviceIcon = assetForLabel(manager.yearsOfService);
  $: legacyIcon = manager.championship?.league ? assetForLabel(manager.championship.league) : '/trophy.png';
  $: rival = data.rival || manager.rival || null;
  $: contactIcon = manager.preferredContact ? assetForLabel(manager.preferredContact) : null;
  $: favoriteTeamLogo = manager.favoriteTeam ? `https://sleepercdn.com/images/team_logos/nfl/${manager.favoriteTeam}.png` : null;
  $: infoItems = [manager.location, fantasySince(manager.fantasyStart), manager.preferredContact].filter(Boolean);
</script>

<svelte:head>
  <title>{manager.name} | Irving Champions League</title>
</svelte:head>

<div class="manager-page">
  <LeagueSubnav season={data.season} active="managers" />

  <section class="identity-stage" aria-labelledby="manager-title">
    <div class="logo-wrap">
      <div class="logo-frame">
        <img src={manager.photo} alt={`${manager.teamName || manager.name} logo`} />
      </div>
      {#if manager.isCommissioner}
        <span class="comm-badge" title="Commissioner">C</span>
      {/if}
    </div>

    <div class="title-lockup">
      <h1 id="manager-title">{manager.name}</h1>
      <p>{data.coOwnerLabel || 'Manager'} of <i>{manager.liveTeamName || manager.teamName}</i></p>
    </div>

    <div class={`money-block ${draftMoneyTone}`}>
      <div class="money-label">Future Draft<br />Money</div>
      <div class="money-value">{fmtMoney(draftMoneyValue)}</div>
      {#if data.draftMoney?.error}
        <small>{data.draftMoney.error}</small>
      {/if}
    </div>

    <div class="basic-info" aria-label="Manager quick facts">
      {#each infoItems as item, i}
        {#if i > 0}<span class="separator">|</span>{/if}
        <span>{item}</span>
        {#if item === manager.preferredContact && contactIcon}
          <img class="contact-icon" src={contactIcon} alt="" />
        {/if}
      {/each}
      {#if favoriteTeamLogo}
        <span class="separator">|</span>
        <img class="team-icon" src={favoriteTeamLogo} alt={`${manager.favoriteTeam} logo`} />
      {/if}
    </div>

    <nav class="manager-nav" aria-label="Manager profile navigation">
      {#if data.managerNav?.prev}
        <a class="nav-button" href={data.managerNav.prev.href}>Previous Manager</a>
      {:else}
        <span class="nav-button disabled">Previous Manager</span>
      {/if}
      <a class="nav-button primary" href={data.managerNav?.all || '/league/managers'}>All Managers</a>
      {#if data.managerNav?.next}
        <a class="nav-button" href={data.managerNav.next.href}>Next Manager</a>
      {:else}
        <span class="nav-button disabled">Next Manager</span>
      {/if}
    </nav>
  </section>



  <section class="badge-band" aria-label="Manager identity badges">
    <article class="identity-tile">
      <h3>Persona</h3>
      {#if personaIcon}<img src={personaIcon} alt="" />{/if}
      <strong>{manager.persona || 'Unassigned'}</strong>
      <span>{data.personaDefinition || 'League temperament profile'}</span>
    </article>

    <article class="identity-tile">
      <h3>Years of Service</h3>
      {#if serviceIcon}<img src={serviceIcon} alt="" />{/if}
      <strong>{yearsLabel(manager.yearsOfService) || 'Rookie Watch'}</strong>
      <span>{manager.fantasyStart ? `Fantasy since ${manager.fantasyStart}` : 'Awaiting service badge'}</span>
    </article>

    <article class="identity-tile">
      <h3>Legacy</h3>
      {#if legacyIcon}<img src={legacyIcon} alt="" />{/if}
      <strong>{legacyLeague}</strong>
      <span>{legacyYears || 'No title years on file'}</span>
    </article>

    <article class="identity-tile rival-tile">
      <h3>Rival</h3>
      {#if rival?.href}
        <a href={rival.href} aria-label={`View ${rival.name}'s manager page`}>
          {#if rival.image}<img src={rival.image} alt="" />{/if}
          <strong>{rival.name}</strong>
        </a>
      {:else}
        {#if rival?.image}<img src={rival.image} alt="" />{/if}
        <strong>{rival?.name || 'TBD'}</strong>
      {/if}
      <span>{rival?.teamName || 'Circle the date'}</span>
    </article>
  </section>

  <section class="live-strip" aria-label="Current season summary">
    {#each data.dossierStats || [] as stat}
      <article>
        <span>{stat.label}</span>
        <strong>{stat.value}</strong>
      </article>
    {/each}
    <article>
      <span>Point Diff</span>
      <strong>{fmtNumber(manager.currentPointDiff)}</strong>
    </article>
  </section>

  <section class="lower-grid">
    <article class="panel card-panel">
      <div class="panel-head">
        <h2>Current Starters</h2>
        <a href={data.quickLinks?.franchise}>Full team</a>
      </div>
      <div class="player-stack">
        {#each (data.starters || []).slice(0, 8) as player}
          <div class="player-row">
            <img src={player.photoUrl} alt="" />
            <div>
              <strong>{player.name}</strong>
              <small>{player.position || '—'} · {player.teamLabel || player.team || 'FA'}</small>
            </div>
          </div>
        {/each}
        {#if !(data.starters || []).length}<p class="empty">No starter snapshot available yet.</p>{/if}
      </div>
    </article>

    <article class="panel card-panel">
      <div class="panel-head">
        <h2>Recent Moves</h2>
        <a href={data.quickLinks?.moves}>All moves</a>
      </div>
      <div class="line-stack">
        {#each (data.recentMoves || []).slice(0, 5) as move}
          <a class="line-row" href={data.quickLinks?.moves}>
            <strong>Week {move.week} · {move.type}</strong>
            <span>{move.addCount} add / {move.dropCount} drop · {fmtEpoch(move.createdAt)}</span>
          </a>
        {/each}
        {#if !(data.recentMoves || []).length}<p class="empty">No recent moves attached to this manager.</p>{/if}
      </div>
    </article>

    <article class="panel card-panel">
      <div class="panel-head">
        <h2>Lineup Audit</h2>
        <a href={data.quickLinks?.games}>Matchups</a>
      </div>
      <div class="line-stack">
        {#each (data.weeklyLinks || []).slice(0, 5) as week}
          <a class="line-row" href={week.href}>
            <strong>Week {week.week}</strong>
            <span>{fmtNumber(week.lineupIQ, 1)}% IQ · {fmtNumber(week.benchPoints)} bench swing</span>
          </a>
        {/each}
        {#if !(data.weeklyLinks || []).length}<p class="empty">No weekly lineup audits available yet.</p>{/if}
      </div>
    </article>

    <article class="panel card-panel">
      <div class="panel-head">
        <h2>Season History</h2>
        <a href="/history/records">Records</a>
      </div>
      <div class="history-table">
        {#each (data.seasonHistory || []).slice(0, 6) as season}
          <div class="history-row">
            <strong>{season.season}</strong>
            <span>{season.champion ? '🏆 ' : ''}#{season.rank}</span>
            <span>{season.recordLabel}</span>
            <span>{fmtNumber(season.points)}</span>
          </div>
        {/each}
        {#if !(data.seasonHistory || []).length}<p class="empty">No season history attached yet.</p>{/if}
      </div>
    </article>
  </section>
</div>

<style>
  .manager-page {
    display: grid;
    gap: 0;
    margin: -4px -18px 0;
  }

  .identity-stage {
    position: relative;
    display: grid;
    justify-items: center;
    text-align: center;
    padding: 28px 18px 46px;
    min-height: 475px;
    background:
      radial-gradient(680px 300px at 50% 2%, rgba(255,255,255,0.085), transparent 62%),
      radial-gradient(560px 220px at 50% 38%, rgba(0, 153, 255, 0.075), transparent 66%),
      linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.008));
    border-bottom: 1px solid rgba(255,255,255,0.18);
    box-shadow: inset 0 -24px 70px rgba(0,0,0,0.42);
  }

  .logo-wrap {
    position: relative;
    width: 202px;
    height: 202px;
    display: grid;
    place-items: center;
    margin-top: 4px;
  }

  .logo-frame {
    width: 196px;
    height: 196px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    padding: 10px;
    background: var(--panel);
    border: 1px solid var(--border);
    box-shadow:
      0 22px 56px rgba(0,0,0,0.44),
      0 0 0 1px rgba(0,0,0,0.72) inset;
  }

  .logo-frame img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 50%;
  }

  .comm-badge {
    position: absolute;
    right: -8px;
    bottom: 5px;
    min-width: 42px;
    height: 28px;
    padding: 0 11px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    color: var(--yellow);
    font-weight: 950;
    letter-spacing: 0.04em;
    background: var(--panel);
    border: 1px solid var(--border);
    box-shadow: 0 12px 26px rgba(0,0,0,0.42);
  }

  .title-lockup { display: grid; gap: 0; margin-top: 12px; }

  .title-lockup h1 {
    margin: 0;
    font-size: clamp(2.25rem, 5.2vw, 4.15rem);
    line-height: 0.92;
    letter-spacing: -0.055em;
    font-weight: 350;
    color: var(--yellow);
    text-shadow:
      0 2px 0 rgba(0,0,0,0.92),
      0 0 26px rgba(255,255,255,0.16);
  }

  .title-lockup p {
    margin: 3px 0 0;
    color: var(--text);
    font-size: 1.05rem;
    line-height: 1.15;
  }

  .title-lockup i { color: var(--text); }

  .money-block {
    display: grid;
    justify-items: center;
    gap: 6px;
    margin-top: 10px;
    min-height: 74px;
  }

  .money-label {
    width: 128px;
    color: var(--cyan);
    text-transform: none;
    line-height: 1.05;
    font-size: 0.9rem;
    font-weight: 900;
  }

  .money-value {
    font-weight: 950;
    font-size: 1.18rem;
    color: var(--success);
  }

  .money-block.danger .money-value { color: var(--danger); }
  .money-block.bonus .money-value { color: var(--warning); }
  .money-block.neutral .money-value { color: var(--muted); }
  .money-block small { color: var(--text); font-size: 0.72rem; max-width: 260px; }

  .basic-info {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 13px;
    min-height: 34px;
    margin-top: 6px;
    color: var(--text);
    font-family: var(--font-serif);
    font-style: italic;
  }

  .separator { color: var(--text); font-style: normal; }
  .contact-icon { width: 22px; height: 22px; object-fit: contain; margin-left: -6px; opacity: 0.7; }
  .team-icon { width: 34px; height: 34px; object-fit: contain; filter: drop-shadow(0 8px 14px rgba(0,0,0,0.45)); }

  .manager-nav {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 18px;
  }

  .nav-button {
    min-width: 154px;
    padding: 11px 16px;
    border: 1px solid rgba(255,255,255,0.13);
    border-right-width: 0;
    background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.18));
    color: #00a7ff;
    text-transform: uppercase;
    font-size: 0.77rem;
    font-weight: 950;
    letter-spacing: 0.12em;
    text-decoration: none;
  }

  .nav-button:first-child { border-radius: 7px 0 0 7px; }
  .nav-button:last-child { border-right-width: 1px; border-radius: 0 7px 7px 0; }
  .nav-button:hover { background: rgba(0, 167, 255, 0.10); text-decoration: none; color: white; }
  .nav-button.primary { color: #18b7ff; background: rgba(0, 167, 255, 0.055); }
  .nav-button.disabled { color: rgba(255,255,255,0.28); pointer-events: none; }

  .about-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 1px minmax(0, 1fr);
    gap: 56px;
    align-items: start;
    max-width: 940px;
    width: calc(100% - 36px);
    margin: -6px auto 44px;
    padding-top: 2px;
  }

  .about-col { text-align: center; min-height: 158px; }
  .about-col h2 {
    position: relative;
    display: inline-block;
    margin: 0 0 22px;
    color: white;
    font-size: 1.25rem;
    line-height: 1;
    text-shadow: 0 2px 0 rgba(0,0,0,0.9);
  }
  .about-col h2::after {
    content: '';
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: -11px;
    width: 66px;
    height: 2px;
    border-radius: 99px;
    background: linear-gradient(90deg, #00a7ff, #2458ff);
  }
  .about-col p {
    margin: 0;
    color: white;
    font-weight: 750;
    line-height: 1.45;
    text-wrap: balance;
  }
  .about-divider {
    width: 1px;
    height: 182px;
    background: linear-gradient(180deg, transparent, rgba(255,255,255,0.24), transparent);
    box-shadow: 0 0 18px rgba(0, 153, 255, 0.18);
  }

  .badge-band {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 24px;
    padding: 28px clamp(18px, 6vw, 92px) 36px;
    border-top: 1px solid rgba(255,255,255,0.18);
    border-bottom: 1px solid rgba(255,255,255,0.09);
    background:
      radial-gradient(700px 240px at 50% 0%, rgba(255,255,255,0.06), transparent 65%),
      linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.008));
  }

  .identity-tile {
    display: grid;
    justify-items: center;
    gap: 8px;
    text-align: center;
    min-height: 144px;
  }

  .identity-tile h3 {
    margin: 0 0 3px;
    color: #009dff;
    font-size: 0.83rem;
    font-weight: 950;
  }

  .identity-tile img {
    width: 78px;
    height: 78px;
    object-fit: contain;
    border-radius: 50%;
    filter: drop-shadow(0 14px 18px rgba(0,0,0,0.5));
  }

  .identity-tile strong { color: white; font-size: 1.04rem; line-height: 1; }
  .identity-tile span { color: rgba(255,255,255,0.52); font-size: 0.78rem; max-width: 210px; }
  .identity-tile a { color: inherit; text-decoration: none; display: contents; }
  .identity-tile a:hover strong { color: #52c5ff; }

  .live-strip {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
    padding: 28px 18px 0;
  }
  .live-strip article,
  .card-panel {
    border: 1px solid rgba(255,255,255,0.09);
    background: linear-gradient(180deg, rgba(255,255,255,0.047), rgba(255,255,255,0.018));
    border-radius: 20px;
    box-shadow: 0 18px 40px rgba(0,0,0,0.24);
  }
  .live-strip article { padding: 16px; display: grid; gap: 6px; text-align: center; }
  .live-strip span { color: #009dff; text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.68rem; font-weight: 950; }
  .live-strip strong { color: white; font-size: 1.2rem; }

  .lower-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    padding: 18px 18px 56px;
  }

  .card-panel { padding: 20px; }
  .panel-head { display: flex; justify-content: space-between; gap: 16px; align-items: center; margin-bottom: 14px; }
  .panel-head h2 { margin: 0; font-size: 1.15rem; }
  .panel-head a { color: #18b7ff; font-size: 0.82rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.09em; }

  .player-stack, .line-stack, .history-table { display: grid; gap: 10px; }
  .player-row {
    display: grid;
    grid-template-columns: 44px 1fr;
    gap: 12px;
    align-items: center;
    padding: 10px;
    border-radius: 14px;
    background: rgba(0,0,0,0.17);
  }
  .player-row img { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; background: rgba(255,255,255,0.08); }
  .player-row strong, .line-row strong { color: white; }
  .player-row small, .line-row span { color: rgba(255,255,255,0.58); }

  .line-row {
    display: grid;
    gap: 4px;
    padding: 12px;
    border-radius: 14px;
    background: rgba(0,0,0,0.17);
    color: inherit;
    text-decoration: none;
  }
  .line-row:hover { text-decoration: none; background: rgba(0, 167, 255, 0.075); }

  .history-row {
    display: grid;
    grid-template-columns: 76px 72px 1fr auto;
    gap: 10px;
    padding: 11px 12px;
    border-radius: 14px;
    background: rgba(0,0,0,0.17);
    align-items: center;
  }
  .history-row span { color: rgba(255,255,255,0.66); }
  .empty { margin: 0; padding: 12px; border-radius: 14px; background: rgba(0,0,0,0.15); color: rgba(255,255,255,0.55); }

  @media (max-width: 900px) {
    .manager-page { margin-left: -12px; margin-right: -12px; }
    .about-grid { grid-template-columns: 1fr; gap: 30px; }
    .about-divider { display: none; }
    .badge-band { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .live-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .lower-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 560px) {
    .identity-stage { min-height: auto; padding-top: 22px; }
    .logo-wrap { width: 172px; height: 172px; }
    .logo-frame { width: 166px; height: 166px; }
    .basic-info { gap: 8px 10px; }
    .manager-nav { display: grid; width: min(100%, 330px); }
    .nav-button, .nav-button:first-child, .nav-button:last-child { border-radius: 0; border-right-width: 1px; }
    .nav-button:first-child { border-radius: 8px 8px 0 0; }
    .nav-button:last-child { border-radius: 0 0 8px 8px; }
    .badge-band, .live-strip { grid-template-columns: 1fr; }
    .history-row { grid-template-columns: 1fr 1fr; }
  }
</style>
