<script>
  import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';
  export let data;
  function formatEpoch(epoch) {
    if (!epoch) return '—';
    return new Date(Number(epoch)).toLocaleString();
  }
</script>

<div class="page-stack">
  <LeagueSubnav season={data.season} active="managers" />

  <section class="hero card">
    <img src={data.manager.photo} alt={data.manager.name} />
    <div class="hero-copy">
      <div class="eyebrow">Manager dossier</div>
      <h1>{data.manager.liveTeamName}</h1>
      <h2>{data.manager.name}</h2>
      <p>{data.manager.bio}</p>
      <div class="chips">
        <span>{data.manager.location}</span>
        <span>{data.manager.persona}</span>
        <span>{data.manager.recordLabel}</span>
        <span>{(data.manager.pointsFor || 0).toFixed(2)} PF</span>
      </div>
      <div class="link-row">
        <a href={data.quickLinks.moves}>Recent moves</a>
        <a href={data.quickLinks.games}>Recent games</a>
        <a href={data.quickLinks.standings}>Standings</a>
        <a href={data.quickLinks.drafts}>Draft archive</a>
        <a href={data.quickLinks.franchise}>Franchise page</a>
      </div>
      <div class="source">{data.source}</div>
    </div>
  </section>

  <section class="stats-grid">
    {#each data.dossierStats as stat}
      <div class="stat-card">
        <div class="label">{stat.label}</div>
        <strong>{stat.value}</strong>
      </div>
    {/each}
  </section>

  <section class="analytics-grid">
    {#each data.analyticsCards as stat}
      <div class="stat-card analytic">
        <div class="label">{stat.label}</div>
        <strong>{stat.value}</strong>
        <small>{stat.hint}</small>
      </div>
    {/each}
  </section>

  <section class="grid two-up">
    <div class="card">
      <h3>Season analytics</h3>
      <dl class="facts compact">
        <div><dt>Average score</dt><dd>{data.seasonAnalytics.averageScore.toFixed(2)}</dd></div>
        <div><dt>Median score</dt><dd>{data.seasonAnalytics.medianScore.toFixed(2)}</dd></div>
        <div><dt>Average margin</dt><dd>{data.seasonAnalytics.averageMargin.toFixed(2)}</dd></div>
        <div><dt>Best week</dt><dd>{data.seasonAnalytics.bestWeek ? `W${data.seasonAnalytics.bestWeek.week} · ${data.seasonAnalytics.bestWeek.score.toFixed(2)}` : '—'}</dd></div>
        <div><dt>Worst week</dt><dd>{data.seasonAnalytics.worstWeek ? `W${data.seasonAnalytics.worstWeek.week} · ${data.seasonAnalytics.worstWeek.score.toFixed(2)}` : '—'}</dd></div>
        <div><dt>Volatility</dt><dd>{data.seasonAnalytics.scoreVolatility.toFixed(2)}</dd></div>
      </dl>
    </div>
    <div class="card">
      <h3>Trade market profile</h3>
      <dl class="facts compact">
        <div><dt>Market style</dt><dd>{data.tradeProfile.marketStyle}</dd></div>
        <div><dt>Total trades</dt><dd>{data.tradeProfile.tradeCount}</dd></div>
        <div><dt>Favorite partner</dt><dd>{data.tradeProfile.favoritePartner ? `${data.tradeProfile.favoritePartner} (${data.tradeProfile.favoritePartnerCount})` : '—'}</dd></div>
        <div><dt>Players in / out</dt><dd>{data.tradeProfile.playerInCount} / {data.tradeProfile.playerOutCount}</dd></div>
        <div><dt>Pick deals</dt><dd>{data.tradeProfile.pickDeals}</dd></div>
        <div><dt>Last trade</dt><dd>{formatEpoch(data.tradeProfile.lastTradeAt)}</dd></div>
      </dl>
      {#if data.tradeProfile.positionTargets.length}
        <div class="chips tight">
          {#each data.tradeProfile.positionTargets.slice(0, 4) as [pos, count]}
            <span>Bought {pos}: {count}</span>
          {/each}
        </div>
      {/if}
    </div>
  </section>

  <section class="grid two-up">
    <div class="card">
      <h3>Top auction spends</h3>
      <div class="stack">
        {#each data.topSpend as pick}
          <div class="player-row"><img src={pick.player.photoUrl} alt={pick.player.name} /><div><strong>{pick.player.name}</strong><small>{pick.player.position || '—'} · {pick.player.teamLabel || pick.player.team || 'FA'}</small></div><span>${pick.amount}</span></div>
        {/each}
        {#if !data.topSpend.length}<div class="empty">No live draft picks found for this dossier in the selected season.</div>{/if}
      </div>
    </div>
    <div class="card">
      <h3>Current starters</h3>
      <div class="stack">
        {#each data.starters as player}
          <div class="player-row"><img src={player.photoUrl} alt={player.name} /><div><strong>{player.name}</strong><small>{player.position || '—'} · {player.teamLabel || player.team || 'FA'}</small></div></div>
        {/each}
        {#if !data.starters.length}<div class="empty">No starter snapshot available.</div>{/if}
      </div>
    </div>
  </section>

  <section class="grid two-up">
    <div class="card">
      <h3>Move profile</h3>
      <div class="chips tight">
        <span>{data.moveProfile.totalMoves} total</span>
        <span>{data.moveProfile.trades} trades</span>
        <span>{data.moveProfile.waivers} waivers</span>
        <span>{data.moveProfile.freeAgents} FA adds</span>
      </div>
      <p class="soft">Adds: {data.moveProfile.adds} · Drops: {data.moveProfile.drops} · Most active week: {data.moveProfile.mostActiveWeek ? `Week ${data.moveProfile.mostActiveWeek}` : '—'} · Last move: {formatEpoch(data.moveProfile.lastMoveAt)}</p>
      <div class="stack">
        {#each data.recentMoves as move}
          <a class="line-item" href={data.quickLinks.moves}><strong>Week {move.week} · {move.type}</strong><small>{move.counterparties.join(' • ') || 'Solo move'}</small><span>{move.addCount} add / {move.dropCount} drop</span></a>
        {/each}
        {#if !data.recentMoves.length}<div class="empty">No recent moves attached to this team.</div>{/if}
      </div>
    </div>
    <div class="card">
      <h3>Weekly lineup audit</h3>
      <div class="stack">
        {#each data.weeklyLinks as week}
          <a class="line-item" href={week.href}><strong>Week {week.week}</strong><small>{week.lineupIQ.toFixed(1)}% lineup IQ · {week.benchPoints.toFixed(2)} swing</small><span>{week.optimalScore.toFixed(2)} optimal</span></a>
        {/each}
        {#if !data.weeklyLinks.length}<div class="empty">No weekly lineup audits available yet.</div>{/if}
      </div>
    </div>
  </section>

  <section class="grid two-up">
    <div class="card">
      <h3>Season-by-season finishes</h3>
      <div class="history-table">
        <div class="history-head"><span>Season</span><span>Finish</span><span>Record</span><span>PF</span></div>
        {#each data.seasonHistory as season}
          <div class="history-row">
            <span>{season.season}</span>
            <span>{season.champion ? '🏆' : ''} #{season.rank}</span>
            <span>{season.recordLabel}</span>
            <span>{season.points.toFixed(2)}</span>
          </div>
        {/each}
      </div>
    </div>
    <div class="card">
      <h3>Future analytics runway</h3>
      <div class="stack">
        {#each data.futureMetrics as item}
          <div class="line-item"><strong>{item}</strong></div>
        {/each}
      </div>
    </div>
  </section>
</div>

<style>
  .page-stack{display:grid;gap:20px}.card,.stat-card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:20px}
  .hero{display:grid;grid-template-columns:220px 1fr;gap:20px}.hero img{width:220px;height:220px;object-fit:cover;border-radius:20px}
  .eyebrow,.label{text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#d6b15e}
  .hero-copy,.stack{display:grid;gap:12px}.hero-copy p,.soft,.source,small{color:rgba(255,255,255,.7)}
  .chips,.link-row{display:flex;gap:10px;flex-wrap:wrap}.chips span{padding:8px 12px;border-radius:999px;background:rgba(214,177,94,.12);color:#e2c16f}.chips.tight span{padding:7px 10px}
  .link-row a{color:#d6b15e;text-decoration:none}
  .stats-grid,.analytics-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.stat-card strong{font-size:1.4rem;margin-top:6px;display:block}.analytic small{margin-top:6px;display:block}
  .grid.two-up{display:grid;grid-template-columns:1fr 1fr;gap:20px}.facts{display:grid;gap:12px}
  .facts div{display:grid;grid-template-columns:160px 1fr;gap:12px;border-bottom:1px solid rgba(255,255,255,.08);padding-bottom:8px}.facts dt{color:rgba(255,255,255,.6)}
  .player-row,.line-item{display:grid;grid-template-columns:44px 1fr auto;gap:12px;padding:12px;border-radius:14px;background:rgba(255,255,255,.03);align-items:center;text-decoration:none;color:inherit}
  .player-row img{width:44px;height:44px;border-radius:50%;object-fit:cover;background:rgba(255,255,255,.08)}
  .line-item{grid-template-columns:1fr}.empty{padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.03)}
  .history-table{display:grid;gap:8px}.history-head,.history-row{display:grid;grid-template-columns:90px 110px 1fr auto;gap:12px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.03)}.history-head{color:#d6b15e;font-size:12px;text-transform:uppercase;letter-spacing:.15em}
  @media(max-width:960px){.stats-grid,.analytics-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:860px){.hero,.grid.two-up,.facts div,.history-head,.history-row{grid-template-columns:1fr}.hero img{width:100%;height:auto;max-width:280px}.player-row{grid-template-columns:40px 1fr}.line-item{grid-template-columns:1fr}}
</style>
