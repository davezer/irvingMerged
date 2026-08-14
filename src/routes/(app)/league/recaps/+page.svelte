<script>
  export let data;
</script>

<div class="recap-archive">
  <header class="archive-hero">
    <div class="eyebrow">
      League Media
    </div>

    <h1>
      The Irving Weekly
    </h1>

    <p>
      Matchups, waiver chaos, trades, stains, triumphs,
      and whatever the hell else happened this week.
    </p>
  </header>

  {#if data.recaps.length}
    {#each data.seasons as season}
      <section class="season-section">
        <div class="season-heading">
          <span>
            Season
          </span>

          <h2>
            {season}
          </h2>
        </div>

        <div class="recap-grid">
          {#each data.recaps.filter(
            (recap) =>
              recap.season ===
              season
          ) as recap}
            <a
              class="recap-card"
              href={`/league/recaps/${recap.season}/${recap.week}`}
            >
              <div class="week">
                Week {recap.week}
              </div>

              <h3>
                {recap.title}
              </h3>

              {#if recap.subtitle}
                <p>
                  {recap.subtitle}
                </p>
              {/if}

              <div class="read-link">
                Read the column →
              </div>
            </a>
          {/each}
        </div>
      </section>
    {/each}
  {:else}
    <section class="empty">
      <div>
        No Irving Weekly editions have been published yet.
      </div>
    </section>
  {/if}
</div>

<style>
  .recap-archive {
    display: grid;
    gap: 28px;
    max-width: 1180px;
    margin: 0 auto;
    padding-bottom: 48px;
  }

  .archive-hero {
    padding: 28px;
    border: 2px solid #070808;
    border-radius: 16px;
    background:
      linear-gradient(
        180deg,
        rgba(255,255,255,.10),
        rgba(255,255,255,.02) 20%,
        rgba(0,0,0,.18)
      ),
      linear-gradient(
        180deg,
        var(--bug-gray),
        var(--bug-charcoal),
        var(--bug-black)
      );
    box-shadow: var(--shadow-panel);
  }

  .eyebrow,
  .season-heading span,
  .week {
    color: var(--bug-yellow);
    font-family: var(--font-score);
    font-size: .7rem;
    font-weight: 950;
    letter-spacing: .14em;
    text-transform: uppercase;
  }

  h1 {
    margin: 8px 0 0;
    font-family: var(--font-display);
    font-size: clamp(3rem, 7vw, 5.5rem);
    line-height: .9;
  }

  .archive-hero p {
    max-width: 700px;
    margin: 14px 0 0;
    color: var(--muted);
    font-size: 1.05rem;
    line-height: 1.5;
  }

  .season-section {
    display: grid;
    gap: 14px;
  }

  .season-heading {
    display: flex;
    gap: 10px;
    align-items: baseline;
  }

  .season-heading h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 2rem;
  }

  .recap-grid {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );
    gap: 12px;
  }

  .recap-card {
    display: grid;
    align-content: start;
    gap: 10px;
    min-height: 190px;
    padding: 20px;
    border: 2px solid #070808;
    border-radius: 14px;
    background:
      linear-gradient(
        180deg,
        rgba(255,255,255,.07),
        rgba(0,0,0,.08)
      ),
      linear-gradient(
        180deg,
        #303735,
        #151817
      );
    color: inherit;
    text-decoration: none;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.12),
      0 5px 14px rgba(0,0,0,.18);
    transition:
      transform .14s ease,
      border-color .14s ease;
  }

  .recap-card:hover {
    transform: translateY(-2px);
    border-color:
      rgba(244,220,123,.6);
  }

  .recap-card h3 {
    margin: 0;
    font-size: 1.45rem;
    line-height: 1.1;
  }

  .recap-card p {
    margin: 0;
    color: var(--muted);
    line-height: 1.45;
  }

  .read-link {
    margin-top: auto;
    color: #67dbe8;
    font-family: var(--font-score);
    font-size: .72rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .empty {
    padding: 30px;
    border:
      1px solid
      rgba(255,255,255,.12);
    border-radius: 14px;
    color: var(--muted);
  }

  @media (max-width: 760px) {
    .recap-grid {
      grid-template-columns: 1fr;
    }
  }
</style>