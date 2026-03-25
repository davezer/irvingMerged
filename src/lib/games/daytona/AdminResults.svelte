<script>
  import { enhance } from '$app/forms';
  import UnpublishButton from '$lib/components/admin/UnpublishButton.svelte';

  export let data;

  // ✅ Reactive: don't destructure into consts (breaks updates after enhance())
  $: event = data?.event;
  $: results = data?.results;
  $: entries = data?.entries || [];
  $: driverOptions = data?.driverOptions || [];
  $: optionsMode = data?.optionsMode || '';
  $: optionsNote = data?.optionsNote || '';

  // NOTE:
  // - results?.published_at is your per-game results record timestamp (nice for display)
  // - event?.results_published_at is the global "published" flag on events (used for unpublish)
  $: publishedAt = results?.published_at || null;

  $: officialIds =
    Array.isArray(results?.payload?.officialTop10Ids)
      ? results.payload.officialTop10Ids.map((x) => String(x))
      : [];

  let saving = false;
  let errorMsg = '';
  let okPulse = false;

  // Form state: Pos 1..10
  let selected = Array.from({ length: 10 }, () => '');
  let lastOfficialKey = '';

  // ✅ Load persisted official results into the selects (initial + after publish refresh)
  $: {
    const key = officialIds.length ? officialIds.join('|') : '';
    if (key && key !== lastOfficialKey && officialIds.length === 10) {
      selected = officialIds.map(String);
      lastOfficialKey = key;
    }
  }

  // Normalize all selections to strings
  $: selected = selected.map((v) => (v ? String(v) : ''));

  // Local validity
  $: filledCount = selected.filter(Boolean).length;
  $: isComplete = filledCount === 10;
  $: isUnique = new Set(selected.filter(Boolean)).size === filledCount;
  $: canPreview = isComplete && isUnique;

  // Fast id → option lookup
  $: driverMap = new Map((driverOptions || []).map((d) => [String(d.id), d]));
  $: eventPublishedAt = event?.results_published_at || null;

  function labelFor(id) {
    const o = driverMap.get(String(id));
    if (!o) return String(id);
    const num = o.carNumber ? `#${o.carNumber} ` : '';
    return `${num}${o.name}`;
  }

  function pickText(pick) {
    if (!pick) return '';
    const num = pick.carNumber ? `#${pick.carNumber} ` : '';
    const name = pick.name || labelFor(pick.id);
    return `${num}${name}`;
  }

  function formatDateTime(sec) {
    if (!sec && sec !== 0) return '';
    const d = new Date(Number(sec) * 1000);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  // -----------------------------
  // ✅ Bulletproof unique filtering
  // -----------------------------
  function normId(x) {
    return x == null ? '' : String(x);
  }

  function buildTakenSet(top10) {
    return new Set((top10 || []).map(normId).filter(Boolean));
  }

  // For dropdown idx: exclude picks in all other slots, BUT keep current selection visible.
  function optionsForIndex(allOptions, top10, idx) {
    const current = normId(top10?.[idx] || '');
    const taken = buildTakenSet(top10);
    if (current) taken.delete(current);

    return (allOptions || []).filter((d) => {
      const id = normId(d.id);
      if (!id) return false;
      return !taken.has(id);
    });
  }

  // When a slot changes, hard-dedupe across all slots: only keep the most recent selection.
  function onPickChange(idx) {
    const v = normId(selected[idx]);
    if (!v) return;

    selected = selected.map((x, i) => (i !== idx && normId(x) === v ? '' : normId(x)));
  }

  // Preview scoring (mirror server scoring/daytonaScore.js)
  const TOP10_POINTS_BY_POS = [250, 100, 50, 25, 25, 10, 10, 10, 10, 10];
  const CHAOS_PENALTY_BY_POS = [250, 100, 50, 50, 50, 50, 50, 50, 50, 50];

  function previewScore(entry, officialTop10) {
    if (!canPreview) return null;
    const picks = Array.isArray(entry?.payload?.top10Ids) ? entry.payload.top10Ids.map(String) : [];
    const chaosPick = entry?.payload?.chaosCarId != null ? String(entry.payload.chaosCarId) : null;

    if (officialTop10.length !== 10 || picks.length !== 10) return null;

    let exact = 0;
    for (let i = 0; i < 10; i++) {
      if (String(picks[i]) === String(officialTop10[i])) exact += TOP10_POINTS_BY_POS[i] || 0;
    }

    const podiumExacta =
      String(picks[0]) === String(officialTop10[0]) &&
      String(picks[1]) === String(officialTop10[1]) &&
      String(picks[2]) === String(officialTop10[2]);

    const bonus = podiumExacta ? 500 : 0;

    let chaosPenalty = 0;
    let chaosFinishPos = null;
    if (chaosPick) {
      const idx = officialTop10.findIndex((id) => String(id) === chaosPick);
      if (idx !== -1) {
        chaosFinishPos = idx + 1;
        chaosPenalty = CHAOS_PENALTY_BY_POS[idx] || 0;
      }
    }

    const chaos = chaosPenalty ? -chaosPenalty : 0;
    const total = exact + bonus + chaos;

    return {
      total,
      breakdown: { exact, bonus, chaos, podiumExacta, chaosPenalty, chaosFinishPos }
    };
  }

  function storedScore(entry) {
    const b = entry?.score?.breakdown || null;
    const totals = b?.totals || {};
    const exact = totals?.exact ?? 0;
    const bonus = totals?.bonus ?? 0;
    const chaos = totals?.chaos ?? 0;
    const podiumExacta = Boolean(b?.podiumExacta);
    const chaosPenalty = b?.chaos?.penalty ?? 0;
    const chaosFinishPos = b?.chaos?.finishPos ?? null;
    const total = entry?.score?.score_total ?? exact + bonus + chaos;

    return {
      total,
      breakdown: { exact, bonus, chaos, podiumExacta, chaosPenalty, chaosFinishPos }
    };
  }

  $: officialForPreview = selected.map(String);

  // Precompute view model (so template stays clean)
  $: entriesView = entries.map((e) => {
    const p = canPreview ? previewScore(e, officialForPreview) : null;
    const s = storedScore(e);
    const show = p || s;

    const chaosFinishPos = show?.breakdown?.chaosFinishPos ?? null;

    const chaosHit =
      Number.isFinite(chaosFinishPos) && chaosFinishPos >= 1 && chaosFinishPos <= 10;

    return {
      ...e,
      _preview: p,
      _show: show,
      chaosHit
    };
  });
</script>

<div class="page-wide">
  <div class="card">
    <div class="section-head">
      <h2 class="h2">Publish Official Top 10</h2>
      <span class="pill pill--gold">Daytona</span>
    </div>

    {#if optionsMode}
      <div class="muted" style="margin-top:10px;">
        Options: {optionsMode}{#if optionsNote} · {optionsNote}{/if}
      </div>
    {/if}

  {#if eventPublishedAt}
    <div class="muted" style="margin-top:8px;">
      Current published: <strong>{eventPublishedAt}</strong>
    </div>
  {:else if publishedAt && officialIds.length === 10}
    <div class="muted" style="margin-top:8px;">
      Last published snapshot: <strong>{publishedAt}</strong>
    </div>
  {/if}



    <form
      method="POST"
      action="?/publish"
      use:enhance={() => {
        saving = true;
        errorMsg = '';
        okPulse = false;

        return async ({ result, update }) => {
          if (result.type === 'success') {
            await update({ reset: false });
            okPulse = true;
            setTimeout(() => (okPulse = false), 1200);
          } else if (result.type === 'failure') {
            errorMsg = result.data?.error || 'Publish failed.';
          } else {
            errorMsg = 'Publish failed.';
          }
          saving = false;
        };
      }}
    >
      <div class="grid">
        {#each Array.from({ length: 10 }, (_, i) => i) as idx}
          <div class="field">
            <label class="muted" for={"pos" + (idx + 1)}>Pos {idx + 1}</label>

            <select
              id={"pos" + (idx + 1)}
              class="input"
              name={"pos" + (idx + 1)}
              bind:value={selected[idx]}
              on:change={() => onPickChange(idx)}
              required
            >
              <option value="">— select driver —</option>

              {#each optionsForIndex(driverOptions, selected, idx) as d (String(d.id))}
                <option value={String(d.id)}>
                  {d.carNumber ? `#${d.carNumber} ` : ''}{d.name}
                </option>
              {/each}
            </select>
          </div>
        {/each}
      </div>

      <div class="actions">
        <button class="btn btn--vip" type="submit" disabled={saving || !isComplete || !isUnique}>
          {saving ? 'Publishing…' : 'Publish results + recompute'}
        </button>

        <div class="muted">
          {#if !isUnique}
            <span style="color: rgba(255,120,120,0.95);">Drivers must be unique.</span>
          {:else if errorMsg}
            <span style="color: rgba(255,120,120,0.95);">{errorMsg}</span>
          {:else if okPulse}
            Published ✅
          {:else if canPreview}
            Preview enabled ✨
          {/if}
        </div>
      </div>
    </form>

    <!-- Danger Zone: keep destructive actions explicit + separate -->
    <div style="margin-top: 18px;">
      <div class="section-head">
        <h3 class="h3">Danger Zone</h3>
        <div class="muted">Unpublishing removes all computed scores for this event.</div>
      </div>

      <div class="actions" style="margin-top: 10px;">
        <!-- ✅ Correct prop: use event.results_published_at, not a boolean -->
        <UnpublishButton publishedAt={eventPublishedAt} />

      </div>
    </div>
  </div>

  <div class="spacer"></div>

  <div class="card">
    <div class="section-head">
      <h2 class="h2">Submitted Entries ({entriesView.length})</h2>
    </div>

    {#if !entriesView.length}
      <div class="muted" style="margin-top:12px;">No entries yet.</div>
    {:else}
      <div class="entry-grid">
        {#each entriesView as e}
          <div class="entry-card">
            <div class="entry-head">
              <div class="entry-name">{e.display_name}</div>

              {#if e._preview}
                <span class="pill pill--gold">Preview {e._preview.total}</span>
              {:else}
                <span class="pill">{e._show.total} pts</span>
              {/if}
            </div>

            <div class="muted entry-meta">
              Updated: {formatDateTime(e.updated_at ?? e.submitted_at)}
            </div>

            <div class="chips">
              <span class="chip">
                <span class="k">Exact</span><span class="v">{e._show.breakdown.exact}</span>
              </span>

              <span class="chip">
                <span class="k">Bonus</span><span class="v">{e._show.breakdown.bonus}</span>
              </span>

              <span class={"chip " + (e._show.breakdown.chaos < 0 ? 'chip--bad' : '')}>
                <span class="k">Chaos</span><span class="v">{e._show.breakdown.chaos}</span>
              </span>

              {#if e.chaosHit}
                <span class="chip chip--badge">
                  <span class="k">Chaos Hit</span>
                  <span class="v">P{e._show.breakdown.chaosFinishPos}</span>
                </span>
              {/if}

              <span class={"chip " + (e._show.breakdown.podiumExacta ? 'chip--badge' : '')}>
                <span class="k">Podium</span><span class="v">{e._show.breakdown.podiumExacta ? '✔' : '—'}</span>
              </span>
            </div>

            <div class="block">
              <div class="block-head">Top 10</div>
              {#if e.top10Display?.length}
                <ol class="picks">
                  {#each e.top10Display as pick}
                    <li>{pickText(pick)}</li>
                  {/each}
                </ol>
              {:else}
                <div class="muted">No picks.</div>
              {/if}
            </div>

            <div class="block">
              <div class="block-head">Chaos Car</div>
              <div class="chaos-line">
                {#if e.chaosDisplay}
                  {pickText(e.chaosDisplay)}
                {:else}
                  <span class="muted">—</span>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>


<style>
  .page-wide {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px;
    box-sizing: border-box;
  }
  @media (max-width: 640px) {
    .page-wide { padding: 0 14px; }
  }

  .spacer { height: 16px; }
  .section-head { display:flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }

  .grid {
    margin-top: 14px;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
  }
  @media (max-width: 960px) {
    .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  .field { display: grid; gap: 8px; }

  .actions { display:flex; align-items:center; gap: 12px; margin-top: 14px; flex-wrap: wrap; }

  .entry-grid {
    margin-top: 14px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
  }

  .entry-card {
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(0,0,0,0.22);
    border-radius: 18px;
    padding: 14px 14px 12px;
  }

  .entry-head {
    display:flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
  }

  .entry-name { font-weight: 800; }
  .entry-meta { margin-top: 6px; }

  .chips {
    display:flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 12px;
  }

  .chip {
    display:inline-flex;
    align-items:center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.25);
  }

  .chip--badge {
    border-color: rgba(212, 175, 55, 0.30);
    background: rgba(212, 175, 55, 0.08);
  }

  .chip--bad {
    border-color: rgba(227,87,87,0.35);
    background: rgba(227,87,87,0.10);
  }

  .k { opacity: 0.8; font-size: 0.95rem; }
  .v { font-weight: 900; }

  .block { margin-top: 14px; }
  .block-head { font-weight: 800; margin-bottom: 8px; opacity: 0.95; }

  .picks {
    margin: 0;
    padding-left: 22px;
  }

  .chaos-line { font-weight: 700; }
</style>
