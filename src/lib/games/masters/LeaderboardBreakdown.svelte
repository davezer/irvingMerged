<script>
  export let ev;
  export let teamLogoById; // harmless if passed; unused here

  // ✅ Use shared labels/points so Masters stays consistent everywhere
  import { MASTERS_STAGE_LABELS, MASTERS_STAGE_POINTS } from '$lib/scoring/masters.js';

  // Breakdown object can be in a few shapes depending on how leaderboard builds ev
  const b = ev?.breakdown || ev?.score?.breakdown || null;

  const lockStage = b?.lockStage || ev?.breakdown?.lockStage || 'pre_r1';
  const won = Boolean(b?.won);

  // Total points for this event for this user
  const total = Number(ev?.points ?? ev?.score_total ?? b?.totals?.total ?? ev?.totals?.total ?? 0);

  // Optional: show who they picked (best effort)
  const pickedName =
    b?.pickedName ||
    ev?.pickDisplay?.name ||
    ev?.payload?.golferSnapshot?.name ||
    ev?.breakdown?.pickedName ||
    null;

  function stageLabel(key) {
    return MASTERS_STAGE_LABELS[key] ?? key ?? '—';
  }

  function stagePts(key) {
    return MASTERS_STAGE_POINTS[key] ?? 0;
  }
</script>

<div class="chips">
  <span class="chip">
    <span class="k">Stage Selected</span>
    <span class="v">{stageLabel(lockStage)}</span>
  </span>

  <span class="chip">
    <span class="k">Worth</span>
    <span class="v">{stagePts(lockStage)}</span>
  </span>

  {#if pickedName}
    <span class="chip">
      <span class="k">Pick</span>
      <span class="v">{pickedName}</span>
    </span>
  {/if}

  <span class="chip {won ? 'chip--badge' : ''}">
    <span class="k">Winner</span>
    <span class="v">{won ? '✔' : '—'}</span>
  </span>

  <span class="chip chip--total">
    <span class="k">Total</span>
    <span class="v">{total}</span>
  </span>
</div>

<style>
  .chips { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
  .chip {
    display:inline-flex;
    align-items:baseline;
    gap:8px;
    padding:6px 10px;
    border-radius:999px;
    border:1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
  }
  .chip--badge { border-color: rgba(80,216,150,0.22); background: rgba(80,216,150,0.07); }
  .chip--total { border-color: rgba(216,180,80,0.30); background: rgba(216,180,80,0.10); }
  .k { opacity:0.75; font-size:0.82rem; }
  .v { font-weight:900; }
</style>
