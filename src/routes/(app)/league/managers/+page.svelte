<script>
  export let data;

  const rows = data.managers.map((manager) => ({
    ...manager,
    standing: data.standings.find((row) => row.slug === manager.slug),
    awards: data.awards.find((row) => row.slug === manager.slug)
  }));
</script>

<div class="page-stack">
  <div>
    <div class="eyebrow">Managers</div>
    <h1>League dossiers</h1>
    <p class="lede">Every GM gets a club-grade dossier with identity, current form, and a hint of historical menace.</p>
  </div>

  <div class="grid">
    {#each rows as manager}
      <a class="card dossier" href={'/league/managers/' + manager.slug}>
        <img src={manager.photo} alt={manager.name} />
        <div class="content">
          <div class="topline">
            <div class="team">{manager.teamName}</div>
            {#if manager.standing}<span class="rank">#{manager.standing.rank}</span>{/if}
          </div>
          <h3>{manager.name}</h3>
          <p>{manager.bio}</p>
          <div class="chips">
            <span>{manager.location}</span>
            <span>{manager.persona}</span>
            <span>{manager.awards?.championshipCount || 0} titles</span>
            {#if manager.standing}<span>{manager.standing.wins}-{manager.standing.losses}</span>{/if}
          </div>
        </div>
      </a>
    {/each}
  </div>
</div>

<style>
  .page-stack{display:grid;gap:20px}.eyebrow{text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#d6b15e}
  .lede{max-width:62ch;color:rgba(255,255,255,.72)}
  .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
  .card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:18px;text-decoration:none;color:inherit}
  .dossier{display:grid;grid-template-columns:120px 1fr;gap:18px;align-items:start}
  .dossier img{width:120px;height:120px;object-fit:cover;border-radius:18px}
  .content{display:grid;gap:10px}
  .topline{display:flex;justify-content:space-between;gap:12px;align-items:center}
  .team{color:#d6b15e;text-transform:uppercase;letter-spacing:.12em;font-size:11px}
  .rank{padding:6px 10px;border-radius:999px;background:rgba(214,177,94,.14);color:#e2c16f;font-size:12px}
  p{color:rgba(255,255,255,.7);margin:0}
  .chips{display:flex;gap:8px;flex-wrap:wrap}
  .chips span{padding:7px 11px;border-radius:999px;background:rgba(255,255,255,.05);font-size:12px;color:rgba(255,255,255,.84)}
  @media(max-width:860px){.grid{grid-template-columns:1fr}.dossier{grid-template-columns:88px 1fr}.dossier img{width:88px;height:88px}}
</style>
