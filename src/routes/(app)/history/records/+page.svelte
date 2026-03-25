<script>export let data;</script>
<div class="page-stack">
  <div><div class="eyebrow">Records</div><h1>Record board</h1></div>
  <div class="grid">
    {#each data.records as record}
      <div class="card">
        <div class="accent">{record.accent}</div>
        <h3>{record.title}</h3>
        <strong>{record.value}</strong>
        <p>{record.detail}</p>
      </div>
    {/each}
  </div>
</div>
<style>.page-stack{display:grid;gap:20px}.eyebrow,.accent{text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#d6b15e}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:24px;display:grid;gap:10px}.card p{color:rgba(255,255,255,.72)}@media(max-width:760px){.grid{grid-template-columns:1fr}}</style>
