<script>
  export let data;
  const { deck = [] } = data;
</script>

<div class="page-stack">
  <div class="card hero">
    <div class="eyebrow">League Admin</div>
    <h1>League control room</h1>
    <p>This surface is ready to grow into the command center for manager dossiers, standings snapshots, history modules, and the lounge desk.</p>
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
      <div class="section-label">Migration reality</div>
      <ul>
        <li>D1 is now the target system of record</li>
        <li>League seed data can be used until full normalization lands</li>
        <li>Phase 2 turns placeholders into living product surfaces</li>
        <li>Phase 3 can focus on importers and persistence</li>
      </ul>
    </div>
  </div>
</div>

<style>
  .page-stack{display:grid;gap:20px}.card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:24px}.eyebrow,.section-label{text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#d6b15e}
  .hero p,.stat p,li{color:rgba(255,255,255,.72)}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}.grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}.value{font-size:2rem;font-weight:800;color:#f0c96d}.stat{display:grid;gap:8px}ul{margin:.75rem 0 0 1rem;padding:0;display:grid;gap:8px}@media(max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.grid,.grid.two{grid-template-columns:1fr}}
</style>