<script>
  import { onMount } from 'svelte';
  import { eventDisplay } from '$lib/events/displayNames';
  import { getGameComponent, gameNeedsOptions } from '$lib/games/index.js';

  export let data;

  // keep results as you had it
  const results = data.results;

  // ✅ include bankroll
  let event, locked, entry, bankroll;
  $: ({ event, locked, entry, bankroll } = data);

  $: Game = getGameComponent(event?.type);

  let optionsMode = '';
  let optionsNote = '';
  let loading = false;
  let loadError = '';
  let options = [];

  async function fetchOptionsWithTimeout() {
    loading = true;
    loadError = '';
    optionsMode = '';
    optionsNote = '';

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(`/api/events/${event.slug}/options`, {
        signal: controller.signal
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Failed to load options (${res.status})`);
      }

      const body = await res.json();
      options = body.options || [];
      optionsMode = body.mode || '';
      optionsNote = body.note || '';
    } catch (e) {
      loadError =
        e?.name === 'AbortError'
          ? 'Timed out loading options. Try again.'
          : e?.message || 'Failed to load options';
    } finally {
      clearTimeout(t);
      loading = false;
    }
  }

  onMount(() => {
    if (event && gameNeedsOptions(event.type)) {
      fetchOptionsWithTimeout();
    }
  });

  $: names = eventDisplay(event);
  $: lockLabel = event?.lock_at ? new Date(Number(event.lock_at) * 1000).toLocaleString() : '';
  $: statusPillClass = locked ? 'pill pill--red' : 'pill pill--green';
  $: statusText = locked ? 'Locked' : 'Open';

  function isLockedLocal(e) {
    if (!e?.lock_at) return false;
    const now = Math.floor(Date.now() / 1000);
    return now >= Number(e.lock_at);
  }
  function statusTextLocal(e) {
    return isLockedLocal(e) ? 'Locked' : 'Upcoming';
  }
  function statusClassLocal(e) {
    return isLockedLocal(e) ? 'pill pill--red' : 'pill pill--green';
  }
</script>

<div class="page-wide">
  <div class="card card--glow">
    <div class="kicker">Event</div>

    <div class="event-top">
      <div class="event-titlewrap">
        <div class="event-name-row">
          {#if names.logo}
            <img class="event-logo" src={names.logo} alt={`${names.title} logo`} loading="lazy" />
          {/if}
          <div class="event-name">{names.title}</div>
        </div>

        {#if names.subtitle}
          <div class="event-subtitle">{names.subtitle}</div>
        {/if}
      </div>

      <span class={statusClassLocal(event)}>{statusTextLocal(event)}</span>
    </div>

    <div class="meta-row">
      <span class="pill pill--gold">Locks: {lockLabel}</span>
      <span class={statusPillClass}>{statusText}</span>
      {#if event?.type}
        <span class="pill">Type: {event.type}</span>
      {/if}
    </div>

    <!-- {#if optionsMode}
      <div class="debug">
        <div class="muted">Options mode: {optionsMode}</div>
        {#if optionsNote}
          <div class="muted">{optionsNote}</div>
        {/if}
      </div>
    {/if} -->
  </div>
</div>

<div class="spacer"></div>

{#if !Game}
  <div class="card">
    <div class="section-head">
      <h2 class="h2">Coming Soon</h2>
      <span class="pill">Not wired</span>
    </div>
    <p class="subtle" style="margin-top: 10px;">This event type isn’t wired yet.</p>
  </div>
{:else}
  <svelte:component
    this={Game}
    {event}
    {locked}
    {entry}
    {options}
    {loading}
    {loadError}
    {results}
    {bankroll}
    onRetryOptions={fetchOptionsWithTimeout}
  />
{/if}

<style>
  .spacer { height: 16px; }

  .meta-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
    margin-top: 14px;
  }

  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .event-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-top: 8px;
    flex-wrap: wrap;
  }

  .event-titlewrap {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
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
    border: 1px solid rgba(255, 255, 255, 0.10);
    background: rgba(0, 0, 0, 0.25);
  }

  .event-subtitle {
    margin-top: 4px;
    font-size: 0.85rem;
    opacity: 0.65;
    line-height: 1.2;
  }

  .debug {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    display: grid;
    gap: 6px;
  }

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
</style>
