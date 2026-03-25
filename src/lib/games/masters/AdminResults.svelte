<script>
  import { enhance } from '$app/forms';
  import { MASTERS_STAGE_LABELS, MASTERS_STAGE_KEYS, MASTERS_STAGE_POINTS } from '$lib/scoring/masters.js';
  import UnpublishButton from '$lib/components/admin/UnpublishButton.svelte';


  export let data;

  $: event = data?.event ?? null;
  $: results = data?.results ?? null;
  $: entries = Array.isArray(data?.entries) ? data.entries : [];
  $: golferOptions = Array.isArray(data?.golferOptions) ? data.golferOptions : [];
  $: optionsMode = data?.optionsMode || '';
  $: optionsNote = data?.optionsNote || '';

  $: currentStage = results?.payload?.stage || 'pre_r1';
  $: winnerId = results?.payload?.winnerId ? String(results.payload.winnerId) : '';
  $: eventPublishedAt = event?.results_published_at || null;

const STAGES = MASTERS_STAGE_KEYS.map((id) => ({
  id,
  label: `${MASTERS_STAGE_LABELS[id] ?? id} (${MASTERS_STAGE_POINTS[id] ?? 0})`
}));

  $: golferMap = new Map(golferOptions.map((g) => [String(g.id), g]));;

  function snapFor(id) {
    const g = golferMap.get(String(id));
    return JSON.stringify(g ? { id: String(g.id), name: g.name, country: g.country || null } : { id: String(id) });
  }

  function fmtDateTime(sec) {
    if (!sec && sec !== 0) return '';
    const d = new Date(Number(sec) * 1000);
    return d.toLocaleString();
  }
</script>

<div class="page-wide">
  <div class="card">
    <div class="section-head">
      <h2 class="h2">Masters Admin</h2>
      <span class="pill pill--gold">Masters</span>
    </div>

    {#if optionsMode}
      <div class="muted" style="margin-top:10px;">
        Options: {optionsMode}{#if optionsNote} · {optionsNote}{/if}
      </div>
    {/if}

    <div class="grid2" style="margin-top: 14px;">
      <div class="panel">
        <div class="panel-head">Stage Control</div>

        <form
          method="POST"
          action="?/saveStage"
          use:enhance={() => async ({ update }) => update({ reset: false })}
        >
          <div class="row">
            <label class="muted">Current stage</label>
            <select class="input" name="stage" bind:value={currentStage}>
              {#each STAGES as s}
                <option value={s.id}>{s.label}</option>
              {/each}
            </select>
          </div>

          <div class="actions">
            <button class="btn btn--vip" type="submit">Save stage</button>
            <div class="muted small">Stage is used when a GM changes their pick.</div>
          </div>
        </form>
      </div>

      <div class="panel">
        <div class="panel-head">Publish Winner</div>

        <form
          method="POST"
          action="?/publish"
          use:enhance={() => async ({ update }) => update({ reset: false })}
        >
          <div class="row">
            <label class="muted">Winner</label>
            <select class="input" name="winnerId" bind:value={winnerId} required>
              <option value="">— select winner —</option>
              {#each golferOptions as g (String(g.id))}
                <option value={String(g.id)}>{g.name}</option>
              {/each}
            </select>
          </div>
          
          <input type="hidden" name="winnerSnapshot" value={winnerId ? snapFor(winnerId) : ''} />

          <div class="actions">
            <button class="btn btn--vip" type="submit" disabled={!winnerId}>
              Publish winner + recompute
            </button>

            {#if results?.published_at}
              <div class="muted small">Published: {results.published_at}</div>
            {/if}
          </div>
        </form>
      </div>
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
      <div class="muted" style="margin-top: 12px;">No entries yet.</div>
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
              <span class="chip chip--badge">
                <span class="k">Stage</span>
                {#key e?.payload?.lockStage}
                  {@const stageKey = e?.payload?.lockStage || 'pre_r1'}
                  <span class="v">
                    {MASTERS_STAGE_LABELS[stageKey] ?? stageKey}
                    ({MASTERS_STAGE_POINTS[stageKey] ?? 0})
                  </span>
                {/key}
              </span>

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

              {#if results?.payload?.winnerId && e?.payload?.golferId}
                {#if String(results.payload.winnerId) === String(e.payload.golferId)}
                  <span class="chip chip--badge">
                    <span class="k">Winner</span>
                    <span class="v">✔</span>
                  </span>
                {:else}
                  <span class="chip">
                    <span class="k">Winner</span>
                    <span class="v">—</span>
                  </span>
                {/if}
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  /* uses your existing global lounge styles for .card/.btn/.pill */
  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  @media (max-width: 900px) {
    .grid2 { grid-template-columns: 1fr; }
  }
  .panel {
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(0,0,0,0.18);
    border-radius: 16px;
    padding: 12px;
  }
  .panel-head {
    font-weight: 900;
    margin-bottom: 10px;
  }
  .row { display: grid; gap: 6px; }
  .actions { display: flex; align-items: center; gap: 12px; margin-top: 10px; flex-wrap: wrap; }
  .small { font-size: 0.85rem; }

  .entry-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; margin-top: 12px; }
  .entry-card { border: 1px solid rgba(255,255,255,0.10); background: rgba(0,0,0,0.18); border-radius: 18px; padding: 12px; }
  .entry-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
  .entry-name { font-weight: 900; }
  .entry-meta { margin-top: 6px; }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .chip { display: inline-flex; gap: 8px; align-items: baseline; padding: 6px 10px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); }
  .chip--badge { border-color: rgba(255,210,120,0.22); background: rgba(255,210,120,0.06); }
  .chip--bad { border-color: rgba(255,120,120,0.22); background: rgba(255,120,120,0.06); }
  .k { opacity: 0.75; font-size: 0.82rem; }
  .v { font-weight: 900; }
</style>
