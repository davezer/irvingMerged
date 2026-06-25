<script>
  import { enhance } from '$app/forms';
  import { resolve } from '$app/paths';
  import { MASTERS_RULES } from './rules.js';
  import SectionHead from '$lib/ui/SectionHeader.svelte';
  import { MASTERS_STAGE_LABELS, MASTERS_STAGE_POINTS } from '$lib/scoring/masters.js';

  export let event;
  export let locked = false;
  export let entry = null;
  export let results = null;

  export let options = [];
  export let loading = false;
  export let loadError = '';
  export let onRetryOptions = () => {};

  let golferId = '';

  $: pick =
    golferId && options?.length
      ? options.find((o) => String(o.id) === String(golferId)) || { id: golferId, name: null }
      : golferId
        ? { id: golferId, name: entry?.payload?.golferSnapshot?.name || null }
        : null;

  $: golferSnapshot = JSON.stringify({
    id: golferId,
    name: pick?.name || null,
    country: pick?.country || null
  });

  let hydratedEntryRowId = null;
  $: if (entry?.id && entry.id !== hydratedEntryRowId) {
    hydratedEntryRowId = entry.id;
    golferId = entry?.payload?.golferId ? String(entry.payload.golferId) : '';
  }

  let saving = false;
  let saveError = '';
  let savedPulse = false;

  $: lastSavedId = entry?.payload?.golferId ? String(entry.payload.golferId) : '';
  $: dirty = !locked && golferId && golferId !== lastSavedId;

  $: currentStage = String(results?.payload?.stage || 'pre_r1');
  $: currentStageLabel = MASTERS_STAGE_LABELS[currentStage] || 'Round 1';
  $: currentStagePoints = MASTERS_STAGE_POINTS[currentStage] ?? 0;
  $: currentStageTitle = `${currentStageLabel.toUpperCase()} PICK`;
  $: currentStageNote =
    currentStage === 'pre_r1'
      ? 'Any pick you save right now locks in as your opening-round selection.'
      : `Any change you make right now becomes your ${currentStageLabel} selection.`;

  $: lockStage = entry?.payload?.lockStage || 'pre_r1';
  $: lockedPickStageLabel = MASTERS_STAGE_LABELS[String(lockStage)] || 'Round 1';
  $: pointsIfWins = MASTERS_STAGE_POINTS[String(lockStage)] ?? 0;
</script>

<div class="card">
  <div class="section-head">
    <div>
      <div class="kicker">Your Pick</div>
      <h2 class="h2" style="margin:0;">The Masters</h2>
      <div class="sectionHead"><SectionHead rules={MASTERS_RULES} /></div>
    </div>

    {#if locked}
      <span class="pill">Locked</span>
    {:else}
      <span class="pill pill--gold">{dirty ? 'Unsaved' : 'Ready'}</span>
    {/if}
  </div>

  <div class="stage-banner" aria-live="polite">
    <div class="stage-banner__eyebrow">Current pick window</div>
    <div class="stage-banner__headline">{currentStageTitle}</div>
    <div class="stage-banner__meta">
      <span class="stage-chip">{currentStageLabel}</span>
      <span class="stage-points">Worth {currentStagePoints} pts if your golfer wins</span>
    </div>
    <p class="stage-banner__note">{currentStageNote}</p>

    {#if entry?.payload?.golferId}
      <div class="stage-banner__saved">
        Your current saved golfer is locked at <strong>{lockedPickStageLabel}</strong>
        {#if pointsIfWins}
          <span class="stage-banner__saved-points">· {pointsIfWins} pt value</span>
        {/if}
      </div>
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

    <div class="actions" style="margin-top: 10px;">
      <div class="muted">
        Your pick is sticky across rounds unless you change it.
      </div>

      {#if locked}
        <a class="btn btn--ghost btn--sm" href={resolve('/games/[slug]/picks', { slug: event.slug })}>
          Open war room
        </a>
      {/if}
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

  .stage-banner {
    position: relative;
    overflow: hidden;
    margin-top: 16px;
    padding: 18px 18px 16px;
    border-radius: 18px;
    border: 1px solid rgba(255, 214, 102, 0.35);
    background:
      radial-gradient(circle at top right, rgba(255, 196, 84, 0.22), transparent 34%),
      linear-gradient(135deg, rgba(255, 196, 84, 0.18), rgba(255, 255, 255, 0.03));
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      0 0 0 1px rgba(255, 196, 84, 0.08),
      0 18px 40px rgba(0, 0, 0, 0.28);
  }

  .stage-banner::after {
    content: '';
    position: absolute;
    inset: auto -40px -40px auto;
    width: 160px;
    height: 160px;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(255, 214, 102, 0.14), transparent 70%);
    pointer-events: none;
  }

  .stage-banner__eyebrow {
    font-size: 0.72rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255, 224, 163, 0.9);
  }

  .stage-banner__headline {
    margin-top: 6px;
    font-size: clamp(1.5rem, 3.2vw, 2.35rem);
    font-weight: 900;
    letter-spacing: 0.06em;
    line-height: 0.95;
    text-transform: uppercase;
    color: #fff7dc;
    text-shadow: 0 0 18px rgba(255, 214, 102, 0.2);
  }

  .stage-banner__meta {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
    margin-top: 12px;
  }

  .stage-chip,
  .stage-points {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    padding: 0 14px;
    border-radius: 999px;
    font-weight: 700;
  }

  .stage-chip {
    border: 1px solid rgba(255, 224, 163, 0.35);
    background: rgba(255, 224, 163, 0.1);
    color: #fff2c8;
  }

  .stage-points {
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.92);
  }

  .stage-banner__note {
    margin: 12px 0 0;
    font-size: 1rem;
    line-height: 1.45;
    color: rgba(255, 255, 255, 0.88);
    max-width: 720px;
  }

  .stage-banner__saved {
    margin-top: 12px;
    display: inline-flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
    padding: 9px 12px;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.18);
    border: 1px solid rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.9);
  }

  .stage-banner__saved-points {
    color: rgba(255, 224, 163, 0.9);
  }
</style>
