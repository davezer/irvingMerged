<script>
  import { onMount } from 'svelte';

  export let data;

  const fmtUnix = (unix) => {
    if (!unix) return 'TBD';
    return new Date(Number(unix) * 1000).toLocaleString('en-US', {
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

  let themeMusic = false;
  let audioEl;
  const LOUNGE_TRACK = '/ICLOF.mp3';

  onMount(() => {
    try {
      themeMusic = window.localStorage.getItem('ic:theme-music') === '1';
    } catch {}
    if (audioEl) {
      audioEl.volume = 0.18;
      audioEl.loop = true;
    }
  });

  async function toggleThemeMusic() {
    themeMusic = !themeMusic;
    try {
      window.localStorage.setItem('ic:theme-music', themeMusic ? '1' : '0');
    } catch {}
    if (!audioEl) return;
    if (themeMusic) {
      try {
        audioEl.currentTime = 0;
        audioEl.volume = 0.18;
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
  <title>Irving Collective Broadcast</title>
  <meta
    name="description"
    content="The Irving Collective clubhouse: fantasy football, offseason games, standings, news, history, and broadcast-grade nonsense."
  />
</svelte:head>

<div class="clubhouse">
  <section class="broadcast-hero">
    <div class="pregame-card">
      <div class="live-ribbon"><span>ICN</span><strong>LIVE PREGAME</strong><em>ON AIR</em></div>
      <div class="hero-grid">
        <div class="hero-copy">
          <div class="eyebrow">Irving Collective • Sunday desk</div>
          <h1>Welcome back, {who}. We now join league chaos already in progress.</h1>
          <p>
            League HQ, offseason games, bankrolls, standings, history, rivalries, manager dossiers, news, and
            questionable decisions — packaged like a regional broadcast nobody asked for and everybody deserves.
          </p>
          <div class="hero-actions">
            <a class="bug-button primary" href="/league">Enter League HQ</a>
            <a class="bug-button" href="/games">Games Floor</a>
            <button type="button" class="bug-button" aria-pressed={themeMusic} on:click={toggleThemeMusic}>
              Theme Music: {themeMusic ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        <aside class="scoreboard" aria-label="Clubhouse scoreboard">
          <div class="scoreboard-top"><span>ICN SCOREBOARD</span><strong>FINAL-ish</strong></div>
          <div class="score-row">
            <span class="network">HQ</span>
            <strong>League HQ</strong>
            <em>{data.leagueStats?.totalManagers || 14}</em>
          </div>
          <div class="score-row away">
            <span class="network alt">OFF</span>
            <strong>Offseason Lounge</strong>
            <em>{number(collective.bankroll)}</em>
          </div>
          <div class="game-meta">
            <span>Top Seed</span>
            <strong>{topSeed?.teamName || 'Board Loading'}</strong>
            <em>{topSeed ? `${topSeed.wins}-${topSeed.losses}` : '0-0'}</em>
          </div>
        </aside>
      </div>
    </div>

    <aside class="studio-stack" aria-label="Studio cards">
      <div class="studio-card bankroll">
        <span>Bankroll</span>
        <strong>{number(collective.bankroll)}</strong>
        <small>{collective.myRank ? `Rank #${collective.myRank} on the offseason board` : 'Offseason points bank'}</small>
      </div>
      <div class="studio-grid">
        <div class="studio-card">
          <span>Managers</span>
          <strong>{data.leagueStats?.totalManagers || 14}</strong>
          <small>Certified sickos</small>
        </div>
        <div class="studio-card">
          <span>Top Seed</span>
          <strong>{topSeed?.teamName || '—'}</strong>
          <small>{topSeed ? `${topSeed.wins}-${topSeed.losses}` : 'Board loading'}</small>
        </div>
      </div>
      <div class="studio-card next-up">
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
          <a class="standings-row" href={`/league/teams/${row.slug}`}>
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
        <span class="eyebrow">Franchise roll call</span>
        <h2>Faces of the operation</h2>
      </div>
      <a href="/league/teams">All teams</a>
    </div>
    <div class="manager-strip">
      {#each managers as manager}
        <a class="manager-token" href={`/league/teams/${manager.slug}`}>
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
        scoreboard, panic room, and trophy-adjacent nonsense generator.
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
  }

  .broadcast-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
    gap: 22px;
    align-items: stretch;
  }

  .pregame-card,
  .studio-card,
  .panel,
  .command-card {
    border: 2px solid #070808;
    background: linear-gradient(180deg, #5d6561, #242a29 52%, #101212);
    box-shadow: var(--shadow-bug);
  }

  .pregame-card {
    position: relative;
    overflow: hidden;
    border-radius: 18px;
    min-height: 530px;
    background:
      linear-gradient(90deg, rgba(199,25,47,0.22), transparent 34%),
      linear-gradient(180deg, #5f6763, #252b2a 48%, #101313);
  }

  .pregame-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px),
      linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 54px 54px;
    opacity: 0.26;
  }

  .pregame-card::after {
    content: 'ICN';
    position: absolute;
    right: -30px;
    top: 22px;
    color: rgba(255,255,255,0.055);
    font-family: var(--font-score);
    font-size: clamp(9rem, 20vw, 18rem);
    line-height: 1;
  }

  .live-ribbon {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    border-bottom: 2px solid #070808;
    background: linear-gradient(180deg, #161918, #070808);
    font-family: var(--font-score);
    text-transform: uppercase;
  }

  .live-ribbon span,
  .live-ribbon em {
    padding: 9px 12px;
    background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));
    color: white;
    font-style: normal;
  }

  .live-ribbon strong {
    padding: 9px 12px;
    color: var(--bug-yellow);
    letter-spacing: 0.14em;
  }

  .hero-grid {
    position: relative;
    z-index: 1;
    display: grid;
    align-content: space-between;
    gap: 28px;
    min-height: 486px;
    padding: clamp(24px, 4vw, 46px);
  }

  .hero-copy {
    max-width: 780px;
    display: grid;
    gap: 18px;
  }

  h1 {
    max-width: 10ch;
    margin: 0;
    font-size: clamp(3.2rem, 8.3vw, 6.8rem);
    line-height: 0.82;
  }

  .hero-copy p {
    max-width: 62ch;
    margin: 0;
    color: rgba(247,245,235,0.82);
    font-weight: 750;
    line-height: 1.55;
  }

  .hero-actions,
  .manifesto-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .bug-button,
  .manifesto-grid a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 36px;
    border: 1px solid #050606;
    border-radius: 5px;
    background: linear-gradient(180deg, #f5f4ea, #b9bcb5 52%, #6d7470);
    color: #101111;
    padding: 8px 12px;
    font-family: var(--font-score);
    font-size: 0.76rem;
    font-weight: 950;
    text-transform: uppercase;
    text-decoration: none;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -2px 0 rgba(0,0,0,0.30);
    cursor: pointer;
  }

  .bug-button.primary {
    background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));
    color: white;
  }

  .scoreboard {
    width: min(520px, 100%);
    border: 2px solid #050606;
    border-radius: 8px;
    overflow: hidden;
    background: #0b0d0d;
    box-shadow: var(--shadow-bug);
  }

  .scoreboard-top,
  .game-meta {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    align-items: center;
    padding: 7px 9px;
    background: linear-gradient(180deg, #f4f3ea, #b8bbb4 52%, #777e79);
    color: #111;
    font-family: var(--font-score);
    text-transform: uppercase;
  }

  .score-row {
    display: grid;
    grid-template-columns: 54px 1fr 78px;
    align-items: stretch;
    min-height: 58px;
    border-top: 2px solid #050606;
    font-family: var(--font-score);
  }

  .network {
    display: grid;
    place-items: center;
    background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));
    color: white;
  }
  .network.alt { background: linear-gradient(180deg, var(--bug-blue), #0b315e); }

  .score-row strong {
    display: flex;
    align-items: center;
    padding: 0 12px;
    color: #f7f5eb;
    font-size: 1.15rem;
  }

  .score-row em {
    display: grid;
    place-items: center;
    background: linear-gradient(180deg, #f4f3ea, #b8bbb4 52%, #777e79);
    color: #111;
    font-size: 1.55rem;
    font-style: normal;
  }

  .game-meta {
    grid-template-columns: auto 1fr auto;
    border-top: 2px solid #050606;
    font-size: 0.72rem;
  }

  .studio-stack {
    display: grid;
    gap: 14px;
  }

  .studio-card,
  .panel,
  .command-card {
    border-radius: 16px;
    padding: 18px;
  }

  .studio-card {
    display: grid;
    gap: 10px;
    min-height: 150px;
  }

  .studio-card > span,
  .command-card span {
    color: var(--bug-yellow);
    font-family: var(--font-score);
    text-transform: uppercase;
    letter-spacing: 0.16em;
    font-size: 0.7rem;
  }

  .studio-card strong {
    font-family: var(--font-score);
    font-size: clamp(1.8rem, 4vw, 3.1rem);
    line-height: 1;
  }

  .studio-grid,
  .split-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .event-line,
  .team-ident,
  .event-chip {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .event-line img,
  .event-chip img {
    width: 54px;
    height: 54px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid #070808;
  }

  .studio-card a { color: var(--bug-yellow); font-weight: 900; }

  .command-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .command-card {
    display: grid;
    gap: 12px;
    color: inherit;
    text-decoration: none;
  }

  .command-card strong {
    font-family: var(--font-score);
    font-size: 1.45rem;
    text-transform: uppercase;
  }

  .panel-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: start;
    margin-bottom: 14px;
  }

  .panel-head h2 { margin: 4px 0 0; font-size: 1.5rem; }

  .standings-list,
  .leader-list,
  .event-stack,
  .story-stack {
    display: grid;
    gap: 10px;
  }

  .standings-row,
  .leader-row,
  .event-chip,
  .story-card {
    border-radius: 8px;
    padding: 12px;
    color: inherit;
    text-decoration: none;
  }

  .standings-row {
    display: grid;
    grid-template-columns: 52px 1fr auto;
    gap: 12px;
    align-items: center;
  }

  .team-ident img,
  .team-ident > span,
  .manager-token img {
    width: 46px;
    height: 46px;
    border-radius: 7px;
    object-fit: cover;
    border: 1px solid #070808;
    background: var(--bug-silver);
  }

  .team-ident > span {
    display: grid;
    place-items: center;
    font-family: var(--font-score);
    color: #111;
  }

  .record-block { text-align: right; }
  .record-block strong { display: block; font-family: var(--font-score); color: var(--bug-yellow); }

  .leader-row {
    display: grid;
    grid-template-columns: 54px 1fr auto;
    gap: 12px;
    align-items: center;
  }
  .leader-row em { color: var(--bug-yellow); font-family: var(--font-score); font-style: normal; }

  .empty-state { padding: 14px; border: 1px solid #070808; border-radius: 8px; background: rgba(0,0,0,0.22); }

  .managers-panel { overflow: hidden; }
  .manager-strip {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(150px, 1fr);
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 5px;
  }

  .manager-token {
    display: grid;
    gap: 8px;
    justify-items: center;
    text-align: center;
    color: inherit;
    text-decoration: none;
    border: 1px solid #070808;
    border-radius: 9px;
    padding: 12px;
    background: linear-gradient(180deg, #303735, #111313);
  }

  .manager-token img { width: 68px; height: 68px; }
  .manager-token strong { font-size: 0.88rem; }
  .manager-token span { color: var(--muted); font-size: 0.78rem; }

  .story-card {
    display: grid;
    gap: 8px;
  }

  .manifesto-panel p { line-height: 1.55; }

  @media (max-width: 1000px) {
    .broadcast-hero,
    .split-layout,
    .command-grid { grid-template-columns: 1fr; }
    h1 { max-width: 11ch; }
  }

  @media (max-width: 620px) {
    .pregame-card { min-height: auto; }
    .hero-grid { min-height: auto; padding: 22px; }
    h1 { font-size: clamp(3rem, 16vw, 4.6rem); }
    .score-row { grid-template-columns: 46px 1fr 66px; }
    .studio-grid { grid-template-columns: 1fr; }
    .standings-row { grid-template-columns: 44px 1fr; }
    .record-block { grid-column: 2; text-align: left; }
    .live-ribbon { grid-template-columns: auto 1fr; }
    .live-ribbon em { display: none; }
  }
</style>
