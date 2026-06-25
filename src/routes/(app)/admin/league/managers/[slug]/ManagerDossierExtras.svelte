<script>
  import BadgeShelf from '$lib/components/league/BadgeShelf.svelte';
  import DraftMoneyPanel from '$lib/components/league/DraftMoneyPanel.svelte';
  export let dossier;
</script>

<div class="extras-grid">
  <BadgeShelf badges={dossier?.badges ?? []} />
  <DraftMoneyPanel finance={dossier?.finance ?? null} />
</div>

{#if dossier?.rivalry?.length}
  <div class="card">
    <div class="section-kicker">Rivalry notes</div>
    <div class="rival-grid">
      {#each dossier.rivalry as row (row.rival_manager_id || row.rivalId)}
        <div class="rival-row">
          <strong>{row.rival_manager_id || row.rivalId}</strong>
          <span>{row.wins}-{row.losses}{#if row.ties}- {row.ties}{/if}</span>
          <p>{row.notes || 'Legacy rivalry entry'}</p>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .extras-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:24px}.section-kicker{text-transform:uppercase;letter-spacing:.18em;font-size:11px;color:#d4b15e;margin-bottom:14px}.rival-grid{display:grid;gap:12px}.rival-row{border:1px solid rgba(255,255,255,.06);border-radius:18px;padding:14px;background:rgba(255,255,255,.03)}span,p{color:rgba(255,255,255,.72);display:block}@media(max-width:800px){.extras-grid{grid-template-columns:1fr}}
</style>
