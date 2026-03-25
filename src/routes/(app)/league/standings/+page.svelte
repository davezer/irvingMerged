<script>
  export let data;
  const podium = data.standings.slice(0, 3);
  const board = data.standings.slice(3);
</script>

<div class="page-stack">
  <div class="page-head">
    <div>
      <div class="eyebrow">Standings</div>
      <h1>League table</h1>
      <p class="lede">A premium board view for the room: rank, pressure, points, and who is forcing everyone else to look up.</p>
    </div>
    <a class="back" href="/league">Back to League</a>
  </div>

  <section class="podium-grid">
    {#each podium as row}
      <a class="podium-card" href={'/league/managers/' + row.slug}>
        <div class="cap">#{row.rank}</div>
        <strong>{row.teamName}</strong>
        <span>{row.displayName}</span>
        <div class="stat-row"><b>{row.wins}-{row.losses}{#if row.ties}-{/if}{row.ties || ''}</b><small>{row.points.toFixed(2)} PF</small></div>
        <div class="tier">{row.tier}</div>
      </a>
    {/each}
  </section>

  <section class="spotlight-grid">
    <div class="spotlight-card">
      <div class="label">Current pace car</div>
      <h3>{data.pulse.topSeed.teamName}</h3>
      <p>{data.pulse.topSeed.displayName} is setting the tone at {(data.pulse.topSeed.pct * 100).toFixed(1)}% with {data.pulse.topSeed.points.toFixed(2)} points for.</p>
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
          <th>Points For</th>
          <th>Win %</th>
          <th>Back</th>
          <th>Tier</th>
        </tr>
      </thead>
      <tbody>
        {#each board as row}
          <tr>
            <td>#{row.rank}</td>
            <td><a href={'/league/managers/' + row.slug}>{row.teamName}</a></td>
            <td>{row.displayName}</td>
            <td>{row.wins}-{row.losses}{#if row.ties}-{/if}{row.ties || ''}</td>
            <td>{row.points.toFixed(2)}</td>
            <td>{(row.pct * 100).toFixed(1)}%</td>
            <td>{row.pointsBehind.toFixed(2)}</td>
            <td><span class="tier-chip">{row.tier}</span></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .page-stack{display:grid;gap:22px}
  .page-head{display:flex;justify-content:space-between;align-items:end;gap:16px}
  .eyebrow,.label{text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#d6b15e}
  .lede{max-width:64ch;color:rgba(255,255,255,.72)}
  .back{color:#d6b15e;text-decoration:none}
  .podium-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
  .podium-card,.spotlight-card,.table-card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.09);border-radius:24px}
  .podium-card{padding:20px;text-decoration:none;color:inherit;display:grid;gap:8px;box-shadow:0 20px 60px rgba(0,0,0,.2)}
  .cap{font-size:28px;font-weight:800;color:#f0c96d}
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
  a{color:inherit;text-decoration:none}
  @media(max-width:960px){.podium-grid,.spotlight-grid{grid-template-columns:1fr}.page-head{align-items:start;flex-direction:column}}
</style>
