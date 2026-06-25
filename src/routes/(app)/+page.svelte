<script>
  import { onMount } from 'svelte';

  export let data;

  const fmtUnix = (sec) => {
    const value = Number(sec);
    if (!Number.isFinite(value) || !value) return 'Date TBA';
    return new Date(value * 1000).toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const initials = (value = '') =>
    String(value)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'IC';

  const number = (value) => new Intl.NumberFormat('en-US').format(Number(value || 0));
  const points = (value) => Number(value || 0).toFixed(2);

  let hypeMode = false;
  let audioEl;
  const LOUNGE_TRACK = '/ICLOF.mp3';

  onMount(() => {
    try {
      hypeMode = window.localStorage.getItem('ic:hype-mode') === '1';
    } catch {}
    if (audioEl) {
      audioEl.volume = 0.2;
      audioEl.loop = true;
    }
  });

  async function toggleHypeMode() {
    hypeMode = !hypeMode;
    try {
      window.localStorage.setItem('ic:hype-mode', hypeMode ? '1' : '0');
    } catch {}
    if (!audioEl) return;
    if (hypeMode) {
      try {
        audioEl.currentTime = 0;
        audioEl.volume = 0.2;
        audioEl.loop = true;
        await audioEl.play();
      } catch (err) {
        console.warn('Audio play blocked', err);
      }
    } else {
      audioEl.pause();
      audioEl.currentTime = 0;
    }
  }

  $: who = data?.user?.displayName || 'Member';
  $: collective = data?.collective || {};
  $: nextEvent = collective.nextEvent;
  $: standings = data?.standings || [];
  $: managers = data?.managers || [];
  $: posts = data?.posts || [];
  $: cards = data?.commandCards || [];
  $: topSeed = data?.leagueStats?.topSeed;
</script>

<svelte:head>
  <title>Irving Collective</title>
  <meta
    name="description"
    content="The Irving Collective clubhouse for fantasy football, offseason games, league history, news, records, and bad decisions."
  />
</svelte:head>

<div class="clubhouse {hypeMode ? 'is-hype' : ''}">
  <section class="hero-shell">
    <div class="hero-copy">
      <div class="hero-kicker">Irving Collective • One Clubhouse</div>
      <h1>Welcome back, {who}. The velvet rope is now attached to a live grenade.</h1>
      <p>
        League HQ, offseason games, bankrolls, standings, history, rivalries, manager dossiers, news, and
        every questionable decision now live under one roof.
      </p>
      <div class="hero-actions">
        <a class="btn btn--vip" href="/league">Enter League HQ</a>
        <a class="btn btn--ghost" href="/games">Hit the Games Floor</a>
        <button type="button" class="hype-button" aria-pressed={hypeMode} on:click={toggleHypeMode}>
          Hype Mode: {hypeMode ? 'On' : 'Off'}
        </button>
      </div>
    </div>

    <aside class="mission-control" aria-label="Clubhouse mission control">
      <div class="orbital-card primary">
        <span>Bankroll</span>
        <strong>{number(collective.bankroll)}</strong>
        <small>{collective.myRank ? `Rank #${collective.myRank} on the offseason board` : 'Offseason points bank'}</small>
      </div>
      <div class="orbital-grid">
        <div class="orbital-card">
          <span>Managers</span>
          <strong>{data.leagueStats?.totalManagers || 14}</strong>
          <small>Certified sickos</small>
        </div>
        <div class="orbital-card">
          <span>Top Seed</span>
          <strong>{topSeed?.teamName || '—'}</strong>
          <small>{topSeed ? `${topSeed.wins}-${topSeed.losses}` : 'Board loading'}</small>
        </div>
      </div>
      <div class="orbital-card live-event">
        <span>Next Up</span>
        {#if nextEvent}
          <div class="event-line">
            {#if nextEvent.logo}
              <img src={nextEvent.logo} alt="" loading="lazy" />
            {:else}
              <div class="logo-fallback">IC</div>
            {/if}
            <div>
              <strong>{nextEvent.title}</strong>
              <small>{nextEvent.subtitle} • {fmtUnix(nextEvent.start_at || nextEvent.lock_at)}</small>
            </div>
          </div>
          <a href={`/games/${nextEvent.slug}`}>Make your pick →</a>
        {:else}
          <strong>No event queued</strong>
          <small>The lounge is quiet. Suspiciously quiet.</small>
          <a href="/games">View games →</a>
        {/if}
      </div>
    </aside>
  </section>

  <section class="command-grid" aria-label="Main command cards">
    {#each cards as card}
      <a class="command-card" href={card.href}>
        <span>{card.eyebrow}</span>
        <strong>{card.title}</strong>
        <p>{card.body}</p>
        <em>{card.cta} →</em>
      </a>
    {/each}
  </section>

  <section class="split-layout">
    <article class="panel board-panel">
      <div class="panel-head">
        <div>
          <span class="eyebrow">League Table</span>
          <h2>Current war board</h2>
        </div>
        <a href="/league/standings">Full standings</a>
      </div>
      <div class="standings-list">
        {#each standings as row}
          <a class="standings-row" href={`/league/managers/${row.slug}`}>
            <span class="rank">#{row.rank}</span>
            <div class="team-ident">
              {#if row.manager?.photo}
                <img src={row.manager.photo} alt={row.teamName} loading="lazy" />
              {:else}
                <span>{initials(row.teamName)}</span>
              {/if}
              <div>
                <strong>{row.teamName}</strong>
                <small>{row.displayName}</small>
              </div>
            </div>
            <div class="record-block">
              <strong>{row.wins}-{row.losses}</strong>
              <small>{points(row.points)} PF</small>
            </div>
          </a>
        {/each}
      </div>
    </article>

    <article class="panel lounge-panel">
      <div class="panel-head">
        <div>
          <span class="eyebrow">Offseason Board</span>
          <h2>Cash, chaos, clout</h2>
        </div>
        <a href="/leaderboard">Leaderboard</a>
      </div>
      {#if collective.top?.length}
        <div class="leader-list">
          {#each collective.top as row}
            <div class="leader-row">
              <span>#{row.rank}</span>
              <strong>{row.displayName}</strong>
              <em>{number(row.total)}</em>
            </div>
          {/each}
        </div>
      {:else}
        <div class="empty-state">
          <strong>The offseason board is waiting.</strong>
          <p>Once D1 has scores, this becomes a live leaderboard preview. Until then: menace energy, safely contained.</p>
        </div>
      {/if}

      <div class="event-stack">
        {#each collective.eventsUpcoming || [] as event}
          <a href={`/games/${event.slug}`} class="event-chip">
            {#if event.logo}<img src={event.logo} alt="" loading="lazy" />{/if}
            <div>
              <strong>{event.title}</strong>
              <span>{fmtUnix(event.start_at || event.lock_at)}</span>
            </div>
          </a>
        {/each}
      </div>
    </article>
  </section>

  <section class="panel managers-panel">
    <div class="panel-head">
      <div>
        <span class="eyebrow">Dossiers</span>
        <h2>Faces of the operation</h2>
      </div>
      <a href="/league/managers">All managers</a>
    </div>
    <div class="manager-strip">
      {#each managers as manager}
        <a class="manager-token" href={`/league/managers/${manager.slug}`}>
          <img src={manager.photo} alt={manager.name} loading="lazy" />
          <strong>{manager.teamName}</strong>
          <span>{manager.persona || 'Operator'}</span>
        </a>
      {/each}
    </div>
  </section>

  <section class="split-layout bottom-zone">
    <article class="panel news-panel">
      <div class="panel-head">
        <div>
          <span class="eyebrow">News Desk</span>
          <h2>Fresh from the lounge</h2>
        </div>
        <a href="/news">Archive</a>
      </div>
      <div class="story-stack">
        {#each posts as post}
          <a class="story-card" href={`/news/${post.slug}`}>
            <span>{post.tag}</span>
            <strong>{post.title}</strong>
            <p>{post.excerpt}</p>
          </a>
        {/each}
      </div>
    </article>

    <article class="panel manifesto-panel">
      <span class="eyebrow">Build Philosophy</span>
      <h2>One app. Two seasons. Maximum nonsense.</h2>
      <p>
        During football season, this is the league command center. During the offseason, it becomes the casino,
        scoreboard, sportsbook-ish panic room, and trophy-adjacent nonsense generator.
      </p>
      <div class="manifesto-grid">
        <a href="/history/badges">Badges</a>
        <a href="/history/rivalry">Rivalry</a>
        <a href="/constitution">Constitution</a>
        <a href="/resources">Resources</a>
      </div>
    </article>
  </section>

  <audio bind:this={audioEl} src={LOUNGE_TRACK} preload="auto"></audio>
</div>

<style>
  .clubhouse {
    display: grid;
    gap: 24px;
    position: relative;
  }

  .clubhouse::before {
    content: '';
    position: fixed;
    inset: 76px 0 auto;
    height: 360px;
    pointer-events: none;
    background:
      radial-gradient(circle at 18% 0%, rgba(245, 213, 138, 0.18), transparent 28%),
      radial-gradient(circle at 74% 12%, rgba(64, 188, 255, 0.12), transparent 30%),
      linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.04), transparent);
    filter: blur(4px);
    opacity: 0.85;
    z-index: -1;
  }

  .hero-shell {
    min-height: 520px;
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(340px, 0.85fr);
    gap: 22px;
    align-items: stretch;
  }

  .hero-copy,
  .mission-control,
  .panel,
  .command-card {
    border: 1px solid rgba(255, 255, 255, 0.11);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.025)),
      rgba(7, 8, 10, 0.58);
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(16px);
  }

  .hero-copy {
    border-radius: 34px;
    padding: clamp(26px, 5vw, 54px);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    overflow: hidden;
    position: relative;
  }

  .hero-copy::after {
    content: 'IC';
    position: absolute;
    right: -1.8rem;
    top: -3.4rem;
    font-family: var(--font-serif);
    font-size: clamp(10rem, 28vw, 22rem);
    line-height: 0.8;
    color: rgba(255, 255, 255, 0.035);
    pointer-events: none;
  }

  .hero-kicker,
  .eyebrow,
  .command-card span,
  .orbital-card span {
    color: var(--gold0);
    text-transform: uppercase;
    letter-spacing: 0.2em;
    font-size: 11px;
    font-weight: 800;
  }

  h1,
  h2,
  p {
    position: relative;
  }

  h1 {
    max-width: 12ch;
    margin: 16px 0;
    font-family: var(--font-serif);
    font-size: clamp(3rem, 8vw, 6.8rem);
    line-height: 0.82;
    letter-spacing: -0.065em;
  }

  .hero-copy p {
    max-width: 58ch;
    margin: 0;
    color: rgba(255, 255, 255, 0.76);
    font-size: 1.05rem;
    line-height: 1.65;
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 26px;
  }

  .hype-button {
    appearance: none;
    border: 1px solid rgba(255, 255, 255, 0.14);
    color: rgba(255, 255, 255, 0.9);
    border-radius: 999px;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.04);
    font-weight: 800;
    cursor: pointer;
  }

  .is-hype .hero-copy,
  .is-hype .mission-control {
    box-shadow: 0 24px 90px rgba(214, 177, 94, 0.16), 0 0 0 1px rgba(214, 177, 94, 0.14);
  }

  .mission-control {
    border-radius: 34px;
    padding: 18px;
    display: grid;
    gap: 14px;
  }

  .orbital-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .orbital-card {
    min-height: 124px;
    border-radius: 24px;
    padding: 18px;
    display: grid;
    align-content: space-between;
    gap: 10px;
    background: rgba(0, 0, 0, 0.24);
    border: 1px solid rgba(255, 255, 255, 0.09);
  }

  .orbital-card.primary {
    min-height: 160px;
    background:
      radial-gradient(circle at top right, rgba(245, 213, 138, 0.22), transparent 45%),
      rgba(0, 0, 0, 0.28);
  }

  .orbital-card strong {
    font-size: clamp(1.5rem, 4vw, 2.4rem);
    line-height: 1;
  }

  .orbital-card small,
  .event-line small,
  .record-block small,
  .team-ident small,
  .manager-token span {
    color: rgba(255, 255, 255, 0.62);
  }

  .event-line {
    display: grid;
    grid-template-columns: 58px 1fr;
    gap: 12px;
    align-items: center;
  }

  .event-line img,
  .logo-fallback {
    width: 58px;
    height: 58px;
    border-radius: 18px;
    object-fit: cover;
    background: rgba(255, 255, 255, 0.06);
    display: grid;
    place-items: center;
    font-weight: 900;
  }

  .live-event a {
    color: var(--gold0);
    font-weight: 900;
  }

  .command-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .command-card {
    min-height: 230px;
    border-radius: 28px;
    padding: 22px;
    display: flex;
    flex-direction: column;
    color: inherit;
    text-decoration: none;
    transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
  }

  .command-card:hover {
    transform: translateY(-4px);
    border-color: rgba(245, 213, 138, 0.34);
    text-decoration: none;
  }

  .command-card strong {
    margin-top: 12px;
    font-size: 1.5rem;
    line-height: 1.05;
  }

  .command-card p {
    color: rgba(255, 255, 255, 0.68);
    line-height: 1.55;
  }

  .command-card em {
    margin-top: auto;
    color: var(--gold0);
    font-style: normal;
    font-weight: 900;
  }

  .split-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
    gap: 24px;
  }

  .panel {
    border-radius: 28px;
    padding: 24px;
    overflow: hidden;
  }

  .panel-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 18px;
  }

  .panel-head h2,
  .manifesto-panel h2 {
    margin: 6px 0 0;
    font-size: clamp(1.55rem, 3vw, 2.4rem);
    line-height: 1;
    font-family: var(--font-serif);
  }

  .panel-head a,
  .manifesto-grid a {
    color: var(--gold0);
    font-weight: 900;
  }

  .standings-list,
  .leader-list,
  .event-stack,
  .story-stack {
    display: grid;
    gap: 10px;
  }

  .standings-row {
    display: grid;
    grid-template-columns: 54px 1fr auto;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 18px;
    color: inherit;
    text-decoration: none;
    background: rgba(255, 255, 255, 0.035);
    border: 1px solid rgba(255, 255, 255, 0.07);
  }

  .standings-row:hover,
  .story-card:hover,
  .event-chip:hover,
  .manager-token:hover {
    border-color: rgba(245, 213, 138, 0.22);
    background: rgba(245, 213, 138, 0.06);
    text-decoration: none;
  }

  .rank {
    color: var(--gold0);
    font-weight: 950;
    font-size: 1.1rem;
  }

  .team-ident {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .team-ident img,
  .team-ident > span {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    object-fit: cover;
    background: rgba(255, 255, 255, 0.07);
    display: grid;
    place-items: center;
    font-weight: 900;
  }

  .team-ident strong,
  .team-ident small,
  .event-chip strong,
  .event-chip span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .record-block {
    text-align: right;
  }

  .leader-row {
    display: grid;
    grid-template-columns: 54px 1fr auto;
    align-items: center;
    gap: 12px;
    padding: 13px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.04);
  }

  .leader-row span,
  .leader-row em {
    color: var(--gold0);
    font-style: normal;
    font-weight: 900;
  }

  .empty-state {
    padding: 18px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.035);
    color: rgba(255, 255, 255, 0.72);
  }

  .event-stack {
    margin-top: 14px;
  }

  .event-chip {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: 16px;
    color: inherit;
    text-decoration: none;
    border: 1px solid rgba(255, 255, 255, 0.07);
    background: rgba(0, 0, 0, 0.18);
  }

  .event-chip img {
    width: 42px;
    height: 42px;
    object-fit: cover;
    border-radius: 12px;
  }

  .manager-strip {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 12px;
  }

  .manager-token {
    min-width: 0;
    display: grid;
    gap: 8px;
    justify-items: center;
    text-align: center;
    color: inherit;
    text-decoration: none;
    padding: 12px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);
  }

  .manager-token img {
    width: 72px;
    height: 72px;
    border-radius: 22px;
    object-fit: cover;
  }

  .manager-token strong {
    font-size: 0.84rem;
    line-height: 1.1;
  }

  .story-card {
    color: inherit;
    text-decoration: none;
    border-radius: 20px;
    padding: 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.035);
  }

  .story-card span {
    display: inline-flex;
    width: fit-content;
    padding: 5px 9px;
    border-radius: 999px;
    background: rgba(214, 177, 94, 0.12);
    color: var(--gold0);
    font-size: 0.78rem;
    margin-bottom: 10px;
  }

  .story-card strong {
    display: block;
    font-size: 1.1rem;
  }

  .story-card p,
  .manifesto-panel p {
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.6;
  }

  .manifesto-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 20px;
  }

  .manifesto-grid a {
    padding: 14px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  @media (max-width: 1120px) {
    .hero-shell,
    .split-layout {
      grid-template-columns: 1fr;
    }

    .manager-strip {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  @media (max-width: 860px) {
    .hero-shell {
      min-height: auto;
    }

    h1 {
      max-width: 100%;
      letter-spacing: -0.045em;
    }

    .command-grid,
    .orbital-grid,
    .manager-strip,
    .manifesto-grid {
      grid-template-columns: 1fr;
    }

    .standings-row,
    .leader-row {
      grid-template-columns: 1fr;
      align-items: start;
    }

    .record-block {
      text-align: left;
    }
  }
</style>
