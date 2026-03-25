<script>
  export let data;
</script>

<div class="page-stack">
  <section class="hero card">
    <img src={data.manager.photo} alt={data.manager.name} />
    <div class="hero-copy">
      <div class="eyebrow">Manager dossier</div>
      <h1>{data.manager.teamName}</h1>
      <h2>{data.manager.name}</h2>
      <p>{data.manager.bio}</p>
      <div class="chips">
        <span>{data.manager.location}</span>
        <span>{data.manager.persona}</span>
        <span>{data.recordLabel}</span>
        <span>{data.manager.philosophy}</span>
      </div>
    </div>
  </section>

  <section class="stats-grid">
    {#each data.dossierStats as stat}
      <div class="stat-card">
        <div class="label">{stat.label}</div>
        <strong>{stat.value}</strong>
      </div>
    {/each}
  </section>

  <section class="grid two-up">
    <div class="card">
      <h3>Profile</h3>
      <dl class="facts">
        <div><dt>Favorite team</dt><dd>{String(data.manager.favoriteTeam).toUpperCase()}</dd></div>
        <div><dt>Fantasy start</dt><dd>{data.manager.fantasyStart}</dd></div>
        <div><dt>Mode</dt><dd>{data.manager.mode}</dd></div>
        <div><dt>Championship years</dt><dd>{data.manager.championship?.years || '—'}</dd></div>
        <div><dt>Preferred contact</dt><dd>{data.manager.preferredContact || '—'}</dd></div>
      </dl>
    </div>
    <div class="card">
      <h3>Top auction spends</h3>
      <div class="stack">
        {#each data.topSpend as pick}
          <div class="row"><strong>{pick.player_name}</strong><span>{pick.pos}</span><span>${pick.price}</span></div>
        {/each}
        {#if !data.topSpend.length}<div class="empty">No imported picks yet for this dossier.</div>{/if}
      </div>
    </div>
  </section>

  <section class="grid two-up">
    <div class="card">
      <h3>Award case</h3>
      <div class="stack soft-list">
        {#each data.awards.awardCase as item}
          <div class="line-item">{item}</div>
        {/each}
      </div>
    </div>
    <div class="card">
      <h3>Rivalry line</h3>
      {#if data.rivalry}
        <p class="rival-headline">{data.rivalry.headline}</p>
        <p class="soft">{data.rivalry.subhead}</p>
        <p class="soft">{data.rivalry.stakes}</p>
      {:else}
        <p class="soft">No rivalry pairing has been attached to this manager yet.</p>
      {/if}
    </div>
  </section>
</div>

<style>
  .page-stack{display:grid;gap:20px}.card,.stat-card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:20px}
  .hero{display:grid;grid-template-columns:220px 1fr;gap:20px}.hero img{width:220px;height:220px;object-fit:cover;border-radius:20px}
  .eyebrow,.label{text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#d6b15e}
  .hero-copy{display:grid;gap:12px}.hero-copy p,.soft{color:rgba(255,255,255,.7)}
  .chips{display:flex;gap:10px;flex-wrap:wrap}.chips span{padding:8px 12px;border-radius:999px;background:rgba(214,177,94,.12);color:#e2c16f}
  .stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.stat-card strong{font-size:1.4rem;margin-top:6px;display:block}
  .grid.two-up{display:grid;grid-template-columns:1fr 1fr;gap:20px}.facts,.stack{display:grid;gap:12px}
  .facts div{display:grid;grid-template-columns:140px 1fr;gap:12px;border-bottom:1px solid rgba(255,255,255,.08);padding-bottom:8px}.facts dt{color:rgba(255,255,255,.6)}
  .row{display:grid;grid-template-columns:1fr auto auto;gap:12px;padding:12px;border-radius:14px;background:rgba(255,255,255,.03)}
  .line-item,.empty{padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.03)}
  .rival-headline{font-weight:700;font-size:1.1rem;margin-bottom:.4rem}
  @media(max-width:960px){.stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:860px){.hero,.grid.two-up,.facts div{grid-template-columns:1fr}.hero img{width:100%;height:auto;max-width:280px}}
</style>
