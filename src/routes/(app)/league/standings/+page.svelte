
<script>export let data;</script>
<div class="page-stack">
  <div class="page-head"><div><div class="eyebrow">Standings</div><h1>League table</h1></div><a href="/league">Back to League</a></div>
  <div class="card table-wrap">
    <table>
      <thead><tr><th>Rank</th><th>Team</th><th>Manager</th><th>Record</th><th>Points For</th><th>Win %</th></tr></thead>
      <tbody>
        {#each data.standings as row}
          <tr>
            <td>#{row.rank}</td>
            <td><a href={'/league/managers/' + row.slug}>{row.teamName}</a></td>
            <td>{row.displayName}</td>
            <td>{row.wins}-{row.losses}{#if row.ties}-{/if}{row.ties || ''}</td>
            <td>{row.points.toFixed(2)}</td>
            <td>{(row.pct * 100).toFixed(1)}%</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
<style>.page-stack{display:grid;gap:20px}.page-head{display:flex;justify-content:space-between;align-items:end;gap:12px}.eyebrow{text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#d6b15e}.page-head a{color:#d6b15e;text-decoration:none}.card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:20px;overflow:auto}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:14px;border-bottom:1px solid rgba(255,255,255,.08)}a{color:inherit;text-decoration:none}tbody tr:hover{background:rgba(255,255,255,.02)}</style>
