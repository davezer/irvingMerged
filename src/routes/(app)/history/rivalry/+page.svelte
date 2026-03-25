<script>export let data;</script>
<div class="page-stack">
  <div><div class="eyebrow">Rivalry</div><h1>Blood feud board</h1></div>
  <div class="stack">
    {#each data.rivalries as item}
      <div class="card">
        <div class="pair">
          <div><strong>{item.left.teamName}</strong><span>{item.left.name}</span></div>
          <div class="versus">vs</div>
          <div><strong>{item.right.teamName}</strong><span>{item.right.name}</span></div>
        </div>
        <p>{item.subhead}</p>
        <small>{item.stakes}</small>
      </div>
    {/each}
  </div>
</div>
<style>.page-stack,.stack{display:grid;gap:18px}.eyebrow{text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#d6b15e}.card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:22px}.pair{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center}.pair span,p,small{display:block;color:rgba(255,255,255,.7)}.versus{color:#d6b15e;font-weight:700;text-transform:uppercase;letter-spacing:.2em}@media(max-width:700px){.pair{grid-template-columns:1fr}}</style>
