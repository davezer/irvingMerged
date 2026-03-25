<script>
  export let fatePath = null;

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }
</script>

{#if fatePath}
  <div class="fate-card">
    <div class="fate-head">
      <div>
        <div class="fate-title">Path to Win</div>
        <!-- <div class="fate-summary">{fatePath.summary}</div> -->
      </div>
    </div>

    <div class="fate-lanes">
      <div class="fate-lane">
        <div class="fate-label">Needs</div>
        <div class="fate-chips">
          {#if asArray(fatePath.needs).length}
            {#each fatePath.needs as item}
              <div class="fate-chip">{item}</div>
            {/each}
          {:else}
            <div class="fate-empty">No clean edge yet.</div>
          {/if}
        </div>
      </div>

      <div class="fate-lane fate-lane--danger">
        <div class="fate-label">Danger</div>
        <div class="fate-chips">
          {#if asArray(fatePath.danger).length}
            {#each fatePath.danger as item}
              <div class="fate-chip fate-chip--danger">{item}</div>
            {/each}
          {:else}
            <div class="fate-empty">No obvious death blow yet.</div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .fate-card {
    border: 1px solid rgba(255,255,255,0.08);
    background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.025));
    border-radius: 16px;
    padding: 14px;
    display: grid;
    gap: 12px;
  }

  .fate-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: start;
  }

  .fate-title,
  .fate-label {
    font-size: 0.76rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.66;
  }

  .fate-summary {
    margin-top: 5px;
    font-size: 1rem;
    font-weight: 900;
    line-height: 1.25;
  }

  .fate-lanes {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .fate-lane {
    border: 1px solid rgba(255,255,255,0.06);
    background: rgba(0,0,0,0.18);
    border-radius: 14px;
    padding: 12px;
    display: grid;
    gap: 10px;
  }

  .fate-lane--danger {
    border-color: rgba(191, 78, 78, 0.24);
    background: rgba(191, 78, 78, 0.07);
  }

  .fate-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .fate-chip {
    display: inline-flex;
    align-items: center;
    min-height: 34px;
    padding: 8px 11px;
    border-radius: 999px;
    border: 1px solid rgba(49, 163, 112, 0.22);
    background: rgba(49, 163, 112, 0.08);
    font-size: 0.9rem;
    line-height: 1.25;
  }
  

  .fate-chip--danger {
    border-color: rgba(191, 78, 78, 0.28);
    background: rgba(191, 78, 78, 0.09);
  }

  .fate-empty {
    opacity: 0.72;
    font-size: 0.9rem;
    line-height: 1.35;
  }

  @media (max-width: 760px) {
    .fate-lanes {
      grid-template-columns: 1fr;
    }
  }
</style>
