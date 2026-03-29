<script>
  import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';
  export let data;

  function isWinner(matchup, side) {
    return matchup?.winner && matchup.winner === side?.rosterId;
  }
</script>

<div class="page-stack">
  <LeagueSubnav season={data.season || new Date().getFullYear()} active="matchups" />
  <div class="hero card">
    <div class="eyebrow">Matchups</div>
    <h1>Weekly scoreboard</h1>
    <p>Season flow now includes polished week navigation, rivalry cards, and a playoff-path board built from Sleeper matchups.</p>
    <div class="source">{data.source}</div>
    <div class="week-nav-row">
      {#if data.previousWeek}
        <a class="nav-pill" href={`?season=${data.season}&week=${data.previousWeek}`}>← Week {data.previousWeek}</a>
      {/if}
      <div class="week-links">
        {#each data.availableWeeks as week}
          <a class:selected={week === data.selectedWeek} href={`?season=${data.season}&week=${week}`}>Week {week}</a>
        {/each}
      </div>
      {#if data.nextWeek}
        <a class="nav-pill" href={`?season=${data.season}&week=${data.nextWeek}`}>Week {data.nextWeek} →</a>
      {/if}
    </div>
  </div>

  {#if !data.hasData}
    <div class="card empty">
      <h2>No matchup data yet</h2>
      <p>We could not pull matchup data for this league/week selection.</p>
    </div>
  {:else}
    {#if data.highlights}
      <section class="highlight-grid">
        <div class="card">
          <div class="eyebrow">Week {data.week.week}</div>
          <h3>Highest combined score</h3>
          <p>{data.highlights.highestCombined.left.teamName} vs {data.highlights.highestCombined.right.teamName}</p>
          <strong>{data.highlights.highestCombined.totalScore.toFixed(2)} total points</strong>
        </div>
        <div class="card">
          <div class="eyebrow">Tightest sweat</div>
          <h3>{data.highlights.closestGame.left.teamName} vs {data.highlights.closestGame.right.teamName}</h3>
          <p>{data.highlights.closestGame.margin.toFixed(2)} point margin</p>
          <strong>{data.highlights.closestGame.winnerName || 'Draw'}</strong>
        </div>
        <div class="card">
          <div class="eyebrow">Largest blowout</div>
          <h3>{data.highlights.biggestBlowout.winnerName || 'Dead heat'}</h3>
          <p>{data.highlights.biggestBlowout.margin.toFixed(2)} point margin</p>
          <strong>Week {data.week.week}</strong>
        </div>
      </section>
    {/if}

    <section class="stack">
      <div class="section-head">
        <div>
          <div class="eyebrow">Week {data.week.week}</div>
          <h2>Head-to-head board</h2>
        </div>
      </div>

      <div class="matchup-grid">
        {#each data.week.matchups as matchup (`week-${data.week.week}-${matchup.matchupId}`)}
          <article class="card matchup-card">
            {#each [matchup.left, matchup.right] as side, index (`${matchup.matchupId}-${side?.rosterId || index}`)}
              <div class:winning={isWinner(matchup, side)} class="team-row">
                <div class="team-main">
                  <div class="team-photo">
                    {#if side?.teamPhoto}
                      <img src={side.teamPhoto} alt={side.teamName} />
                    {:else}
                      <span>{side?.initials || '?'}</span>
                    {/if}
                  </div>
                  <div>
                    <strong>{side?.teamName || 'Bye / TBD'}</strong>
                    <small>{side?.managerName || 'Waiting on opponent'} · {side?.recordLabel || '—'}</small>
                  </div>
                </div>
                <div class="score">{side ? side.score.toFixed(2) : '—'}</div>
              </div>

              {#if side?.starters?.length}
                <div class="starter-strip">
                  {#each side.starters as starter (`${side.rosterId}-${starter.id}`)}
                    <div class="starter-chip">
                      <img src={starter.photoUrl} alt={starter.name} />
                      <span>{starter.shortName}</span>
                    </div>
                  {/each}
                </div>
              {/if}
            {/each}
          </article>
        {/each}
      </div>
    </section>

    {#if data.rivalryCards.length}
      <section class="stack">
        <div class="section-head">
          <div>
            <div class="eyebrow">Season rivalry scan</div>
            <h2>Head-to-head pressure points</h2>
          </div>
        </div>
        <div class="rivalry-grid">
          {#each data.rivalryCards as rivalry (rivalry.key)}
            <article class="card rivalry-card">
              <strong>{rivalry.leftTeamName} vs {rivalry.rightTeamName}</strong>
              <p>{rivalry.leftWins}-{rivalry.rightWins} across {rivalry.meetings} meeting{rivalry.meetings === 1 ? '' : 's'}.</p>
              <div class="meta-row">
                <span>Leader: {rivalry.leader}</span>
                <span>Closest margin: {rivalry.closestMargin?.toFixed(2) ?? '—'}</span>
              </div>
            </article>
          {/each}
        </div>
      </section>
    {/if}

    {#if data.playoffBoard.length}
      <section class="stack">
        <div class="section-head">
          <div>
            <div class="eyebrow">Playoff path</div>
            <h2>Bracket board</h2>
          </div>
        </div>
        <div class="playoff-grid">
          {#each data.playoffBoard as week (week.week)}
            <div class="card playoff-week">
              <div class="eyebrow">Week {week.week}</div>
              <div class="stack mini-stack">
                {#each week.games as game (`${week.week}-${game.matchupId}`)}
                  <div class="playoff-game">
                    <strong>{game.left.teamName}</strong>
                    <span>{game.left.score.toFixed(2)}</span>
                    <strong>{game.right.teamName}</strong>
                    <span>{game.right.score.toFixed(2)}</span>
                    <small>{game.winnerName || 'Draw'}</small>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  {/if}
</div>

<style>
  .page-stack,.stack{display:grid;gap:18px}
  .card{background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:24px}
  .eyebrow{text-transform:uppercase;letter-spacing:.18em;font-size:11px;color:#d1ac59}
  .hero p,.team-row small,.source{color:rgba(255,255,255,.72)}
  .week-nav-row{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;margin-top:14px}
  .week-links{display:flex;flex-wrap:wrap;gap:8px}
  .week-links a,.nav-pill{padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);text-decoration:none;color:rgba(255,255,255,.78)}
  .week-links a.selected{background:rgba(208,172,89,.16);color:#f0c96d}
  .highlight-grid,.matchup-grid,.rivalry-grid,.playoff-grid{display:grid;gap:16px}
  .highlight-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
  .matchup-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .rivalry-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
  .playoff-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
  .matchup-card{display:grid;gap:14px}
  .team-row{display:flex;justify-content:space-between;gap:18px;align-items:center;padding:12px 14px;border-radius:18px;background:rgba(255,255,255,.04)}
  .team-row.winning{border:1px solid rgba(240,201,109,.35);background:rgba(240,201,109,.08)}
  .team-main{display:flex;gap:12px;align-items:center}
  .team-photo{width:52px;height:52px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:rgba(255,255,255,.08);font-weight:800}
  .team-photo img{width:100%;height:100%;object-fit:cover}
  .score{font-size:1.4rem;font-weight:800;color:#f0c96d}
  .starter-strip{display:flex;flex-wrap:wrap;gap:8px}
  .starter-chip{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.06)}
  .starter-chip img{width:28px;height:28px;border-radius:50%;object-fit:cover;background:rgba(255,255,255,.08)}
  .meta-row{display:flex;justify-content:space-between;gap:12px;color:rgba(255,255,255,.7);font-size:.94rem;margin-top:10px}
  .playoff-week{display:grid;gap:14px}
  .mini-stack{margin-top:0}
  .playoff-game{display:grid;grid-template-columns:1fr auto;gap:6px 12px;padding:12px;border-radius:14px;background:rgba(255,255,255,.04)}
  .playoff-game small{grid-column:1 / -1;color:rgba(255,255,255,.62)}
  @media(max-width:1100px){.highlight-grid,.rivalry-grid,.playoff-grid{grid-template-columns:1fr}.matchup-grid{grid-template-columns:1fr}.week-nav-row{grid-template-columns:1fr}.nav-pill{width:fit-content}}
</style>
