<!-- src/lib/games/worldcup/LeaderboardBreakdown.svelte -->
<script>
  import { WORLD_CUP_ROUND_LABELS } from '$lib/scoring/worldCup.js';
  export let breakdown;

  $: rounds = breakdown?.rounds || [];
  $: eliminated = Boolean(breakdown?.eliminated);
  $: total = breakdown?.totals?.total ?? 0;

  function clsFor(status) {
    if (status === 'advanced') return 'pill pill--green';
    if (status === 'eliminated') return 'pill pill--red';
    if (status === 'invalid') return 'pill pill--red';
    return 'pill pill--muted';
  }

  function labelFor(status) {
    if (status === 'advanced') return 'Alive';
    if (status === 'eliminated') return 'Eliminated';
    if (status === 'invalid') return 'Invalid';
    return 'Pending';
  }
</script>

<div class="wc-break">
  <div class="top">
    <div class="title">World Cup Run</div>
    <div class="total">Total {total}</div>
  </div>

  <div class="list">
    {#if rounds.length}
      {#each rounds as r (r.round)}
        <div class="row">
          <div class="left">
            <div class="round">{WORLD_CUP_ROUND_LABELS[r.round] || r.round}</div>
            <div class="team">{r.pickedTeamName || r.pickedTeamId}</div>
          </div>
          <div class="right">
            <span class={clsFor(r.status)}>{labelFor(r.status)}</span>
            <span class="pts">{r.points || 0}</span>
          </div>
        </div>
      {/each}
    {:else}
      <div class="muted">No picks yet.</div>
    {/if}
  </div>

  {#if eliminated}
    <div class="elim">Eliminated</div>
  {/if}
</div>

<style>
  .wc-break{ display:grid; gap:10px; }
  .top{ display:flex; justify-content:space-between; gap:12px; align-items:baseline; }
  .title{ font-weight:950; }
  .total{ opacity:0.75; font-weight:900; }

  .list{ display:grid; gap:8px; }

  .row{
    display:flex;
    justify-content:space-between;
    gap:12px;
    padding:10px 12px;
    border-radius: 14px;
    border:1px solid rgba(255,255,255,0.08);
    background: rgba(0,0,0,0.14);
  }

  .round{ font-weight:900; opacity:0.85; font-size:0.9rem; }
  .team{ opacity:0.75; font-size:0.88rem; margin-top:2px; }

  .right{ display:flex; gap:10px; align-items:center; white-space:nowrap; }

  .pill{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    height:26px;
    padding:0 10px;
    border-radius: 999px;
    border:1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.04);
    opacity:0.85;
  }

  .pill--green{
    border-color: rgba(80,216,150,0.22);
    background: rgba(80,216,150,0.07);
  }

  .pill--red{
    border-color: rgba(255,120,120,0.25);
    background: rgba(255,120,120,0.08);
  }

  .pill--muted{
    border-color: rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
  }

  .pts{ font-weight:950; opacity:0.85; min-width: 32px; text-align:right; }

  .elim{
    padding:10px 12px;
    border-radius: 14px;
    border:1px solid rgba(255,120,120,0.20);
    background: rgba(255,120,120,0.06);
  }

  .muted{ opacity:0.7; }
</style>
