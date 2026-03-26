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
    <p>Every add, drop, trade, draft asset movement, and waiver-budget hit should end up here once the Sleeper sync has populated D1.</p>
  </div>

  {#if !hasData}
    <div class="card empty">
      <h2>No transaction data yet</h2>
      <p>Sync Sleeper data from the admin endpoint and this ticker will fill with the latest roster movement.</p>
      <code>POST /api/admin/league/sync-sleeper</code>
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
                <ul>
                  {#each txn.addEntries as [playerId, rosterId] (`add-${txn.id}-${playerId}`)}
                    <li><strong>{playerId}</strong> → roster {rosterId}</li>
                  {/each}
                </ul>
              {:else}
                <p>None</p>
              {/if}
            </div>

            <div class="panel">
              <div class="label">Drops</div>
              {#if txn.dropEntries.length}
                <ul>
                  {#each txn.dropEntries as [playerId, rosterId] (`drop-${txn.id}-${playerId}`)}
                    <li><strong>{playerId}</strong> ← roster {rosterId}</li>
                  {/each}
                </ul>
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
                    <li>{JSON.stringify(pick)}</li>
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
                  {#each txn.faabMoves as [rosterId, amount] (`faab-${txn.id}-${rosterId}`)}
                    <li>Roster {rosterId}: ${amount}</li>
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
  p,li,.timestamp,code{color:rgba(255,255,255,.74)}
  .pill{display:inline-flex;padding:6px 10px;border-radius:999px;background:rgba(208,172,89,.16);color:#f0c96d;text-transform:uppercase;font-size:11px;letter-spacing:.16em;margin-bottom:10px}
  .topline{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}
  .row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
  .panel{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.06);border-radius:18px;padding:16px}
  .empty{display:grid;gap:12px}
  code{background:rgba(255,255,255,.06);padding:8px 10px;border-radius:10px;display:inline-block}
  ul{margin:12px 0 0 16px;padding:0;display:grid;gap:8px}
  @media(max-width:760px){.topline{display:grid}.row{grid-template-columns:1fr}}
</style>
