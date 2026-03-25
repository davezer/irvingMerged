<script>
  import { getAdminResultsComponent } from '$lib/games/adminResults/index.js';
  import { eventDisplay } from '$lib/events/displayNames';

  export let data;

  $: event = data?.event;
  $: names = eventDisplay(event);
  $: Admin = getAdminResultsComponent(event?.type);

  // show reset only when we actually have an event loaded
  $: canReset = !!event?.id;
</script>

<div class="page-wide">
  <div class="card card--glow">
    <div class="kicker">Admin</div>
    <div class="section-head">
      <div>
        <div class="h2" style="margin:0;">Results</div>
        <div class="muted" style="margin-top:6px;">
          {names.title}{#if names.subtitle} · {names.subtitle}{/if}
        </div>
      </div>

      <div class="head-right">
        {#if event?.type}
          <span class="pill">Type: {event.type}</span>
        {/if}
      </div>
    </div>
  </div>
</div>

<div class="spacer"></div>

{#if !Admin}
  <div class="page-wide">
    <div class="card">
      <div class="section-head">
        <h2 class="h2">Not wired</h2>
        <span class="pill">Unsupported</span>
      </div>
      <p class="subtle" style="margin-top: 10px;">
        No AdminResults component registered for <code>{event?.type}</code>.
      </p>
    </div>
  </div>
{:else}
  <div class="page-wide">
    <svelte:component this={Admin} {data} />

    {#if canReset}
      <div class="danger card card--glow">
        <div class="danger-head">
          <div>
            <div class="danger-title">Danger Zone</div>
            <div class="muted small">
              Reset wipes every entry + score for this event. Use when you want to start fresh.
            </div>
          </div>

          <form method="POST" action="?/resetEntries" class="danger-form">
            <input type="hidden" name="confirm" value="RESET" />

            <button
              type="submit"
              class="btn btn--danger"
              on:click={(e) => {
                if (
                  !confirm(
                    `Reset ALL entries for "${names.title}"?\n\nThis deletes every entry + score for this event.\nYou cannot undo this.`
                  )
                ) {
                  e.preventDefault();
                }
              }}
            >
              Reset All Entries
            </button>
          </form>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
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

  .spacer { height: 16px; }

  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  }

  .head-right{
    display:flex;
    align-items:center;
    gap:10px;
  }

  /* Danger zone */
  .danger{
    margin-top: 14px;
    padding: 14px;
    border: 1px solid rgba(255,120,120,0.18);
    background: rgba(255,120,120,0.04);
  }

  .danger-head{
    display:flex;
    align-items:center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .danger-title{
    font-weight: 950;
    letter-spacing: 0.02em;
  }

  .danger-form{ margin: 0; }

  .btn--danger{
    border: 1px solid rgba(255,120,120,0.28);
    background: rgba(255,120,120,0.08);
    color: rgba(255,235,235,0.98);
    border-radius: 12px;
    padding: 10px 14px;
    font-weight: 950;
  }
  .btn--danger:hover{
    background: rgba(255,120,120,0.12);
  }
</style>
