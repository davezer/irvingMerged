<script>
  import { enhance } from '$app/forms';

  export let publishedAt = null;
  export let label = 'Unpublish Results';

  let busy = false;
  let errorMsg = '';

  $: isPublished =
    publishedAt !== null && publishedAt !== undefined && String(publishedAt).length > 0;

  function confirmUnpublish() {
    return confirm(
      `Unpublish results?\n\nThis will:\n• Set results_published_at back to NULL\n• Delete all entry_scores for this event\n\nYou can republish later.`
    );
  }
</script>

<form
  method="POST"
  action="?/unpublish"
  use:enhance={() => {
    busy = true;
    errorMsg = '';
    return async ({ result, update }) => {
      await update({ reset: false });
      busy = false;

      if (result?.type === 'failure') {
        errorMsg = result.data?.error || 'Unpublish failed.';
      } else if (result?.type === 'error') {
        errorMsg = 'Unpublish failed.';
      }
    };
  }}
  on:submit={(e) => {
    if (!confirmUnpublish()) e.preventDefault();
  }}
>
  <button class="btn btn--danger" type="submit" disabled={!isPublished || busy}>
    {busy ? 'Unpublishing…' : label}
  </button>

  {#if errorMsg}
    <div class="muted" style="margin-top:8px; color: rgba(255,120,120,0.95);">
      {errorMsg}
    </div>
  {/if}
</form>
