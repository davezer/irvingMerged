<script>
  import Card from '$lib/ui/Card.svelte';
  import SectionHeader from '$lib/ui/SectionHeader.svelte';
  import Pill from '$lib/ui/Pill.svelte';
  import { eventDisplay } from '$lib/events/displayNames';

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
</script>

<Card variant="glow">
  <div class="kicker">Offseason</div>
  <h1 class="h1">Games</h1>
  <p class="subtle" style="margin-top:10px;">
    Picks close at lock time. After that… no mercy.
  </p>
</Card>

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

  @media (max-width: 900px) {
    .grid { grid-template-columns: 1fr; }
  }
</style>
