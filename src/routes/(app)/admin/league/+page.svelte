<script>
  import { browser } from '$app/environment';
  export let data;
  export let form;

  function pretty(value) {
    if (value == null) return '';
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
</script>

<div class="page-stack">
  {#if browser && form?.ok}
    <div class="card notice success">
      <div class="section-label">Action completed</div>
      <pre>{pretty(form?.result)}</pre>
    </div>
  {/if}

  {#if browser && form && form.ok === false}
    <div class="card notice error">
      <div class="section-label">Action failed</div>
      <p>{form?.error || 'Something went wrong.'}</p>
      {#if form?.result}
        <pre>{pretty(form.result)}</pre>
      {/if}
    </div>
  {/if}

  <div class="card hero">
    <div class="eyebrow">League Admin</div>
    <h1>League control room</h1>
    <p>The old Sleeper D1 sync/backfill path is retired. League pages now run off cached Sleeper fetches. The main admin control left here is cache invalidation.</p>
  </div>

  <div class="grid actions">
    <div class="card action-card">
      <div class="section-label">Cache</div>
      <h2>Flush league cache</h2>
      <p>Clears cached Sleeper keys for the current runtime. Great for local testing after structural changes.</p>
      <form method="POST" action="?/flushLeagueCache" class="stack">
        <label>
          <span>Prefix</span>
          <input name="prefix" type="text" value="sleeper:" />
        </label>
        <button type="submit">Flush cache</button>
      </form>
    </div>

    <div class="card action-card retired">
      <div class="section-label">Retired</div>
      <h2>Sleeper sync / backfill</h2>
      <p>Removed from the main flow. Sleeper-owned data is no longer written to D1.</p>
      <code>/api/admin/league/sync-sleeper</code>
      <p class="muted">To physically remove the last retired Sleeper-D1 files from your repo after applying this patch, run <code>./scripts/cleanup-legacy-sleeper-d1.ps1</code> in PowerShell.</p>
    </div>
  </div>

  <div class="card">
    <div class="section-label">Known cache keys</div>
    {#if data.cacheKeys.length}
      <div class="keys">
        {#each data.cacheKeys as key}
          <code>{key}</code>
        {/each}
      </div>
    {:else}
      <p class="muted">No cached Sleeper keys have been registered in this runtime yet.</p>
    {/if}
  </div>
</div>

<style>
  .page-stack{display:grid;gap:20px}
  .card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:24px}
  .eyebrow,.section-label{text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#d6b15e}
  h1,h2{margin:.35rem 0 0}
  p,.muted,code{color:rgba(255,255,255,.72)}
  .grid.actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
  .action-card{display:grid;gap:18px;align-content:start}
  button{appearance:none;border:none;border-radius:999px;padding:14px 18px;font-weight:800;cursor:pointer;background:linear-gradient(180deg,#f0c96d,#c99a34);color:#111;width:100%}
  .stack{display:grid;gap:12px}
  label{display:grid;gap:6px} input{border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:#f6f1e8;padding:12px 14px}
  .retired{border-color:rgba(255,255,255,.12)}
  .notice.success{border-color:rgba(90,200,120,.45)} .notice.error{border-color:rgba(220,90,90,.45)}
  pre{white-space:pre-wrap;word-break:break-word;overflow:auto;margin-top:12px;padding:14px;border-radius:16px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.06);color:#f6f1e8;font-size:.92rem}
  .keys{display:grid;gap:10px;margin-top:14px} code{background:rgba(255,255,255,.05);padding:8px 10px;border-radius:10px;display:block;overflow:auto}
  @media(max-width:900px){.grid.actions{grid-template-columns:1fr}.card{padding:18px}}
</style>
