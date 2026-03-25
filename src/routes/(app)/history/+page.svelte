<script>
  export let data;
</script>

<div class="page-stack">
  <section class="hero card">
    <div>
      <div class="eyebrow">History</div>
      <h1>Legacy wing</h1>
      <p>This is where the league stops feeling like software and starts feeling like folklore: records, titles, grudges, archetypes, and the long memory of the room.</p>
    </div>
  </section>

  <div class="grid">
    {#each data.modules as item}
      <a class="card module" href={item.href}>
        <strong>{item.title}</strong>
        <p>{item.description}</p>
      </a>
    {/each}
  </div>

  <section class="showcase-grid">
    <div class="card">
      <div class="section-label">Record board preview</div>
      {#each data.records as record}
        <div class="line-item"><strong>{record.title}</strong><span>{record.value}</span></div>
      {/each}
    </div>
    <div class="card">
      <div class="section-label">Rivalry preview</div>
      {#each data.rivalries as item}
        <div class="line-item"><strong>{item.headline}</strong><span>{item.subhead}</span></div>
      {/each}
    </div>
  </section>
</div>

<style>
  .page-stack{display:grid;gap:20px}.card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:24px}
  .eyebrow,.section-label{text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#d6b15e}
  .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.module{text-decoration:none;color:inherit}.module p,.line-item span{color:rgba(255,255,255,.7)}
  .showcase-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.line-item{display:grid;gap:6px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.08)}
  @media(max-width:760px){.grid,.showcase-grid{grid-template-columns:1fr}}
</style>
