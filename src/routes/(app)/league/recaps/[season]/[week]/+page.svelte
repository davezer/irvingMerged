<script>
  import WeeklyRecapArticle
    from '$lib/components/league/WeeklyRecapArticle.svelte';

  export let data;

  $: published =
    data.published;

  $: recap =
    published?.recap ||
    null;
</script>

<svelte:head>
  <title>
    {recap?.title || `Week ${published?.week} Recap`} | Irving Championship League
  </title>

  {#if recap?.subtitle}
    <meta
      name="description"
      content={recap.subtitle}
    />
  {/if}
</svelte:head>

<div class="public-recap-page">
  <div class="recap-nav">
    <a href="/league/recaps">
      ← The Irving Weekly
    </a>

    <div>
      {published.season}
      ·
      Week {published.week}
    </div>
  </div>

  <WeeklyRecapArticle
    {recap}
  />
</div>

<style>
  .public-recap-page {
    display: grid;
    gap: 14px;
    max-width: 1180px;
    margin: 0 auto;
    padding-bottom: 54px;
  }

  .recap-nav {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    padding: 4px 2px;
    color: var(--muted);
    font-family: var(--font-score);
    font-size: .72rem;
    font-weight: 900;
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .recap-nav a {
    color: #67dbe8;
    text-decoration: none;
  }

  .recap-nav a:hover {
    text-decoration: underline;
  }

  @media (max-width: 600px) {
    .recap-nav {
      display: grid;
    }
  }
</style>