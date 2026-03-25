<script>
  import { getLeaderboardBreakdownComponent } from '$lib/games/leaderboard/index.js';
  import { eventDisplay } from '$lib/events/displayNames';
  import Pill from '$lib/ui/Pill.svelte';
  export let data;

  let expanded = new Set(); // user_id set

  function toggleUser(userId) {
    const next = new Set(expanded);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    expanded = next;
  }

  function fmtDate(unix) {
    if (!unix) return '';
    return new Date(Number(unix) * 1000).toLocaleDateString();
  }

  function hasAnyBreakdown(ev) {
    return Boolean(ev?.totals || ev?.breakdown);
  }

    function evTitle(ev) {
    // ev.slug is strongly preferred. If it's missing, we fall back to official name.
    return eventDisplay({ slug: ev?.slug, name: ev?.event_name }).title;
  }

  function evSubtitle(ev) {
    return eventDisplay({ slug: ev?.slug, name: ev?.event_name }).subtitle;
  }

  function evIsPast(ev) {
  if (!ev?.start_at) return false;
  const now = Math.floor(Date.now() / 1000);
  return now >= Number(ev.start_at);
}

function evStatusText(ev) {
  return evIsPast(ev) ? 'Complete' : 'Upcoming';
}

function evStatusClass(ev) {
  return evIsPast(ev) ? 'pill pill--gold' : 'pill pill--green';
}

$: leaderPoints = Number(data?.totals?.[0]?.points ?? 0) || 1;
function pct(points) {
  const p = Number(points ?? 0);
  return Math.max(0, Math.min(100, Math.round((p / leaderPoints) * 100)));
}

$: top3 = (data?.totals || []).slice(0, 3);

 const ALL = 'all';
  $: gameTypes = (() => {
    const s = new Set();
    for (const uid of Object.keys(data.byUser || {})) {
      for (const ev of data.byUser[uid] || []) {
        if (ev?.type) s.add(ev.type);
      }
    }
    return Array.from(s);
  })();

  let gameFilter = ALL;

  function prettyGameLabel(type) {
    // Keep it simple and lounge-y (you can expand later)
    if (type === 'daytona') return 'Daytona';
    if (type === 'madness') return 'Madness';
    return type?.charAt(0).toUpperCase() + type?.slice(1);
  }

  function pointsForUser(userId) {
    if (gameFilter === ALL) {
      // use server totals as source of truth for overall
      const row = (data.totals || []).find((r) => r.user_id === userId);
      return Number(row?.points ?? 0);
    }
    const evs = data.byUser?.[userId] || [];
    return evs
      .filter((ev) => ev?.type === gameFilter)
      .reduce((sum, ev) => sum + Number(ev?.points ?? 0), 0);
  }

  $: filteredTotals = (() => {
    // Use the displayed users from data.totals as the "roster"
    const base = (data.totals || []).map((r) => ({
      user_id: r.user_id,
      display_name: r.display_name,
      points: pointsForUser(r.user_id)
    }));

    base.sort((a, b) => b.points - a.points);

    // Rank with ties (1,2,2,4 style)
    let rank = 0;
    let lastPoints = null;
    let seen = 0;

    return base.map((r) => {
      seen++;
      if (lastPoints === null || r.points !== lastPoints) rank = seen;
      lastPoints = r.points;
      return { ...r, rank };
    });
  })();



</script>

<div class="card">
  <div class="section-head">
    <div>
      <div class="kicker">Overall</div>
      <h2 class="h2" style="margin: 0;">Totals</h2>
      <div class="muted" style="margin-top:6px;">
        {#if data.updated_at}
          Updated {fmtDate(data.updated_at)}
        {:else}
          Updated recently
        {/if}
      </div>
    </div>

    <span class="pill pill--gold">{filteredTotals?.length ?? 0} players</span>
    <div class="filters">
  <button
    type="button"
    class={"seg " + (gameFilter === ALL ? "seg--on" : "")}
    on:click={() => (gameFilter = ALL)}
  >
    Overall
  </button>

  {#each gameTypes as t (t)}
    <button
      type="button"
      class={"seg " + (gameFilter === t ? "seg--on" : "")}
      on:click={() => (gameFilter = t)}
    >
      {prettyGameLabel(t)}
    </button>
  {/each}
</div>

  </div>
    {#if top3.length}
      <div class="podium">
        {#each top3 as p (p.user_id)}
          <button
            type="button"
            class={"podium-card " + (p.rank === 1 ? 'podium-1' : p.rank === 2 ? 'podium-2' : 'podium-3')}
            on:click={() => toggleUser(p.user_id)}
            aria-expanded={expanded.has(p.user_id)}
          >
            <div class="podium-rank">{p.rank === 1 ? '♛' : `#${p.rank}`}</div>
            <div class="podium-name">{p.display_name}</div>
            <div class="podium-points">{p.points}</div>
            <div class="podium-sub muted">{expanded.has(p.user_id) ? 'Hide breakdown' : 'View breakdown'}</div>
          </button>
        {/each}
      </div>
    {/if}

  <div class="table-wrap">
    <table class="lb">
      <colgroup>
        <col class="col-rank" />
        <col />
        <col class="col-points" />
      </colgroup>

      <thead>
        <tr>
          <th class="rank-h">Rank</th>
          <th class="gm-h">GM</th>
          <th class="right points-h">Points</th>
        </tr>
      </thead>

      <tbody>
        {#each filteredTotals as row (row.user_id)}
          <tr class={"row " + (row.rank === 1 ? 'row-leader' : '')}>
            <td class="rank">{row.rank}</td>

            <td class="gm">
              <button
                type="button"
                class={"gm-btn " + (expanded.has(row.user_id) ? 'is-open' : '')}
                on:click={() => toggleUser(row.user_id)}
                aria-expanded={expanded.has(row.user_id)}
              >
                <span class="chev">▸</span>
                <span class="name">{row.display_name}</span>
              </button>
            </td>

            <td class="right points">
              <div class="points-wrap">
                <div class="bar">
                  <div class="bar-fill" style={"width:" + pct(row.points) + "%"}></div>
                </div>
                <div class="points-num">{row.points}</div>
              </div>
            </td>
          </tr>

          {#if expanded.has(row.user_id)}
            <tr class="detail">
              <td colspan="3">
                <div class="detail-inner">
                  {#if data.byUser?.[row.user_id]?.length}
                    {#each (gameFilter === ALL
                      ? data.byUser[row.user_id]
                      : (data.byUser[row.user_id] || []).filter((ev) => ev?.type === gameFilter)
                    ) as ev (ev.event_id)}
                      <div class="ev">
                        <div class="ev-head">
                          <div class="event-top">
                            <div class="event-titlewrap">
                              <div class="event-name-row">
                                {#if eventDisplay(ev).logo}
                                  <img
                                    class="event-logo"
                                    src={eventDisplay(ev).logo}
                                    alt={`${eventDisplay(ev).title} logo`}
                                    loading="lazy"
                                  />
                                {/if}

                                <div class="event-text">
                                  <div class="event-name">{eventDisplay(ev).title}</div>
                                  {#if eventDisplay(ev).subtitle}
                                    <div class="event-subtitle">{eventDisplay(ev).subtitle}</div>
                                  {/if}
                                </div>

                                <span class={evStatusClass(ev)}>{evStatusText(ev)}</span>
                              </div>
                            </div>
                          </div>

                          <div class="ev-points">{ev.points}</div>
                        </div>

                        {#if hasAnyBreakdown(ev)}
                          {#if ev?.type}
                            {@const Breakdown = getLeaderboardBreakdownComponent(ev.type)}
                            {#if Breakdown}
                              <svelte:component
                                this={Breakdown}
                                ev={ev}
                                row={ev}
                                breakdown={ev.breakdown}
                                totals={ev.totals}
                                points={ev.points}
                                teamLogoById={data.teamLogoById}
                              />
                            {:else}
                              <div class="muted" style="margin-top: 8px;">
                                No breakdown renderer registered for <code>{ev.type}</code>.
                              </div>
                            {/if}
                          {:else}
                            <div class="muted" style="margin-top: 8px;">Missing event type.</div>
                          {/if}
                        {:else}
                          <div class="muted" style="margin-top: 8px;">No breakdown available.</div>
                        {/if}
                      </div>

                      
                    {/each}
                  {:else}
                    <div class="muted">No scored events yet.</div>
                  {/if}
                </div>
              </td>
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
  </div>
</div>
<style>
  .right { text-align: right; }

  .table-wrap {
    margin-top: 12px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(0,0,0,0.18);
    overflow: hidden; /* keeps rounded corners */
  }

  table.lb {
    width: 100%;
    border-collapse: collapse;
  }

  thead th {
    text-align: left;
    padding: 14px 16px;
    font-weight: 800;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }

  tbody td {
    padding: 14px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    vertical-align: top;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  .points {
    font-weight: 950;
  }

  .gm-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: transparent;
    border: 0;
    color: inherit;
    cursor: pointer;
    padding: 0;
    font: inherit;
  }

  .gm-btn:hover .name { text-decoration: underline; }

.chev {
  width: 14px;
  display: inline-block;
  opacity: 0.85;
  transform: translateY(-1px);
  transition: transform 140ms ease;
}

.gm-btn.is-open .chev {
  transform: translateY(-1px) rotate(90deg);
}

  /* --- Fun name + official subtitle styling in expanded events --- */
  .ev-name {
    font-weight: 650;
    line-height: 1.2;
  }

  .ev-subname {
    margin-top: 2px;
    font-size: 0.78rem;
    opacity: 0.7;
    line-height: 1.2;
  }
.event-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.event-logo {
  width: 95px;
  height: 95px;
  border-radius: 55px;
  object-fit: cover;
  flex: 0 0 auto;
  border: 1px solid rgba(131, 118, 3, 0.637);
  background: rgba(0,0,0,0.25);
}
  /* Expanded section inside table */
  tr.detail td {
    padding: 0 16px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .detail-inner {
    margin-top: 8px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(0,0,0,0.20);
    padding: 12px 14px;
  }

  .ev {
    padding: 10px 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .ev:last-child { border-bottom: 0; }

  .ev-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 14px;
  }

  .ev-name {
    font-weight: 850;
    font-size: 1.02rem;
  }

  .ev-date { margin-top: 2px; }

  .ev-points {
    font-weight: 950;
    min-width: 60px;
    text-align: right;
  }

  /* Chips */
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }

  .chip {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
  }

  .chip--badge {
    border-color: rgba(255,210,120,0.22);
    background: rgba(255,210,120,0.06);
  }

  .muted { opacity: 0.75; }

  /* Tighten table column widths */
table.lb {
  table-layout: fixed; /* makes colgroup widths actually matter */
}

/* Give Rank a fixed compact width, keep Points compact too */
table.lb col.col-rank { width: 64px; }
table.lb col.col-points { width: 90px; }
/* GM takes the rest automatically */

/* Reduce padding a bit so it feels tighter */
thead th,
tbody td {
  padding: 12px 12px; /* was 14px 16px */
}

/* Make the GM cell sit closer to Rank */
td.rank { padding-right: 6px; }
td.gm { padding-left: 6px; }

/* Keep the GM button compact */
.gm-btn { gap: 8px; }
.chev { width: 14px; }
/* ---------------------------
   COMPACT MODE OVERRIDES
---------------------------- */

/* Overall container padding tighter */
.detail-inner {
  padding: 10px 12px;            /* was 12px 14px */
}

/* Each event block: less vertical space */
.ev {
  padding: 8px 0;                /* was 10px 0 */
}

/* Make the event header align nicely and reduce height */
.event-top {
  display: grid;
  grid-template-columns: auto 1fr auto;  /* logo | text | status */
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

/* Smaller logo */
.event-logo {
  width: 64px;                   /* was 95px */
  height: 64px;
  border-radius: 18px;           /* was 55px */
}

/* Title + subtitle tighter */
.event-name {
  font-weight: 850;
  font-size: 1rem;               /* slightly smaller */
  line-height: 1.15;
}

.event-subtitle {
  margin-top: 2px;
  font-size: 0.78rem;
  opacity: 0.7;
  line-height: 1.15;
}

/* Status pill smaller */
.pill {
  padding: 6px 10px;
  font-size: 0.82rem;
}

/* Points in the top-right: tighter and aligned */
.ev-points {
  font-weight: 950;
  min-width: 52px;
  text-align: right;
  font-size: 0.95rem;
}

/* Chips: smaller + less vertical space */
.chips {
  gap: 6px;                      /* was 8px */
  margin-top: 8px;               /* was 10px */
}

.chip {
  padding: 5px 9px;              /* was 6px 10px */
  gap: 7px;                      /* was 8px */
  font-size: 0.9rem;
}

.chip .k {
  font-size: 0.78rem;            /* was 0.85rem */
}

.chip .v {
  font-size: 0.9rem;             /* was 0.95rem */
}

/* If you added the mini logo inside chips, keep it tiny */
.chip img.logo {
  width: 16px;
  height: 16px;
}

/* Tighten table row padding slightly (optional) */
tbody td {
  padding: 10px 12px;            /* was 12px 12px */
}
.detail-inner {
  border-radius: 12px;
  background: rgba(0,0,0,0.14);  /* slightly lighter */
  border: 1px solid rgba(255,255,255,0.08);
}

.event-subtitle { display: none; }

/* --- tighter expanded rows --- */
.detail-inner {
  padding: 8px 10px;
}

/* Event block tighter */
.ev {
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.ev:last-child { border-bottom: 0; }

/* Head row: logo/title/status on left, points on right */
.ev-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* Keep header compact */
.event-top { width: 100%; }

/* Row with logo + text + status */
.event-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

/* Slightly smaller logo */
.event-logo {
  width: 56px;
  height: 56px;
  border-radius: 16px;
}

/* Text tighter */
.event-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.event-name {
  font-weight: 900;
  font-size: 0.98rem;
  line-height: 1.1;
}

.event-subtitle {
  font-size: 0.75rem;
  opacity: 0.65;
  line-height: 1.1;
}

/* ✅ Status pill should NOT expand — make it auto sized */
.event-name-row > .pill {
  flex: 0 0 auto;
  width: auto;
  white-space: nowrap;
  padding: 6px 10px;
  font-size: 0.8rem;
  justify-self: end;
}

/* Points tighter */
.ev-points {
  min-width: 52px;
  text-align: right;
  font-weight: 950;
  font-size: 0.95rem;
}

/* Chips tighter and closer to header */
.chips {
  margin-top: 8px;
  gap: 6px;
}

/* Smaller chips */
.chip {
  padding: 5px 9px;
  gap: 7px;
}

.chip .k { font-size: 0.78rem; }
.chip .v { font-size: 0.9rem; }

/* If you have chip logos */
.chip img.logo {
  width: 15px;
  height: 15px;
}
.section-head .h2 {
  font-size: 1.2rem;
}
.kicker {
  letter-spacing: 0.12em;
  font-size: 0.72rem;
}

.podium {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
  margin-bottom: 12px;
}

.podium-card {
  text-align: left;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.20);
  border-radius: 18px;
  padding: 14px 14px 12px;
  cursor: pointer;
  color: inherit;
  transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
}

.podium-card:hover {
  transform: translateY(-2px);
  border-color: rgba(212,175,55,0.22);
  background: rgba(0,0,0,0.26);
}

.podium-1 {
  border-color: rgba(212,175,55,0.35);
  box-shadow: 0 0 0 1px rgba(212,175,55,0.10) inset;
}

.podium-rank { font-weight: 950; font-size: 1.1rem; opacity: 0.95; }
.podium-name { font-weight: 900; font-size: 1.05rem; margin-top: 6px; }
.podium-points { font-weight: 950; font-size: 1.4rem; margin-top: 6px; }
.podium-sub { margin-top: 6px; font-size: 0.85rem; }
@media (max-width: 900px) {
  .podium { grid-template-columns: 1fr; }
}
.points-wrap {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}

.bar {
  width: 140px;
  height: 8px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.22);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: rgba(212,175,55,0.32);
  border-right: 1px solid rgba(212,175,55,0.28);
}

.points-num { min-width: 52px; text-align: right; font-weight: 950; }
@media (max-width: 900px) {
  .bar { width: 90px; }
}
.row-leader td {
  background: rgba(212,175,55,0.06);
}
.row-leader td:first-child {
  box-shadow: 3px 0 0 rgba(212,175,55,0.30) inset;
}

.detail-inner {
  animation: drop 140ms ease-out;
  transform-origin: top;
}
@keyframes drop {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.chev { transition: transform 120ms ease; }
.gm-btn[aria-expanded="true"] .chev { transform: rotate(90deg) translateY(-1px); }

.filters {
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.seg {
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.18);
  color: rgba(255,255,255,0.85);
  padding: 7px 10px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease, transform 120ms ease;
}

.seg:hover {
  transform: translateY(-1px);
  border-color: rgba(212,175,55,0.22);
  background: rgba(0,0,0,0.24);
}

.seg--on {
  border-color: rgba(212,175,55,0.35);
  background: rgba(212,175,55,0.08);
  color: rgba(255,255,255,0.95);
}



</style>
