<script>
  export let ev;
  export let teamLogoById = {};

  const b = ev?.breakdown || {};
  const items = Array.isArray(b.items) ? b.items : [];

  const totalFromTotals = Number(b?.totals?.total ?? 0);
  const totalFromEvent = Number(ev?.points ?? 0);

  // prefer breakdown totals if present, else fall back to event points
  const total = totalFromTotals || totalFromEvent;

  const teams = items.length;

  function countWins(winsObj) {
    if (!winsObj || typeof winsObj !== 'object') return 0;
    let n = 0;
    for (const k of ['r1', 'r2', 'r3', 'r4', 'r5', 'r6']) {
      if (winsObj[k]) n += 1;
    }
    return n;
  }

  const totalWins = items.reduce((sum, it) => sum + countWins(it?.wins), 0);

  // sanity: sum of item points (should match totals.total)
  const itemPointsTotal = items.reduce((sum, it) => sum + Number(it?.points ?? 0), 0);

  // show top 2 contributors as a nice hint without clutter
  const topItems = [...items]
    .map((it) => {
      const teamId = String(it?.teamId ?? '');
      return {
        teamId,
        seed: it?.seed != null ? Number(it.seed) : null,
        points: Number(it?.points ?? 0),
        wins: countWins(it?.wins),
        logo: teamId && teamLogoById?.[teamId] ? teamLogoById[teamId] : null
      };
    })
    .filter((x) => x.teamId)
    .sort((a, b) => b.points - a.points)
    .slice(0, 2);

</script>

<div class="chips">
  <div class="chip">
    <span class="k">Teams</span>
    <span class="v">{teams}</span>
  </div>

  <div class="chip">
    <span class="k">Wins</span>
    <span class="v">{totalWins}</span>
  </div>

  <div class="chip">
    <span class="k">Item Pts</span>
    <span class="v">{itemPointsTotal}</span>
  </div>

  <div class="chip chip--badge">
    <span class="k">Total</span>
    <span class="v">{total}</span>
  </div>

  {#if topItems.length}
    {#each topItems as it (it.teamId)}
    
      <div class="chip chip--badge">
        <span class="k">Top</span>
        {#if it.logo}
          <img class="logo" src={it.logo} alt="" loading="lazy" />
        {/if}
        
        <span class="v">
          {it.seed != null ? `${it.seed} Seed | ` : ''}{it.points} Pts ({it.wins} Wins)
        </span>
      </div>
    {/each}
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
   .logo {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    object-fit: contain;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.10);
  }
</style>
