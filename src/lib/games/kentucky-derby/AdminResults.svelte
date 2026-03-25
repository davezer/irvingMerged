<script>
  import { enhance } from '$app/forms';
  import UnpublishButton from '$lib/components/admin/UnpublishButton.svelte';

  export let data;

  $: event = data?.event ?? null;
  $: results = data?.results ?? null;
  $: entries = Array.isArray(data?.entries) ? data.entries : [];
  $: horseOptions = Array.isArray(data?.horseOptions) ? data.horseOptions : [];
  $: optionsMode = data?.optionsMode || '';
  $: optionsNote = data?.optionsNote || '';

  $: winnerHorseId = results?.payload?.winnerHorseId ? `${results.payload.winnerHorseId}` : '';
  $: payout = results?.payload?.payout != null ? String(results.payload.payout) : '';

  $: horseMap = new Map(horseOptions.map((h) => [`${h.id}`, h]));
  $: eventPublishedAt = event?.results_published_at || null;

  function snapFor(id) {
    const h = horseMap.get(`${id}`);
    return JSON.stringify(h ? { id: `${h.id}`, name: h.name } : { id: `${id}` });
  }

  function fmtDateTime(sec) {
    if (!sec && sec !== 0) return '';
    const d = new Date(Number(sec) * 1000);
    return d.toLocaleString();
  }

  function fmtDelta(n) {
    const v = Number(n || 0);
    if (!Number.isFinite(v)) return '0';
    return v >= 0 ? `+${v}` : `${v}`;
  }
</script>

<div class="page-wide">
  <div class="card">
    <div class="section-head">
      <h2 class="h2">Derby Admin</h2>
      <span class="pill pill--gold">Derby</span>
    </div>

    {#if optionsMode}
      <div class="muted" style="margin-top:10px;">
        Options: {optionsMode}{#if optionsNote} · {optionsNote}{/if}
      </div>
    {/if}

    <div class="panel" style="margin-top:14px;">
      <div class="panel-head">Publish Winner + Payout</div>

      <form
        method="POST"
        action="?/publish"
        use:enhance={() => async ({ update }) => update({ reset: false })}
      >
        <div class="grid2">
          <div class="row">
            <label class="muted">Winning horse</label>
            <select class="input" name="winnerHorseId" bind:value={winnerHorseId} required>
              <option value="">— select winner —</option>
              {#each horseOptions as h (`${h.id}`)}
                <option value={`${h.id}`}>{h.name}</option>
              {/each}
            </select>
          </div>

          <div class="row">
            <label class="muted">Payout multiplier (x)</label>
            <input class="input" name="payout" type="number" step="0.01" min="0" bind:value={payout} required placeholder="3.5" />
            <div class="muted small">Example: 3.5 means wager × 3.5 added on a win.</div>
          </div>
        </div>

        <input type="hidden" name="winnerSnapshot" value={winnerHorseId ? snapFor(winnerHorseId) : ''} />

        <div class="actions">
          <button class="btn btn--vip" type="submit" disabled={!winnerHorseId || !payout}>
            Publish + recompute
          </button>
          
          {#if results?.published_at}
            <div class="muted small">Published: {results.published_at}</div>
          {/if}
        </div>
      </form>
    </div>
  </div>
  <div style="margin-top: 18px;">
  <div class="section-head">
    <h3 class="h3">Danger Zone</h3>
    <div class="muted">Unpublishing removes all computed scores for this event.</div>
  </div>

  <div class="actions" style="margin-top: 10px;">
    <UnpublishButton publishedAt={eventPublishedAt} />
  </div>
</div>

  <div class="spacer"></div>

  <div class="card">
    <div class="section-head">
      <h2 class="h2">Submitted Entries ({entries.length})</h2>
    </div>

    {#if !entries.length}
      <div class="muted" style="margin-top:12px;">No entries yet.</div>
    {:else}
      <div class="entry-grid">
        {#each entries as e (e.user_id)}
          <div class="entry-card">
            <div class="entry-head">
              <div class="entry-name">{e.display_name}</div>
              <span class="pill">{e?.score?.score_total ?? 0} pts</span>
            </div>

            <div class="muted entry-meta">
              Updated: {fmtDateTime(e.updated_at ?? e.submitted_at)}
            </div>

            <div class="chips">
              {#if e.pickDisplay}
                <span class="chip">
                  <span class="k">Pick</span>
                  <span class="v">{e.pickDisplay.name}</span>
                </span>
              {:else}
                <span class="chip chip--bad">
                  <span class="k">Pick</span>
                  <span class="v">—</span>
                </span>
              {/if}

              <span class="chip">
                <span class="k">Wager</span>
                <span class="v">{e.wager ?? '—'}</span>
              </span>

              {#if results?.payload?.winnerHorseId && e?.payload?.horseId}
                {#if `${results.payload.winnerHorseId}` === `${e.payload.horseId}`}
                  <span class="chip chip--badge">
                    <span class="k">Hit</span>
                    <span class="v">✔</span>
                  </span>
                {:else}
                  <span class="chip">
                    <span class="k">Hit</span>
                    <span class="v">—</span>
                  </span>
                {/if}
              {/if}

              {#if e?.score?.breakdown?.delta != null}
                <span class="chip">
                  <span class="k">Δ</span>
                  <span class="v">{fmtDelta(e.score.breakdown.delta)}</span>
                </span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .panel {
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(0,0,0,0.18);
    border-radius: 16px;
    padding: 12px;
  }
  .panel-head { font-weight: 900; margin-bottom: 10px; }
  .grid2 { display:grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media (max-width: 900px) { .grid2 { grid-template-columns: 1fr; } }
  .row { display: grid; gap: 6px; }
  .actions { display:flex; align-items:center; gap:12px; margin-top:10px; flex-wrap:wrap; }
  .small { font-size: 0.85rem; }

  .entry-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:14px; margin-top:12px; }
  .entry-card { border: 1px solid rgba(255,255,255,0.10); background: rgba(0,0,0,0.18); border-radius: 18px; padding: 12px; }
  .entry-head { display:flex; justify-content: space-between; align-items:center; gap:10px; }
  .entry-name { font-weight: 900; }
  .entry-meta { margin-top: 6px; }
  .chips { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
  .chip { display:inline-flex; gap:8px; align-items: baseline; padding:6px 10px; border-radius:999px; border:1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); }
  .chip--badge { border-color: rgba(255,210,120,0.22); background: rgba(255,210,120,0.06); }
  .chip--bad { border-color: rgba(255,120,120,0.22); background: rgba(255,120,120,0.06); }
  .k { opacity:0.75; font-size:0.82rem; }
  .v { font-weight:900; }
</style>
