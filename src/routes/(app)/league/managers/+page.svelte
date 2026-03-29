<script>
  import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';
  export let data;
</script>

<div class="page-stack">
  <LeagueSubnav season={data.season || new Date().getFullYear()} active="managers" />
  <div>
    <div class="eyebrow">Managers</div>
    <h1>League dossiers</h1>
    <p class="lede">Manager cards now ride the live Sleeper spine: current rank, record, points, and roster shape are pulled live while the Irving identity layer still handles the voice and branding.</p>
    <div class="source">{data.source}</div>
  </div>

  <div class="grid">
    {#each data.dossiers as manager}
      <article class="card dossier">
        <a class="cover" href={manager.quickLinks.dossier}><img src={manager.liveTeamPhoto || manager.photo} alt={manager.teamName} /></a>
        <div class="content">
          <div class="topline">
            <div class="team">{manager.liveTeamName}</div>
            {#if manager.currentRank}<span class="rank">#{manager.currentRank}</span>{/if}
          </div>
          <h3><a href={manager.quickLinks.dossier}>{manager.name}</a></h3>
          <p>{manager.bio}</p>
          <div class="chips">
            <span>{manager.location}</span>
            <span>{manager.persona}</span>
            <span>{manager.currentRecord}</span>
            <span>{manager.currentPoints.toFixed(2)} PF</span>
            <span>{manager.playerCount} players</span>
          </div>
          <div class="link-row">
            <a href={manager.quickLinks.dossier}>Dossier</a>
            <a href={manager.quickLinks.games}>Games</a>
            <a href={manager.quickLinks.moves}>Moves</a>
            <a href={manager.quickLinks.franchise}>Franchise</a>
          </div>
        </div>
      </article>
    {/each}
  </div>
</div>

<style>
  .page-stack{display:grid;gap:20px}.eyebrow{text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#d6b15e}
  .lede,.source{max-width:68ch;color:rgba(255,255,255,.72)}
  .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
  .card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:18px;color:inherit}
  .dossier{display:grid;grid-template-columns:120px 1fr;gap:18px;align-items:start}.cover{text-decoration:none}.dossier img{width:120px;height:120px;object-fit:cover;border-radius:18px}
  .content{display:grid;gap:10px}
  .topline{display:flex;justify-content:space-between;gap:12px;align-items:center}
  .team{color:#d6b15e;text-transform:uppercase;letter-spacing:.12em;font-size:11px}
  .rank{padding:6px 10px;border-radius:999px;background:rgba(214,177,94,.14);color:#e2c16f;font-size:12px}
  h3 a,.link-row a{color:inherit;text-decoration:none} p{color:rgba(255,255,255,.7);margin:0}
  .chips,.link-row{display:flex;gap:8px;flex-wrap:wrap}
  .chips span{padding:7px 11px;border-radius:999px;background:rgba(255,255,255,.05);font-size:12px;color:rgba(255,255,255,.84)}
  .link-row a{color:#d6b15e}
  @media(max-width:860px){.grid{grid-template-columns:1fr}.dossier{grid-template-columns:88px 1fr}.dossier img{width:88px;height:88px}}
</style>
