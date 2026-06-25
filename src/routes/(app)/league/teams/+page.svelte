<script>
  import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';
  export let data;
</script>

<div class="page-stack">
  <LeagueSubnav season={data.season || new Date().getFullYear()} active="teams" />

  <section class="hero-copy">
    <div class="eyebrow">Franchises</div>
    <h1>Franchise directory</h1>
    
    <!-- <div class="source">{data.source}</div> -->
  </section>

  <div class="grid">
    {#each data.cards as card}
      <article class="team-card">
        <a class="cover" href={card.quickLinks.team} aria-label={`Open ${card.teamName}`}>
          <img src={card.teamPhoto} alt={card.teamName} />
        </a>

        <div class="content">
          <div class="topline">
            <div class="team">{card.teamName}</div>
            {#if card.currentRank}<span class="rank">#{card.currentRank}</span>{/if}
          </div>

          <h3><a href={card.quickLinks.team}>{card.managerName}</a></h3>
          <p>{card.bio}</p>

          <div class="chips" aria-label="Current season snapshot">
            <span>{card.currentRecord}</span>
            <span>{card.currentPoints.toFixed(2)} PF</span>
            <span>{card.currentPointDiff.toFixed(2)} diff</span>
          </div>

          <div class="link-row">
            <a href={card.quickLinks.team}>Franchise page</a>
            <a href={card.quickLinks.games}>Games</a>
            <a href={card.quickLinks.moves}>Moves</a>
          </div>
        </div>
      </article>
    {/each}
  </div>
</div>

<style>
  .page-stack{display:grid;gap:20px}
  .hero-copy{display:grid;gap:10px}
  .eyebrow{text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#d6b15e;font-weight:800}
  .lede,.source{max-width:72ch;color:rgba(255,255,255,.72)}
  .lede{font-size:16px;line-height:1.5}.source{font-size:14px}
  .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
  .team-card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:18px;display:grid;grid-template-columns:120px 1fr;gap:18px}
  .cover img{width:120px;height:120px;border-radius:18px;object-fit:cover;background:rgba(255,255,255,.08)}
  .content{display:grid;gap:10px}.topline{display:flex;justify-content:space-between;gap:12px;align-items:center}
  .team{color:#d6b15e;text-transform:uppercase;letter-spacing:.12em;font-size:11px;font-weight:800}
  .rank{padding:6px 10px;border-radius:999px;background:rgba(214,177,94,.14);color:#e2c16f;font-size:12px}
  h3{margin:0} h3 a,.link-row a{color:inherit;text-decoration:none} p{color:rgba(255,255,255,.7);margin:0;line-height:1.45}
  .chips,.link-row{display:flex;gap:8px;flex-wrap:wrap}.chips span{padding:7px 11px;border-radius:999px;background:rgba(255,255,255,.05);font-size:12px;color:rgba(255,255,255,.84)}.link-row a{color:#d6b15e}
  .link-row a:hover{text-decoration:underline}
  @media(max-width:860px){.grid{grid-template-columns:1fr}.team-card{grid-template-columns:88px 1fr}.cover img{width:88px;height:88px}}
  @media(max-width:560px){.team-card{grid-template-columns:1fr}.cover img{width:96px;height:96px}}
</style>
