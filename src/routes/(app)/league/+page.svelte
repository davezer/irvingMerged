
<script>
  export let data;
  const { stats, standings, managers, draft, modules } = data;
</script>

<div class="page-stack">
  <section class="hero card">
    <div>
      <div class="eyebrow">League HQ</div>
      <h1>{stats.leagueName}</h1>
      <p>The ritual side of the product lives here: standings, managers, rosters, drafts, records, awards, rivalries, and all the league personality that makes the app feel like yours instead of generic fantasy software.</p>
    </div>
    <div class="mini-grid">
      <a class="mini" href="/league/standings"><strong>Standings</strong><span>{standings.length} teams tracked</span></a>
      <a class="mini" href="/league/managers"><strong>Managers</strong><span>{managers.length} dossiers</span></a>
      <a class="mini" href="/league/drafts"><strong>Draft archive</strong><span>{draft.totalPicks} picks preserved</span></a>
      <a class="mini" href="/history"><strong>History</strong><span>Records, awards, badges, rivalry</span></a>
    </div>
  </section>

  <section class="grid two-up">
    <div class="card">
      <div class="section-head"><h2>Top of the board</h2><a href="/league/standings">Full standings</a></div>
      <div class="stack">
        {#each standings as row}
          <a class="row" href={'/league/managers/' + row.slug}>
            <span class="rank">#{row.rank}</span>
            <div><strong>{row.teamName}</strong><small>{row.displayName}</small></div>
            <span>{row.wins}-{row.losses}</span>
          </a>
        {/each}
      </div>
    </div>
    <div class="card">
      <div class="section-head"><h2>History surfaces</h2><a href="/history">Open history</a></div>
      <div class="stack">
        {#each modules as item}
          <a class="story" href={item.href}>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
          </a>
        {/each}
      </div>
    </div>
  </section>
</div>

<style>
  .page-stack{display:grid;gap:24px}.card{background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:24px}.hero{display:grid;grid-template-columns:1.2fr 1fr;gap:24px;align-items:start}.eyebrow{text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#d6b15e}.mini-grid,.stack{display:grid;gap:12px}.mini,.story,.row{text-decoration:none;color:inherit;background:rgba(255,255,255,.03);border-radius:16px;padding:14px}.mini{display:grid;gap:6px}.row{display:grid;grid-template-columns:52px 1fr auto;align-items:center;gap:12px}.rank{font-weight:700;color:#d6b15e}.row small{display:block;color:rgba(255,255,255,.6)}.grid.two-up{display:grid;grid-template-columns:1fr 1fr;gap:24px}.section-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.section-head a{color:#d6b15e;text-decoration:none}.story p{margin:.45rem 0 0;color:rgba(255,255,255,.7)}@media(max-width:860px){.hero,.grid.two-up{grid-template-columns:1fr}}
</style>
