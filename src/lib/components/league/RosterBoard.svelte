<script>
  export let teams = [];
</script>

<div class="board-grid">
  {#if teams.length}
    {#each teams as team (team.rosterId)}
      <section class="card team-card">
        <div class="topline">
          <div>
            <div class="kicker">Roster {team.rosterId}</div>
            <h3>{team.teamName}</h3>
            <p>{team.managerName}</p>
          </div>
          <div class="record">{team.record.wins}-{team.record.losses}{#if team.record.ties}- {team.record.ties}{/if}</div>
        </div>
        <div class="statline">
          <span>{team.players.length} total players</span>
          <span>{team.starters.length} starters</span>
          <span>{team.record.fpts} pts</span>
        </div>
        <details>
          <summary>Show player pool</summary>
          <div class="chips">
            {#each team.players as player (player)}
              <span>{player}</span>
            {/each}
          </div>
        </details>
      </section>
    {/each}
  {:else}
    <div class="card empty">No roster data yet. Run Sleeper sync and come back.</div>
  {/if}
</div>

<style>
  .board-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px}
  .card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:24px}
  .topline{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.kicker{text-transform:uppercase;letter-spacing:.16em;font-size:11px;color:#d4b15e}.record{font-size:1.8rem;font-weight:800;color:#f1cb70}
  h3{margin:.35rem 0}.p,.statline,summary,.empty,p{color:rgba(255,255,255,.72)}
  .statline{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0}
  .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
  .chips span{padding:8px 10px;border-radius:999px;background:rgba(255,255,255,.05);font-size:.9rem}
</style>
