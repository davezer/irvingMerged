
<script>
  export let data;
  const { stats, standings, managers, posts } = data;
</script>

<svelte:head>
  <title>Irving Collective Lounge</title>
</svelte:head>

<div class="lounge-home">
  <section class="hero card">
    <div>
      <div class="eyebrow">Gentleman Only • The Irving Gentleman</div>
      <h1>One private clubhouse for league history, offseason games, and prestige.</h1>
      <p class="lede">The New Home For Fantasy Football and Offseason Fun</p>
      <div class="actions">
        <a class="btn btn--vip" href="/league">Enter League HQ</a>
        <a class="btn btn--ghost" href="/games">Open The Offseason Games Floor</a>
      </div>
    </div>
    <div class="hero-side">
      <div class="stat-card">
        <span>Managers</span>
        <strong>{stats.totalManagers}</strong>
      </div>
      <div class="stat-card">
        <span>Recorded matchups</span>
        <strong>{stats.totalGames}</strong>
      </div>
      <div class="stat-card">
        <span>Top seed</span>
        <strong>{stats.topSeed?.teamName}</strong>
        <small>{stats.topSeed?.wins}-{stats.topSeed?.losses}</small>
      </div>
    </div>
  </section>

  <section class="grid two-up">
    <div class="card">
      <div class="section-head">
        <div>
          <div class="eyebrow">Standings</div>
          <h2>Current board</h2>
        </div>
        <a href="/league/standings">View all</a>
      </div>
      <div class="table-list">
        {#each standings as row}
          <a class="table-row" href={'/league/managers/' + row.slug}>
            <span class="rank">#{row.rank}</span>
            <span class="name">{row.teamName}</span>
            <span class="record">{row.wins}-{row.losses}</span>
          </a>
        {/each}
      </div>
    </div>

    <div class="card">
      <div class="section-head">
        <div>
          <div class="eyebrow">Managers</div>
          <!-- <h2>Dossiers</h2> -->
        </div>
        <a href="/league/managers">View all</a>
      </div>
      <div class="manager-grid">
        {#each managers as manager}
          <a class="manager-card" href={'/league/managers/' + manager.slug}>
            <img src={manager.photo} alt={manager.name} />
            <div>
              <strong>{manager.teamName}</strong>
              <div>{manager.name}</div>
            </div>
          </a>
        {/each}
      </div>
    </div>
  </section>

  <section class="grid two-up">
    <div class="card">
      <div class="section-head">
        <div>
          <div class="eyebrow">News Desk</div>
          <h2>Fresh from the lounge</h2>
        </div>
        <a href="/news">News archive</a>
      </div>
      <div class="stack">
        {#each posts as post}
          <a class="story" href={'/news/' + post.slug}>
            <div class="tag">{post.tag}</div>
            <strong>{post.title}</strong>
            <p>{post.excerpt}</p>
          </a>
        {/each}
      </div>
    </div>

    <div class="card glow">
      <div class="section-head">
        <div>
          <div class="eyebrow">Migration posture</div>
          <h2>What this foundation already does</h2>
        </div>
      </div>
      <ul class="checklist">
        <li>Unifies League and Collective under one authenticated shell</li>
        <li>Preserves manager identity, standings, draft data, and history routes</li>
        <li>Points the whole product toward Cloudflare + D1 as the source of truth</li>
        <li>Keeps current games, schedule, leaderboard, and admin flow alive</li>
      </ul>
    </div>
  </section>
</div>

<style>
  .lounge-home { display:grid; gap:24px; }
  .card { background:linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02)); border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:24px; box-shadow:0 20px 60px rgba(0,0,0,0.28); }
  .hero { display:grid; grid-template-columns: 1.5fr 1fr; gap:20px; align-items:stretch; }
  .eyebrow { text-transform:uppercase; letter-spacing:0.2em; font-size:11px; color:var(--gold, #d6b15e); }
  h1 { font-size: clamp(2rem, 5vw, 3.8rem); line-height:1; margin:12px 0; max-width:12ch; }
  .lede { max-width:60ch; color:rgba(255,255,255,0.72); }
  .actions { display:flex; gap:12px; flex-wrap:wrap; margin-top:18px; }
  .hero-side { display:grid; gap:12px; }
  .stat-card { padding:18px; border-radius:18px; background:rgba(0,0,0,0.24); border:1px solid rgba(214,177,94,0.18); display:grid; gap:8px; }
  .stat-card strong { font-size:1.8rem; }
  .grid.two-up { display:grid; grid-template-columns: 1fr 1fr; gap:24px; }
  .section-head { display:flex; align-items:end; justify-content:space-between; gap:12px; margin-bottom:16px; }
  .section-head h2 { margin:4px 0 0; font-size:1.45rem; }
  .section-head a { color:#d6b15e; text-decoration:none; }
  .table-list, .stack, .manager-grid { display:grid; gap:12px; }
  .table-row { display:grid; grid-template-columns: 54px 1fr auto; gap:12px; align-items:center; text-decoration:none; color:inherit; padding:14px; border-radius:16px; background:rgba(255,255,255,0.03); }
  .rank { font-weight:700; color:#d6b15e; }
  .record { color:rgba(255,255,255,0.65); }
  .manager-grid { grid-template-columns: 1fr 1fr; }
  .manager-card { display:grid; grid-template-columns: 72px 1fr; gap:12px; align-items:center; text-decoration:none; color:inherit; padding:12px; border-radius:16px; background:rgba(255,255,255,0.03); }
  .manager-card img { width:72px; height:72px; object-fit:cover; border-radius:14px; }
  .story { text-decoration:none; color:inherit; padding:16px; border-radius:16px; background:rgba(255,255,255,0.03); }
  .story p { color:rgba(255,255,255,0.7); margin:8px 0 0; }
  .tag { display:inline-flex; width:fit-content; padding:5px 10px; border-radius:999px; background:rgba(214,177,94,0.14); color:#d6b15e; font-size:12px; margin-bottom:10px; }
  .glow { box-shadow:0 0 0 1px rgba(214,177,94,0.14), 0 22px 80px rgba(214,177,94,0.08); }
  .checklist { margin:0; padding-left:18px; display:grid; gap:10px; color:rgba(255,255,255,0.78); }
  @media (max-width: 860px) { .hero, .grid.two-up, .manager-grid { grid-template-columns:1fr; } h1 { max-width:none; } }
</style>
