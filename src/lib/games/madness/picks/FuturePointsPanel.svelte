<script>
  export let futurePoints = null;
  export let compact = false;

  $: cards = futurePoints
    ? [
        { label: 'Max Left', value: futurePoints.maxLeft, sub: 'best-case ceiling' },
        { label: 'Alive Value', value: futurePoints.aliveValue, sub: 'live upside still in play', accent: true },
        { label: 'Dead Value', value: futurePoints.deadValueLost, sub: 'already burned off the card' },
        { label: 'Title Equity', value: futurePoints.titleEquity, sub: 'needs a title-game push' }
      ]
    : [];
</script>

{#if futurePoints}
  <div class:compact class="fp-panel">
    <div class="fp-grid">
      {#each cards as card}
        <div class:accent={card.accent} class="fp-card">
          <div class="fp-label">{card.label}</div>
          <div class="fp-value">{card.value}</div>
          <div class="fp-sub">{card.sub}</div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .fp-panel {
    display: grid;
    gap: 10px;
  }

  .fp-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .fp-card {
    border: 1px solid rgba(255,255,255,0.08);
    background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.025));
    border-radius: 16px;
    padding: 14px;
    min-width: 0;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
  }

  .fp-card.accent {
    border-color: rgba(214,177,94,0.24);
    background: linear-gradient(180deg, rgba(214,177,94,0.11), rgba(214,177,94,0.06));
    box-shadow: 0 10px 24px rgba(214,177,94,0.08), inset 0 1px 0 rgba(255,255,255,0.04);
  }

  .fp-label {
    font-size: 0.76rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.66;
  }

  .fp-value {
    margin-top: 7px;
    font-size: 1.55rem;
    font-weight: 900;
    line-height: 1;
  }

  .fp-sub {
    margin-top: 7px;
    opacity: 0.74;
    font-size: 0.84rem;
    line-height: 1.3;
  }

  .compact .fp-card {
    padding: 13px;
  }

  .compact .fp-value {
    font-size: 1.35rem;
  }

  @media (max-width: 980px) {
    .fp-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 560px) {
    .fp-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
