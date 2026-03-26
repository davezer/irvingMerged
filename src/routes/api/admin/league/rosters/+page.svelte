<script>
  import RosterBoard from '$lib/components/league/RosterBoard.svelte';
  export let data;
</script>

<div class="page-stack">
  <section class="hero card">
    <div class="eyebrow">League • Sleeper Surface</div>
    <h1>Rosters</h1>
    <p>Live roster cards powered by the new league engine layer.</p>
    {#if data.updatedAt}
      <div class="stamp">Last sync: {data.updatedAt}</div>
    {/if}
  </section>

  <RosterBoard teams={data.teams ?? []} />
</div>

<style>
  .page-stack{display:grid;gap:18px}.card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:24px}.eyebrow{text-transform:uppercase;letter-spacing:.18em;font-size:11px;color:#d4b15e}.stamp,p{color:rgba(255,255,255,.72)}
</style>
