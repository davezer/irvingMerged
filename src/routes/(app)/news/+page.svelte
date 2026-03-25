<script>
  export let data;
  const [lead, ...rest] = data.posts;
</script>

<div class="page-stack">
  <div>
    <div class="eyebrow">News</div>
    <h1>Lounge desk</h1>
    <p class="lede">League pulse, product moves, rivalry smoke, and everything else worth reading with a drink in hand.</p>
  </div>

  {#if lead}
    <a class="lead-card" href={'/news/' + lead.slug}>
      <div class="tag">{lead.tag}</div>
      <h2>{lead.title}</h2>
      <p>{lead.excerpt}</p>
      <div class="meta">{lead.publishedAt} · {lead.readTime}</div>
    </a>
  {/if}

  <div class="stack">
    {#each rest as post}
      <a class="card" href={'/news/' + post.slug}>
        <div class="row-head">
          <div class="tag">{post.tag}</div>
          <small>{post.publishedAt}</small>
        </div>
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
      </a>
    {/each}
  </div>
</div>

<style>
  .page-stack,.stack{display:grid;gap:18px}.eyebrow{text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#d6b15e}
  .lede{max-width:64ch;color:rgba(255,255,255,.72)}
  .lead-card,.card{text-decoration:none;color:inherit;background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:24px}
  .lead-card h2{margin:.5rem 0}.card p,.lead-card p{color:rgba(255,255,255,.7)}
  .row-head{display:flex;justify-content:space-between;gap:12px;align-items:center}
  .tag{display:inline-flex;width:fit-content;padding:5px 10px;border-radius:999px;background:rgba(214,177,94,.14);color:#d6b15e;font-size:12px}
  .meta,small{color:rgba(255,255,255,.6)}
</style>
