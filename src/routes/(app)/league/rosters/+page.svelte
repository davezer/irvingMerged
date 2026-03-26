<script>
  export let data;
  const rosters = data?.rosters ?? [];
  const hasData = data?.hasData ?? false;

  function recordLine(item) {
    return `${item.wins}-${item.losses}${item.ties ? `-${item.ties}` : ''}`;
  }
</script>

<div class="page-stack">
  <div class="hero">
    <div>
      <div class="eyebrow">League Rosters</div>
      <h1>Depth charts and ownership room</h1>
      <p>Live Sleeper roster data lands here after a sync. Team identity, roster bodies, and current season pulse all belong in one place now.</p>
    </div>
  </div>

  {#if !hasData}
    <div class="empty card">
      <h2>No roster data yet</h2>
      <p>Run the Sleeper sync endpoint from the admin side and this board will populate from D1-backed roster records.</p>
      <code>POST /api/admin/league/sync-sleeper</code>
    </div>
  {:else}
    <div class="grid">
      {#each rosters as roster (roster.rosterId)}
        <article class="card roster">
          <div class="head">
            <div class="avatar">
              {#if roster.avatarUrl}
                <img src={roster.avatarUrl} alt={roster.displayName} />
              {:else}
                <span>{roster.initials}</span>
              {/if}
            </div>
            <div class="meta">
              <h2>{roster.displayName}</h2>
              {#if roster.teamName}
                <div class="team-name">{roster.teamName}</div>
              {/if}
              <div class="record">{recordLine(roster)}</div>
            </div>
          </div>

          <div class="stats">
            <div><span>Roster ID</span><strong>{roster.rosterId}</strong></div>
            <div><span>Starters</span><strong>{roster.starterCount}</strong></div>
            <div><span>Players</span><strong>{roster.playerCount}</strong></div>
            <div><span>FAAB Used</span><strong>${roster.waiverBudgetUsed}</strong></div>
          </div>

          <div class="strip">
            <div class="label">Starter slots</div>
            <div class="chips">
              {#each roster.starters as starter, index (`${roster.rosterId}-${starter}-${index}`)}
                <span class="chip">{starter}</span>
              {/each}
            </div>
          </div>

          {#if roster.managerSlug}
            <a class="link" href={`/league/managers/${roster.managerSlug}`}>Open manager dossier →</a>
          {/if}
        </article>
      {/each}
    </div>
  {/if}
</div>

<style>
  .page-stack{display:grid;gap:20px}
  .hero,.card{background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:24px}
  .eyebrow,.label{text-transform:uppercase;letter-spacing:.18em;font-size:11px;color:#d1ac59}
  h1,h2{margin:0}
  p,.team-name,.record,.label,.chip,code{color:rgba(255,255,255,.76)}
  .empty{display:grid;gap:12px}
  code{background:rgba(255,255,255,.06);padding:8px 10px;border-radius:10px;display:inline-block}
  .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
  .roster{display:grid;gap:18px}
  .head{display:flex;gap:14px;align-items:center}
  .avatar{width:56px;height:56px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.08);display:grid;place-items:center;font-weight:800}
  .avatar img{width:100%;height:100%;object-fit:cover}
  .meta{display:grid;gap:4px}
  .record{font-weight:700;color:#f0c96d}
  .stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
  .stats div{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:12px;display:grid;gap:5px}
  .stats span{font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:rgba(255,255,255,.52)}
  .strip{display:grid;gap:10px}
  .chips{display:flex;flex-wrap:wrap;gap:8px}
  .chip{padding:8px 10px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);font-size:.86rem}
  .link{color:#f0c96d;text-decoration:none;font-weight:700}
  @media(max-width:900px){.grid{grid-template-columns:1fr}.stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:560px){.stats{grid-template-columns:1fr}}
</style>
