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

    applySaved(entry.payload);

    if (!chaosTouched) {
      chaosCarId = entry?.payload?.chaosCarId
        ? String(entry.payload.chaosCarId)
        : '';
    }

    lastSavedIds = (entry?.payload?.top10Ids || []).map(String);

    lastSavedChaosId = entry?.payload?.chaosCarId
      ? String(entry.payload.chaosCarId)
      : '';
  }

  // If a top10 pick ever equals the chaos car, clear chaos car
  $: if (chaosCarId && top10IdSet.has(String(chaosCarId))) {
    chaosCarId = '';
    chaosTouched = true;
  }

  // Hidden input payloads
  $: top10IdsJson = JSON.stringify(
    top10.map((x) => String(x.id))
  );

  $: top10SnapshotJson = JSON.stringify(
    top10.map((x) => ({
      id: String(x.id),
      name: x?.name ? String(x.name) : null,
      carNumber: x?.carNumber ? String(x.carNumber) : null
    }))
  );

  // Chaos label
  $: chaosLabel = (() => {
    if (!chaosCarId) return '';

    const o = options.find(
      (x) => String(x.id) === String(chaosCarId)
    );

    if (!o) return chaosCarId;

    const num = o.carNumber
      ? `#${o.carNumber} `
      : '';

    return `${num}${o.name}`;
  })();

  // Chaos snapshot fields
  $: chaosOption = chaosCarId
    ? options.find(
        (x) =>
          String(x.id) ===
          String(chaosCarId)
      )
    : null;

  $: chaosCarName = chaosOption?.name
    ? String(chaosOption.name)
    : '';

  $: chaosCarNumber = chaosOption?.carNumber
    ? String(chaosOption.carNumber)
    : '';
</script>


{#if locked}

  <div class="daytona-shell">

    <header class="race-hero locked-hero">

      <div class="hero-copy">

        <div class="eyebrow">
          Race, Crash, Cash · Daytona 500
        </div>

        <h1>
          Race Card Final
        </h1>

        <p>
          The window is closed. Your projected Top 10
          and Chaos Car are officially on the record.
        </p>

      </div>


      <div class="lock-card">

        <span>
          Entry Status
        </span>

        <strong>
          Locked
        </strong>

        <small>
          No edits
        </small>

      </div>


      <div
        class="hero-watermark"
        aria-hidden="true"
      >
        DAYTONA
      </div>

    </header>


    {#if entry?.payload?.top10Ids?.length}

      <section class="locked-board">

        <div class="section-heading">

          <div>

            <div class="eyebrow">
              Official Forecast
            </div>

            <h2>
              Your Top 10
            </h2>

          </div>

          <span>
            Final Entry
          </span>

        </div>


        <div class="locked-grid">

          {#if entry?.payload?.top10Snapshot?.length}

            {#each entry.payload.top10Snapshot as row, index}

              <div class="locked-driver">

                <span class="locked-rank">
                  {index + 1}
                </span>

                <div>

                  <strong>
                    {row?.name || row?.id}
                  </strong>

                  {#if row?.carNumber}
                    <small>
                      Car #{row.carNumber}
                    </small>
                  {/if}

                </div>

              </div>

            {/each}

          {:else}

            {#each entry.payload.top10Ids as id, index}

              <div class="locked-driver">

                <span class="locked-rank">
                  {index + 1}
                </span>

                <div>
                  <strong>
                    {id}
                  </strong>
                </div>

              </div>

            {/each}

          {/if}

        </div>

      </section>


      <section class="locked-chaos">

        <div>

          <div class="eyebrow">
            Wild Card
          </div>

          <h2>
            Chaos Car
          </h2>

          <p>
            One driver outside your Top 10,
            selected specifically because normal
            racing apparently wasn't enough.
          </p>

        </div>


        <div class="locked-chaos-value">

          {#if entry?.payload?.chaosCarId}

            <span>
              Locked Selection
            </span>

            <strong>
              {#if entry?.payload?.chaosCarSnapshot?.carNumber}
                #{entry.payload.chaosCarSnapshot.carNumber}
              {/if}

              {entry?.payload?.chaosCarSnapshot?.name ||
                entry?.payload?.chaosCarSnapshot?.id ||
                entry.payload.chaosCarId}
            </strong>

          {:else}

            <span>
              No Selection
            </span>

            <strong>
              —
            </strong>

          {/if}

        </div>

      </section>

    {:else}

      <section class="state-screen">

        <div class="eyebrow">
          No Official Entry
        </div>

        <h2>
          You Sat This One Out
        </h2>

        <p>
          No Daytona entry was submitted before
          the event locked.
        </p>

      </section>

    {/if}

  </div>


{:else if loading}

  <div class="daytona-shell">

    <section class="state-screen">

      <div class="eyebrow">
        Daytona Entry Desk
      </div>

      <h2>
        Loading the Grid
      </h2>

      <p>
        Fetching the driver pool…
      </p>

    </section>

  </div>


{:else if loadError}

  <div class="daytona-shell">

    <section class="state-screen error-state">

      <div class="eyebrow">
        Daytona Entry Desk
      </div>

      <h2>
        Couldn't Load the Grid
      </h2>

      <p>
        {loadError}
      </p>

      <button
        class="retry-btn"
        type="button"
        on:click={onRetryOptions}
      >
        Try Again
      </button>

    </section>

  </div>


{:else}

  <form
    method="POST"
    action="?/save"
    use:enhance={() => {
      saving = true;
      saveError = '';
      savedPulse = false;

      const savedIdsNow = [...currentIds];

      const savedChaosNow =
        currentChaosId
          ? String(currentChaosId)
          : '';

      return async ({ result, update }) => {

        if (result.type === 'success') {

          await update({
            reset: false
          });

          hydratedEntryRowId = null;

          lastSavedIds =
            savedIdsNow;

          lastSavedChaosId =
            savedChaosNow;

          savedPulse = true;

          setTimeout(
            () =>
              (savedPulse = false),
            1200
          );

        } else if (
          result.type ===
          'failure'
        ) {

          saveError =
            result.data?.message ||
            'Could not save entry.';

        } else {

          saveError =
            'Something went wrong saving your entry.';

        }

        saving = false;
      };
    }}
  >

    <div class="daytona-shell">

      <header class="race-hero">

        <div class="hero-copy">

          <div class="eyebrow">
            Race, Crash, Cash · Daytona 500
          </div>

          <h1>
            Build Your Race Card
          </h1>

          <p>
            Predict the Top 10 in exact finishing order,
            then choose one driver outside your board
            as the Chaos Car.
          </p>


          <div class="race-specs">

            <div>

              <strong>
                10
              </strong>

              <span>
                Ranked Picks
              </span>

            </div>

            <div>

              <strong>
                1
              </strong>

              <span>
                Chaos Car
              </span>

            </div>

            <div>

              <strong>
                41
              </strong>

              <span>
                Make Race
              </span>

            </div>

          </div>

        </div>


        <aside class="rules-desk">

          <div class="eyebrow">
            Event Rules
          </div>

          <div class="rules-head">
            <SectionHead
              rules={DAYTONA_RULES}
            />
          </div>

          <p>
            45 cars are in the pool. Only 41 qualify.
            If one of your picks misses the race,
            that's your problem.
          </p>

        </aside>


        <div
          class="hero-watermark"
          aria-hidden="true"
        >
          DAYTONA
        </div>

      </header>


      <section class="race-workspace">

        <div class="workspace-heading">

          <div>

            <div class="eyebrow">
              Race Forecast
            </div>

            <h2>
              Your Daytona Entry
            </h2>

            <p>
              Order matters. You're predicting finishes,
              not picking ten drivers you happen to like.
            </p>

          </div>


          <div class="completion">

            <strong>
              {top10.length}
            </strong>

            <span>
              of 10
            </span>

          </div>

        </div>


        <PodiumPicker
          {options}
          bind:value={top10}
          {locked}
          max={10}
        >

          <button
            slot="podiumActions"
            class="save-entry-btn"
            type="submit"
            disabled={
              locked ||
              saving ||
              top10.length !== 10 ||
              !chaosCarId ||
              !dirty
            }
            title={
              locked
                ? 'Event is locked'
                : top10.length !== 10
                  ? 'Pick exactly 10 to save'
                  : !chaosCarId
                    ? 'Choose a Chaos Car'
                    : !dirty
                      ? 'No changes to save'
                      : 'Save entry'
            }
          >
            {saveLabel}
          </button>


          <div
            slot="sidePanel"
            class="chaos-desk"
          >

            <div class="chaos-head">

              <div>

                <div class="eyebrow">
                  Wild Card
                </div>

                <h3>
                  Chaos Car
                </h3>

              </div>


              <span
                class="chaos-state"
                class:selected={Boolean(
                  chaosCarId
                )}
              >
                {chaosCarId
                  ? 'Chosen'
                  : 'Required'}
              </span>

            </div>


            <p>
              Pick one driver outside your Top 10.
              Volatility is not a bug here.
            </p>


            <label for="chaos">
              Chaos Driver
            </label>

            <select
              id="chaos"
              class="chaos-select"
              bind:value={chaosCarId}
              disabled={locked}
              on:change={() =>
                (chaosTouched = true)}
            >

              <option value="">
                — Choose a Chaos Car —
              </option>

              {#each chaosOptions as opt}

                <option
                  value={String(opt.id)}
                >
                  {opt.carNumber
                    ? `#${opt.carNumber} `
                    : ''}{opt.name}
                </option>

              {/each}

            </select>


            {#if chaosCarId}

              <div class="chaos-selection">

                <span>
                  Selected Driver
                </span>

                <strong>
                  {chaosLabel}
                </strong>

                <button
                  class="clear-chaos"
                  type="button"
                  on:click={() => {
                    chaosCarId = '';
                    chaosTouched = true;
                  }}
                >
                  Clear Selection
                </button>

              </div>

            {:else}

              <div class="chaos-tip">

                <strong>
                  The Assignment
                </strong>

                <span>
                  Pick someone capable of turning
                  a perfectly normal Sunday into nonsense.
                </span>

              </div>

            {/if}


            <div class="chaos-rule">
              Chaos Car cannot appear in your Top 10.
            </div>

          </div>


          <div
            slot="statusLine"
            class="save-status"
            class:error={Boolean(saveError)}
            class:success={
              savedPulse ||
              (!dirty &&
                top10.length === 10 &&
                Boolean(chaosCarId))
            }
            aria-live="polite"
          >

            {#if saveError}

              {saveError}

            {:else if saving}

              Saving your race card…

            {:else if savedPulse}

              ✓ Entry saved.

            {:else if top10.length !== 10}

              {10 - top10.length}
              more
              {10 - top10.length === 1
                ? 'pick'
                : 'picks'}
              needed.

            {:else if !chaosCarId}

              Top 10 complete. Choose your Chaos Car.

            {:else if !dirty}

              ✓ Entry saved.

            {:else}

              Changes ready to save.

            {/if}

          </div>

        </PodiumPicker>

      </section>


      <input
        type="hidden"
        name="top10Ids"
        value={top10IdsJson}
      />

      <input
        type="hidden"
        name="top10Snapshot"
        value={top10SnapshotJson}
      />

      <input
        type="hidden"
        name="chaosCarId"
        value={chaosCarId}
      />

      <input
        type="hidden"
        name="chaosCarName"
        value={chaosCarName}
      />

      <input
        type="hidden"
        name="chaosCarNumber"
        value={chaosCarNumber}
      />

    </div>

  </form>

{/if}


<style>
  .daytona-shell {
    width: 100%;
    max-width: 1500px;

    display: grid;
    gap: 30px;

    margin: 0 auto;
    padding-bottom: 64px;
  }


  .eyebrow {
    color: var(--brand-gold);

    font-size: .64rem;
    font-weight: 850;

    letter-spacing: .12em;
    text-transform: uppercase;
  }


  /* ==================================================
     HERO
     ================================================== */

  .race-hero {
    position: relative;

    display: grid;

    grid-template-columns:
      minmax(0, 1fr)
      360px;

    gap: 48px;

    align-items: center;

    overflow: hidden;

    padding:
      38px
      clamp(30px, 4vw, 54px);

    border:
      1px solid
      var(--border-strong);

    border-radius:
      var(--radius-lg);

    background:
      linear-gradient(
        120deg,
        rgba(191,161,106,.045),
        transparent 45%
      ),
      var(--panel-strong);

    box-shadow:
      var(--shadow-panel);
  }


  .hero-copy {
    position: relative;
    z-index: 2;
  }


  .race-hero h1 {
    max-width: 900px;

    margin: 8px 0 0;

    color:
      var(--brand-ivory);

    font-family:
      var(--font-display);

    font-size:
      clamp(
        4.2rem,
        7vw,
        6.8rem
      );

    font-weight: 400;

    line-height: .85;

    letter-spacing: -.025em;

    text-transform: uppercase;
  }


  .hero-copy > p {
    max-width: 720px;

    margin: 20px 0 0;

    color:
      var(--muted);

    font-size: .95rem;
    font-weight: 600;

    line-height: 1.6;
  }


  .hero-watermark {
    position: absolute;

    right: -20px;
    bottom: -55px;

    color:
      rgba(191,161,106,.017);

    font-family:
      var(--font-display);

    font-size:
      clamp(
        10rem,
        18vw,
        16rem
      );

    line-height: 1;

    pointer-events: none;
  }


  /* ==================================================
     EVENT SPECS
     ================================================== */

  .race-specs {
    display: inline-grid;

    grid-template-columns:
      repeat(3, auto);

    width: fit-content;

    margin-top: 25px;

    border:
      1px solid
      var(--border);
  }


  .race-specs > div {
    min-width: 112px;

    display: grid;
    gap: 3px;

    padding:
      10px 13px;

    border-right:
      1px solid
      var(--border);

    background:
      #090d0c;
  }


  .race-specs > div:last-child {
    border-right: 0;
  }


  .race-specs strong {
    color:
      var(--brand-sand);

    font-family:
      var(--font-display);

    font-size: 1.4rem;
    font-weight: 400;

    line-height: 1;
  }


  .race-specs span {
    color:
      var(--brand-stone);

    font-size: .58rem;
    font-weight: 800;

    letter-spacing: .05em;

    text-transform: uppercase;
  }


  /* ==================================================
     RULES
     ================================================== */

  .rules-desk {
    position: relative;
    z-index: 2;

    min-width: 0;

    display: grid;
    gap: 13px;

    padding: 20px;

    border:
      1px solid
      rgba(191,161,106,.28);

    background:
      rgba(6,9,8,.56);
  }


  .rules-desk p {
    margin: 0;

    color:
      var(--muted);

    font-size: .77rem;

    line-height: 1.55;
  }


  .rules-head {
    min-width: 0;
  }


  /* ==================================================
     WORKSPACE
     ================================================== */

  .race-workspace {
    display: grid;
    gap: 18px;
  }


  .workspace-heading {
    display: flex;

    justify-content: space-between;
    align-items: end;

    gap: 22px;

    padding-bottom: 15px;

    border-bottom:
      1px solid
      var(--border);
  }


  .workspace-heading h2 {
    margin: 5px 0 0;

    color:
      var(--brand-ivory);

    font-family:
      var(--font-display);

    font-size:
      clamp(
        2.8rem,
        4.5vw,
        4rem
      );

    font-weight: 400;

    line-height: .93;

    text-transform: uppercase;
  }


  .workspace-heading p {
    max-width: 760px;

    margin: 10px 0 0;

    color:
      var(--muted);

    font-size: .82rem;

    line-height: 1.5;
  }


  .completion {
    display: flex;

    align-items: baseline;

    gap: 6px;

    padding-bottom: 3px;
  }


  .completion strong {
    color:
      var(--brand-sand);

    font-family:
      var(--font-display);

    font-size: 2.2rem;
    font-weight: 400;

    line-height: 1;
  }


  .completion span {
    color:
      var(--brand-stone);

    font-size: .62rem;
    font-weight: 850;

    letter-spacing: .06em;

    text-transform: uppercase;
  }


  /* ==================================================
     CHAOS PANEL
     ================================================== */

  .chaos-desk {
    min-width: 0;

    display: grid;
    align-content: start;

    gap: 15px;

    padding:
      4px 0
      0 20px;

    border-left:
      2px solid
      var(--brand-gold);
  }


  .chaos-head {
    display: flex;

    justify-content: space-between;
    align-items: flex-start;

    gap: 15px;
  }


  .chaos-head h3 {
    margin: 5px 0 0;

    color:
      var(--brand-ivory);

    font-family:
      var(--font-display);

    font-size: 2.35rem;
    font-weight: 400;

    line-height: .92;

    text-transform: uppercase;
  }


  .chaos-state {
    padding:
      5px 7px;

    border:
      1px solid
      var(--border-strong);

    color:
      var(--brand-stone);

    font-size: .58rem;
    font-weight: 850;

    letter-spacing: .06em;

    text-transform: uppercase;
  }


  .chaos-state.selected {
    border-color:
      rgba(145,184,155,.42);

    color:
      #91b89b;
  }


  .chaos-desk > p {
    margin: 0;

    color:
      var(--muted);

    font-size: .77rem;

    line-height: 1.55;
  }


  .chaos-desk label {
    color:
      var(--brand-stone);

    font-size: .61rem;
    font-weight: 850;

    letter-spacing: .08em;

    text-transform: uppercase;
  }


  .chaos-select {
    width: 100%;

    min-height: 44px;

    box-sizing: border-box;

    outline: 0;

    border:
      1px solid
      var(--border-strong);

    border-radius: 2px;

    padding:
      9px 11px;

    background:
      #090d0c;

    color:
      var(--brand-ivory);

    font: inherit;
    font-size: .82rem;
  }


  .chaos-select:focus {
    border-color:
      var(--brand-gold);
  }


  .chaos-select option {
    background: #fff;
    color: #111;
  }


  .chaos-selection {
    display: grid;
    gap: 5px;

    padding:
      14px 0;

    border-top:
      1px solid
      var(--border);

    border-bottom:
      1px solid
      var(--border);
  }


  .chaos-selection > span {
    color:
      var(--brand-gold);

    font-size: .58rem;
    font-weight: 850;

    letter-spacing: .08em;

    text-transform: uppercase;
  }


  .chaos-selection strong {
    color:
      var(--brand-ivory);

    font-size: .9rem;
  }


  .clear-chaos {
    width: fit-content;

    margin-top: 7px;
    padding: 0;

    cursor: pointer;

    border: 0;

    background: transparent;

    color:
      var(--brand-gold);

    font: inherit;
    font-size: .65rem;
    font-weight: 850;

    text-transform: uppercase;
  }


  .clear-chaos:hover {
    color:
      var(--brand-sand);
  }


  .chaos-tip {
    display: grid;
    gap: 4px;

    padding:
      14px 0;

    border-top:
      1px solid
      var(--border);

    border-bottom:
      1px solid
      var(--border);
  }


  .chaos-tip strong {
    color:
      var(--brand-gold);

    font-size: .67rem;
  }


  .chaos-tip span,
  .chaos-rule {
    color:
      var(--brand-stone);

    font-size: .68rem;

    line-height: 1.5;
  }


  /* ==================================================
     SAVE
     ================================================== */

  .save-entry-btn,
  .retry-btn {
    min-height: 40px;

    cursor: pointer;

    padding:
      0 17px;

    border:
      1px solid
      var(--brand-gold);

    border-radius: 2px;

    background:
      var(--brand-gold);

    color:
      var(--brand-charcoal);

    font: inherit;
    font-size: .63rem;
    font-weight: 900;

    letter-spacing: .05em;

    text-transform: uppercase;
  }


  .save-entry-btn:hover:not(:disabled),
  .retry-btn:hover {
    background:
      var(--brand-sand);

    border-color:
      var(--brand-sand);
  }


  .save-entry-btn:disabled {
    cursor: not-allowed;

    opacity: .35;
  }


  .save-status {
    min-height: 32px;

    display: flex;
    align-items: center;

    padding-left: 12px;

    border-left:
      2px solid
      var(--brand-gold);

    color:
      var(--brand-stone);

    font-size: .7rem;
  }


  .save-status.success {
    border-color:
      #91b89b;

    color:
      #91b89b;
  }


  .save-status.error {
    border-color:
      #c77d72;

    color:
      #c77d72;
  }


  /* ==================================================
     LOCKED VIEW
     ================================================== */

  .lock-card {
    position: relative;
    z-index: 2;

    min-width: 185px;

    display: grid;
    gap: 4px;

    justify-items: center;

    justify-self: end;

    padding: 21px;

    border:
      1px solid
      rgba(191,161,106,.32);

    background:
      rgba(6,9,8,.48);
  }


  .lock-card span,
  .lock-card small {
    color:
      var(--brand-stone);

    font-size: .58rem;
    font-weight: 850;

    letter-spacing: .08em;

    text-transform: uppercase;
  }


  .lock-card strong {
    color:
      var(--brand-sand);

    font-family:
      var(--font-display);

    font-size: 2.6rem;
    font-weight: 400;

    line-height: 1;
  }


  .locked-board {
    display: grid;
  }


  .section-heading {
    display: flex;

    justify-content: space-between;
    align-items: end;

    gap: 20px;

    padding-bottom: 14px;

    border-bottom:
      1px solid
      var(--border);
  }


  .section-heading h2,
  .locked-chaos h2,
  .state-screen h2 {
    margin: 5px 0 0;

    color:
      var(--brand-ivory);

    font-family:
      var(--font-display);

    font-weight: 400;

    line-height: .94;

    text-transform: uppercase;
  }


  .section-heading h2 {
    font-size:
      clamp(
        2.5rem,
        4vw,
        3.6rem
      );
  }


  .section-heading > span {
    color:
      var(--brand-stone);

    font-size: .62rem;
    font-weight: 850;

    text-transform: uppercase;
  }


  .locked-grid {
    display: grid;

    grid-template-columns:
      repeat(2, minmax(0,1fr));
  }


  .locked-driver {
    min-height: 66px;

    display: grid;

    grid-template-columns:
      52px
      minmax(0,1fr);

    gap: 14px;

    align-items: center;

    padding:
      0 12px;

    border-bottom:
      1px solid
      var(--border);
  }


  .locked-driver:nth-child(odd) {
    border-right:
      1px solid
      var(--border);
  }


  .locked-rank {
    color:
      var(--brand-gold);

    font-family:
      var(--font-display);

    font-size: 1.45rem;
  }


  .locked-driver > div {
    display: grid;
    gap: 3px;
  }


  .locked-driver strong {
    color:
      var(--brand-ivory);

    font-size: .83rem;
  }


  .locked-driver small {
    color:
      var(--brand-stone);

    font-size: .64rem;
  }


  .locked-chaos {
    display: grid;

    grid-template-columns:
      minmax(0,1fr)
      330px;

    gap: 40px;

    align-items: center;

    padding:
      26px 0;

    border-top:
      1px solid
      var(--border);

    border-bottom:
      1px solid
      var(--border);
  }


  .locked-chaos h2 {
    font-size: 2.7rem;
  }


  .locked-chaos p {
    max-width: 650px;

    margin: 9px 0 0;

    color:
      var(--muted);

    font-size: .8rem;

    line-height: 1.55;
  }


  .locked-chaos-value {
    display: grid;
    gap: 5px;

    padding-left: 18px;

    border-left:
      2px solid
      var(--brand-gold);
  }


  .locked-chaos-value span {
    color:
      var(--brand-gold);

    font-size: .59rem;
    font-weight: 850;

    text-transform: uppercase;
  }


  .locked-chaos-value strong {
    color:
      var(--brand-sand);

    font-size: 1rem;
  }


  /* ==================================================
     STATE SCREENS
     ================================================== */

  .state-screen {
    padding:
      50px 0;

    border-top:
      1px solid
      var(--border);

    border-bottom:
      1px solid
      var(--border);
  }


  .state-screen h2 {
    font-size:
      clamp(
        2.8rem,
        5vw,
        4.3rem
      );
  }


  .state-screen p {
    margin: 12px 0 0;

    color:
      var(--muted);

    font-size: .85rem;
  }


  .state-screen .retry-btn {
    margin-top: 20px;
  }


  .error-state {
    padding-left: 20px;

    border-left:
      2px solid
      #c77d72;
  }


  /* ==================================================
     RESPONSIVE
     ================================================== */

  @media (max-width: 1000px) {

    .race-hero {
      grid-template-columns:
        1fr;
    }


    .rules-desk {
      max-width: 620px;
    }


    .lock-card {
      justify-self: start;
    }


    .locked-chaos {
      grid-template-columns:
        1fr;
    }

  }


  @media (max-width: 650px) {

    .daytona-shell {
      gap: 22px;
    }


    .race-hero {
      padding:
        28px 21px;
    }


    .race-hero h1 {
      font-size:
        clamp(
          3.8rem,
          18vw,
          5rem
        );
    }


    .race-specs {
      width: 100%;

      grid-template-columns:
        repeat(3,1fr);
    }


    .race-specs > div {
      min-width: 0;
    }


    .workspace-heading,
    .section-heading {
      display: grid;
    }


    .completion {
      justify-self: start;
    }


    .locked-grid {
      grid-template-columns:
        1fr;
    }


    .locked-driver:nth-child(odd) {
      border-right: 0;
    }

  }
</style>