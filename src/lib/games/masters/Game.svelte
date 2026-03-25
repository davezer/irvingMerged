<script>
  import { enhance } from '$app/forms';
  import GameRules from '$lib/components/GameRules.svelte';
  import { MASTERS_RULES } from './rules.js';
   import SectionHead from '$lib/ui/SectionHeader.svelte';

  export let event;
  export let locked = false;
  export let entry = null;

  export let options = [];
  export let loading = false;
  export let loadError = '';
  export let onRetryOptions = () => {};

  // ✅ real form state (do NOT derive this from pick)
  let golferId = '';

  // Derived: selected golfer object
  $: pick =
    golferId && options?.length
      ? options.find((o) => String(o.id) === String(golferId)) || { id: golferId, name: null }
      : golferId
        ? { id: golferId, name: entry?.payload?.golferSnapshot?.name || null }
        : null;

  // ✅ snapshot always matches current pick
  $: golferSnapshot = JSON.stringify({
    id: golferId,
    name: pick?.name || null,
    country: pick?.country || null
  });

  // Hydrate from server entry (once per entry id)
  let hydratedEntryRowId = null;
  $: if (entry?.id && entry.id !== hydratedEntryRowId) {
    hydratedEntryRowId = entry.id;
    golferId = entry?.payload?.golferId ? String(entry.payload.golferId) : '';
  }

  // Save UX
  let saving = false;
  let saveError = '';
  let savedPulse = false;

  // Dirty tracking
  $: lastSavedId = entry?.payload?.golferId ? String(entry.payload.golferId) : '';
  $: dirty = !locked && golferId && golferId !== lastSavedId;

  // Points label based on lockStage stored on entry
  const STAGE_POINTS = { pre_r1: 1000, post_r1: 500, post_r2: 200, post_r3: 50 };
  $: lockStage = entry?.payload?.lockStage || 'pre_r1';
  $: pointsIfWins = STAGE_POINTS[String(lockStage)] ?? 0;
</script>

<div class="card">
  <div class="section-head">
    <div>
      <div class="kicker">Your Pick</div>
      <h2 class="h2" style="margin:0;">The Masters</h2>
      <div class="sectionHead"><SectionHead rules={MASTERS_RULES}/></div>
    </div>

    {#if locked}
      <span class="pill">Locked</span>
    {:else}
      <span class="pill pill--gold">{dirty ? 'Unsaved' : 'Ready'}</span>
    {/if}
  </div>

  {#if loading}
    <div class="muted" style="margin-top: 12px;">Loading golfers…</div>
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
      <input type="hidden" name="golferId" value={golferId} />
      <input type="hidden" name="golferSnapshot" value={golferSnapshot} />

      <div class="row">
        <label class="muted">Pick the winner</label>
        <select class="input" bind:value={golferId} disabled={locked || saving} required>
          <option value="">— select golfer —</option>
          {#each options as g (String(g.id))}
            <option value={String(g.id)}>{g.name}</option>
          {/each}
        </select>
      </div>

      <div class="actions">
        <button class="btn btn--vip" type="submit" disabled={locked || saving || !golferId}>
          {saving ? 'Saving…' : 'Save pick'}
        </button>

        <div class="muted">
          {#if saveError}
            <span style="color: rgba(255,120,120,0.95)">{saveError}</span>
          {:else if savedPulse}
            Saved ✅
          {:else if golferId}
            Points if he wins (based on your current lock stage): <strong>{pointsIfWins}</strong>
          {/if}
        </div>
      </div>
    </form>

    <div class="muted" style="margin-top: 10px;">
      Your pick is sticky across rounds unless you change it.
    </div>
  {/if}
</div>

<style>
  .row { display: grid; gap: 6px; margin-top: 12px; }
  .actions { display: flex; align-items: center; gap: 12px; margin-top: 12px; flex-wrap: wrap; }
  .kicker { letter-spacing: 0.12em; font-size: 0.72rem; opacity: 0.85; }
  .sectionHead {
  flex-wrap: wrap;
  justify-self: left;
  padding-bottom: 2px;
}
</style>
