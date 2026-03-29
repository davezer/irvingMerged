<script>
  import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';
  export let data;

  function formatTime(epoch) {
    if (!epoch) return 'Unknown time';
    return new Date(Number(epoch)).toLocaleString();
  }
</script>

<div class="page-stack">
  <LeagueSubnav season={data.season || new Date().getFullYear()} active="transactions" />
  <div class="page-head card">
    <div>
      <div class="eyebrow">Transactions</div>
      <h1>Wire room and movement log</h1>
      <p>Live Sleeper movement with Irving team identity, grouped by week instead of raw IDs and roster numbers.</p>
      <div class="source">{data.source}</div>
    </div>
    <div class="week-pills">
      {#each data.availableWeeks as week}
        <a class:selected={data.selectedWeeks.includes(week)} href={`?season=${data.season}&weeks=${week}${data.filterTeam ? `&team=${data.filterTeam.managerSlug}` : ''}`}>W{week}</a>
      {/each}
      <a class:selected={data.selectedWeeks.length === data.availableWeeks.length} href={`?season=${data.season}&weeks=${data.availableWeeks.join(',')}${data.filterTeam ? `&team=${data.filterTeam.managerSlug}` : ''}`}>All</a>
    </div>
  </div>

  {#if data.filterTeam}
    <div class="card filter-banner">
      <div class="team-pill big">
        <div class="team-photo">{#if data.filterTeam.teamPhoto}<img src={data.filterTeam.teamPhoto} alt={data.filterTeam.teamName} />{:else}<span>{data.filterTeam.initials}</span>{/if}</div>
        <div><strong>{data.filterTeam.teamName}</strong><small>{data.filterTeam.managerName}</small></div>
      </div>
      <div class="link-row">
        <a href={`/league/managers/${data.filterTeam.managerSlug}?season=${data.season}`}>Open dossier</a>
        <a href={`/league/matchups?season=${data.season}&team=${data.filterTeam.managerSlug}`}>Recent games</a>
        <a href={`?season=${data.season}&weeks=${data.availableWeeks.join(',')}`}>Clear filter</a>
      </div>
    </div>
  {/if}

  {#if !data.hasData}
    <div class="card empty"><h2>No transaction data yet</h2><p>We could not pull transaction data for this season/week selection.</p></div>
  {:else}
    {#each data.weeks as bucket (bucket.week)}
      <section class="week-stack">
        <div class="section-head">
          <div>
            <div class="eyebrow">Week {bucket.week}</div>
            <h2>{bucket.items.length} move{bucket.items.length === 1 ? '' : 's'}</h2>
          </div>
        </div>

        <div class="stack">
          {#each bucket.items as txn (txn.id)}
            <article class="card txn">
              <div class="txn-head">
                <div>
                  <div class="type-pill">{txn.typeLabel}</div>
                  <h3>{txn.summaryLine}</h3>
                  <div class="meta-row">
                    {#each txn.rosterCards as team (team.rosterId)}
                      <a class="team-pill" href={team.managerSlug ? `/league/managers/${team.managerSlug}?season=${data.season}` : `/league/transactions?season=${data.season}&rosterId=${team.rosterId}`}>
                        <div class="team-photo">{#if team.teamPhoto}<img src={team.teamPhoto} alt={team.teamName} />{:else}<span>{team.initials}</span>{/if}</div>
                        <span>{team.teamName}</span>
                      </a>
                    {/each}
                  </div>
                  <div class="link-row compact">
                    {#each txn.rosterCards as team (team.rosterId)}
                      <a href={team.managerSlug ? `/league/transactions?season=${data.season}&team=${team.managerSlug}` : `/league/transactions?season=${data.season}&rosterId=${team.rosterId}`}>Only {team.teamName}</a>
                    {/each}
                  </div>
                </div>
                <div class="timestamp">{formatTime(txn.createdAt)}</div>
              </div>

              <div class="txn-grid">
                <div class="panel">
                  <div class="label">Adds</div>
                  {#if txn.addGroups.length}
                    {#each txn.addGroups as group (group.rosterId)}
                      <div class="club-group">
                        <div class="club-head">
                          <a class="team-link" href={group.managerSlug ? `/league/transactions?season=${data.season}&team=${group.managerSlug}` : `/league/transactions?season=${data.season}&rosterId=${group.rosterId}`}>
                            <div class="team-photo small">{#if group.teamPhoto}<img src={group.teamPhoto} alt={group.teamName} />{:else}<span>{group.initials}</span>{/if}</div>
                            <strong>{group.teamName}</strong>
                          </a>
                        </div>
                        <div class="player-grid">
                          {#each group.players as player (player.id)}
                            <div class="player-chip">
                              <img src={player.photoUrl} alt={player.name} />
                              <div><strong>{player.name}</strong><small>{player.position || '—'} · {player.teamLabel || player.team || 'FA'}</small></div>
                            </div>
                          {/each}
                        </div>
                      </div>
                    {/each}
                  {:else}
                    <p>None</p>
                  {/if}
                </div>

                <div class="panel">
                  <div class="label">Drops</div>
                  {#if txn.dropGroups.length}
                    {#each txn.dropGroups as group (group.rosterId)}
                      <div class="club-group">
                        <div class="club-head">
                          <a class="team-link" href={group.managerSlug ? `/league/transactions?season=${data.season}&team=${group.managerSlug}` : `/league/transactions?season=${data.season}&rosterId=${group.rosterId}`}>
                            <div class="team-photo small">{#if group.teamPhoto}<img src={group.teamPhoto} alt={group.teamName} />{:else}<span>{group.initials}</span>{/if}</div>
                            <strong>{group.teamName}</strong>
                          </a>
                        </div>
                        <div class="player-grid">
                          {#each group.players as player (player.id)}
                            <div class="player-chip">
                              <img src={player.photoUrl} alt={player.name} />
                              <div><strong>{player.name}</strong><small>{player.position || '—'} · {player.teamLabel || player.team || 'FA'}</small></div>
                            </div>
                          {/each}
                        </div>
                      </div>
                    {/each}
                  {:else}
                    <p>None</p>
                  {/if}
                </div>
              </div>

              {#if txn.draftPicks.length || txn.faabRows.length}
                <div class="txn-grid secondary">
                  <div class="panel">
                    <div class="label">Draft assets</div>
                    {#if txn.draftPicks.length}
                      <div class="stack small-gap">
                        {#each txn.draftPicks as pick (pick.id)}
                          <div class="simple-row"><strong>{pick.label}</strong><span>{pick.lineage}</span></div>
                        {/each}
                      </div>
                    {:else}
                      <p>None</p>
                    {/if}
                  </div>
                  <div class="panel">
                    <div class="label">FAAB movement</div>
                    {#if txn.faabRows.length}
                      <div class="stack small-gap">
                        {#each txn.faabRows as row (row.rosterId)}
                          <div class="simple-row"><strong>{row.teamName}</strong><span>${row.amount}</span></div>
                        {/each}
                      </div>
                    {:else}
                      <p>None</p>
                    {/if}
                  </div>
                </div>
              {/if}
            </article>
          {/each}
        </div>
      </section>
    {/each}
  {/if}
</div>

<style>
  .page-stack,.stack,.week-stack{display:grid;gap:18px}
  .card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:20px}
  .eyebrow,.label{text-transform:uppercase;letter-spacing:.18em;font-size:11px;color:#d1ac59}
  .page-head{display:grid;gap:14px}
  .source,p,small,.timestamp{color:rgba(255,255,255,.68)}
  .week-pills{display:flex;gap:8px;flex-wrap:wrap;overflow:auto;padding-bottom:2px}
  .week-pills a{padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);text-decoration:none;color:rgba(255,255,255,.78);white-space:nowrap}
  .week-pills a.selected,.week-pills a.all-selected{background:rgba(208,172,89,.16);color:#f0c96d}
  .filter-banner{display:flex;justify-content:space-between;gap:16px;align-items:center}
  .txn{display:grid;gap:16px}
  .txn-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
  .type-pill{display:inline-flex;padding:6px 10px;border-radius:999px;background:rgba(208,172,89,.16);color:#f0c96d;text-transform:uppercase;font-size:11px;letter-spacing:.16em;margin-bottom:10px}
  .meta-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
  .team-pill{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.06);text-decoration:none;color:inherit}
  .team-pill.big{padding:10px 14px}
  .team-photo{width:32px;height:32px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:rgba(255,255,255,.08);font-weight:800}
  .team-photo.small{width:28px;height:28px}
  .team-photo img{width:100%;height:100%;object-fit:cover}
  .link-row{display:flex;gap:10px;flex-wrap:wrap}.link-row a,.team-link{color:#f0c96d;text-decoration:none}.link-row.compact{margin-top:10px}
  .txn-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
  .panel{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:18px;padding:16px;display:grid;gap:12px}
  .club-group{display:grid;gap:10px}
  .club-head{display:flex;align-items:center;gap:10px}
  .team-link{display:flex;align-items:center;gap:10px}
  .player-grid{display:grid;gap:10px}
  .player-chip{display:grid;grid-template-columns:40px 1fr;gap:10px;align-items:center;padding:10px;border-radius:14px;background:rgba(255,255,255,.04)}
  .player-chip img{width:40px;height:40px;border-radius:50%;object-fit:cover;background:rgba(255,255,255,.08)}
  .simple-row{display:flex;justify-content:space-between;gap:12px;padding:10px;border-radius:12px;background:rgba(255,255,255,.04)}
  .small-gap{gap:8px}
  @media(max-width:880px){
    .card{padding:16px}
    .filter-banner,.txn-head,.txn-grid{grid-template-columns:1fr;display:grid}
    .txn-grid.secondary{grid-template-columns:1fr}
    .timestamp{font-size:.9rem}
  }
</style>
