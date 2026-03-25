<script>
  import { eventDisplay } from '$lib/events/displayNames';

  export let data;

  function fmtUnix(unix) {
    if (!unix) return '—';
    try {
      return new Date(Number(unix) * 1000).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return '—';
    }
  }

  function resultsStatus(e) {
    if (e?.resultsPublished) return { text: 'Published', cls: 'pill pill--gold' };
    return { text: 'Not published', cls: 'pill pill--muted' };
  }

  function lockStatus(e) {
    if (Number(e?.manual_lock) === 1) return { text: 'Locked (manual)', cls: 'pill pill--red' };
    if (Number(e?.manual_unlock) === 1) return { text: 'Open (manual)', cls: 'pill pill--green' };
    return { text: 'Auto', cls: 'pill pill--muted' };
  }
</script>

<div class="page">
  <div class="head">
    <div>
      <div class="kicker">Admin</div>
      <h1 class="h1">Events</h1>
      <div class="subtle">Manage results, publish, and recompute scoring.</div>
    </div>

    <span class="pill pill--gold">{data?.events?.length ?? 0} events</span>
  </div>

  <div class="grid">
    {#if data?.events?.length}
      {#each data.events as e (e.id)}
        <div class="card card--event">
          <!-- Top row -->
          <div class="card-top">
            <div class="event-cell">
              {#if eventDisplay(e).logo}
                <img class="logo" src={eventDisplay(e).logo} alt="" loading="lazy" />
              {/if}

              <div class="event-text">
                <div class="title">{eventDisplay(e).title}</div>
                {#if eventDisplay(e).subtitle}
                  <div class="subtitle">{eventDisplay(e).subtitle}</div>
                {/if}
                <div class="slug muted">/{e.slug}</div>
              </div>
            </div>

            <div class="top-right">
              <span class={resultsStatus(e).cls}>{resultsStatus(e).text}</span>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Body -->
          <div class="card-body">
            <!-- Locks -->
            <div class="block">
              <div class="label">Locks</div>
              <div class="value muted">{fmtUnix(e.lock_at)}</div>
            </div>

            <!-- Lock controls -->
            <div class="block">
              <div class="label">Lock</div>

              <div class="lockui">
                <div class="lockui-top">
                  <span class={lockStatus(e).cls}>{lockStatus(e).text}</span>
                </div>

                <form method="POST" action="?/setLockOverride" class="lock-actions">
                  <input type="hidden" name="eventId" value={e.id} />

                  {#if Number(e.manual_lock) === 1}
                    <button class="btn btn--seg" type="submit" name="mode" value="auto">Auto</button>
                    <button class="btn btn--seg" type="submit" name="mode" value="unlock">Unlock</button>
                  {:else if Number(e.manual_unlock) === 1}
                    <button class="btn btn--seg" type="submit" name="mode" value="auto">Auto</button>
                    <button class="btn btn--seg" type="submit" name="mode" value="lock">Lock</button>
                  {:else}
                    <button class="btn btn--seg" type="submit" name="mode" value="lock">Lock</button>
                    <button class="btn btn--seg" type="submit" name="mode" value="unlock">Unlock</button>
                  {/if}
                </form>
              </div>
            </div>

            <!-- Entries + Manage -->
            <div class="block entries-row">
              <div class="entries-left">
                <div class="label">Entries</div>
                <div class="value">
                  <span class="pill pill--muted entries-pill">{e.entriesSubmitted}</span>
                </div>
              </div>

              <a class="btn btn--vip btn--sm manage-btn" href={`/admin/events/${e.slug}/results`}>Manage</a>
            </div>
          </div>
        </div>
      {/each}
    {:else}
      <div class="muted">No events found.</div>
    {/if}
  </div>
</div>


<style>
  .page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 24px;
  }

  .head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }

  .kicker {
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    font-size: 0.78rem;
    opacity: 0.8;
  }

  .h1 {
    margin: 0;
    font-size: 1.85rem;
    letter-spacing: 0.2px;
  }

  .subtle {
    opacity: 0.7;
    margin-top: 6px;
  }

  .muted { opacity: 0.7; }

  /* Cards grid */
  .grid {
    display: grid;
    gap: 12px;
  }

  .card--event {
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(0,0,0,0.18);
    overflow: hidden;
    padding: 14px;
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
  }

  .top-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 140px;
  }

  .divider {
    height: 1px;
    background: rgba(255,255,255,0.08);
    margin: 10px 0;
  }

  /* Event cell */
  .event-cell {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    gap: 12px;
    align-items: center;
    min-width: 0;
  }

  .logo {
    width: 38px;
    height: 38px;
    border-radius: 11px;
    object-fit: cover;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(0,0,0,0.25);
  }

  .event-text {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .title {
    font-weight: 950;
    line-height: 1.12;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .subtitle {
    font-size: 0.85rem;
    line-height: 1.1;
    opacity: 0.72;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .slug {
    font-size: 0.78rem;
    opacity: 0.6;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Body blocks */
  .card-body {
    display: grid;
    grid-template-columns: 1fr 1.4fr 0.8fr;
    gap: 10px;
    align-items: start;
  }

  .block {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  .block--right {
    justify-items: end;
    text-align: right;
  }

  .label {
    font-weight: 900;
    opacity: 0.75;
    font-size: 0.78rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .value {
    font-weight: 700;
  }

  /* Pills */
  .pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    white-space: nowrap;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.04);
    font-size: 0.82rem;
    letter-spacing: 0.01em;
  }

  .pill--muted {
    border-color: rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.75);
  }

  .pill--gold {
    border-color: rgba(212,175,55,0.25);
    background: rgba(212,175,55,0.10);
    color: rgba(245,213,138,0.95);
  }

  .pill--red {
    border-color: rgba(255,120,120,0.25);
    background: rgba(255,120,120,0.08);
    color: rgba(255,220,220,0.95);
  }

  .pill--green {
    border-color: rgba(80,216,150,0.22);
    background: rgba(80,216,150,0.07);
    color: rgba(210,255,235,0.95);
  }
  .entries-row {
  grid-template-columns: 1fr auto;
  align-items: center;
}
.entries-left { display: grid; gap: 4px; }
.manage-btn { justify-self: end; }
  .entries-pill { min-width: 38px; }
.pill { height: 26px; padding: 0 10px; font-size: 0.80rem; }
.entries-pill { min-width: 34px; height: 24px; }
  /* Lock UI */
  .lockui { display: grid; gap: 6px; }

  .lock-actions {
    display: inline-flex;
    width: fit-content;
    border-radius: 12px;
    padding: 3px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(0,0,0,0.22);
    gap: 3px;
    flex-wrap: wrap;
  }

  /* Buttons */
  .btn {
    appearance: none;
    cursor: pointer;
    font-weight: 900;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.14);
    background: transparent;
    color: rgba(255,255,255,0.92);
    padding: 10px 12px;
    transition: border-color 0.14s ease, background 0.14s ease, transform 0.12s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .btn--sm { padding: 8px 12px; border-radius: 12px; font-size: 0.92rem; }

  .btn--vip {
    border-color: rgba(212,175,55,0.25);
    background: rgba(212,175,55,0.10);
  }

  .btn--vip:hover {
    border-color: rgba(212,175,55,0.35);
    background: rgba(212,175,55,0.14);
    transform: translateY(-1px);
  }

  .btn--seg {
    border: 0 !important;
    background: transparent !important;
    padding: 6px 9px;
    border-radius: 10px;
    font-size: 0.86rem;
  }

  .btn--seg:hover {
    background: rgba(255,255,255,0.06) !important;
  }

  .btn:active { transform: translateY(1px); }

  .card-foot {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  /* Mobile: stack everything, prevent overflow */
  @media (max-width: 820px) {
    .page { padding: 16px; }

    .top-right { min-width: 0; }

    .card-body {
      grid-template-columns: 1fr;
      gap: 14px;
    }

    .block--right {
      justify-items: start;
      text-align: left;
    }

    .lock-actions {
      width: 100%;
      justify-content: space-between;
    }

    .lock-actions .btn--seg {
      flex: 1 1 auto;
      min-width: 90px;
      text-align: center;
    }
  }

  @media (max-width: 820px) {
  .card--event { padding: 12px; }
  .card-body { gap: 12px; }

  .entries-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    width: 100%;
  }

  .manage-btn { padding: 8px 12px; }
}
</style>
