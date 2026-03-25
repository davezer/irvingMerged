<script>export let data;</script>
<div class="page-stack">
  <div><div class="eyebrow">Awards</div><h1>Trophy wall</h1></div>
  <div class="stack">
    {#each data.awards as item}
      <div class="card">
        <div class="head"><strong>{item.teamName}</strong><span>{item.managerName}</span></div>
        <div class="chips"><span>{item.championshipCount} titles</span><span>{item.currentRecord}</span>{#if item.currentRank}<span>#{item.currentRank}</span>{/if}</div>
        <p>{item.awardCase.join(' • ')}</p>
      </div>
    {/each}
  </div>
</div>
<style>.page-stack,.stack{display:grid;gap:18px}.eyebrow{text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#d6b15e}.card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:22px}.head{display:grid;gap:4px}.head span,p{color:rgba(255,255,255,.72)}.chips{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.chips span{padding:6px 10px;border-radius:999px;background:rgba(214,177,94,.14);color:#e9c76d;font-size:12px}</style>
