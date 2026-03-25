<script>
  export let title = 'Rules';
  export let defaultOpen = false;
  export let compact = true;

  let open = defaultOpen;
</script>

<div class={"rules " + (compact ? 'rules--compact' : '')}>
  <button
    class={"rules__toggle " + (open ? 'is-open' : '')}
    type="button"
    aria-expanded={open}
    on:click={() => (open = !open)}
  >
    <span class="rules__label">{title}</span>
    <span class="rules__chev" aria-hidden="true">{open ? '▾' : '▸'}</span>
  </button>

  {#if open}
    <div class="rules__body" role="region" aria-label={title}>
      <slot />
    </div>
  {/if}
</div>

<style>
 .rules{
  width: 100%;
  box-sizing: border-box;

  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.16);
  overflow: hidden;
}


.rules--compact{
  border-radius: 18px;
}


  .rules__toggle{
    width: 100%;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap: 10px;

    padding: 12px 14px;
    border: 0;
    cursor: pointer;

    background:
      radial-gradient(120% 140% at 20% 10%, rgba(255,255,255,0.05), transparent 55%),
      rgba(0,0,0,0.14);
    color: rgba(255,255,255,0.92);

    font-weight: 900;
    letter-spacing: 0.02em;

    transition: background 160ms ease, transform 140ms ease, box-shadow 160ms ease;
  }

  .rules__toggle:hover{
    background:
      radial-gradient(120% 140% at 20% 10%, rgba(212,175,55,0.09), transparent 55%),
      rgba(0,0,0,0.16);
  }

  .rules__toggle:active{
    transform: translateY(1px);
  }

  .rules__toggle:focus-visible{
    outline: none;
    box-shadow: 0 0 0 3px rgba(212,175,55,0.16);
  }

  .rules__chev{
    opacity: 0.9;
    font-size: 16px;
    transform: translateY(-1px);
  }

.rules__body{
  padding: 12px 14px 20px; /* 👈 extra bottom pad */
  border-top: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.82);
}

  /* typography inside slot */
  .rules__body :global(h4){
    margin: 10px 0 6px;
    font-size: 0.95rem;
    font-weight: 950;
    color: rgba(245,213,138,0.95);
  }

  .rules__body :global(p){
    margin: 0 0 10px;
    line-height: 1.45;
  }

  .rules__body :global(ul){
    margin: 0 0 10px 18px;
    padding: 0;
    line-height: 1.45;
  }

  .rules__body :global(li){
    margin: 6px 0;
  }

  .rules__body :global(code){
    padding: 2px 6px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.04);
    font-weight: 800;
  }
</style>
