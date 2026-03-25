
<script>export let data;</script>
<div class="page-stack">
  <section class="hero card">
    <img src={data.manager.photo} alt={data.manager.name} />
    <div>
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
  <section class="grid two-up">
    <div class="card">
      <h3>Profile</h3>
      <dl class="facts">
        <div><dt>Favorite team</dt><dd>{data.manager.favoriteTeam}</dd></div>
        <div><dt>Fantasy start</dt><dd>{data.manager.fantasyStart}</dd></div>
        <div><dt>Mode</dt><dd>{data.manager.mode}</dd></div>
        <div><dt>Championships</dt><dd>{data.manager.championship?.years || '—'}</dd></div>
      </dl>
    </div>
    <div class="card">
      <h3>Top auction spends</h3>
      <div class="stack">
        {#each data.topSpend as pick}
          <div class="row"><strong>{pick.player_name}</strong><span>{pick.pos}</span><span>${pick.price}</span></div>
        {/each}
      </div>
    </div>
  </section>
</div>
<style>.page-stack{display:grid;gap:20px}.card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:20px}.hero{display:grid;grid-template-columns:220px 1fr;gap:20px}.hero img{width:220px;height:220px;object-fit:cover;border-radius:20px}.eyebrow{text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#d6b15e}.chips{display:flex;gap:10px;flex-wrap:wrap}.chips span{padding:8px 12px;border-radius:999px;background:rgba(214,177,94,.12);color:#e2c16f}.grid.two-up{display:grid;grid-template-columns:1fr 1fr;gap:20px}.facts{display:grid;gap:12px}.facts div{display:grid;grid-template-columns:140px 1fr;gap:12px;border-bottom:1px solid rgba(255,255,255,.08);padding-bottom:8px}.facts dt{color:rgba(255,255,255,.6)}.stack{display:grid;gap:10px}.row{display:grid;grid-template-columns:1fr auto auto;gap:12px;padding:12px;border-radius:14px;background:rgba(255,255,255,.03)}@media(max-width:860px){.hero,.grid.two-up,.facts div{grid-template-columns:1fr}.hero img{width:100%;height:auto;max-width:280px}}</style>
