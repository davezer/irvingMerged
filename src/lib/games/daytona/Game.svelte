<script>
  import { enhance } from '$app/forms';
  import PodiumPicker from '$lib/components/PodiumPicker.svelte';
  import SectionHead from '$lib/ui/SectionHeader.svelte';
  import { DAYTONA_RULES } from './rules.js';

  export let event;
  export let locked = false;
  export let entry = null;

  // options + load state from parent route
  export let options = [];
  export let loading = false;
  export let loadError = '';
  export let onRetryOptions = () => {};

  // Selected picks (objects)
  let top10 = [];

  // Derived: current top10 id set + chaos dropdown options exclude top10
  $: top10IdSet = new Set(top10.map((x) => String(x.id)));
  $: chaosOptions = options.filter((o) => !top10IdSet.has(String(o.id)));

  // Chaos car (single id)
  let chaosCarId = '';
  let chaosTouched = false;

  // Save UX
  let saving = false;
  let saveError = '';
  let savedPulse = false;

  // Track what the server last confirmed so dirty works correctly
  let lastSavedIds = [];
  let lastSavedChaosId = '';

  // Current ids (in order)
  $: currentIds = top10.map((x) => String(x.id));
  $: currentChaosId = chaosCarId ? String(chaosCarId) : '';

  // Dirty if order/content differs from last saved snapshot (including chaos car)
  $: dirty =
    !locked &&
    (JSON.stringify(currentIds) !== JSON.stringify(lastSavedIds) ||
      String(currentChaosId) !== String(lastSavedChaosId));

  // Button label helper
  $: hasSavedEntry = lastSavedIds.length === 10;
  $: saveLabel = saving
    ? 'Saving…'
    : dirty
      ? hasSavedEntry
        ? 'Update entry'
        : 'Save entry'
      : 'Saved';

  // IDs from server payload that need resolving into option objects
  let pendingIds = [];

  function applySaved(entryPayload) {
    if (!entryPayload?.top10Ids || !Array.isArray(entryPayload.top10Ids)) return;

    const seen = new Set();
    const ids = entryPayload.top10Ids
      .map(String)
      .filter((id) => (seen.has(id) ? false : (seen.add(id), true)))
      .slice(0, 10);

    pendingIds = ids;

    // If options already loaded, resolve immediately
    if (options.length) {
      const map = new Map(options.map((o) => [String(o.id), o]));
      top10 = pendingIds
        .map((id) => map.get(String(id)))
        .filter(Boolean)
        .slice(0, 10);
      pendingIds = [];
    }
  }

  // If pendingIds exist and options become available later, resolve them
  $: if (pendingIds.length && options.length) {
    const map = new Map(options.map((o) => [String(o.id), o]));
    top10 = pendingIds
      .map((id) => map.get(String(id)))
      .filter(Boolean)
      .slice(0, 10);
    pendingIds = [];
  }

  // Hydrate from server entry only when we get a real entry row
  let hydratedEntryRowId = null;

  $: if (entry?.id && entry.id !== hydratedEntryRowId) {
    hydratedEntryRowId = entry.id;

    // Hydrate saved Top 10 → pendingIds (resolved to objects if options already loaded)
    applySaved(entry.payload);

    // Hydrate chaos from server only if user hasn't touched it
    if (!chaosTouched) {
      chaosCarId = entry?.payload?.chaosCarId ? String(entry.payload.chaosCarId) : '';
    }

    // Hydrate server-confirmed "last saved" snapshots used by dirty calc
    lastSavedIds = (entry?.payload?.top10Ids || []).map(String);
    lastSavedChaosId = entry?.payload?.chaosCarId ? String(entry.payload.chaosCarId) : '';
  }

  // If a top10 pick ever equals the chaos car, clear chaos car (client guard)
  $: if (chaosCarId && top10IdSet.has(String(chaosCarId))) {
    chaosCarId = '';
    chaosTouched = true;
  }

  // Hidden input payloads to submit
  $: top10IdsJson = JSON.stringify(top10.map((x) => String(x.id)));
  $: top10SnapshotJson = JSON.stringify(
    top10.map((x) => ({
      id: String(x.id),
      name: x?.name ? String(x.name) : null,
      carNumber: x?.carNumber ? String(x.carNumber) : null
    }))
  );

  // Chaos label (nice display)
  $: chaosLabel = (() => {
    if (!chaosCarId) return '';
    const o = options.find((x) => String(x.id) === String(chaosCarId));
    if (!o) return chaosCarId;
    const num = o.carNumber ? `#${o.carNumber} ` : '';
    return `${num}${o.name}`;
  })();

  // Chaos snapshot fields (what we store)
  $: chaosOption = chaosCarId ? options.find((x) => String(x.id) === String(chaosCarId)) : null;
  $: chaosCarName = chaosOption?.name ? String(chaosOption.name) : '';
  $: chaosCarNumber = chaosOption?.carNumber ? String(chaosOption.carNumber) : '';
</script>


{#if locked}
  <div class="card">
    <div class="section-head">
      <h2 class="h2">Finalized Entry</h2>
      <span class="pill pill--red">No edits</span>
    </div>

    {#if entry?.payload?.top10Ids?.length}
      <p class="subtle" style="margin-top: 6px;">
        Your picks are locked in.
      </p>

      <div class="list">
        {#if entry?.payload?.top10Snapshot?.length}
          <ol>
            {#each entry.payload.top10Snapshot as row}
              <li>
                {#if row?.carNumber}
                  <span class="pill">#{row.carNumber}</span>
                {/if}
                <strong style="margin-left: 8px;">
                  {row?.name || row?.id}
                </strong>
                <span class="muted" style="margin-left: 8px;">
                  ({row?.id})
                </span>
              </li>
            {/each}
          </ol>
        {:else}
          <ol>
            {#each entry.payload.top10Ids as id}
              <li><span class="muted">{id}</span></li>
            {/each}
          </ol>
        {/if}
      </div>

      {#if entry?.payload?.chaosCarId}
        <div class="spacer-sm"></div>
        <div class="list">
          <div class="section-head">
            <h3 class="h3" style="margin:0;">Chaos Car</h3>
            <span class="pill pill--gold">Locked</span>
          </div>

          {#if entry?.payload?.chaosCarSnapshot}
            <div class="muted" style="margin-top:10px;">
              {#if entry.payload.chaosCarSnapshot.carNumber}
                <span class="pill">#{entry.payload.chaosCarSnapshot.carNumber}</span>
              {/if}
              <strong style="margin-left: 8px;">
                {entry.payload.chaosCarSnapshot.name || entry.payload.chaosCarSnapshot.id}
              </strong>
            </div>
            <div class="muted" style="margin-top: 6px;">
              ID: {entry.payload.chaosCarSnapshot.id}
            </div>
          {:else}
            <div class="muted" style="margin-top:10px;">
              {String(entry.payload.chaosCarId)}
            </div>
          {/if}
        </div>
      {/if}
    {:else}
      <p class="subtle" style="margin-top: 10px;">You didn’t submit an entry for this event.</p>
    {/if}
  </div>
  

{:else if loading}
  <div class="card">
    
    <div class="section-head">
      <h2 class="h2">Loading</h2>
      <span class="pill">Please wait</span>
    </div>
    <p class="subtle" style="margin-top: 10px;">Fetching the driver pool…</p>
  </div>

{:else if loadError}
  <div class="card">
    <div class="section-head">
      <h2 class="h2">Couldn’t load options</h2>
      <span class="pill pill--red">Error</span>
    </div>

    <p class="subtle" style="margin-top: 10px;">
      <strong class="muted">Details:</strong>
      {loadError}
    </p>

    <div class="actions">
      <button class="btn" type="button" on:click={onRetryOptions}>Try again</button>
    </div>
  </div>

{:else}
  <form
    method="POST"
    action="?/save"
    use:enhance={() => {
      saving = true;
      saveError = '';
      savedPulse = false;

      // snapshot what we're saving
      const savedIdsNow = [...currentIds];
      const savedChaosNow = currentChaosId ? String(currentChaosId) : '';

      return async ({ result, update }) => {
        if (result.type === 'success') {
          await update({ reset: false });

          // allow re-hydration when server data is ready (but don't wipe UI)
          hydratedEntryRowId = null;

          lastSavedIds = savedIdsNow;
          lastSavedChaosId = savedChaosNow;

          savedPulse = true;
          setTimeout(() => (savedPulse = false), 1200);
        } else if (result.type === 'failure') {
          saveError = result.data?.message || 'Could not save entry.';
        } else {
          saveError = 'Something went wrong saving your entry.';
        }

        saving = false;
      };
    }}
  >
    <div class="page-wide">
      <div class="card">
        <div class="section-head">
          <h2 class="h2">Your Daytona Entry</h2>
          <div class="sectionHead"><SectionHead rules={DAYTONA_RULES}/></div>
          {#if chaosCarId}
            <span class="pill pill--gold">Chaos set </span> 
          {:else}
            <span class="pill">Chaos Required</span>
          {/if}
          
        </div>

        <p class="subtle" style="margin-top: 10px;">
          Choose your top 10 finishers. Order matters. Chaos Car for extra spice.
        </p>
        <p class="subtle" style="margin-top: 10px;">
          45 cars are in the pool. Only 41 make the race. Do your homework and pay attention to who qualifies.
        </p>
        <p class="subtle" style="margin-top: 10px;">
          If you choose a car who does not qualify, thats on you.
        </p>

        <div class="spacer-sm"></div>

        <PodiumPicker {options} bind:value={top10} {locked} max={10}>
          <button
            slot="podiumActions"
            class="btn btn--vip"
            type="submit"
            disabled={locked || saving || top10.length !== 10 || !chaosCarId || !dirty}
            title={locked
              ? 'Event is locked'
              : top10.length !== 10
                ? 'Pick exactly 10 to save'
                : !dirty
                  ? 'No changes to save'
                  : 'Save entry'}
          >
            {saveLabel}
          </button>

          <div slot="sidePanel" class="podium-side">
            <div class="chaos-head">
              <div>
                <div class="kicker">Chaos</div>
                <h3 class="chaos-title">Chaos Car</h3>
              </div>

              {#if chaosCarId}
                <span class="pill pill--gold">Chosen</span>
              {:else}
                <span class="pill">Required</span>
              {/if}
            </div>

            <p class="subtle" style="margin-top: 0;">
              Pick one driver outside your Top 10. Pure danger.
            </p>

            <div class="spacer-sm"></div>

            <label class="muted" for="chaos">Chaos driver</label>
            <select
              id="chaos"
              class="input"
              bind:value={chaosCarId}
              disabled={locked}
              on:change={() => (chaosTouched = true)}
            >
              <option value="">— No chaos car —</option>

              {#each chaosOptions as opt}
                <option value={String(opt.id)}>
                  {opt.carNumber ? `#${opt.carNumber} ` : ''}{opt.name}
                </option>
              {/each}
            </select>

            <div class="panel" style="margin-top: 10px;">
              <div class="panel-pad">
                {#if chaosCarId}
                  <div class="muted">Selected</div>
                  <div style="margin-top: 6px;">
                    <strong>{chaosLabel}</strong>
                  </div>

                  <div class="actions" style="margin-top: 12px;">
                    <button class="btn btn--ghost" type="button" on:click={() => (chaosCarId = '')}>
                      Clear
                    </button>
                  </div>
                {:else}
                  <div class="muted">Tip: pick someone volatile. That’s the point.</div>
                {/if}
              </div>
            </div>

            <div class="foot muted" style="margin-top: 10px;">
              Rule: chaos car must not be in your Top 10.
            </div>
          </div>

          <div slot="statusLine" class="muted">
            {#if saveError}
              <span style="color: rgba(255,120,120,0.95);">{saveError}</span>
            {:else if saving}
              Saving your picks…
            {:else if savedPulse || (!dirty && top10.length === 10)}
              Saved.
            {:else if top10.length !== 10}
              Pick exactly 10 to submit.
            {:else}
              Make changes, then save.
            {/if}
          </div>
        </PodiumPicker>

        <input type="hidden" name="top10Ids" value={top10IdsJson} />
        <input type="hidden" name="top10Snapshot" value={top10SnapshotJson} />
        <input type="hidden" name="chaosCarId" value={chaosCarId} />
        <input type="hidden" name="chaosCarName" value={chaosCarName} />
        <input type="hidden" name="chaosCarNumber" value={chaosCarNumber} />
      </div>
    </div>
  </form>
{/if}

<style>
  .spacer-sm { height: 10px; }
  .actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 16px;
    flex-wrap: wrap;
  }
  .list {
    margin-top: 12px;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.25);
  }
  ol { margin: 0; padding-left: 22px; }
  li { margin: 6px 0; }
  .input {
    width: 100%;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(0, 0, 0, 0.28);
    color: rgba(255, 255, 255, 0.92);
    outline: none;
  }
  .input:disabled { opacity: 0.65; cursor: not-allowed; }

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

  .podium-side .chaos-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
  }
  .podium-side .chaos-title {
    margin: 2px 0 0 0;
    font-family: ui-serif, 'Iowan Old Style', 'Palatino Linotype', Palatino, Garamond, Georgia, serif;
    letter-spacing: 0.3px;
    font-size: 18px;
    white-space: nowrap;
  }

.sectionHead {
  flex-wrap: wrap;
  justify-self: left;
  padding-bottom: 2px;
}
</style>
