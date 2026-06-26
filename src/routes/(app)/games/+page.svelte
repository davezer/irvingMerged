<script>
  import Card from '$lib/ui/Card.svelte';
  import SectionHeader from '$lib/ui/SectionHeader.svelte';
  import Pill from '$lib/ui/Pill.svelte';
  import { eventDisplay } from '$lib/events/displayNames';
  import { page } from '$app/stores';

  export let data;
  const { events = [] } = data;

  const nowSec = () => Math.floor(Date.now() / 1000);

  function statusFor(e) {
    const now = nowSec();
    const lock = Number(e.lock_at);
    if (now >= lock) return { text: 'Locked', tone: 'red' };
    return { text: 'Upcoming', tone: 'green' };
  }

  function pretty(ts) {
    return new Date(Number(ts) * 1000).toLocaleString();
  }

   const gamesNav = [
    { href: '/games', label: 'Games Floor', meta: 'Events' },
    { href: '/leaderboard', label: 'Leaderboard', meta: 'Offseason board' }
  ];

  $: currentPath = $page.url.pathname;

  function gamesNavActive(href) {
    if (href === '/games') return currentPath === '/games' || currentPath.startsWith('/games/');
    return currentPath === href || currentPath.startsWith(`${href}/`);
  }
</script>

<!-- <Card variant="glow">
  <div class="kicker">Offseason</div>
  <h1 class="h1">Games</h1>
  <p class="subtle" style="margin-top:10px;">
    Picks close at lock time. After that… no mercy.
  </p>
</Card> -->

<nav class="games-subnav" aria-label="Games navigation">
  <span class="games-bug">ICN</span>

  {#each gamesNav as item}
    <a class:active={gamesNavActive(item.href)} href={item.href}>
      <strong>{item.label}</strong>
      <small>{item.meta}</small>
    </a>
  {/each}
</nav>

<div style="height:16px;"></div>

<Card variant="default">
  <SectionHeader kicker="Schedule" title="All Events">
    <Pill tone="gold">{events.length} events</Pill>
  </SectionHeader>

  <div class="grid" style="margin-top: 14px;">
    {#if events.length === 0}
      <div class="muted">No events yet.</div>
    {:else}
      {#each events as e (e.id)}
        {@const st = statusFor(e)}

        <a class="event" href={`/games/${e.slug}`}>
          <div class="event-top">
            <div class="event-titlewrap">
              <div class="event-name-row">
                {#if eventDisplay(e).logo}
                  <img
                    class="event-logo"
                    src={eventDisplay(e).logo}
                    alt={`${eventDisplay(e).title} logo`}
                    loading="lazy"
                  />
                {/if}

                <div class="event-name">{eventDisplay(e).title}</div>
              </div>

              {#if eventDisplay(e).subtitle}
                <div class="event-subtitle">{eventDisplay(e).subtitle}</div>
              {/if}
            </div>

            <Pill tone={st.tone}>{st.text}</Pill>
          </div>


          <div class="event-meta">
            <span class="muted">Locks</span>
            <span class="subtle">{pretty(e.lock_at)}</span>
          </div>

          <div class="event-meta">
            <span class="muted">Type</span>
            <span class="subtle">{e.type}</span>
          </div>

          <div class="event-cta">
            <span class="cta">Enter →</span>
          </div>
        </a>
      {/each}
    {/if}
  </div>
</Card>



<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .event {
    text-decoration: none;
    color: inherit;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(0,0,0,0.22);
    padding: 14px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.25);
    transition: transform 0.10s ease, border-color 0.2s ease, background 0.2s ease;
    display: grid;
    gap: 10px;
  }

  .event:hover {
    transform: translateY(-1px);
    border-color: rgba(214,177,94,0.28);
    background: rgba(214,177,94,0.06);
  }

  .event-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    flex-wrap: wrap;
  }
.event-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.event-logo {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  object-fit: cover;
  flex: 0 0 auto;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.25);
}
  .event-titlewrap {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .event-name {
    font-family: ui-serif, "Iowan Old Style", "Palatino Linotype", Palatino, Garamond, Georgia, serif;
    letter-spacing: 0.2px;
    font-size: 18px;
    line-height: 1.2;
  }

  .event-subtitle {
    font-size: 0.82rem;
    opacity: 0.65;
    line-height: 1.2;
  }

  .event-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    border-top: 1px solid rgba(255,255,255,0.06);
    padding-top: 10px;
  }

  .event-cta {
    display: flex;
    justify-content: flex-end;
    margin-top: 2px;
  }

  .cta {
    color: rgba(245,213,138,0.95);
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .games-subnav {
  display: flex;
  align-items: stretch;
  gap: 7px;
  flex-wrap: wrap;
  margin: 16px 0;
  padding: 7px;
  border: 2px solid #070808;
  border-radius: 10px;
  background: linear-gradient(180deg, #6a716e, #2d3331 46%, #0d0f0f);
  box-shadow: var(--shadow-bug);
}

.games-bug,
.games-subnav a {
  min-height: 42px;
  border: 1px solid #050606;
  border-radius: 5px;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.24),
    inset 0 -2px 0 rgba(0,0,0,0.45);
}

.games-bug {
  display: inline-grid;
  place-items: center;
  padding: 0 13px;
  color: #fff;
  background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));
  font-family: var(--font-score);
  font-weight: 950;
}

.games-subnav a {
  display: grid;
  align-content: center;
  gap: 2px;
  min-width: 170px;
  padding: 7px 12px;
  color: rgba(247,245,235,0.86);
  background: linear-gradient(180deg, #4f5754, #202625 55%, #0b0d0d);
  text-decoration: none;
}

.games-subnav a strong {
  font-family: var(--font-score);
  font-size: 0.78rem;
  line-height: 1;
  text-transform: uppercase;
}

.games-subnav a small {
  color: rgba(247,245,235,0.58);
  font-size: 0.68rem;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.games-subnav a:hover,
.games-subnav a.active {
  color: #111;
  background: linear-gradient(180deg, #fffdf3, #cfd1c9 52%, #8a918c);
}

.games-subnav a:hover small,
.games-subnav a.active small {
  color: rgba(0,0,0,0.7);
}

  @media (max-width: 900px) {
    .grid { grid-template-columns: 1fr; }
  }
</style>
