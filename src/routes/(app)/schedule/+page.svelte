<script>
  import { onMount } from 'svelte';
  import { eventDisplay } from '$lib/events/displayNames';

  export let data;
  const events = data.events ?? [];
  const myEntries = data.myEntries ?? {};

  let now = Math.floor(Date.now() / 1000);

  onMount(() => {
    // Update once per minute (keeps countdown fresh without being noisy)
    const t = setInterval(() => {
      now = Math.floor(Date.now() / 1000);
    }, 60_000);
    return () => clearInterval(t);
  });

  function isPast(e) {
    return Number(e.start_at) <= now;
  }

  function isLocked(e) {
    return Number(e.lock_at) <= now;
  }

  function fmtDateTime(unix) {
    if (!unix) return '';
    return new Date(Number(unix) * 1000).toLocaleString();
  }

  function fmtMonth(unix) {
    if (!unix) return '';
    const d = new Date(Number(unix) * 1000);
    return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  }

  function groupByMonth(list) {
    const out = [];
    const map = new Map();

    for (const e of list) {
      const key = fmtMonth(e.start_at);
      if (!map.has(key)) {
        const bucket = { key, items: [] };
        map.set(key, bucket);
        out.push(bucket);
      }
      map.get(key).items.push(e);
    }
    return out;
  }

  function hasEntry(e) {
    return Boolean(myEntries?.[e.id]?.id);
  }

  function statusLabel(e) {
    if (isPast(e)) return 'Complete';
    if (isLocked(e)) return 'Locked';
    if (hasEntry(e)) return 'Submitted';
    return 'Not submitted';
  }

  function statusClass(e) {
    // keep this aligned with your lounge pills
    if (isPast(e)) return 'pill pill--gold';
    if (isLocked(e)) return 'pill pill--red';
    if (hasEntry(e)) return 'pill pill--green';
    return 'pill';
  }

  function fmtDuration(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);

    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  function locksInText(e) {
    if (!e?.lock_at) return '';
    const diff = Number(e.lock_at) - now;
    if (diff <= 0) return 'Locked';
    return `Locks in ${fmtDuration(diff)}`;
  }

  function locksInClass(e) {
    const diff = Number(e.lock_at) - now;
    if (diff <= 0) return 'muted';
    if (diff <= 3600) return 'urgency urgency--hot';        // < 1 hour
    if (diff <= 86400) return 'urgency urgency--warm';      // < 24 hours
    return 'muted';
  }

  $: upcoming = events.filter((e) => !isPast(e));
  $: past = events.filter((e) => isPast(e)).slice().reverse(); // most recent first

  $: upcomingByMonth = groupByMonth(upcoming);
  $: pastByMonth = groupByMonth(past);
</script>

<div class="page-wide">
  <div class="card card--glow">
    <div class="kicker">Schedule</div>
    <h1 class="h1">All Events</h1>
    <p class="subtle" style="margin-top: 10px;">
      Everything on deck — with lock times and quick entry links.
    </p>
  </div>

  <div class="spacer"></div>

  <div class="grid">
    <div class="card">
      <div class="section-head">
        <div>
          <div class="kicker">Next up</div>
          <h2 class="h2" style="margin:0;">Upcoming</h2>
        </div>
        <span class="pill pill--green">{upcoming.length} upcoming</span>
      </div>

      {#if upcoming.length === 0}
        <div class="muted" style="margin-top: 12px;">Nothing upcoming yet.</div>
      {:else}
        {#each upcomingByMonth as bucket (bucket.key)}
          <div class="month">
            <div class="month-label">{bucket.key}</div>

            <div class="list">
              {#each bucket.items as e (e.id)}
                <a class="row" href={`/games/${e.slug}`}>
                  <div class="left">
                    {#if eventDisplay(e).logo}
                      <img
                        class="logo"
                        src={eventDisplay(e).logo}
                        alt={`${eventDisplay(e).title} logo`}
                        loading="lazy"
                      />
                    {/if}

                    <div class="titles">
                      <div class="title-row">
                        <div class="title">{eventDisplay(e).title}</div>
                        <span class={statusClass(e)}>{statusLabel(e)}</span>
                      </div>

                      {#if eventDisplay(e).subtitle}
                        <div class="subtitle">{eventDisplay(e).subtitle}</div>
                      {/if}

                      <div class="meta muted">
                        <span>Locks: {fmtDateTime(e.lock_at)}</span>
                        {#if e.type}<span class="dot">•</span><span>Type: {e.type}</span>{/if}
                      </div>

                      <div class={locksInClass(e)} style="margin-top:6px;">
                        {locksInText(e)}
                      </div>
                    </div>
                  </div>

                  <div class="right">
                    <span class="cta">Enter →</span>
                  </div>
                </a>
              {/each}
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <div class="card">
      <div class="section-head">
        <div>
          <div class="kicker">History</div>
          <h2 class="h2" style="margin:0;">Past</h2>
        </div>
        <span class="pill pill--gold">{past.length} completed</span>
      </div>

      {#if past.length === 0}
        <div class="muted" style="margin-top: 12px;">No completed events yet.</div>
      {:else}
        {#each pastByMonth as bucket (bucket.key)}
          <div class="month">
            <div class="month-label">{bucket.key}</div>

            <div class="list">
              {#each bucket.items as e (e.id)}
                <a class="row" href={`/games/${e.slug}`}>
                  <div class="left">
                    {#if eventDisplay(e).logo}
                      <img
                        class="logo"
                        src={eventDisplay(e).logo}
                        alt={`${eventDisplay(e).title} logo`}
                        loading="lazy"
                      />
                    {/if}

                    <div class="titles">
                      <div class="title-row">
                        <div class="title">{eventDisplay(e).title}</div>
                        <span class={statusClass(e)}>{statusLabel(e)}</span>
                      </div>

                      {#if eventDisplay(e).subtitle}
                        <div class="subtitle">{eventDisplay(e).subtitle}</div>
                      {/if}

                      <div class="meta muted">
                        <span>Started: {fmtDateTime(e.start_at)}</span>
                        {#if e.type}<span class="dot">•</span><span>Type: {e.type}</span>{/if}
                      </div>

                      {#if myEntries?.[e.id]?.submitted_at}
                        <div class="muted" style="margin-top:6px;">
                          You submitted: {fmtDateTime(myEntries[e.id].submitted_at)}
                        </div>
                      {/if}
                    </div>
                  </div>

                  <div class="right">
                    <span class="cta">View →</span>
                  </div>
                </a>
              {/each}
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>

<style>
  .spacer { height: 16px; }

  .page-wide {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px;
    box-sizing: border-box;
  }
  @media (max-width: 640px) {
    .page-wide { padding: 0 14px; }
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    align-items: start;
  }
  @media (max-width: 980px) {
    .grid { grid-template-columns: 1fr; }
  }

  .month { margin-top: 14px; }
  .month-label {
    font-size: 0.85rem;
    opacity: 0.75;
    margin: 10px 0 8px;
    letter-spacing: 0.02em;
  }

  .list {
    display: grid;
    gap: 10px;
  }

  .row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
    text-decoration: none;
    color: inherit;

    padding: 12px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(0,0,0,0.22);
    transition: transform 0.10s ease, border-color 0.2s ease, background 0.2s ease;
  }
  .row:hover {
    transform: translateY(-1px);
    border-color: rgba(214,177,94,0.28);
    background: rgba(214,177,94,0.06);
  }

  .left {
    display: flex;
    gap: 10px;
    min-width: 0;
    flex: 1 1 auto;
  }

  .logo {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    object-fit: cover;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(0,0,0,0.25);
    flex: 0 0 auto;
    margin-top: 2px;
  }

  .titles {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .title-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
  }

  .title {
    font-weight: 700;
    line-height: 1.2;
    min-width: 0;
  }

  .subtitle {
    font-size: 0.82rem;
    opacity: 0.65;
    line-height: 1.2;
  }

  .meta {
    margin-top: 6px;
    font-size: 0.82rem;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .dot { opacity: 0.55; }

  .right {
    display: grid;
    gap: 8px;
    justify-items: end;
    flex: 0 0 auto;
    padding-top: 2px;
  }

  .cta {
    color: rgba(245,213,138,0.95);
    font-weight: 700;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .urgency {
    font-size: 0.82rem;
    font-weight: 650;
    letter-spacing: 0.01em;
  }

  .urgency--warm {
    color: rgba(245, 213, 138, 0.95);
  }

  .urgency--hot {
    color: rgba(255, 120, 120, 0.95);
  }
</style>
