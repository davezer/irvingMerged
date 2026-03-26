<script>
  export let data;
  const rivalries = data?.rivalries ?? [];
</script>

<div class="page-stack">
  <div class="hero">
    <div class="eyebrow">Rivalry Room</div>
    <h1>Blood feud ledger</h1>
    <p>This top-level route exists so old links stop 404ing while the full League rivalry domain settles into place.</p>
  </div>

  {#if rivalries.length === 0}
    <div class="card">
      <h2>No rivalry data yet</h2>
      <p>Once rivalry records exist in D1, this board will show them here too.</p>
      <a href="/league/rivalry">Open the League rivalry page</a>
    </div>
  {:else}
    <div class="table card">
      <div class="row head">
        <strong>Manager</strong>
        <strong>Rival</strong>
        <strong>Record</strong>
        <strong>Notes</strong>
      </div>
      {#each rivalries as item (`${item.managerName}-${item.rivalName}`)}
        <div class="row">
          <span>{item.managerName}</span>
          <span>{item.rivalName}</span>
          <span>{item.record}</span>
          <span>{item.notes || '—'}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .page-stack{display:grid;gap:18px}
  .hero,.card{background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:24px}
  .eyebrow{text-transform:uppercase;letter-spacing:.18em;font-size:11px;color:#d1ac59}
  p,a,span{color:rgba(255,255,255,.76)}
  .table{display:grid;gap:8px}
  .row{display:grid;grid-template-columns:1.2fr 1.2fr .8fr 1.6fr;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)}
  .row.head{padding-top:0}
  @media(max-width:760px){.row{grid-template-columns:1fr 1fr}}
</style>
