<script>
  export let data;

  function dateLabel(
    post
  ) {
    const value =
      post.publishedAt ||
      (
        post.updatedAt
          ? new Date(
              post.updatedAt *
              1000
            ).toISOString()
          : null
      );

    if (!value) {
      return '—';
    }

    return new Date(
      value
    ).toLocaleString();
  }
</script>

<div class="weekly-admin">
  <header class="hero">
    <div>
      <div class="eyebrow">
        League Media
      </div>

      <h1>
        The Irving Weekly
      </h1>

      <p>
        AI recaps, commissioner notes, league news,
        power rankings, features, and other nonsense.
      </p>
    </div>

    <a
      class="new-button"
      href="/admin/league/irving-weekly/new"
    >
      + New Article
    </a>
  </header>

  <section class="post-list">
    {#if data.posts.length}
      {#each data.posts as post}
        <article class="post-row">
          <div class="post-main">
            <div class="meta">
              <span class:published={post.status === 'published'}>
                {post.status}
              </span>

              <span>
                {post.sourceType === 'weekly_recap'
                  ? `Week ${post.recapWeek} Recap`
                  : post.postType.replaceAll('_', ' ')}
              </span>
            </div>

            <h2>
              {post.title}
            </h2>

            {#if post.subtitle}
              <p>
                {post.subtitle}
              </p>
            {/if}

            <small>
              {dateLabel(post)}
            </small>
          </div>

          <div class="post-actions">
            {#if post.sourceType === 'manual'}
              <a
                href={`/admin/league/irving-weekly/${post.id}`}
              >
                Edit
              </a>
            {:else}
              <a
                href={`/admin/league/weekly-recap?season=${post.recapSeason}&week=${post.recapWeek}`}
              >
                Recap Lab
              </a>
            {/if}
          </div>
        </article>
      {/each}
    {:else}
      <div class="empty">
        No Irving Weekly posts yet.
      </div>
    {/if}
  </section>
</div>

<style>
  .weekly-admin {
    display: grid;
    gap: 18px;
    max-width: 1200px;
    margin: 0 auto;
    padding-bottom: 50px;
  }

  .hero {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: center;
    padding: 22px;
    border: 2px solid #070808;
    border-radius: 16px;
    background:
      linear-gradient(
        180deg,
        var(--bug-gray),
        var(--bug-charcoal)
      );
  }

  .eyebrow,
  .meta {
    color: var(--bug-yellow);
    font-family: var(--font-score);
    font-size: .68rem;
    font-weight: 950;
    letter-spacing: .12em;
    text-transform: uppercase;
  }

  h1 {
    margin: 6px 0 0;
    font-family: var(--font-display);
    font-size: clamp(2.6rem, 6vw, 4.4rem);
  }

  .hero p {
    margin: 8px 0 0;
    color: var(--muted);
  }

  .new-button,
  .post-actions a {
    color: inherit;
    text-decoration: none;
  }

  .new-button {
    padding: 12px 16px;
    border: 2px solid #070808;
    border-radius: 8px;
    background:
      linear-gradient(
        180deg,
        #83df9d,
        #329759
      );
    color: #07120a;
    font-family: var(--font-score);
    font-weight: 950;
    text-transform: uppercase;
  }

  .post-list {
    display: grid;
    gap: 10px;
  }

  .post-row {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    padding: 18px;
    border: 2px solid #070808;
    border-radius: 12px;
    background:
      linear-gradient(
        180deg,
        #303735,
        #141716
      );
  }

  .post-main {
    display: grid;
    gap: 6px;
  }

  .meta {
    display: flex;
    gap: 12px;
  }

  .meta .published {
    color: #7ee59a;
  }

  .post-row h2,
  .post-row p {
    margin: 0;
  }

  .post-row p,
  .post-row small {
    color: var(--muted);
  }

  .post-actions {
    display: flex;
    align-items: center;
  }

  .post-actions a {
    padding: 8px 12px;
    border:
      1px solid rgba(255,255,255,.2);
    border-radius: 7px;
    color: #67dbe8;
    font-family: var(--font-score);
    font-weight: 900;
    text-transform: uppercase;
  }

  .empty {
    padding: 24px;
    color: var(--muted);
  }

  @media (max-width: 700px) {
    .hero,
    .post-row {
      display: grid;
    }
  }
</style>