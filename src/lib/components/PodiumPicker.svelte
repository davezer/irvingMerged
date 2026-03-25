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
  /* === GRID LAYOUT === */
  .grid {
    display: grid;
    gap: 16px;
    margin-top: 14px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: stretch;
    width: 100%;
  }

  .grid.has-side {
    grid-template-columns: 1.1fr 1.1fr 0.9fr;
  }

  .grid > section {
    min-width: 0;
    display: flex;
    flex-direction: column;
    min-height: 560px;
  }

  /* === HEADER === */
  .head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
    min-width: 0;
    flex: 0 0 auto;
  }

  .head-left {
    min-width: 0;
  }

  .title {
    margin: 2px 0 0 0;
    font-family: ui-serif, "Iowan Old Style", "Palatino Linotype", Palatino, Garamond, Georgia, serif;
    letter-spacing: 0.3px;
    font-size: 18px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .head-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    flex: 0 0 auto;
  }

  .actions-row {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  /* === PANEL === */
  .panel {
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 14px;
    overflow: hidden;
    background: rgba(0,0,0,0.22);
    flex: 1 1 auto;
    min-height: 0;
  }
.panel--scroll {
  overflow-y: auto;
}

/* About ~15 rows tall (tweak the number if you want) */
.panel--scroll {
  max-height: calc(15 * 52px); /* ~52px per row incl border */
}

/* Smooth scrolling + looks nicer */
.panel--scroll {
  overscroll-behavior: contain;
  scrollbar-gutter: stable both-edges;
}

.panel--scroll::-webkit-scrollbar {
  width: 10px;
}
.panel--scroll::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.12);
  border-radius: 999px;
}
.panel--scroll::-webkit-scrollbar-track {
  background: transparent;
}

section:nth-of-type(2) .panel--scroll {
  max-height: calc(15 * 52px);
}
  /* === ROWS === */
  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 10px 10px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    min-width: 0;
  }
  .row:last-child { border-bottom: none; }

  .row--selected {
    background: linear-gradient(180deg, rgba(214,177,94,0.10), rgba(255,255,255,0.02));
  }

  .row-left {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .name {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rank {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 999px;
    border: 1px solid rgba(214,177,94,0.35);
    background: rgba(214,177,94,0.10);
    color: #f5d58a;
    font-weight: 800;
    flex: 0 0 auto;
  }

  .meta {
    font-size: 12px;
    opacity: 0.65;
  }

  .controls {
    display: flex;
    gap: 8px;
    align-items: center;
    flex: 0 0 auto;
  }

  .empty {
    padding: 14px;
    opacity: 0.65;
  }

  .foot {
    flex: 0 0 auto;
    padding-bottom: 9px;
  }

  .statusline {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid rgba(255,255,255,0.08);
    opacity: 0.9;
    flex: 0 0 auto;
  }

  .input {
    margin-bottom: 12px;
  }

  :global(.btn) {
    padding: 10px 12px;
    border-radius: 12px;
    min-width: 42px;
    line-height: 1;
  }

  :global(.pill) {
    height: 30px;
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
  }

  @media (max-width: 1100px) {
    .grid.has-side {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 780px) {
    .grid,
    .grid.has-side {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
