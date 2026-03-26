<script>
  export let rivalries = [];
</script>

<div class="card shell">
  <div class="kicker">Rivalry ledger</div>
  {#if rivalries.length}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Manager</th>
            <th>Rival</th>
            <th>Record</th>
            <th>Badges</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {#each rivalries as row (row.managerId + '-' + row.rivalId)}
            <tr>
              <td>{row.managerId}</td>
              <td>{row.rivalId}</td>
              <td>{row.record}</td>
              <td>{row.badgeCount}</td>
              <td>{row.notes}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <p class="empty">No rivalry records available yet.</p>
  {/if}
</div>

<style>
  .card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:24px}.kicker{text-transform:uppercase;letter-spacing:.16em;font-size:11px;color:#d4b15e;margin-bottom:14px}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:12px 10px;border-bottom:1px solid rgba(255,255,255,.08)}th{color:#f1cb70;font-size:.85rem;text-transform:uppercase;letter-spacing:.1em}td,.empty{color:rgba(255,255,255,.72)}
</style>
