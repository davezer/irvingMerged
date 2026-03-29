<script>
  import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';
  export let data;
  const draft = data?.draft;
</script>

<div class="page-stack">
  <LeagueSubnav season={data.season || new Date().getFullYear()} active="drafts" />
  <div class="page-head card">
    <div>
      <div class="eyebrow">Drafts</div>
      <h1>Auction archive</h1>
      <p>Same live Sleeper spine, now with value deltas, spend profiles, draft DNA, and franchise-level spend history layered on top.</p>
      <div class="source">{data.source}</div>
    </div>
    <div class="season-pills">
      {#each data.archive as item}
        <a class:selected={item.season === data.season} href={`?season=${item.season}`}>{item.season}</a>
      {/each}
    </div>
  </div>

  {#if !data.hasData || !draft}
    <div class="card"><h2>No draft data available</h2><p>We could not pull a Sleeper draft for this season.</p></div>
  {:else}
    <div class="stats-grid">
      <div class="card stat-card"><span>Total picks</span><strong>{draft.totalPicks}</strong></div>
      <div class="card stat-card"><span>Total spend</span><strong>${draft.totalSpend}</strong></div>
      <div class="card stat-card"><span>Average bid</span><strong>${draft.averageBid}</strong></div>
      <div class="card stat-card"><span>Format</span><strong>{draft.teams} teams • {draft.rounds} rounds</strong></div>
    </div>

    <div class="grid two-up">
      <div class="card">
        <div class="section-head"><h3>Most expensive buys</h3><span>{data.season}</span></div>
        <div class="stack picks">
          {#each draft.topPicks as pick}
            <div class="pick-row"><img src={pick.player.photoUrl} alt={pick.player.name} /><div><strong>{pick.player.name}</strong><small>{pick.teamName} • Round {pick.round}</small></div><span>{pick.amount ? `$${pick.amount}` : `#${pick.pickNo}`}</span></div>
          {/each}
        </div>
      </div>
      <div class="card">
        <div class="section-head"><h3>Position economy</h3><span>Market share</span></div>
        <div class="stack">
          {#each draft.positionEconomy as row (row.position)}
            <div class="row four-up"><strong>{row.position}</strong><span>{row.picks} picks</span><span>${row.spend}</span><span>${row.averageSpend} avg</span></div>
          {/each}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="section-head"><h3>Bid bands</h3><span>How the room spent its money</span></div>
      <div class="bands-grid">
        {#each draft.priceBands as band (band.label)}
          <div class="band-card"><strong>{band.label}</strong><span>{band.picks} picks</span><b>${band.spend}</b></div>
        {/each}
      </div>
    </div>

    <div class="grid two-up">
      <div class="card">
        <div class="section-head"><h3>Best value board</h3><span>vs position average</span></div>
        <div class="stack picks">
          {#each draft.valueBoard.bargains as pick}
            <div class="pick-row"><img src={pick.player.photoUrl} alt={pick.player.name} /><div><strong>{pick.player.name}</strong><small>{pick.teamName} • baseline ${pick.baselineAverage}</small></div><span>{pick.valueDelta < 0 ? '' : '+'}{pick.valueDelta}</span></div>
          {/each}
        </div>
      </div>
      <div class="card">
        <div class="section-head"><h3>Premium buys</h3><span>room-over-market</span></div>
        <div class="stack picks">
          {#each draft.valueBoard.premiumBuys as pick}
            <div class="pick-row"><img src={pick.player.photoUrl} alt={pick.player.name} /><div><strong>{pick.player.name}</strong><small>{pick.teamName} • baseline ${pick.baselineAverage}</small></div><span>+{pick.valueDelta}</span></div>
          {/each}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="section-head"><h3>Per-team draft boards</h3><span>Selected season</span></div>
      <div class="team-grid">
        {#each draft.teamBoards as row (row.teamName)}
          <article class="team-card">
            <div class="team-head">
              <div class="team-photo">{#if row.teamPhoto}<img src={row.teamPhoto} alt={row.teamName} />{:else}<span>{row.teamName.slice(0, 2)}</span>{/if}</div>
              <div><strong>{row.teamName}</strong><small>{row.managerName}</small></div>
            </div>
            <div class="team-metrics"><span>{row.picks} picks</span><span>${row.spend} spend</span><span>${row.averageSpend} avg</span></div>
            {#if row.bestBuy}<p class="muted">Top buy: {row.bestBuy.player.name} for ${row.bestBuy.amount}</p>{/if}
            {#if row.topPosition}<p class="muted">Biggest position spend: {row.topPosition.position} (${row.topPosition.spend})</p>{/if}
            <div class="sample-picks">
              {#each row.samplePicks as pick (pick.id)}
                <div class="sample-pill">{pick.player.shortName} <span>${pick.amount}</span></div>
              {/each}
            </div>
          </article>
        {/each}
      </div>
    </div>

    <div class="grid two-up">
      <div class="card">
        <div class="section-head"><h3>Spend profiles</h3><span>stars & scrubs index</span></div>
        <div class="stack">
          {#each draft.spendProfiles as row (row.teamName)}
            <div class="history-row"><div class="history-main"><strong>{row.teamName}</strong><small>{row.managerName}</small></div><div class="history-side"><span>{row.starsAndScrubsIndex}%</span><small>${row.averageSpend} avg</small></div></div>
          {/each}
        </div>
      </div>
      <div class="card">
        <div class="section-head"><h3>Draft DNA</h3><span>room archetypes</span></div>
        <div class="stack">
          {#each draft.draftDNA as row (row.teamName)}
            <div class="history-row"><div class="history-main"><strong>{row.teamName}</strong><small>{row.labels.join(' • ')}</small></div><div class="history-side"><span>{row.overThirty} $30+ buys</span><small>{row.underTen} sub-$10 picks</small></div></div>
          {/each}
        </div>
      </div>
    </div>

    <div class="grid two-up">
      <div class="card">
        <div class="section-head"><h3>Franchise draft history</h3><span>Across archive seasons</span></div>
        <div class="stack">
          {#each draft.franchiseHistory.slice(0, 10) as row (row.teamName)}
            <div class="history-row"><div class="history-main"><strong>{row.teamName}</strong><small>{row.seasons.length} seasons • {row.totalPicks} picks</small></div><div class="history-side"><span>${row.totalSpend}</span><small>avg ${row.averageSpend}</small></div></div>
          {/each}
        </div>
      </div>
      <div class="card">
        <div class="section-head"><h3>Season spend timeline</h3><span>Archive view</span></div>
        <div class="stack">
          {#each draft.spendTimeline as row (row.season)}
            <div class="history-row"><div class="history-main"><strong>{row.season}</strong><small>{row.topTeam ? `${row.topTeam.teamName} led spend` : 'No leader'}</small></div><div class="history-side"><span>${row.totalSpend}</span><small>{row.topPick ? `${row.topPick.player.shortName} $${row.topPick.amount}` : '—'}</small></div></div>
          {/each}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="section-head"><h3>Traded picks</h3><span>Lineage</span></div>
      {#if draft.tradedPicks.length}
        <div class="stack">
          {#each draft.tradedPicks as pick (pick.id)}
            <div class="trade-row"><strong>{pick.season} Round {pick.round}</strong><span>{pick.lineageLabel}</span></div>
          {/each}
        </div>
      {:else}
        <p>No traded picks logged for this draft.</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .page-stack{display:grid;gap:20px}.card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:20px}.eyebrow{text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#d6b15e}.source{margin-top:10px;color:rgba(255,255,255,.6)}
  .grid.two-up{display:grid;grid-template-columns:1fr 1fr;gap:20px}.stats-grid,.team-grid,.bands-grid{display:grid;gap:16px}.stats-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.team-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.bands-grid{grid-template-columns:repeat(4,minmax(0,1fr));margin-top:12px}
  .stack{display:grid;gap:10px;margin-top:12px}.row{display:grid;grid-template-columns:1fr auto auto;gap:12px;padding:12px;border-radius:14px;background:rgba(255,255,255,.03)}.row.four-up{grid-template-columns:auto auto auto auto}.page-head{display:grid;gap:16px}
  .season-pills{display:flex;flex-wrap:wrap;gap:8px}.season-pills a{padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);text-decoration:none;color:rgba(255,255,255,.78)}.season-pills a.selected{background:rgba(208,172,89,.16);color:#f0c96d}
  .section-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.section-head span,.muted,small{color:rgba(255,255,255,.62)}.stat-card{display:grid;gap:8px}.stat-card strong{font-size:1.5rem}
  .picks .pick-row{display:grid;grid-template-columns:44px 1fr auto;gap:12px;align-items:center;padding:10px;border-radius:14px;background:rgba(255,255,255,.03)}.pick-row img,.team-photo img{width:44px;height:44px;border-radius:50%;object-fit:cover;background:rgba(255,255,255,.08)}
  .team-card{padding:18px;border-radius:18px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);display:grid;gap:12px}.team-head{display:flex;align-items:center;gap:12px}.team-photo{width:48px;height:48px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:rgba(255,255,255,.08);font-weight:800}
  .team-metrics{display:flex;flex-wrap:wrap;gap:10px;color:rgba(255,255,255,.72)}.sample-picks{display:flex;flex-wrap:wrap;gap:8px}.sample-pill{padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.06)}.sample-pill span{color:#f0c96d}
  .band-card{padding:16px;border-radius:16px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);display:grid;gap:6px}.band-card b{color:#f0c96d}.history-row,.trade-row{display:grid;grid-template-columns:1fr auto;gap:12px;padding:12px;border-radius:14px;background:rgba(255,255,255,.03)}.history-main,.history-side{display:grid;gap:4px}.history-side{text-align:right}.trade-row span{color:rgba(255,255,255,.72)}
  @media(max-width:980px){.grid.two-up,.team-grid,.stats-grid,.bands-grid{grid-template-columns:1fr}}
</style>
