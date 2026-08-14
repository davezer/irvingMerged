<script>
  export let recap;
  export let aiMeta = null;
  export let preview = false;
</script>

{#if recap}
  <article class="weekly-recap">
    <header class="recap-header">
      <div>
        <span class="recap-kicker">
          The Irving Weekly
        </span>

        <h1 class="recap-title">
          {recap.title}
        </h1>

        {#if recap.subtitle}
          <p class="recap-subtitle">
            {recap.subtitle}
          </p>
        {/if}
      </div>

      {#if aiMeta || preview}
        <div class="ai-meta">
          {#if aiMeta?.model}
            <span>
              {aiMeta.model}
            </span>
          {/if}

          {#if preview}
            <small>
              Preview only
            </small>
          {/if}
        </div>
      {/if}
    </header>

    <div class="recap-body">
      <div class="recap-opening">
        <p>
          {recap.opening}
        </p>
      </div>

      <section class="recap-section">
        <div class="section-label">
          Matchups
        </div>

        <div class="recap-matchups">
          {#each recap.matchupRecaps || [] as matchup}
            <article
              class="recap-matchup"
              class:featured-matchup={matchup.featured}
            >
              {#if matchup.featured}
                <span class="featured-label">
                  Game of the Week
                </span>
              {/if}

              <h2>
                {matchup.headline}
              </h2>

              <p>
                {matchup.body}
              </p>
            </article>
          {/each}
        </div>
      </section>

      <section class="recap-section">
        <div class="section-label">
          Waiver Wire
        </div>

        <h2>
          {recap.waiverWire?.headline}
        </h2>

        <p>
          {recap.waiverWire?.body}
        </p>

        {#if recap.waiverWire?.notableClaims?.length}
          <div class="recap-mini-grid">
            {#each recap.waiverWire.notableClaims as claim}
              <article class="recap-mini-card">
                <span>
                  {claim.teamName}
                </span>

                <strong>
                  {claim.players?.join(', ')}
                </strong>

                <small>
                  ${claim.faab} FAAB
                </small>

                <p>
                  {claim.commentary}
                </p>
              </article>
            {/each}
          </div>
        {/if}
      </section>

      <section class="recap-section">
        <div class="section-label">
          Trade Desk
        </div>

        <h2>
          {recap.tradeDesk?.headline}
        </h2>

        <p>
          {recap.tradeDesk?.body}
        </p>

        {#if recap.tradeDesk?.items?.length}
          <div class="recap-list">
            {#each recap.tradeDesk.items as trade}
              <article>
                <h3>
                  {trade.headline}
                </h3>

                <p>
                  {trade.body}
                </p>
              </article>
            {/each}
          </div>
        {/if}
      </section>

      <section class="recap-section">
        <div class="section-label">
          Standings Watch
        </div>

        <h2>
          {recap.standings?.headline}
        </h2>

        <p>
          {recap.standings?.body}
        </p>
      </section>

      <section class="recap-section">
        <div class="section-label">
          Badge Cabinet
        </div>

        <h2>
          {recap.awards?.headline}
        </h2>

        {#if recap.awards?.items?.length}
          <div class="recap-mini-grid">
            {#each recap.awards.items as award}
              <article class="recap-mini-card">
                <span>
                  {award.title}
                </span>

                <strong>
                  {award.teamName}
                </strong>

                <p>
                  {award.body}
                </p>
              </article>
            {/each}
          </div>
        {/if}
      </section>

      <footer class="recap-closing">
        <p>
          {recap.closing}
        </p>
      </footer>
    </div>
  </article>
{/if}

<style>
  .weekly-recap {
    width: 100%;
    border: 2px solid #070808;
    border-radius: 16px;
    padding: 24px;
    background:
      linear-gradient(
        180deg,
        rgba(255,255,255,.05),
        rgba(255,255,255,.015) 18%,
        rgba(0,0,0,.18)
      ),
      linear-gradient(
        180deg,
        var(--bug-gray),
        var(--bug-charcoal) 42%,
        var(--bug-black)
      );
    box-shadow: var(--shadow-panel);
  }

  .recap-header {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: flex-start;
    padding-bottom: 22px;
    border-bottom:
      1px solid
      rgba(255,255,255,.10);
  }

  .recap-kicker,
  .featured-label,
  .ai-meta span,
  .section-label {
    color: #67dbe8;
    font-family: var(--font-score);
    font-size: .68rem;
    font-weight: 950;
    letter-spacing: .14em;
    text-transform: uppercase;
  }

  .section-label {
    color: var(--bug-yellow);
  }

  .recap-title {
    max-width: 900px;
    margin: 8px 0 0;
    font-family: var(--font-display);
    font-size: clamp(2.2rem, 4vw, 4rem);
    line-height: .96;
    text-wrap: balance;
  }

  .recap-subtitle {
    max-width: 760px;
    margin: 12px 0 0;
    color: #e2ddd2;
    font-size: 1rem;
    line-height: 1.45;
  }

  .ai-meta {
    display: grid;
    gap: 4px;
    justify-items: end;
    min-width: max-content;
    padding-top: 6px;
  }

  .ai-meta small {
    color: var(--muted);
  }

  .recap-body {
    max-width: 980px;
    margin: 0 auto;
  }

  .recap-opening {
    padding: 26px 0 10px;
  }

  .recap-opening p {
    margin: 0;
    color: #f2eee3;
    font-size: 1.08rem;
    line-height: 1.75;
  }

  .recap-section {
    display: grid;
    gap: 14px;
    margin-top: 28px;
    padding-top: 22px;
    border-top:
      1px solid
      rgba(255,255,255,.08);
  }

  .recap-section h2 {
    margin: 0;
    font-size: 1.8rem;
    line-height: 1.1;
  }

  .recap-section > p,
  .recap-matchup p,
  .recap-mini-card p,
  .recap-list p {
    margin: 0;
    color: #e8e2d7;
    line-height: 1.68;
  }

  .recap-matchups {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .recap-matchup {
    display: grid;
    align-content: start;
    gap: 10px;
    padding: 18px 20px;
    border:
      1px solid
      rgba(255,255,255,.10);
    border-radius: 14px;
    background:
      rgba(255,255,255,.025);
  }

  .recap-matchup h2 {
    margin: 0;
    font-size: 1.35rem;
    line-height: 1.2;
  }

  .featured-matchup {
    border-color:
      rgba(244,220,123,.42);
    background:
      linear-gradient(
        180deg,
        rgba(244,220,123,.06),
        rgba(244,220,123,.025)
      );
  }

  .recap-mini-grid {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-top: 4px;
  }

  .recap-mini-card {
    display: grid;
    align-content: start;
    gap: 8px;
    padding: 16px;
    border:
      1px solid
      rgba(255,255,255,.09);
    border-radius: 12px;
    background:
      rgba(255,255,255,.02);
  }

  .recap-mini-card > span {
    color: var(--bug-yellow);
    font-family: var(--font-score);
    font-size: .67rem;
    font-weight: 950;
    letter-spacing: .1em;
    text-transform: uppercase;
  }

  .recap-mini-card strong {
    font-size: 1.08rem;
    line-height: 1.25;
  }

  .recap-mini-card small {
    color: var(--muted);
  }

  .recap-list {
    display: grid;
    gap: 10px;
  }

  .recap-list article {
    display: grid;
    gap: 7px;
    padding: 13px 16px;
    border-left:
      4px solid
      rgba(103,219,232,.42);
    border-radius:
      0 9px 9px 0;
    background:
      rgba(255,255,255,.018);
  }

  .recap-list h3 {
    margin: 0;
    font-size: 1rem;
    line-height: 1.25;
  }

  .recap-closing {
    margin-top: 32px;
    padding: 24px 0 4px;
    border-top:
      2px solid
      rgba(244,220,123,.38);
  }

  .recap-closing p {
    margin: 0;
    color: #f4f0e5;
    font-size: 1.06rem;
    font-weight: 700;
    line-height: 1.65;
  }

  @media (max-width: 760px) {
    .weekly-recap {
      padding: 18px;
    }

    .recap-header {
      display: grid;
    }

    .ai-meta {
      justify-items: start;
    }

    .recap-mini-grid {
      grid-template-columns: 1fr;
    }

    .recap-title {
      font-size:
        clamp(2rem, 10vw, 3rem);
    }
  }
</style>