<script>
  import TransactionTicker from '$lib/components/league/TransactionTicker.svelte';
  export let data;
</script>

<div class="page-stack">
  <section class="hero card">
    <div class="eyebrow">League • Action Wire</div>
    <h1>Transactions</h1>
    <p>The move log, trade wire, and budget pulse of the league.</p>
  </section>

  <TransactionTicker items={data.items ?? []} />
</div>

<style>
  .page-stack{display:grid;gap:18px}.card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:24px}.eyebrow{text-transform:uppercase;letter-spacing:.18em;font-size:11px;color:#d4b15e}p{color:rgba(255,255,255,.72)}
</style>
