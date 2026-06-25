<script>
  import ManagerDossierExtras from './ManagerDossierExtras.svelte';
  export let data;
  $: dossier = data?.dossier;
</script>

<div class="page-stack">
  <section class="card admin-hero">
    <div>
      <div class="eyebrow">Admin • Manager Dossier</div>
      <h1>{dossier?.manager?.team_name || dossier?.manager?.teamName || dossier?.manager?.name || 'Manager'}</h1>
      <p>{dossier?.manager?.bio || 'Financials, badges, and rivalry overlays for the merged league spine.'}</p>
    </div>
    <a class="btn btn--ghost" href="/admin/league">Back to League Admin</a>
  </section>

  <ManagerDossierExtras {dossier} />
</div>

<style>
  .page-stack{display:grid;gap:18px}.admin-hero{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.eyebrow{text-transform:uppercase;letter-spacing:.18em;font-size:11px;color:#f8dc94}h1{margin:6px 0 8px;font-family:var(--font-serif);font-size:clamp(2rem,6vw,4rem);line-height:.92;letter-spacing:-.04em}p{max-width:72ch;color:rgba(255,255,255,.72)}@media(max-width:760px){.admin-hero{display:grid}}
</style>
