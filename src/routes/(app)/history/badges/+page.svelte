<script>export let data;</script>
<div class="page-stack">
  <div><div class="eyebrow">Badges</div><h1>Identity shelf</h1></div>
  <div class="grid">
    {#each data.badges as item}
      <div class="card">
        <div class="head"><strong>{item.teamName}</strong><span>{item.managerName}</span></div>
        <div class="chips">{#each item.badges as badge}<span>{badge}</span>{/each}</div>
      </div>
    {/each}
  </div>
</div>
<style>.page-stack{display:grid;gap:20px}.eyebrow{text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#d6b15e}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:22px}.head{display:grid;gap:4px;margin-bottom:12px}.head span{color:rgba(255,255,255,.65)}.chips{display:flex;gap:8px;flex-wrap:wrap}.chips span{padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.05);font-size:12px}@media(max-width:760px){.grid{grid-template-columns:1fr}}</style>
