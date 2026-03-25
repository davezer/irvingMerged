<script>
  import { onMount } from 'svelte';

  export let title = '';
  export let subtitle = '';
  export let right = '';          // optional (pill/badge text)
  export let rules = null;        // ✅ { title, sections:[{heading, bullets:[]}] } or null

  let rulesOpen = false;

  function openRules() {
    rulesOpen = true;
  }
  function closeRules() {
    rulesOpen = false;
  }

  function onKey(e) {
    if (e.key === 'Escape') closeRules();
  }

  onMount(() => {
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });
</script>

<div class="section-head">
  <div class="left">
    <h2 class="h2">{title}</h2>
    {#if subtitle}
      <div class="sub">{subtitle}</div>
    {/if}
  </div>

  <div class="right">
    {#if rules}
      <button class="btn btn--rules" type="button" on:click={openRules}>
        Rules
      </button>
    {/if}

    {#if right}
      <span class="pill">{right}</span>
    {/if}

    <slot name="right" />
  </div>
</div>

{#if rulesOpen && rules}
  <!-- Backdrop -->
  <div class="modal-backdrop" on:click={closeRules} aria-hidden="true"></div>

  <!-- Modal -->
  <div class="modal" role="dialog" aria-modal="true" aria-label={rules.title || 'Rules'}>
    <div class="modal-card" on:click|stopPropagation>
      <div class="modal-top">
        <div class="modal-title">{rules.title || 'Rules'}</div>
        <button class="icon-btn" type="button" aria-label="Close" on:click={closeRules}>✕</button>
      </div>

      <div class="modal-body">
        {#each rules.sections || [] as s}
          <div class="rule-section">
            {#if s.heading}<div class="rule-h">{s.heading}</div>{/if}
            {#if s.text}<div class="rule-p">{s.text}</div>{/if}
            {#if s.bullets?.length}
              <ul class="rule-ul">
                {#each s.bullets as b}
                  <li>{b}</li>
                {/each}
              </ul>
            {/if}
          </div>
        {/each}
      </div>

      <div class="modal-actions">
        <button class="btn btn--ghost" type="button" on:click={closeRules}>Close</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .section-head{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap: 3px;
    flex-wrap:wrap;
    padding-bottom: 4px;
  }

  .left{ display:grid; gap:4px; }
  .h2{ margin:0; font-size:1.25rem; font-weight:950; }
  .sub{ opacity:0.7; }

  .right{
    display:flex;
    gap:10px;
    align-items:center;
    justify-content:flex-end;
  }

  .pill{
    display:inline-flex;
    align-items:center;
    height:28px;
    padding:0 12px;
    border-radius:999px;
    border:1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.04);
    opacity:0.9;
    font-weight:800;
  }

  .btn{
    appearance:none;
    border:1px solid rgba(255,255,255,0.14);
    background: transparent;
    color: rgba(255,255,255,0.92);
    padding: 10px 12px;
    border-radius: 12px;
    cursor:pointer;
    font-weight: 850;
    transition: border-color 140ms ease, background 140ms ease, transform 120ms ease;
  }

  .btn:hover{
    border-color: rgba(214,177,94,0.35);
    background: rgba(214,177,94,0.08);
  }

  .btn:active{ transform: translateY(1px); }

  .btn--rules{
    border-color: rgba(212,175,55,0.22);
    background: rgba(212,175,55,0.06);
  }

  .btn--rules:hover{
    border-color: rgba(212,175,55,0.35);
    background: rgba(212,175,55,0.10);
  }

  .btn--ghost{ background: transparent; }

  /* Modal */
.modal-backdrop{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(6px);
  z-index: 90;
}

.modal{
  position: fixed;
  inset: 0;
  z-index: 100;                    /* above backdrop */
  display: grid;
  place-items: center;
  padding: 16px;                   /* keeps it off screen edges */
  box-sizing: border-box;
}

.modal-card{
  width: min(860px, 100%);
  max-height: min(82vh, 720px);
  display: flex;
  flex-direction: column;

  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.78);
  box-shadow: 0 18px 70px rgba(0,0,0,0.55);

  overflow: hidden;                /* ✅ prevents bottom clipping behind rounded corners */
}


.modal-top{
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}


  .modal-title{
    font-weight: 950;
    font-size: 1.05rem;
    letter-spacing: 0.02em;
    color: rgba(245,213,138,0.95);
  }

.icon-btn{
  width: 38px;
  height: 38px;
  min-width: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
}

  .icon-btn:hover{
    border-color: rgba(212,175,55,0.30);
    background: rgba(212,175,55,0.08);
  }

  .modal-body{
    padding: 14px 16px 16px;
    overflow: auto;
    max-height: calc(min(80vh, 720px) - 120px);
    color: rgba(255,255,255,0.86);
  }

  .rule-section{ margin-bottom: 14px; }

  .rule-h{
    font-weight: 950;
    margin-bottom: 6px;
    color: rgba(245,213,138,0.95);
  }

  .rule-p{ opacity: 0.85; line-height: 1.45; margin: 0 0 8px; }

  .rule-ul{
    margin: 0 0 0 18px;
    padding: 0;
    line-height: 1.45;
  }
  .rule-ul li{ margin: 6px 0; }

.modal-actions{
  padding: 12px 16px;
  border-top: 1px solid rgba(255,255,255,0.08);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

  /* Force consistent typography inside the rules modal */


.modal-body {
  font-size: 14px;         /* pick your default */
  line-height: 1.5;
}

/* Normalize any headings that may appear (if rules contain HTML headings) */
.modal-body h1,
.modal-body h2,
.modal-body h3,
.modal-body h4 {
  font-family: inherit;
  font-size: 14px;         /* or slightly bigger if you want */
  font-weight: 950;
  margin: 12px 0 8px;
  color: rgba(245,213,138,0.95);
}

/* Normalize paragraphs/lists too */
.modal-body p {
  margin: 0 0 10px;
  font-size: inherit;
}

.modal-body ul,
.modal-body ol {
  margin: 0 0 12px 18px;
  padding: 0;
  font-size: inherit;
}

.modal-card{
  display: flex;
  flex-direction: column;
  width: min(760px, 100%);
  max-height: min(80vh, 720px);
  overflow: hidden;              /* keep rounded corners clean */
}

/* header + footer don't scroll */
.modal-top,
.modal-actions{
  flex: 0 0 auto;
}


/* body scrolls */
.modal-body{
  flex: 1 1 auto;
  min-height: 0;                   /* ✅ CRITICAL: allows scroll area to shrink */
  overflow: auto;
  padding: 14px 16px 18px;
}


</style>
