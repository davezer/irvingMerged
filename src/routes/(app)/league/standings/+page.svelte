<script>
  import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';
  export let data;
  const podium = data.standings.slice(0, 3);
  const board = data.standings.slice(3);
</script>

<div class="page-stack">
  <LeagueSubnav season={data.season || new Date().getFullYear()} active="standings" />
  <div class="page-head">
    <div>
      <div class="eyebrow">Standings</div>
      <h1>League table</h1>
      <p class="lede">Live Sleeper standings with Irving team identity layered on top. The old seed-driven board is out of the loop now.</p>
      <div class="source">{data.source}</div>
    </div>
    <a class="back" href="/league">Back to League</a>
  </div>

  <div class="season-pills">
    {#each data.seasons as season}
      <a class:selected={season === data.season} href={`?season=${season}`}>{season}</a>
    {/each}
  </div>

  {#if !data.hasData}
    <div class="table-card empty">
      <h2>No standings data yet</h2>
      <p>We could not pull Sleeper standings for this season.</p>
    </div>
  {:else}
    <section class="podium-grid">
      {#each podium as row}
        <article class="podium-card">
          <div class="cap">#{row.rank}</div>
          <div class="identity">
            <div class="team-photo">
              {#if row.teamPhoto}
                <img src={row.teamPhoto} alt={row.teamName} />
              {:else}
                <span>{row.initials}</span>
              {/if}
            </div>
            <div>
              <strong>{row.teamName}</strong>
              <span>{row.managerName}</span>
            </div>
          </div>
          <div class="stat-row"><b>{row.recordLabel}</b><small>{row.points.toFixed(2)} PF • {row.pointsAgainst.toFixed(2)} PA</small></div>
          <div class="tier">{row.tier}</div>
        </article>
      {/each}
    </section>

    <section class="spotlight-grid">
      <div class="spotlight-card">
        <div class="label">Current pace car</div>
        <h3>{data.pulse.topSeed.teamName}</h3>
        <p>{data.pulse.topSeed.managerName} is setting the tone at {(data.pulse.topSeed.pct * 100).toFixed(1)}% with {data.pulse.topSeed.points.toFixed(2)} points for.</p>
      </div>
      <div class="spotlight-card">
        <div class="label">Average points</div>
        <h3>{data.pulse.averagePoints.toFixed(2)}</h3>
        <p>The room average gives you instant context on who is running hot and who is bleeding chips.</p>
      </div>
    </section>

    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Team</th>
            <th>Manager</th>
            <th>Record</th>
            <th>PF</th>
            <th>PA</th>
            <th>Diff</th>
            <th>Win %</th>
            <th>Back</th>
            <th>Tier</th>
          </tr>
        </thead>
        <tbody>
          {#each board as row}
            <tr>
              <td>#{row.rank}</td>
              <td>
                <div class="team-inline">
                  <div class="inline-photo">
                    {#if row.teamPhoto}
                      <img src={row.teamPhoto} alt={row.teamName} />
                    {:else}
                      <span>{row.initials}</span>
                    {/if}
                  </div>
                  <span>{row.teamName}</span>
                </div>
              </td>
              <td>{row.managerName}</td>
              <td>{row.recordLabel}</td>
              <td>{row.points.toFixed(2)}</td>
              <td>{row.pointsAgainst.toFixed(2)}</td>
              <td>{row.pointDiff.toFixed(2)}</td>
              <td>{(row.pct * 100).toFixed(1)}%</td>
              <td>{row.pointsBehind.toFixed(2)}</td>
              <td><span class="tier-chip">{row.tier}</span></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .page-stack{display:grid;gap:22px}
  .page-head{display:flex;justify-content:space-between;align-items:end;gap:16px}
  .eyebrow,.label{text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#d6b15e}
  .lede{max-width:64ch;color:rgba(255,255,255,.72)}
  .back{color:#d6b15e;text-decoration:none}
  .source{margin-top:10px;color:rgba(255,255,255,.58);font-size:.92rem}
  .season-pills{display:flex;flex-wrap:wrap;gap:8px}
  .season-pills a{padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);text-decoration:none;color:rgba(255,255,255,.78)}
  .season-pills a.selected{background:rgba(208,172,89,.16);color:#f0c96d}
  .podium-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
  .podium-card,.spotlight-card,.table-card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.09);border-radius:24px}
  .podium-card{padding:20px;text-decoration:none;color:inherit;display:grid;gap:10px;box-shadow:0 20px 60px rgba(0,0,0,.2)}
  .cap{font-size:28px;font-weight:800;color:#f0c96d}
  .identity,.team-inline{display:flex;align-items:center;gap:12px}
  .team-photo,.inline-photo{width:54px;height:54px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:rgba(255,255,255,.08);font-weight:800}
  .inline-photo{width:34px;height:34px}
  .team-photo img,.inline-photo img{width:100%;height:100%;object-fit:cover}
  .podium-card span,.spotlight-card p{color:rgba(255,255,255,.65)}
  .stat-row{display:flex;justify-content:space-between;gap:10px;align-items:center}
  .tier,.tier-chip{display:inline-flex;width:fit-content;padding:7px 11px;border-radius:999px;background:rgba(214,177,94,.14);color:#e9c76d;font-size:12px}
  .spotlight-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
  .spotlight-card{padding:18px}
  .spotlight-card h3{margin:.35rem 0 .45rem;font-size:1.4rem}
  .table-card{padding:12px;overflow:auto}
  table{width:100%;border-collapse:collapse}
  th,td{text-align:left;padding:14px;border-bottom:1px solid rgba(255,255,255,.08)}
  tbody tr:hover{background:rgba(255,255,255,.025)}
  .empty{padding:24px}
  @media(max-width:960px){.podium-grid,.spotlight-grid{grid-template-columns:1fr}.page-head{align-items:start;flex-direction:column}}
</style>
