<script>
  export let options = []; // [{ id, name, carNumber? }]
  export let value = [];   // bind:value (selected podium items)
  export let locked = false;
  export let max = 10;

  let query = '';

  // Detect whether host provided a right-side panel
  $: hasSidePanel = !!$$slots.sidePanel;

  $: selectedIds = new Set((value ?? []).map((x) => x.id));
  $: available = (options ?? []).filter((x) => !selectedIds.has(x.id));

  $: filteredAvailable = available.filter((x) =>
    (x?.name || '').toLowerCase().includes(query.toLowerCase())
  );

  // Keep render snappy when not searching
  $: renderAvailable = query ? filteredAvailable : filteredAvailable.slice(0, 80);

  function add(item) {
    if (locked) return;
    if (!item) return;
    if (value.some((x) => x.id === item.id)) return;
    if (value.length >= max) return;
    value = [...value, item];
  }

  function remove(id) {
    if (locked) return;
    value = value.filter((x) => x.id !== id);
  }

  function moveUp(idx) {
    if (locked) return;
    if (idx <= 0) return;
    const next = value.slice();
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    value = next;
  }

  function moveDown(idx) {
    if (locked) return;
    if (idx >= value.length - 1) return;
    const next = value.slice();
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    value = next;
  }

  function clearAll() {
    if (locked) return;
    value = [];
  }
</script>

<div class="grid" class:has-side={hasSidePanel}>
  <!-- AVAILABLE -->
  <section class="card card--tight">
    <div class="head">
      <div class="head-left">
        <div class="kicker">Driver pool</div>
        <h3 class="title">Available</h3>
      </div>

      <span class="pill">{filteredAvailable.length} shown</span>
    </div>

    <input
      class="input"
      placeholder="Search drivers…"
      bind:value={query}
      disabled={locked}
    />
    <div class="foot muted">
      {#if !query && filteredAvailable.length > renderAvailable.length}
        Showing {renderAvailable.length} of {filteredAvailable.length}. Search to see more.
      {:else}
        Tip: search by last name.
      {/if}
    </div>

    <div class="panel panel--scroll">
      {#if renderAvailable.length === 0}
        <div class="empty">
          {#if query}
            No matches.
          {:else}
            No available drivers.
          {/if}
        </div>
      {:else}
        {#each renderAvailable as item (item.id)}
          <div class="row">
            <div class="row-left">
              <div class="name" title={item.name}>{item.name}</div>
              {#if item.carNumber}
                <div class="meta">Car #{item.carNumber}</div>
              {:else}
                <div class="meta">&nbsp;</div>
              {/if}
            </div>

            <button
              class="btn"
              type="button"
              on:click={() => add(item)}
              disabled={locked || value.length >= max}
              title="Add"
            >
              +
            </button>
          </div>
        {/each}
      {/if}
    </div>

    
  </section>

  <!-- PODIUM -->
  <section class="card card--tight">
    <div class="head">
      <div class="head-left">
        <div class="kicker">Your picks</div>
        <h3 class="title">Top {max}</h3>
      </div>

      <div class="head-right">
        <span class="pill pill--gold">{value.length}/{max} selected</span>

        <div class="actions-row">
          <button
            class="btn btn--ghost"
            type="button"
            on:click={clearAll}
            disabled={locked || value.length === 0}
            title="Clear all"
          >
            Clear
          </button>

          <slot name="podiumActions" />
        </div>
      </div>
    </div>
    <div class="foot muted">
      Order matters. You’re not picking favorites. You’re picking finishes.
    </div>

    <div class="panel panel--scroll">
      {#if value.length === 0}
        <div class="empty">Pick {max} drivers from the left.</div>
      {:else}
        {#each value as item, idx (item.id)}
          <div class="row row--selected">
            <div class="row-left">
              <div class="name">
                <span class="rank">{idx + 1}</span>
                <span title={item.name}>{item.name}</span>
              </div>
              <div class="meta">Finish position</div>
            </div>

            <div class="controls">
              <button
                class="btn btn--ghost"
                type="button"
                on:click={() => moveUp(idx)}
                disabled={locked || idx === 0}
                title="Move up"
              >
                ↑
              </button>

              <button
                class="btn btn--ghost"
                type="button"
                on:click={() => moveDown(idx)}
                disabled={locked || idx === value.length - 1}
                title="Move down"
              >
                ↓
              </button>

              <button
                class="btn btn--danger"
                type="button"
                on:click={() => remove(item.id)}
                disabled={locked}
                title="Remove"
              >
                ✕
              </button>
            </div>
          </div>
        {/each}
      {/if}
    </div>

    

    {#if $$slots.statusLine}
      <div class="statusline">
        <slot name="statusLine" />
      </div>
    {/if}
  </section>

  <!-- OPTIONAL SIDE PANEL -->
  {#if hasSidePanel}
    <section class="card card--tight">
      <slot name="sidePanel" />
    </section>
  {/if}
</div>

<style>
	/* ==================================================
	   WORKSPACE GRID
	   ================================================== */

	.grid {
		display: grid;
		grid-template-columns:
			repeat(2, minmax(0, 1fr));

		gap: 20px;

		width: 100%;
		margin-top: 14px;

		align-items: stretch;
	}


	.grid.has-side {
		grid-template-columns:
			1fr 1fr .82fr;
	}


	.grid > section {
		min-width: 0;

		display: flex;
		flex-direction: column;

		min-height: 600px;

		padding: 0 !important;

		border: 0 !important;
		border-radius: 0 !important;

		background: transparent !important;

		box-shadow: none !important;
	}


	/*
		Separate the three desks without turning
		each one into another giant card.
	*/

	.grid > section + section {
		padding-left: 20px !important;

		border-left:
			1px solid
			var(--border) !important;
	}


	/* ==================================================
	   HEADERS
	   ================================================== */

	.head {
		display: flex;

		justify-content: space-between;
		align-items: flex-start;

		gap: 18px;

		min-width: 0;

		margin-bottom: 16px;
		padding-bottom: 14px;

		border-bottom:
			1px solid
			var(--border);
	}


	.head-left {
		min-width: 0;
	}


	.kicker {
		color:
			var(--brand-gold);

		font-size: .62rem;
		font-weight: 850;

		letter-spacing: .11em;

		text-transform: uppercase;
	}


	.title {
		margin: 5px 0 0;

		overflow: hidden;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				2rem,
				2.7vw,
				2.8rem
			);

		font-weight: 400;

		line-height: .94;

		letter-spacing: -.01em;

		text-overflow: ellipsis;

		text-transform: uppercase;

		white-space: nowrap;
	}


	.head-right {
		display: flex;
		flex-direction: column;

		align-items: flex-end;

		gap: 10px;

		flex: 0 0 auto;
	}


	.actions-row {
		display: flex;

		align-items: center;
		justify-content: flex-end;

		gap: 7px;

		flex-wrap: wrap;
	}


	/* ==================================================
	   STATUS / COUNT PILLS
	   ================================================== */

	:global(.pill) {
		height: auto !important;
		min-height: 27px;

		display: inline-flex;
		align-items: center;

		padding:
			4px 8px !important;

		border:
			1px solid
			var(--border-strong) !important;

		border-radius: 2px !important;

		background:
			#090d0c !important;

		color:
			var(--brand-stone) !important;

		font-size: .58rem !important;
		font-weight: 850 !important;

		letter-spacing: .05em;

		text-transform: uppercase;

		box-shadow: none !important;
	}


	:global(.pill--gold) {
		border-color:
			rgba(191,161,106,.52) !important;

		color:
			var(--brand-gold) !important;

		background:
			rgba(191,161,106,.045) !important;
	}


	/* ==================================================
	   SEARCH
	   ================================================== */

	.input {
		width: 100%;
		min-height: 43px;

		box-sizing: border-box;

		margin-bottom: 9px;
		padding:
			9px 11px;

		outline: 0;

		border:
			1px solid
			var(--border-strong);

		border-radius: 2px;

		background:
			#090d0c;

		color:
			var(--brand-ivory);

		font: inherit;
		font-size: .82rem;
	}


	.input::placeholder {
		color:
			rgba(157,155,145,.66);
	}


	.input:focus {
		border-color:
			var(--brand-gold);
	}


	.foot {
		flex: 0 0 auto;

		padding-bottom: 12px;

		color:
			var(--brand-stone);

		font-size: .68rem;

		line-height: 1.45;
	}


	/* ==================================================
	   DRIVER LIST
	   ================================================== */

	.panel {
		flex: 1 1 auto;

		min-height: 0;

		overflow: hidden;

		border:
			1px solid
			var(--border);

		border-radius: 0;

		background:
			rgba(7,10,9,.38);
	}


	.panel--scroll {
		overflow-y: auto;

		max-height:
			calc(15 * 54px);

		overscroll-behavior: contain;

		scrollbar-gutter: stable;
	}


	.panel--scroll::-webkit-scrollbar {
		width: 7px;
	}


	.panel--scroll::-webkit-scrollbar-thumb {
		background:
			rgba(191,161,106,.22);

		border-radius: 0;
	}


	.panel--scroll::-webkit-scrollbar-track {
		background:
			transparent;
	}


	.row {
		min-width: 0;
		min-height: 54px;

		display: flex;

		justify-content: space-between;
		align-items: center;

		gap: 14px;

		box-sizing: border-box;

		padding:
			8px 10px;

		border-bottom:
			1px solid
			var(--border);

		transition:
			background 100ms ease,
			border-color 100ms ease;
	}


	.row:last-child {
		border-bottom: 0;
	}


	.row:hover {
		background:
			rgba(191,161,106,.028);
	}


	.row--selected {
		position: relative;

		background:
			linear-gradient(
				90deg,
				rgba(191,161,106,.065),
				transparent 65%
			);
	}


	.row--selected::before {
		content: '';

		position: absolute;

		top: 0;
		bottom: 0;
		left: 0;

		width: 2px;

		background:
			var(--brand-gold);
	}


	.row-left {
		min-width: 0;

		display: grid;

		gap: 3px;
	}


	.name {
		min-width: 0;

		display: flex;

		align-items: center;

		gap: 10px;

		overflow: hidden;

		color:
			var(--brand-ivory);

		font-size: .79rem;
		font-weight: 750;

		text-overflow: ellipsis;

		white-space: nowrap;
	}


	.meta {
		color:
			var(--brand-stone);

		font-size: .63rem;

		opacity: 1;
	}


	/* ==================================================
	   RANK
	   ================================================== */

	.rank {
		width: 28px;
		height: 28px;

		display: inline-grid;
		place-items: center;

		flex: 0 0 auto;

		border:
			1px solid
			rgba(191,161,106,.40);

		border-radius: 0;

		background:
			#090d0c;

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size: 1rem;
		font-weight: 400;
	}


	/* Make the top three read slightly differently */

	.row--selected:nth-child(1) .rank,
	.row--selected:nth-child(2) .rank,
	.row--selected:nth-child(3) .rank {
		background:
			var(--brand-gold);

		color:
			var(--brand-charcoal);
	}


	/* ==================================================
	   BUTTONS
	   ================================================== */

	:global(.btn) {
		min-width: 36px !important;
		min-height: 36px !important;

		cursor: pointer;

		padding:
			0 10px !important;

		border:
			1px solid
			var(--border-strong) !important;

		border-radius: 2px !important;

		background:
			#0a0e0d !important;

		color:
			var(--brand-stone) !important;

		font: inherit;

		font-size: .68rem !important;
		font-weight: 850 !important;

		line-height: 1 !important;

		box-shadow: none !important;

		transition:
			border-color 100ms ease,
			color 100ms ease,
			background 100ms ease;
	}


	:global(.btn:hover:not(:disabled)) {
		border-color:
			var(--brand-gold) !important;

		color:
			var(--brand-sand) !important;
	}


	:global(.btn:disabled) {
		opacity: .3 !important;

		cursor: not-allowed;
	}


	:global(.btn--ghost) {
		background:
			transparent !important;
	}


	:global(.btn--danger) {
		color:
			#c98b81 !important;

		border-color:
			rgba(201,139,129,.27) !important;
	}


	:global(.btn--danger:hover:not(:disabled)) {
		background:
			rgba(201,139,129,.08) !important;

		border-color:
			#c98b81 !important;
	}


	/*
		This catches the Save Entry button
		passed into the podiumActions slot.
	*/

	:global(.save-entry-btn),
	:global(.btn--vip) {
		min-width: 120px !important;

		border-color:
			var(--brand-gold) !important;

		background:
			var(--brand-gold) !important;

		color:
			var(--brand-charcoal) !important;
	}


	:global(.save-entry-btn:hover:not(:disabled)),
	:global(.btn--vip:hover:not(:disabled)) {
		border-color:
			var(--brand-sand) !important;

		background:
			var(--brand-sand) !important;

		color:
			var(--brand-charcoal) !important;
	}


	/* ==================================================
	   CONTROLS
	   ================================================== */

	.controls {
		display: flex;

		align-items: center;

		gap: 5px;

		flex: 0 0 auto;
	}


	.empty {
		padding:
			18px 14px;

		color:
			var(--brand-stone);

		font-size: .72rem;

		opacity: 1;
	}


	.statusline {
		flex: 0 0 auto;

		margin-top: 11px;
		padding-top: 11px;

		border-top:
			1px solid
			var(--border);
	}


	/* ==================================================
	   SIDE PANEL SLOT
	   ================================================== */

	/*
		VERY important:
		the parent Daytona component supplies its
		own .chaos-desk design.

		Don't wrap that in another visible card.
	*/

	.grid.has-side > section:last-child {
		background:
			transparent !important;
	}


	/* ==================================================
	   RESPONSIVE
	   ================================================== */

	@media (max-width: 1100px) {

		.grid.has-side {
			grid-template-columns:
				repeat(
					2,
					minmax(0,1fr)
				);
		}


		.grid.has-side > section:last-child {
			grid-column:
				1 / -1;

			min-height: auto;

			padding:
				20px 0 0 !important;

			border-left: 0 !important;

			border-top:
				1px solid
				var(--border) !important;
		}

	}


	@media (max-width: 780px) {

		.grid,
		.grid.has-side {
			grid-template-columns:
				minmax(0,1fr);
		}


		.grid > section {
			min-height: auto;
		}


		.grid > section + section,
		.grid.has-side > section:last-child {
			grid-column: auto;

			padding:
				20px 0 0 !important;

			border-left: 0 !important;

			border-top:
				1px solid
				var(--border) !important;
		}


		.panel--scroll {
			max-height: 500px;
		}


		.title {
			font-size: 2.15rem;
		}

	}
</style>
