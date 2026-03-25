<script>
  export let data;
</script>

<article class="card article">
  <div class="tag">{data.post.tag}</div>
  <h1>{data.post.title}</h1>
  <div class="meta">{data.post.publishedAt} · {data.post.readTime}</div>
  <p class="lede">{data.post.excerpt}</p>
  <div class="body">
    {#each data.post.body as paragraph}
      <p>{paragraph}</p>
    {/each}
  </div>
  <a class="back" href="/news">Back to news</a>
</article>

<style>
  .card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:28px;max-width:860px}
  .article{display:grid;gap:14px}.tag{display:inline-flex;width:fit-content;padding:5px 10px;border-radius:999px;background:rgba(214,177,94,.14);color:#d6b15e;font-size:12px}
  .meta,.lede,.body p{color:rgba(255,255,255,.74)}.body{display:grid;gap:10px;line-height:1.75}
  .back{color:#d6b15e;text-decoration:none;margin-top:12px}
</style>
