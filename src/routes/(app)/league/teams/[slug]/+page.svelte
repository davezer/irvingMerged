<script>
  import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';
  export let data;
</script>

<div class="page-stack">
  <LeagueSubnav season={data.season} active="teams" />

  <section class="hero card">
    <img src={data.franchise.teamPhoto} alt={data.franchise.teamName} />
    <div class="hero-copy">
      <div class="eyebrow">Franchise page</div>
      <h1>{data.franchise.teamName}</h1>
      <h2>{data.franchise.managerName}</h2>
      <p>{data.franchise.bio}</p>
      <div class="chips">
        <span>{data.franchise.recordLabel}</span>
        <span>{(data.franchise.pointsFor || 0).toFixed(2)} PF</span>
        <span>{(data.franchise.pointsAgainst || 0).toFixed(2)} PA</span>
        <span>{(data.franchise.pointDiff || 0).toFixed(2)} diff</span>
      </div>
      <div class="link-row">
        <a href={data.sections.dossier}>Manager dossier</a>
        <a href={data.sections.moves}>Move log</a>
        <a href={data.sections.games}>Games</a>
        <a href={data.sections.drafts}>Draft archive</a>
        <a href={data.sections.standings}>Standings</a>
      </div>
      <div class="source">{data.source}</div>
    </div>
  </section>

  <section class="stats-grid">
    {#each data.dossierStats as stat}
      <div class="stat-card"><div class="label">{stat.label}</div><strong>{stat.value}</strong></div>
    {/each}
  </section>

  <section class="grid two-up">
    <div class="card">
      <h3>Franchise profile</h3>
      <dl class="facts">
        <div><dt>Preferred NFL tie</dt><dd>{String(data.franchise.favoriteTeam || '—').toUpperCase()}</dd></div>
        <div><dt>Philosophy</dt><dd>{data.franchise.philosophy || '—'}</dd></div>
        <div><dt>Preferred contact</dt><dd>{data.franchise.preferredContact || '—'}</dd></div>
        <div><dt>Championship years</dt><dd>{data.franchise.championship?.years || '—'}</dd></div>
      </dl>
    </div>
    <div class="card">
      <h3>Lineup command center</h3>
      <dl class="facts">
        <div><dt>Average lineup IQ</dt><dd>{data.lineupAnalytics.averageLineupIQ.toFixed(1)}%</dd></div>
        <div><dt>Average hit rate</dt><dd>{data.lineupAnalytics.averageHitRate.toFixed(1)}%</dd></div>
        <div><dt>Bench points lost</dt><dd>{data.lineupAnalytics.totalBenchPoints.toFixed(2)}</dd></div>
        <div><dt>Worst efficiency week</dt><dd>{data.lineupAnalytics.worstWeek ? `Week ${data.lineupAnalytics.worstWeek.week}` : '—'}</dd></div>
      </dl>
    </div>
  </section>

  <section class="grid two-up">
    <div class="card">
      <h3>Trade market profile</h3>
      <dl class="facts">
        <div><dt>Style</dt><dd>{data.tradeProfile.marketStyle}</dd></div>
        <div><dt>Total trades</dt><dd>{data.tradeProfile.tradeCount}</dd></div>
        <div><dt>Favorite partner</dt><dd>{data.tradeProfile.favoritePartner ? `${data.tradeProfile.favoritePartner} (${data.tradeProfile.favoritePartnerCount})` : '—'}</dd></div>
        <div><dt>Players in / out</dt><dd>{data.tradeProfile.playerInCount} / {data.tradeProfile.playerOutCount}</dd></div>
      </dl>
      {#if data.tradeProfile.positionTargets.length}
        <div class="chips tight">
          {#each data.tradeProfile.positionTargets.slice(0, 4) as [pos, count]}
            <span>Bought {pos}: {count}</span>
          {/each}
        </div>
      {/if}
    </div>
    <div class="card">
      <h3>Weekly team pages</h3>
      <div class="stack">
        {#each data.weeklyLinks as week}
          <a class="line-item" href={week.href}><strong>Week {week.week}</strong><small>{week.lineupIQ.toFixed(1)}% lineup IQ · {week.benchPoints.toFixed(2)} swing</small><span>{week.optimalScore.toFixed(2)} optimal</span></a>
        {/each}
        {#if !data.weeklyLinks.length}<div class="empty">No weekly team pages available yet.</div>{/if}
      </div>
    </div>
  </section>

  <section class="grid two-up">
    <div class="card">
      <h3>Recent moves</h3>
      <div class="stack">
        {#each data.recentMoves as move}
          <a class="line-item" href={data.sections.moves}><strong>Week {move.week} · {move.type}</strong><small>{move.counterparties.join(' • ') || 'Solo move'}</small><span>{move.addCount} add / {move.dropCount} drop</span></a>
        {/each}
        {#if !data.recentMoves.length}<div class="empty">No recent move data available.</div>{/if}
      </div>
    </div>
    <div class="card">
      <h3>Recent games</h3>
      <div class="stack">
        {#each data.recentMatchups as row}
          <a class="line-item" href={`/league/teams/${data.franchise.slug}/weeks/${row.week}?season=${data.season}`}><strong>Week {row.week} · {row.result}</strong><small>{row.opponentTeam}</small><span>{row.score.toFixed(2)} – {row.oppScore.toFixed(2)}</span></a>
        {/each}
        {#if !data.recentMatchups.length}<div class="empty">No recent matchup data available.</div>{/if}
      </div>
    </div>
  </section>

  <section class="grid two-up">
    <div class="card">
      <h3>Top spends</h3>
      <div class="stack">
        {#each data.topSpend as pick}
          <div class="player-row"><img src={pick.player.photoUrl} alt={pick.player.name} /><div><strong>{pick.player.name}</strong><small>{pick.player.position || '—'} · {pick.player.teamLabel || pick.player.team || 'FA'}</small></div><span>${pick.amount}</span></div>
        {/each}
        {#if !data.topSpend.length}<div class="empty">No draft-spend data available.</div>{/if}
      </div>
    </div>
    <div class="card">
      <h3>Season-by-season finishes</h3>
      <div class="history-table">
        <div class="history-head"><span>Season</span><span>Finish</span><span>Record</span><span>PF</span></div>
        {#each data.seasonHistory as season}
          <div class="history-row"><span>{season.season}</span><span>{season.champion ? '🏆' : ''} #{season.rank}</span><span>{season.recordLabel}</span><span>{season.points.toFixed(2)}</span></div>
        {/each}
      </div>
    </div>
  </section>
</div>

<style>
  .page-stack{display:grid;gap:20px}.card,.stat-card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:20px}
  .hero{display:grid;grid-template-columns:220px 1fr;gap:20px}.hero img{width:220px;height:220px;object-fit:cover;border-radius:20px}.hero-copy,.stack{display:grid;gap:12px}
  .eyebrow,.label{text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#d6b15e}.source,.hero-copy p,.facts dt,small{color:rgba(255,255,255,.7)}
  .chips,.link-row{display:flex;gap:10px;flex-wrap:wrap}.chips span{padding:8px 12px;border-radius:999px;background:rgba(214,177,94,.12);color:#e2c16f}.chips.tight span{padding:7px 10px}.link-row a{color:#d6b15e;text-decoration:none}
  .stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.stat-card strong{font-size:1.4rem;margin-top:6px;display:block}
  .grid.two-up{display:grid;grid-template-columns:1fr 1fr;gap:20px}.facts{display:grid;gap:12px}.facts div{display:grid;grid-template-columns:160px 1fr;gap:12px;border-bottom:1px solid rgba(255,255,255,.08);padding-bottom:8px}
  .line-item,.player-row{display:grid;grid-template-columns:1fr;gap:6px;padding:12px;border-radius:14px;background:rgba(255,255,255,.03);text-decoration:none;color:inherit}.player-row{grid-template-columns:44px 1fr auto;gap:12px;align-items:center}.player-row img{width:44px;height:44px;border-radius:50%;object-fit:cover;background:rgba(255,255,255,.08)}
  .empty{padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.03)}.history-table{display:grid;gap:8px}.history-head,.history-row{display:grid;grid-template-columns:90px 110px 1fr auto;gap:12px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.03)}.history-head{color:#d6b15e;font-size:12px;text-transform:uppercase;letter-spacing:.15em}
  @media(max-width:960px){.stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:860px){.hero,.grid.two-up,.facts div,.history-head,.history-row{grid-template-columns:1fr}.hero img{width:100%;height:auto;max-width:280px}.player-row{grid-template-columns:40px 1fr}.line-item{grid-template-columns:1fr}}
</style>
