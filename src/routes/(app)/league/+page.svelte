<script>
  import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';
  export let data;
</script>

<div class="page-stack">
  <LeagueSubnav season={data.season || new Date().getFullYear()} active="league" />
  <section class="hero card">
    <div>
      <div class="eyebrow">League HQ</div>
      <h1>{data.leagueName}</h1>
      <p>Every overview card on this page now pulls from the same live Sleeper spine: standings, current-week matchups, recent league movement, and Irving identity overlays.</p>
      <div class="source">{data.source}</div>
    </div>
    <div class="hero-stats">
      <div class="mini stat"><span>Top seed</span><strong>{data.pulse?.topSeed?.teamName || '—'}</strong><small>{data.pulse?.topSeed?.recordLabel || 'No record yet'}</small></div>
      <div class="mini stat"><span>Hottest offense</span><strong>{data.pulse?.hottest?.teamName || '—'}</strong><small>{data.pulse ? `${data.pulse.hottest?.points?.toFixed(2) || '0.00'} PF` : 'No data yet'}</small></div>
      <div class="mini stat"><span>Most active</span><strong>{data.activityLeaders[0]?.teamName || '—'}</strong><small>{data.activityLeaders[0] ? `${data.activityLeaders[0].activityCount} logged moves` : 'No movement yet'}</small></div>
      <div class="mini stat"><span>Draft room</span><strong>{data.draft ? `${data.draft.teams} teams` : 'Archive ready'}</strong><small>{data.draft ? `${data.draft.rounds} rounds • ${data.draft.status}` : 'Sleeper-powered archive'}</small></div>
    </div>
  </section>

  <section class="action-grid">
    <a class="mini action" href={`/league/standings?season=${data.season}`}><strong>Standings</strong><span>{data.topBoard.length} teams ranked live for {data.season}</span></a>
    <a class="mini action" href={`/league/managers?season=${data.season}`}><strong>Managers</strong><span>{data.featuredManagers.length} featured dossiers and live profile analytics</span></a>
    <a class="mini action" href={`/league/teams?season=${data.season}`}><strong>Franchises</strong><span>Team-first pages, current form, and cross-links into moves, games, and dossiers</span></a>
    <a class="mini action" href={`/league/matchups?season=${data.season}&week=${data.selectedWeek}`}><strong>Week {data.selectedWeek}</strong><span>Scoreboard, rivalry cards, and playoff path</span></a>
    <a class="mini action" href={`/league/transactions?season=${data.season}&weeks=${data.availableWeeks.slice(-4).join(',')}`}><strong>Wire room</strong><span>Last four weeks of league movement</span></a>
  </section>

  <section class="grid two-up">
    <div class="card">
      <div class="section-head"><h2>Top of the board</h2><a href={`/league/standings?season=${data.season}`}>Full standings</a></div>
      <div class="stack">
        {#each data.topBoard as row}
          <a class="row" href={row.slug ? `/league/managers/${row.slug}?season=${data.season}` : `/league/standings?season=${data.season}`}>
            <span class="rank">#{row.rank}</span>
            <div class="identity">
              <div class="photo">
                {#if row.teamPhoto}
                  <img src={row.teamPhoto} alt={row.teamName} />
                {:else}
                  <span>{row.initials}</span>
                {/if}
              </div>
              <div><strong>{row.teamName}</strong><small>{row.managerName}</small></div>
            </div>
            <span>{row.recordLabel}</span>
          </a>
        {/each}
      </div>
    </div>

    <div class="card">
      <div class="section-head"><h2>Week {data.selectedWeek} spotlight</h2><a href={`/league/matchups?season=${data.season}&week=${data.selectedWeek}`}>Open matchups</a></div>
      {#if data.spotlightMatchup}
        <div class="spotlight-card">
          <div class="matchup-team">
            <div class="photo">{#if data.spotlightMatchup.left.teamPhoto}<img src={data.spotlightMatchup.left.teamPhoto} alt={data.spotlightMatchup.left.teamName} />{:else}<span>{data.spotlightMatchup.left.initials}</span>{/if}</div>
            <div><strong>{data.spotlightMatchup.left.teamName}</strong><small>{data.spotlightMatchup.left.managerName}</small></div>
            <span>{data.spotlightMatchup.leftScore.toFixed(2)}</span>
          </div>
          <div class="matchup-team">
            <div class="photo">{#if data.spotlightMatchup.right.teamPhoto}<img src={data.spotlightMatchup.right.teamPhoto} alt={data.spotlightMatchup.right.teamName} />{:else}<span>{data.spotlightMatchup.right.initials}</span>{/if}</div>
            <div><strong>{data.spotlightMatchup.right.teamName}</strong><small>{data.spotlightMatchup.right.managerName}</small></div>
            <span>{data.spotlightMatchup.rightScore.toFixed(2)}</span>
          </div>
          <div class="spotlight-meta">
            <span>{data.spotlightMatchup.totalScore.toFixed(2)} combined</span>
            <span>{data.spotlightMatchup.margin.toFixed(2)} margin</span>
            <strong>{data.spotlightMatchup.winnerName}</strong>
          </div>
        </div>
      {:else}
        <div class="story"><strong>No featured matchup yet</strong><p>Once current-week matchup data lands, this panel highlights the juiciest board.</p></div>
      {/if}
    </div>
  </section>

  <section class="grid two-up">
    <div class="card">
      <div class="section-head"><h2>Recent movement</h2><a href={`/league/transactions?season=${data.season}&weeks=${data.availableWeeks.slice(-4).join(',')}`}>Full wire room</a></div>
      <div class="stack">
        {#each data.recentMoves as move}
          <a class="story move-card" href={`/league/transactions?season=${data.season}&weeks=${move.week}`}>
            <strong>Week {move.week} · {move.type}</strong>
            <p>{move.summary}</p>
          </a>
        {/each}
        {#if !data.recentMoves.length}
          <div class="story"><strong>No movement yet</strong><p>The league wire room will populate here as Sleeper transactions roll in.</p></div>
        {/if}
      </div>
    </div>

    <div class="card">
      <div class="section-head"><h2>Front-office heat check</h2><a href={`/league/transactions?season=${data.season}&weeks=${data.availableWeeks.slice(-4).join(',')}`}>Activity log</a></div>
      <div class="stack">
        {#each data.activityLeaders as row}
          <a class="row" href={row.slug ? `/league/transactions?season=${data.season}&team=${row.slug}` : `/league/transactions?season=${data.season}&rosterId=${row.rosterId}`}>
            <div class="identity">
              <div class="photo">{#if row.teamPhoto}<img src={row.teamPhoto} alt={row.teamName} />{:else}<span>{row.initials}</span>{/if}</div>
              <div><strong>{row.teamName}</strong><small>{row.managerName}</small></div>
            </div>
            <span>{row.activityCount} moves</span>
          </a>
        {/each}
        {#if !data.activityLeaders.length}
          <div class="story"><strong>Quiet room so far</strong><p>As soon as trades and wire pickups hit, this turns into a live activity ladder.</p></div>
        {/if}
      </div>
    </div>
  </section>

  <section class="card">
    <div class="section-head"><h2>Featured dossiers</h2><a href={`/league/managers?season=${data.season}`}>All managers</a></div>
    <div class="featured-grid">
      {#each data.featuredManagers as manager}
        <article class="featured-card">
          <div class="identity">
            <div class="photo large">{#if manager.teamPhoto}<img src={manager.teamPhoto} alt={manager.teamName} />{:else}<span>{manager.initials}</span>{/if}</div>
            <div>
              <strong>{manager.teamName}</strong>
              <small>{manager.managerName} · {manager.recordLabel}</small>
            </div>
          </div>
          <p>{manager.bio}</p>
          <div class="chip-row">
            <span>#{manager.rank}</span>
            <span>{manager.points.toFixed(2)} PF</span>
            <span>{manager.pointDiff.toFixed(2)} diff</span>
          </div>
          <div class="link-row">
            <a href={manager.dossierHref}>Dossier</a>
            <a href={manager.gamesHref}>Games</a>
            <a href={manager.movesHref}>Moves</a>
          </div>
        </article>
      {/each}
    </div>
  </section>
</div>

<style>
  .page-stack{display:grid;gap:24px}.card{background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:24px}.hero{display:grid;grid-template-columns:1.1fr .9fr;gap:24px;align-items:start}.hero-stats,.action-grid,.stack,.featured-grid{display:grid;gap:12px}.hero-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.mini,.story,.row,.featured-card,.spotlight-card,.action{background:rgba(255,255,255,.03);border-radius:16px;padding:14px;text-decoration:none;color:inherit}.mini.stat{display:grid;gap:6px}.mini.stat span,.eyebrow{color:#d6b15e;text-transform:uppercase;letter-spacing:.18em;font-size:11px}.action-grid{grid-template-columns:repeat(5,minmax(0,1fr))}.action{display:grid;gap:6px}.grid.two-up{display:grid;grid-template-columns:1fr 1fr;gap:24px}.section-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.section-head a,.link-row a{color:#d6b15e;text-decoration:none}.story p,.source,.row small,.featured-card p{margin:.45rem 0 0;color:rgba(255,255,255,.7)}.row{display:grid;grid-template-columns:52px 1fr auto;align-items:center;gap:12px}.rank{font-weight:700;color:#d6b15e}.identity{display:flex;align-items:center;gap:12px}.photo{width:42px;height:42px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:rgba(255,255,255,.06);font-weight:800}.photo.large{width:56px;height:56px}.photo img{width:100%;height:100%;object-fit:cover}.spotlight-card{display:grid;gap:12px}.matchup-team{display:grid;grid-template-columns:42px 1fr auto;gap:12px;align-items:center;padding:12px;border-radius:14px;background:rgba(255,255,255,.04)}.spotlight-meta{display:flex;justify-content:space-between;gap:12px;color:rgba(255,255,255,.72)}.featured-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.featured-card{display:grid;gap:12px}.chip-row,.link-row{display:flex;gap:8px;flex-wrap:wrap}.chip-row span{padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.84)}.source{margin-top:12px}.move-card strong{display:block}@media(max-width:1100px){.action-grid,.featured-grid,.hero-stats{grid-template-columns:1fr 1fr}}@media(max-width:860px){.hero,.grid.two-up,.action-grid,.featured-grid,.hero-stats{grid-template-columns:1fr}.row{grid-template-columns:1fr}.matchup-team{grid-template-columns:42px 1fr auto}}
</style>
