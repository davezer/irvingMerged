<script>
  import RivalryTable from '$lib/components/league/RivalryTable.svelte';
  export let data;
</script>

<div class="page-stack">
  <section class="hero card">
    <div class="eyebrow">League • Bloodlines</div>
    <h1>Rivalry</h1>
    <p>Head-to-head heat, grudge records, and badge-weighted legacy lines.</p>
  </section>

  <RivalryTable rivalries={data.rivalries ?? []} />
</div>

<style>
  .page-stack{display:grid;gap:18px}.card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:24px}.eyebrow{text-transform:uppercase;letter-spacing:.18em;font-size:11px;color:#d4b15e}p{color:rgba(255,255,255,.72)}
</style>
