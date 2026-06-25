<script>
  import { enhance } from '$app/forms';
  import { DERBY_RULES } from './rules.js';
  import SectionHead from '$lib/ui/SectionHeader.svelte';

  export let event;
  export let locked = false;
  export let entry = null;
  export let results = null;

  // options plumbing pattern you already use
  export let options = [];
  export let loading = false;
  export let loadError = '';
  export let onRetryOptions = () => {};

  // bankroll from server (SUM(entry_scores.score_total))
  export let bankroll = 0;

  // ✅ real form state
  let horseId = '';
  let wager = '';

  // Derived: selected horse object (for snapshot/name/odds)
  $: pick = horseId
    ? options.find((o) => `${o.id}` === `${horseId}`) || { id: horseId, name: null, odds: null }
    : null;

  $: selectedOdds = pick?.odds || 'TBD';

  $: horseSnapshot = JSON.stringify({
    id: horseId,
    name: pick?.name || null,
    odds: pick?.odds || null
  });

  // hydrate from server entry (once per entry id)
  let hydratedEntryRowId = null;
  $: if (entry?.id && entry.id !== hydratedEntryRowId) {
    hydratedEntryRowId = entry.id;

    const savedHorseId = entry?.payload?.horseId != null ? `${entry.payload.horseId}` : '';
    const savedWager = entry?.payload?.wager != null ? Number(entry.payload.wager) : null;

    horseId = savedHorseId || '';
    wager = Number.isFinite(savedWager) ? String(Math.floor(savedWager)) : '';
  }

  // wager handling
  function toIntOrNull(v) {
    const n = Math.floor(Number(v));
    if (!Number.isFinite(n)) return null;
    return n;
  }

  $: wagerInt = toIntOrNull(wager);

  // Helpful computed
  $: bankrollNum = Number(bankroll || 0);
  $: wagerOk = wagerInt != null && wagerInt >= 0 && wagerInt <= bankrollNum;

  // Save UX
  let saving = false;
  let saveError = '';
  let savedPulse = false;

  // Dirty tracking
  $: lastSavedHorseId = entry?.payload?.horseId != null ? `${entry.payload.horseId}` : '';
  $: lastSavedWager =
    entry?.payload?.wager != null ? String(Math.floor(Number(entry.payload.wager))) : '';

  $: currentWager = wagerInt != null ? String(wagerInt) : '';
  $: dirty =
    !locked &&
    horseId &&
    wagerOk &&
    (horseId !== lastSavedHorseId || currentWager !== lastSavedWager);
</script>

<div class="card">
  <div class="section-head">
    <div>
      <div class="kicker">Your Pick</div>
      <h2 class="h2" style="margin:0;">
        Kentucky Derby
        <div class="sectionHead"><SectionHead rules={DERBY_RULES} /></div>
      </h2>
    </div>

    {#if locked}
      <span class="pill">Locked</span>
    {:else}
      <span class="pill pill--gold">{dirty ? 'Unsaved' : 'Ready'}</span>
    {/if}
  </div>

  <div class="muted" style="margin-top:10px;">
    Bankroll: <strong>{bankrollNum}</strong> points
  </div>

  {#if loading}
    <div class="muted" style="margin-top: 12px;">Loading horses…</div>
  {:else if loadError}
    <div class="muted" style="margin-top: 12px;">
      {loadError}
      <button class="btn btn--ghost btn--sm" type="button" on:click={onRetryOptions} style="margin-left:10px;">
        Retry
      </button>
    </div>
  {:else}
    <form
      method="POST"
      action="?/save"
      use:enhance={() => {
        saving = true;
        saveError = '';
        savedPulse = false;

        return async ({ result, update }) => {
          if (result.type === 'success') {
            await update({ reset: false });
            savedPulse = true;
            setTimeout(() => (savedPulse = false), 1200);
          } else if (result.type === 'failure') {
            saveError = result.data?.message || 'Save failed.';
          } else {
            saveError = 'Save failed.';
          }
          saving = false;
        };
      }}
    >
      <input type="hidden" name="horseId" value={horseId} />
      <input type="hidden" name="horseSnapshot" value={horseSnapshot} />
      <input type="hidden" name="wager" value={wagerInt != null ? String(wagerInt) : ''} />

      <div class="row">
        <label class="muted">Pick the winner</label>
        <select class="input" bind:value={horseId} disabled={locked || saving} required>
          <option value="">— select horse —</option>
          {#each options as h (`${h.id}`)}
            <option value={`${h.id}`}>
              {h.name}{h.odds ? ` · ${h.odds}` : ''}
            </option>
          {/each}
        </select>
      </div>

      {#if pick}
        <div class="selected-odds-card">
          <div>
            <div class="odds-eyebrow">Selected Horse</div>
            <div class="selected-name">{pick.name || 'Unknown horse'}</div>
          </div>

          <div class="selected-odds">
            <span>Odds</span>
            <strong>{selectedOdds}</strong>
          </div>
        </div>
      {/if}

      {#if options?.length}
        <div class="odds-board">
          <div class="odds-board__head">
            <div>
              <div class="odds-eyebrow">Derby Board</div>
              <strong>Morning Line Odds</strong>
              <p>Admin Note: These odds are not up to the minute live. They are the morning line odds. Odds Subject to change. Your final payout may differ. We will use the odds from when the race begins.</p>
            </div>
            <span class="muted small">{options.length} horses</span>
          </div>

          <div class="odds-grid">
            {#each options as h (`odds-${h.id}`)}
              <button
                class:selected={`${h.id}` === `${horseId}`}
                class="odds-tile"
                type="button"
                disabled={locked || saving}
                on:click={() => (horseId = `${h.id}`)}
              >
                <span class="odds-tile__name">{h.name}</span>
                <span class="odds-tile__odds">{h.odds || 'TBD'}</span>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <div class="row">
        <label class="muted">Wager (points)</label>
        <input
          class="input"
          type="number"
          min="0"
          step="1"
          inputmode="numeric"
          bind:value={wager}
          disabled={locked || saving}
          placeholder={`0 – ${bankrollNum}`}
          required
        />
        <div class="muted small">
          {#if wagerInt == null}
            Enter a whole number.
          {:else if wagerInt > bankrollNum}
            Max wager is your bankroll ({bankrollNum}).
          {/if}
        </div>
      </div>

      <div class="actions">
        <button class="btn btn--vip" type="submit" disabled={locked || saving || !horseId || !wagerOk}>
          {saving ? 'Saving…' : 'Save pick'}
        </button>

        <div class="muted">
          {#if saveError}
            <span style="color: rgba(255,120,120,0.95)">{saveError}</span>
          {:else if savedPulse}
            Saved ✅
          {:else if horseId}
            Winner only. If you lose: −wager. If you win: wager × odds.
          {/if}
        </div>
      </div>
    </form>
  {/if}
</div>

<style>
  .row {
    display: grid;
    gap: 6px;
    margin-top: 12px;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    flex-wrap: wrap;
  }

  .kicker {
    letter-spacing: 0.12em;
    font-size: 0.72rem;
    opacity: 0.85;
  }

  .small {
    font-size: 0.85rem;
  }

  .sectionHead {
    flex-wrap: wrap;
    justify-self: left;
    padding-bottom: 2px;
  }

  .selected-odds-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-top: 14px;
    padding: 14px;
    border: 1px solid rgba(255, 215, 120, 0.25);
    border-radius: 18px;
    background:
      radial-gradient(circle at top left, rgba(255, 215, 120, 0.16), transparent 34%),
      rgba(255, 255, 255, 0.045);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
  }

  .odds-eyebrow {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.13em;
    opacity: 0.68;
  }

  .selected-name {
    margin-top: 3px;
    font-size: 1.05rem;
    font-weight: 800;
  }

  .selected-odds {
    display: grid;
    place-items: center;
    min-width: 76px;
    padding: 9px 12px;
    border-radius: 14px;
    background: rgba(255, 215, 120, 0.13);
    border: 1px solid rgba(255, 215, 120, 0.26);
  }

  .selected-odds span {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.11em;
    opacity: 0.75;
  }

  .selected-odds strong {
    margin-top: 2px;
    font-size: 1.18rem;
    line-height: 1;
  }

  .odds-board {
    margin-top: 14px;
    padding: 14px;
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.035);
  }

  .odds-board__head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .odds-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 8px;
  }

  .odds-tile {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    padding: 10px 11px;
    color: inherit;
    text-align: left;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.09);
    background: rgba(0, 0, 0, 0.14);
    cursor: pointer;
    transition:
      transform 0.14s ease,
      border-color 0.14s ease,
      background 0.14s ease;
  }

  .odds-tile:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: rgba(255, 215, 120, 0.3);
    background: rgba(255, 255, 255, 0.06);
  }

  .odds-tile:disabled {
    cursor: not-allowed;
    opacity: 0.72;
  }

  .odds-tile.selected {
    border-color: rgba(255, 215, 120, 0.52);
    background: rgba(255, 215, 120, 0.11);
  }

  .odds-tile__name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 750;
  }

  .odds-tile__odds {
    flex: 0 0 auto;
    font-weight: 900;
    color: rgba(255, 230, 160, 0.98);
  }
</style>