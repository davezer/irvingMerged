<script>
  export let data;
  export let form;

  const deck = data?.deck ?? [];
  const result = form?.actionResult ?? data?.actionResult ?? null;
  const error = form?.actionError ?? data?.actionError ?? null;

  const actionCards = [
    {
      title: 'Sync Sleeper',
      action: '?/syncSleeper',
      blurb: 'Pull fresh rosters, users, and transactions from Sleeper into D1.'
    },
    {
      title: 'Rebuild badges',
      action: '?/rebuildBadges',
      blurb: 'Re-run badge assignment logic and refresh manager badge shelves.'
    },
    {
      title: 'Recalculate draft economy',
      action: '?/recalcDraftEconomy',
      blurb: 'Rebuild draft money snapshots, carryovers, and spending summaries.'
    }
  ];
</script>

<div class="page-stack">
  <div class="card hero">
    <div class="eyebrow">League Admin</div>
    <h1>League control room</h1>
    <p>Run the heavy league jobs from inside the app, on-origin, like civilized people.</p>
  </div>

  {#if error}
    <div class="card alert alert--error">
      <strong>Action failed</strong>
      <p>{error}</p>
    </div>
  {/if}

  {#if result?.ok}
    <div class="card alert alert--success">
      <strong>Action completed</strong>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  {/if}

  <div class="grid three">
    {#each actionCards as item (item.title)}
      <form class="card action-card" method="POST" action={item.action}>
        <div class="section-label">Control</div>
        <h2>{item.title}</h2>
        <p>{item.blurb}</p>
        <button type="submit">Run action</button>
      </form>
    {/each}
  </div>

  <div class="grid">
    {#each deck as item (item.title)}
      <div class="card stat">
        <div class="value">{item.value}</div>
        <strong>{item.title}</strong>
        <p>{item.detail}</p>
      </div>
    {/each}
  </div>

  <div class="grid two">
    <div class="card">
      <div class="section-label">Next admin surfaces</div>
      <ul>
        <li>Manager editor and image assignment</li>
        <li>Standings snapshot import + publish controls</li>
        <li>Post creation/edit workflow</li>
        <li>Records and awards wall management</li>
      </ul>
    </div>

    <div class="card">
      <div class="section-label">What these buttons should wake up</div>
      <ul>
        <li>Sleeper users, rosters, and transactions synced into D1</li>
        <li>Badge shelves refreshed on manager pages</li>
        <li>Draft money panels fed by updated snapshots</li>
        <li>Rivalry and history surfaces getting less fake by the day</li>
      </ul>
    </div>
  </div>
</div>

<style>
  .page-stack{display:grid;gap:20px}
  .card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:24px}
  .eyebrow,.section-label{text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#d6b15e}
  .hero p,.stat p,.action-card p,li{color:rgba(255,255,255,.72)}
  .grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}
  .grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}
  .grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}
  .value{font-size:2rem;font-weight:800;color:#f0c96d}
  .stat,.action-card{display:grid;gap:8px}
  button{margin-top:10px;border:0;border-radius:999px;padding:12px 16px;font-weight:800;cursor:pointer;background:linear-gradient(180deg,#f0c96d,#c69637);color:#15110a}
  .alert pre{white-space:pre-wrap;word-break:break-word;margin:10px 0 0;font-size:.85rem;color:rgba(255,255,255,.84)}
  .alert--error{border-color:rgba(255,100,100,.35)}
  .alert--success{border-color:rgba(120,200,120,.35)}
  ul{margin:.75rem 0 0 1rem;padding:0;display:grid;gap:8px}

  @media(max-width:1100px){
    .grid,.grid.three{grid-template-columns:repeat(2,minmax(0,1fr))}
  }
  @media(max-width:700px){
    .grid,.grid.two,.grid.three{grid-template-columns:1fr}
  }
</style>
