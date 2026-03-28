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
      <p>Live Sleeper roster data is fetched server-side, cached, and dressed in Irving League branding before it hits this page.</p>
    </div>
  </div>

  {#if data?.error}
    <div class="card empty">
      <h2>Roster feed unavailable</h2>
      <p>{data.error}</p>
    </div>
  {/if}

  {#if !hasData}
    <div class="empty card">
      <h2>No roster data yet</h2>
      <p>We could not pull roster data from Sleeper for this request.</p>
    </div>
  {:else}
    <div class="grid">
      {#each rosters as roster (roster.rosterId)}
        <article class="card roster">
          <div class="head">
            <div class="avatar">
              {#if roster.avatarUrl}
                <img src={roster.avatarUrl} alt={roster.teamName} />
              {:else}
                <span>{roster.initials}</span>
              {/if}
            </div>
            <div class="meta">
              <h2>{roster.teamName}</h2>
              <div class="manager-name">{roster.managerName}</div>
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
            <div class="label">Starters</div>
            <div class="starter-grid">
              {#each roster.starters as starter, index (`${roster.rosterId}-${starter.id}-${index}`)}
                <div class="starter-card">
                  <div class="starter-avatar">
                    <img src={starter.photoUrl} alt={starter.name} />
                  </div>
                  <div class="starter-meta">
                    <strong>{starter.name}</strong>
                    <span>{starter.position || '—'}{#if starter.team} • {starter.team}{/if}</span>
                  </div>
                </div>
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
  p,.manager-name,.record,.label,.chip,code{color:rgba(255,255,255,.76)}
  .empty{display:grid;gap:12px}
  .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
  .roster{display:grid;gap:18px}
  .head{display:flex;gap:14px;align-items:center}
  .avatar{width:64px;height:64px;border-radius:18px;overflow:hidden;background:rgba(255,255,255,.08);display:grid;place-items:center;font-weight:800}
  .avatar img{width:100%;height:100%;object-fit:cover}
  .meta{display:grid;gap:4px}
  .manager-name{font-size:.95rem}
  .record{font-weight:700;color:#f0c96d}
  .stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
  .stats div{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:12px;display:grid;gap:5px}
  .stats span{font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:rgba(255,255,255,.52)}
  .strip{display:grid;gap:10px}
  .starter-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  .starter-card{display:flex;gap:10px;align-items:center;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:10px}
  .starter-avatar{width:42px;height:42px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.08);flex:0 0 42px}
  .starter-avatar img{width:100%;height:100%;object-fit:cover}
  .starter-meta{display:grid;gap:2px;min-width:0}
  .starter-meta strong{font-size:.92rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .starter-meta span{font-size:.8rem;color:rgba(255,255,255,.58)}
  .link{color:#f0c96d;text-decoration:none;font-weight:700}
  @media(max-width:900px){.grid{grid-template-columns:1fr}.stats,.starter-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:560px){.stats,.starter-grid{grid-template-columns:1fr}}
</style>
