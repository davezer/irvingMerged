<script>
  import { browser } from '$app/environment';

  export let data;
  export let form;

  const recentRuns = data?.recentRuns ?? [];

  function pretty(value) {
    if (value == null) return '';
    if (typeof value === 'string') {
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return value;
      }
    }
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
    <p>Run same-origin admin actions directly from here. No PowerShell wrestling. No CSRF nonsense.</p>
  </div>

  <div class="grid actions">
    <div class="card action-card">
      <div class="section-label">Control</div>
      <h2>Sync Sleeper</h2>
      <p>Pull fresh rosters, users, and transactions from Sleeper into D1.</p>
      <form method="POST" action="?/syncSleeper">
        <button type="submit">Run action</button>
      </form>
    </div>
    <div class="card action-card">
  <div class="section-label">History</div>
  <h2>Backfill season</h2>
  <p>Run a historical import for a specific season and week range.</p>

  <form method="POST" action="?/backfillSeason" class="stack">
    <label>
      <span>Season</span>
      <input name="season" type="number" value="2025" min="2000" max="3000" />
    </label>

    <label>
      <span>Weeks</span>
      <input
        name="weeks"
        type="text"
        value="1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18"
      />
    </label>

    <label>
      <span>League ID</span>
      <input name="leagueId" type="text" placeholder="optional, uses env if blank" />
    </label>

    <button type="submit">Run backfill</button>
  </form>
</div>

    <div class="card action-card">
      <div class="section-label">Control</div>
      <h2>Rebuild badges</h2>
      <p>Recompute badge awards and refresh manager badge data.</p>
      <form method="POST" action="?/rebuildBadges">
        <button type="submit">Run action</button>
      </form>
    </div>

    <div class="card action-card">
      <div class="section-label">Control</div>
      <h2>Recalculate draft economy</h2>
      <p>Refresh draft money, spend, and remaining balance calculations.</p>
      <form method="POST" action="?/recalcDraftEconomy">
        <button type="submit">Run action</button>
      </form>
    </div>
  </div>

  <div class="card">
    <div class="section-label">Recent sync runs</div>

    {#if recentRuns.length}
      <div class="runs">
        {#each recentRuns as run ((run.id ?? '') + '-' + (run.created_at ?? ''))}
          <div class="run">
            <div class="run-top">
              <strong>{run.mode ?? 'sync'}</strong>
              <span class:ok={run.status === 'ok'} class:fail={run.status !== 'ok'}>
                {run.status ?? 'unknown'}
              </span>
            </div>
            <div class="run-meta">
              season {run.season ?? '—'} · week {run.week ?? '—'} · created {run.created_at ?? '—'}
            </div>
            {#if run.summary_json}
              <pre>{pretty(run.summary_json)}</pre>
            {/if}
            {#if run.error_text}
              <p class="error-text">{run.error_text}</p>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <p class="muted">No sync runs yet.</p>
    {/if}
  </div>
</div>

<style>
  .page-stack{display:grid;gap:20px}
  .card{
    background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));
    border:1px solid rgba(255,255,255,.08);
    border-radius:24px;
    padding:24px
  }
  .eyebrow,.section-label{
    text-transform:uppercase;
    letter-spacing:.2em;
    font-size:11px;
    color:#d6b15e
  }
  h1,h2{margin:.35rem 0 0}
  p,.muted,.run-meta{color:rgba(255,255,255,.72)}
  .grid.actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
  .action-card{display:grid;gap:18px;align-content:start}
  button{
    appearance:none;
    border:none;
    border-radius:999px;
    padding:14px 18px;
    font-weight:800;
    cursor:pointer;
    background:linear-gradient(180deg,#f0c96d,#c99a34);
    color:#111;
    width:100%
  }

  .stack{display:grid;gap:12px}
  label{display:grid;gap:6px}
  input{
    border-radius:14px;
    border:1px solid rgba(255,255,255,.1);
    background:rgba(255,255,255,.03);
    color:#f6f1e8;
    padding:12px 14px;
  }

  .notice.success{border-color:rgba(90,200,120,.45)}
  .notice.error{border-color:rgba(220,90,90,.45)}
  .runs{display:grid;gap:14px;margin-top:14px}
  .run{padding:16px;border-radius:18px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06)}
  .run-top{display:flex;justify-content:space-between;gap:12px;align-items:center}
  .ok{color:#7ee787}
  .fail{color:#ff8e8e}
  pre{
    white-space:pre-wrap;
    word-break:break-word;
    overflow:auto;
    margin-top:12px;
    padding:14px;
    border-radius:16px;
    background:rgba(0,0,0,.28);
    border:1px solid rgba(255,255,255,.06);
    color:#f6f1e8;
    font-size:.92rem
  }
  .error-text{color:#ff8e8e}
  @media(max-width:900px){
    .grid.actions{grid-template-columns:1fr}
  }
</style>
