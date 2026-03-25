
<script>export let data;</script>
<div class="page-stack">
  <div class="page-head"><div><div class="eyebrow">Managers</div><h1>League dossiers</h1></div></div>
  <div class="grid">
    {#each data.managers as manager}
      <a class="card dossier" href={'/league/managers/' + manager.slug}>
        <img src={manager.photo} alt={manager.name} />
        <div>
          <div class="team">{manager.teamName}</div>
          <h3>{manager.name}</h3>
          <p>{manager.bio}</p>
          <div class="meta">{manager.location} • {manager.persona}</div>
        </div>
      </a>
    {/each}
  </div>
</div>
<style>.page-stack{display:grid;gap:20px}.eyebrow{text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#d6b15e}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:18px;text-decoration:none;color:inherit}.dossier{display:grid;grid-template-columns:120px 1fr;gap:18px;align-items:start}.dossier img{width:120px;height:120px;object-fit:cover;border-radius:18px}.team{color:#d6b15e;text-transform:uppercase;letter-spacing:.12em;font-size:11px}.meta{color:rgba(255,255,255,.6)}p{color:rgba(255,255,255,.72)}@media(max-width:860px){.grid{grid-template-columns:1fr}.dossier{grid-template-columns:88px 1fr}.dossier img{width:88px;height:88px}}</style>
