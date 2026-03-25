<script>
  export let ev; // one event row from leaderboard server data

  const totals = ev?.totals || ev?.breakdown?.totals || {};
  const exact = totals?.exact ?? 0;
  const bonus = totals?.bonus ?? 0;
  const chaos = totals?.chaos ?? 0;

  const podiumExacta = Boolean(ev?.breakdown?.podiumExacta);
  const chaosHit = Boolean(ev?.breakdown?.chaos?.inTop10);
  const chaosFinishPos = ev?.breakdown?.chaos?.finishPos;
</script>

<div class="chips">
  <div class="chip">
    <span class="k">Exact</span>
    <span class="v">{exact}</span>
  </div>

  <div class="chip">
    <span class="k">Bonus</span>
    <span class="v">{bonus}</span>
  </div>

  <div class="chip">
    <span class="k">Chaos</span>
    <span class="v">{chaos}</span>
  </div>

  {#if podiumExacta}
    <div class="chip chip--badge">
      <span class="k">Podium</span>
      <span class="v">✔</span>
    </div>
  {/if}

  {#if chaosHit}
    <div class="chip chip--badge">
      <span class="k">Chaos Hit</span>
      <span class="v">P{chaosFinishPos}</span>
    </div>
  {/if}
</div>

<style>
  .chips { display:flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
  .chip {
    display:inline-flex; align-items:center; gap: 10px;
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.25);
  }
  .chip--badge {
    border-color: rgba(212, 175, 55, 0.30);
    background: rgba(212, 175, 55, 0.08);
  }
  .k { opacity: 0.8; font-size: 0.9rem; }
  .v { font-weight: 800; }
</style>
