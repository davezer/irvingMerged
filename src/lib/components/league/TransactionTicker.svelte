<script>
  export let items = [];
</script>

<div class="ticker">
  {#if items.length}
    {#each items as item (item.id)}
      <article class="card row">
        <div>
          <div class="kicker">{item.type} • {item.status}</div>
          <h3>{item.id}</h3>
          <p>{item.rosters.length} roster(s) involved</p>
        </div>
        <div class="meta-grid">
          <div><span>Adds</span><strong>{item.addCount}</strong></div>
          <div><span>Drops</span><strong>{item.dropCount}</strong></div>
          <div><span>Picks</span><strong>{item.pickCount}</strong></div>
          <div><span>Budget Δ</span><strong>{item.budgetDelta}</strong></div>
        </div>
      </article>
    {/each}
  {:else}
    <div class="card empty">No transaction data yet.</div>
  {/if}
</div>

<style>
  .ticker{display:grid;gap:16px}.card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:22px}.row{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.kicker{text-transform:uppercase;letter-spacing:.16em;font-size:11px;color:#d4b15e}.meta-grid{display:grid;grid-template-columns:repeat(2,minmax(100px,1fr));gap:14px;min-width:260px}span,.empty,p{color:rgba(255,255,255,.7);display:block}strong{font-size:1.2rem;color:#f1cb70}@media(max-width:760px){.row{flex-direction:column}.meta-grid{min-width:0;width:100%}}
</style>
