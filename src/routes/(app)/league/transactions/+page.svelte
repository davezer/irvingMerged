<script>
  export let data;
  const transactions = data?.transactions ?? [];
  const hasData = data?.hasData ?? false;

  function formatTime(epoch) {
    if (!epoch) return 'Unknown time';
    return new Date(epoch * 1000).toLocaleString();
  }
</script>

<div class="page-stack">
  <div class="hero">
    <div class="eyebrow">League Transactions</div>
    <h1>Wire room and movement log</h1>
    <p>Adds, drops, draft asset movement, and FAAB swings are fetched live from Sleeper, cached on the server, and then translated into Irving team identity.</p>
  </div>

  {#if data?.error}
    <div class="card empty">
      <h2>Transaction feed unavailable</h2>
      <p>{data.error}</p>
    </div>
  {/if}

  {#if !hasData}
    <div class="card empty">
      <h2>No transaction data yet</h2>
      <p>We could not pull transaction data from Sleeper for this request.</p>
    </div>
  {:else}
    <div class="stack">
      {#each transactions as txn (txn.id)}
        <article class="card txn">
          <div class="topline">
            <div>
              <div class="pill">{txn.type}</div>
              <h2>{txn.summaryLine}</h2>
            </div>
            <div class="timestamp">{formatTime(txn.createdAt)}</div>
          </div>

          <div class="row">
            <div class="panel">
              <div class="label">Adds</div>
              {#if txn.addEntries.length}
                <div class="move-list">
                  {#each txn.addEntries as entry (`add-${txn.id}-${entry.player?.id || entry.rosterId}`)}
                    <div class="move-item">
                      <div class="player-avatar">
                        {#if entry.player?.photoUrl}
                          <img src={entry.player.photoUrl} alt={entry.player?.name || 'Player'} />
                        {/if}
                      </div>
                      <div class="move-copy">
                        <strong>{entry.player?.name || 'Unknown player'}</strong>
                        <span>{entry.teamName}{#if entry.player?.position || entry.player?.team} • {entry.player?.position || '—'}{#if entry.player?.team} / {entry.player.team}{/if}{/if}</span>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <p>None</p>
              {/if}
            </div>

            <div class="panel">
              <div class="label">Drops</div>
              {#if txn.dropEntries.length}
                <div class="move-list">
                  {#each txn.dropEntries as entry (`drop-${txn.id}-${entry.player?.id || entry.rosterId}`)}
                    <div class="move-item">
                      <div class="player-avatar">
                        {#if entry.player?.photoUrl}
                          <img src={entry.player.photoUrl} alt={entry.player?.name || 'Player'} />
                        {/if}
                      </div>
                      <div class="move-copy">
                        <strong>{entry.player?.name || 'Unknown player'}</strong>
                        <span>{entry.teamName}{#if entry.player?.position || entry.player?.team} • {entry.player?.position || '—'}{#if entry.player?.team} / {entry.player.team}{/if}{/if}</span>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <p>None</p>
              {/if}
            </div>
          </div>

          <div class="row">
            <div class="panel">
              <div class="label">Draft assets</div>
              {#if txn.draftPicks.length}
                <ul>
                  {#each txn.draftPicks as pick, index (`pick-${txn.id}-${index}`)}
                    <li>{pick.season} Round {pick.round}: {pick.previousOwnerTeamName} → {pick.ownerTeamName}</li>
                  {/each}
                </ul>
              {:else}
                <p>None</p>
              {/if}
            </div>

            <div class="panel">
              <div class="label">FAAB movement</div>
              {#if txn.faabMoves.length}
                <ul>
                  {#each txn.faabMoves as move (`faab-${txn.id}-${move.rosterId}`)}
                    <li>{move.teamName}: ${move.amount}</li>
                  {/each}
                </ul>
              {:else}
                <p>None</p>
              {/if}
            </div>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</div>

<style>
  .page-stack,.stack{display:grid;gap:18px}
  .hero,.card{background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:24px}
  .eyebrow,.label{text-transform:uppercase;letter-spacing:.18em;font-size:11px;color:#d1ac59}
  h1,h2{margin:0}
  p,li,.timestamp{color:rgba(255,255,255,.74)}
  .pill{display:inline-flex;padding:6px 10px;border-radius:999px;background:rgba(208,172,89,.16);color:#f0c96d;text-transform:uppercase;font-size:11px;letter-spacing:.16em;margin-bottom:10px}
  .topline{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}
  .row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
  .panel{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.06);border-radius:18px;padding:16px}
  .empty{display:grid;gap:12px}
  .move-list{display:grid;gap:10px;margin-top:12px}
  .move-item{display:flex;gap:12px;align-items:center}
  .player-avatar{width:42px;height:42px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.08);flex:0 0 42px}
  .player-avatar img{width:100%;height:100%;object-fit:cover}
  .move-copy{display:grid;gap:2px;min-width:0}
  .move-copy strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .move-copy span{font-size:.84rem;color:rgba(255,255,255,.58)}
  ul{margin:12px 0 0 16px;padding:0;display:grid;gap:8px}
  @media(max-width:760px){.topline{display:grid}.row{grid-template-columns:1fr}}
</style>
