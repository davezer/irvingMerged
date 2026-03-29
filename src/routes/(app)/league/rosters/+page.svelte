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
      <h1>{data.leagueName}</h1>
      <p>Live roster bodies from Sleeper, dressed in Irving team identity. No raw player IDs, no D1 dependency, just cached league state with your branding layered on top.</p>
    </div>
    <div class="hero-meta">
      <div><span>Season</span><strong>{data.season}</strong></div>
      <div><span>Source</span><strong>{data.source}</strong></div>
    </div>
  </div>

  {#if !hasData}
    <div class="empty card">
      <h2>No roster data yet</h2>
      <p>We could not pull rosters from Sleeper for this season/league combination.</p>
    </div>
  {:else}
    <div class="grid">
      {#each rosters as roster (roster.rosterId)}
        <article class="card roster">
          <div class="head">
            <div class="avatar team-avatar">
              {#if roster.teamPhoto}
                <img src={roster.teamPhoto} alt={roster.teamName} />
              {:else}
                <span>{roster.initials}</span>
              {/if}
            </div>
            <div class="meta">
              <h2>{roster.teamName}</h2>
              <div class="manager">{roster.managerName}</div>
              <div class="record">{recordLine(roster)} • {roster.pointsFor.toFixed(2)} PF</div>
            </div>
          </div>

          <div class="stats">
            <div><span>Roster ID</span><strong>{roster.rosterId}</strong></div>
            <div><span>Starters</span><strong>{roster.starterCount}</strong></div>
            <div><span>Bench</span><strong>{roster.benchCount}</strong></div>
            <div><span>FAAB Used</span><strong>${roster.waiverBudgetUsed}</strong></div>
          </div>

          <div class="strip">
            <div class="label">Starting lineup</div>
            <div class="player-grid">
              {#each roster.starters as starter (`${roster.rosterId}-${starter.id}`)}
                <div class="player-chip">
                  <img src={starter.photoUrl} alt={starter.name} />
                  <div>
                    <strong>{starter.name}</strong>
                    <small>{starter.position || '—'}{#if starter.team} • {starter.team}{/if}</small>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</div>

<style>
  .page-stack{display:grid;gap:20px}
  .hero,.card{background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:24px}
  .hero{display:grid;grid-template-columns:1.3fr auto;gap:18px;align-items:start}
  .hero-meta{display:grid;gap:10px;min-width:240px}
  .hero-meta div,.stats div{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:12px;display:grid;gap:5px}
  .eyebrow,.label{text-transform:uppercase;letter-spacing:.18em;font-size:11px;color:#d1ac59}
  h1,h2{margin:0}
  p,.manager,.record,.label{color:rgba(255,255,255,.76)}
  .manager{font-weight:600}
  .empty{display:grid;gap:12px}
  .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
  .roster{display:grid;gap:18px}
  .head{display:flex;gap:14px;align-items:center}
  .avatar{width:64px;height:64px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.08);display:grid;place-items:center;font-weight:800}
  .team-avatar img{width:100%;height:100%;object-fit:cover}
  .meta{display:grid;gap:4px}
  .record{font-weight:700;color:#f0c96d}
  .stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
  .stats span,.hero-meta span{font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:rgba(255,255,255,.52)}
  .strip{display:grid;gap:12px}
  .player-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  .player-chip{display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:16px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.06)}
  .player-chip img{width:42px;height:42px;border-radius:50%;object-fit:cover;background:rgba(255,255,255,.08)}
  .player-chip strong{display:block}
  .player-chip small{color:rgba(255,255,255,.6)}
  @media(max-width:900px){.hero,.grid{grid-template-columns:1fr}.stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:700px){.player-grid{grid-template-columns:1fr}}
  @media(max-width:560px){.stats{grid-template-columns:1fr}}
</style>
