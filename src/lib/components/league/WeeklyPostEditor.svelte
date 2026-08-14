<script>
  import {
    renderWeeklyMarkdown
  } from '$lib/weeklyMarkdown.js';

  export let post = null;
  export let user = null;
  export let isNew = false;
  export let message = null;

  let title =
    post?.title ||
    '';

  let subtitle =
    post?.subtitle ||
    '';

  let excerpt =
    post?.excerpt ||
    '';

  let slug =
    post?.slug ||
    '';

  let postType =
    post?.postType ||
    'feature';

  let authorName =
    post?.authorName ||
    user?.displayName ||
    '';

  let body =
    post?.body ||
    '';

  $: previewHtml =
    renderWeeklyMarkdown(
      body
    );
</script>

<div class="editor-shell">
  <div class="editor-top">
    <div>
      <div class="eyebrow">
        The Irving Weekly
      </div>

      <h1>
        {isNew
          ? 'New Article'
          : 'Edit Article'}
      </h1>
    </div>

    {#if post}
      <div
        class="status"
        class:published={post.status === 'published'}
      >
        {post.status}
      </div>
    {/if}
  </div>

  {#if message}
    <div class="message">
      {message}
    </div>
  {/if}

  <form
    method="POST"
    action={isNew
      ? '?/create'
      : '?/save'}
  >
    <div class="meta-grid">
      <label class="wide">
        <span>
          Title
        </span>

        <input
          name="title"
          bind:value={title}
          required
          placeholder="The Trade Deadline Is Going to Get Stupid"
        />
      </label>

      <label class="wide">
        <span>
          Subtitle
        </span>

        <input
          name="subtitle"
          bind:value={subtitle}
          placeholder="Seven contenders, too much draft money..."
        />
      </label>

      <label>
        <span>
          Article Type
        </span>

        <select
          name="postType"
          bind:value={postType}
        >
          <option value="feature">
            Feature
          </option>

          <option value="commissioner">
            Commissioner
          </option>

          <option value="league_news">
            League News
          </option>

          <option value="power_rankings">
            Power Rankings
          </option>

          <option value="announcement">
            Announcement
          </option>

          <option value="opinion">
            Opinion
          </option>
        </select>
      </label>

      <label>
        <span>
          Author
        </span>

        <input
          name="authorName"
          bind:value={authorName}
        />
      </label>

      <label class="wide">
        <span>
          URL Slug
        </span>

        <input
          name="slug"
          bind:value={slug}
          placeholder="Leave blank to generate from title"
        />
      </label>

      <label class="wide">
        <span>
          Card Excerpt
        </span>

        <textarea
          name="excerpt"
          class="excerpt"
          bind:value={excerpt}
          rows="3"
          placeholder="Short description shown on The Irving Weekly front page."
        ></textarea>
      </label>
    </div>

    <div class="writing-grid">
      <div class="writing-pane">
        <div class="pane-label">
          Article
        </div>

        <textarea
          name="body"
          class="article-editor"
          bind:value={body}
          placeholder={`## Buyers

**Dunedin Homers** have decided tomorrow is somebody else's problem.

- Christian McCaffrey
- $75 of draft capital
- absolutely no fear`}
        ></textarea>
      </div>

      <div class="preview-pane">
        <div class="pane-label">
          Live Preview
        </div>

        <article class="markdown-preview">
          {#if title}
            <h1>
              {title}
            </h1>
          {/if}

          {#if subtitle}
            <p class="subtitle">
              {subtitle}
            </p>
          {/if}

          <div class="byline">
            {authorName || 'The Irving Weekly'}
          </div>

          <div class="markdown-body">
            {@html previewHtml}
          </div>
        </article>
      </div>
    </div>

    <div class="actions">
      {#if isNew}
        <button
          type="submit"
          class="save"
        >
          Save Draft
        </button>
      {:else}
        <button
          type="submit"
          formaction="?/save"
          class="save"
        >
          Save Draft
        </button>

        <button
          type="submit"
          formaction="?/publish"
          class="publish"
        >
          {post?.status === 'published'
            ? 'Update Published Article'
            : 'Publish'}
        </button>

        {#if post?.status === 'published'}
          <button
            type="submit"
            formaction="?/unpublish"
            class="unpublish"
          >
            Unpublish
          </button>
        {/if}
      {/if}
    </div>
  </form>
</div>

<style>
  .editor-shell {
    display: grid;
    gap: 18px;
    max-width: 1500px;
    margin: 0 auto;
    padding-bottom: 50px;
  }

  .editor-top {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: center;
  }

  .eyebrow,
  label span,
  .pane-label {
    color: var(--bug-yellow);
    font-family: var(--font-score);
    font-size: .68rem;
    font-weight: 950;
    letter-spacing: .13em;
    text-transform: uppercase;
  }

  h1 {
    margin: 5px 0 0;
    font-family: var(--font-display);
    font-size: clamp(2.5rem, 5vw, 4rem);
  }

  .status {
    padding: 7px 11px;
    border: 1px solid rgba(255,255,255,.2);
    border-radius: 999px;
    color: #efc86a;
    font-family: var(--font-score);
    font-weight: 950;
    text-transform: uppercase;
  }

  .status.published {
    color: #7ee59a;
  }

  .message {
    padding: 12px;
    border: 1px solid rgba(126,229,154,.35);
    border-radius: 9px;
    background: rgba(126,229,154,.06);
  }

  form {
    display: grid;
    gap: 18px;
  }

  .meta-grid {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 12px;
    padding: 18px;
    border: 2px solid #070808;
    border-radius: 14px;
    background:
      linear-gradient(
        180deg,
        var(--bug-gray),
        var(--bug-charcoal)
      );
  }

  label {
    display: grid;
    gap: 7px;
  }

  .wide {
    grid-column: 1 / -1;
  }

  input,
  select,
  textarea {
    width: 100%;
    box-sizing: border-box;
    border: 2px solid #070808;
    border-radius: 8px;
    padding: 10px 12px;
    background: #efeee5;
    color: #111;
    font: inherit;
  }

  input,
  select {
    min-height: 44px;
  }

  .excerpt {
    resize: vertical;
  }

  .writing-grid {
    display: grid;
    grid-template-columns:
      minmax(0, 1fr)
      minmax(0, 1fr);
    gap: 14px;
  }

  .writing-pane,
  .preview-pane {
    overflow: hidden;
    border: 2px solid #070808;
    border-radius: 14px;
    background: #111514;
  }

  .pane-label {
    padding: 11px 14px;
    border-bottom:
      1px solid rgba(255,255,255,.12);
    background:
      linear-gradient(
        180deg,
        #3b4240,
        #242927
      );
  }

  .article-editor {
    min-height: 720px;
    border: 0;
    border-radius: 0;
    padding: 18px;
    background: #0c0f0e;
    color: #f4f0e7;
    font-family:
      Consolas,
      Monaco,
      monospace;
    line-height: 1.6;
    resize: vertical;
  }

  .preview-pane {
    overflow-y: auto;
  }

  .markdown-preview {
    padding: 26px;
  }

  .markdown-preview h1 {
    font-size:
      clamp(2rem, 4vw, 3.4rem);
    line-height: .98;
  }

  .subtitle {
    margin: 12px 0 0;
    color: var(--muted);
    font-size: 1.05rem;
    line-height: 1.45;
  }

  .byline {
    margin-top: 18px;
    color: #67dbe8;
    font-family: var(--font-score);
    font-size: .72rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  :global(.markdown-body) {
    margin-top: 24px;
  }

  :global(.markdown-body h2) {
    margin: 30px 0 10px;
    font-size: 1.7rem;
  }

  :global(.markdown-body h3) {
    margin: 24px 0 8px;
    font-size: 1.3rem;
  }

  :global(.markdown-body p),
  :global(.markdown-body li),
  :global(.markdown-body blockquote) {
    line-height: 1.7;
  }

  :global(.markdown-body blockquote) {
    margin-left: 0;
    padding-left: 16px;
    border-left:
      4px solid var(--bug-yellow);
    color: #ddd8ce;
  }

  :global(.markdown-body a) {
    color: #67dbe8;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  button {
    min-height: 44px;
    border: 2px solid #070808;
    border-radius: 8px;
    padding: 0 18px;
    font-family: var(--font-score);
    font-weight: 950;
    text-transform: uppercase;
    cursor: pointer;
  }

  .save {
    background:
      linear-gradient(
        180deg,
        #f4dc7b,
        #d7a62e
      );
  }

  .publish {
    background:
      linear-gradient(
        180deg,
        #83df9d,
        #329759
      );
  }

  .unpublish {
    background:
      linear-gradient(
        180deg,
        #e88989,
        #a43f3f
      );
  }

  @media (max-width: 950px) {
    .writing-grid,
    .meta-grid {
      grid-template-columns: 1fr;
    }

    .wide {
      grid-column: auto;
    }
  }
</style>