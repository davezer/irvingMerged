<script>
  export let finance = null;
</script>

<div class="finance card">
  <div class="section-kicker">Draft economy</div>
  {#if finance}
    <div class="finance-grid">
      <div>
        <span>Season</span>
        <strong>{finance.season}</strong>
      </div>
      <div>
        <span>Budget</span>
        <strong>${finance.budget ?? 0}</strong>
      </div>
      <div>
        <span>Spent</span>
        <strong>${finance.spent ?? 0}</strong>
      </div>
      <div>
        <span>Remaining</span>
        <strong>${finance.remaining ?? 0}</strong>
      </div>
      <div>
        <span>Dead money</span>
        <strong>${finance.dead_money ?? 0}</strong>
      </div>
    </div>
    {#if finance.notes}
      <p>{finance.notes}</p>
    {/if}
  {:else}
    <p class="empty">No draft economy snapshot has been recorded yet.</p>
  {/if}
</div>

<style>
  .card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:24px}
  .section-kicker{text-transform:uppercase;letter-spacing:.18em;font-size:11px;color:#d4b15e;margin-bottom:14px}
  .finance-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:14px}
  span,.empty,p{color:rgba(255,255,255,.7);display:block}
  strong{font-size:1.35rem;color:#f1cb70}
  p{margin-top:16px}
</style>
