<script>
  import { enhance } from '$app/forms';
  import GameRules from '$lib/components/GameRules.svelte';
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

  // Derived: selected horse object (for snapshot/name)
  $: pick = horseId
    ? options.find((o) => `${o.id}` === `${horseId}`) || { id: horseId, name: null }
    : null;

  $: horseSnapshot = JSON.stringify({
    id: horseId,
    name: pick?.name || null
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
<!-- wherever you want this to appear (usually under the event header card) -->


<div class="card">
  <div class="section-head">
    <div>
      <div class="kicker">Your Pick</div>
      <h2 class="h2" style="margin:0;">Kentucky Derby<div class="sectionHead"><SectionHead rules={DERBY_RULES}/></div></h2>
      
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
            <option value={`${h.id}`}>{h.name}</option>
          {/each}
        </select>
      </div>

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
  .row { display: grid; gap: 6px; margin-top: 12px; }
  .actions { display: flex; align-items: center; gap: 12px; margin-top: 12px; flex-wrap: wrap; }
  .kicker { letter-spacing: 0.12em; font-size: 0.72rem; opacity: 0.85; }
  .small { font-size: 0.85rem; }

.sectionHead {
flex-wrap: wrap;
justify-self: left;
padding-bottom: 2px;
}
</style>
