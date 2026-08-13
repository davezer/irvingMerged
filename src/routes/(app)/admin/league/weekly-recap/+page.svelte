<script>
  export let data;
  export let form;

  function pretty(value) {
    if (value == null) {
      return '';
    }

    try {
      return JSON.stringify(
        value,
        null,
        2
      );
    } catch {
      return String(value);
    }
  }

  $: packet =
    form?.packet ||
    null;

  $: summary =
    packet?.summary ||
    null;
</script>

<div class="page-stack">
  <section class="hero">
    <div class="eyebrow">
      League Admin
    </div>

    <h1>
      Weekly Recap Lab
    </h1>

    <p>
      Build the factual data packet that will eventually feed
      the Irving weekly AI writer.
    </p>
  </section>

  <section class="card">
    <div class="section-label">
      Test a completed week
    </div>

    <form
      method="POST"
      action="?/build"
      class="controls"
    >
      <label>
        <span>
          Season
        </span>

        <input
          name="season"
          type="number"
          min="2017"
          max="2100"
          value={form?.season ?? data.defaultSeason}
        />
      </label>

      <label>
        <span>
          Week
        </span>

        <input
          name="week"
          type="number"
          min="1"
          max="18"
          value={form?.week ?? data.defaultWeek}
        />
      </label>

      <button type="submit">
        Build Week Packet
      </button>
    </form>
  </section>

  {#if form && form.ok === false}
    <section class="card error-card">
      <div class="section-label">
        Build failed
      </div>

      <h2>
        Something went wrong
      </h2>

      <p>
        {form.error}
      </p>
    </section>
  {/if}

  {#if packet}
    <section class="card success-card">
      <div class="section-label">
        Packet built
      </div>

      <h2>
        {packet.season} · Week {packet.week}
      </h2>

      <p>
        {packet.league?.name}
      </p>
    </section>

    {#if summary}
      <section class="stats">
        <article class="stat">
          <span>
            Matchups
          </span>

          <strong>
            {summary.matchupCount}
          </strong>
        </article>

        <article class="stat">
          <span>
            Teams
          </span>

          <strong>
            {summary.teamCount}
          </strong>
        </article>

        <article class="stat">
          <span>
            Waivers
          </span>

          <strong>
            {summary.waiverCount}
          </strong>
        </article>

        <article class="stat">
          <span>
            FAAB Spent
          </span>

          <strong>
            ${summary.faabSpent}
          </strong>
        </article>

        <article class="stat">
          <span>
            Free Agents
          </span>

          <strong>
            {summary.freeAgentCount}
          </strong>
        </article>

        <article class="stat">
          <span>
            Trades
          </span>

          <strong>
            {summary.tradeCount}
          </strong>
        </article>
      </section>
    {/if}

    {#if packet.highlights}
      <section class="card">
        <div class="section-label">
          Weekly highlights
        </div>

        <div class="highlight-grid">
          <div>
            <span>
              Highest score
            </span>

            <strong>
              {packet.highlights.highestScoreTeam?.teamName}
            </strong>

            <small>
              {packet.highlights.highestScoreTeam?.score}
            </small>
          </div>

          <div>
            <span>
              Lowest score
            </span>

            <strong>
              {packet.highlights.lowestScoreTeam?.teamName}
            </strong>

            <small>
              {packet.highlights.lowestScoreTeam?.score}
            </small>
          </div>

          <div>
            <span>
              Closest game
            </span>

            <strong>
              {packet.highlights.closestGame?.left?.teamName}
              vs
              {packet.highlights.closestGame?.right?.teamName}
            </strong>

            <small>
              {packet.highlights.closestGame?.margin}
              point margin
            </small>
          </div>

          <div>
            <span>
              Biggest blowout
            </span>

            <strong>
              {packet.highlights.biggestBlowout?.winnerName}
            </strong>

            <small>
              {packet.highlights.biggestBlowout?.margin}
              point margin
            </small>
          </div>

          <div>
            <span>
              Highest-scoring loser
            </span>

            <strong>
              {packet.highlights.highestScoringLoser?.teamName}
            </strong>

            <small>
              {packet.highlights.highestScoringLoser?.score}
            </small>
          </div>
        </div>
      </section>
    {/if}
      {#if packet.standings?.movement?.length}
  <section class="card">
    <div class="section-label">
      Historical standings
    </div>

    <h2>
      After Week {packet.week}
    </h2>

    <p class="muted">
      Reconstructed from Weeks 1–{packet.week}.
      Week {packet.week} median:
      {packet.standings.medianScore ?? '—'}
    </p>

    <div class="standings-table">
      <div class="standings-head">
        <span>Rank</span>
        <span>Team</span>
        <span>Before</span>
        <span>Week</span>
        <span>After</span>
        <span>Move</span>
        <span>PF</span>
      </div>

      {#each packet.standings.movement as row}
        <div class="standings-row">
          <strong>
            {row.afterRank}
          </strong>

          <div class="team-cell">
            <strong>
              {row.teamName}
            </strong>

            <small>
              {row.managerName}
            </small>
          </div>

          <span>
            #{row.beforeRank}
            ·
            {row.beforeRecord}
          </span>

          <strong>
            {row.weekRecord}
          </strong>

          <span>
            {row.afterRecord}
          </span>

          <strong
            class:move-up={row.change > 0}
            class:move-down={row.change < 0}
          >
            {#if row.change > 0}
              ↑ {row.change}
            {:else if row.change < 0}
              ↓ {Math.abs(row.change)}
            {:else}
              —
            {/if}
          </strong>

          <span>
            {row.pointsFor}
          </span>
        </div>
      {/each}
    </div>
  </section>
{/if}

{#if packet.storyFacts}
  <section class="card">
    <div class="section-label">
      Story Facts
    </div>

    <h2>
      Stuff worth writing about
    </h2>

    <p class="muted">
      Deterministic facts and existing Irving badge logic.
      These will eventually feed the AI writer.
    </p>

    <div class="story-grid">
      {#if packet.storyFacts.standings?.biggestClimber}
        <article class="story-card">
          <span>
            Biggest Climber
          </span>

          <strong>
            {packet.storyFacts.standings.biggestClimber.teamName}
          </strong>

          <small>
            #{packet.storyFacts.standings.biggestClimber.beforeRank}
            →
            #{packet.storyFacts.standings.biggestClimber.afterRank}
            ·
            +{packet.storyFacts.standings.biggestClimber.change}
          </small>
        </article>
      {/if}

      {#if packet.storyFacts.standings?.biggestFaller}
        <article class="story-card">
          <span>
            Biggest Fall
          </span>

          <strong>
            {packet.storyFacts.standings.biggestFaller.teamName}
          </strong>

          <small>
            #{packet.storyFacts.standings.biggestFaller.beforeRank}
            →
            #{packet.storyFacts.standings.biggestFaller.afterRank}
            ·
            {packet.storyFacts.standings.biggestFaller.change}
          </small>
        </article>
      {/if}

      {#if packet.storyFacts.faab?.biggestSpend}
        <article class="story-card">
          <span>
            FAAB King
          </span>

          <strong>
            {packet.storyFacts.faab.biggestSpend.teamName}
          </strong>

          <small>
            ${packet.storyFacts.faab.biggestSpend.amount}

            {#if packet.storyFacts.faab.biggestSpend.players?.length}
              ·
              {packet.storyFacts.faab.biggestSpend.players
                .map((player) => player.name)
                .join(', ')}
            {/if}
          </small>
        </article>
      {/if}

      {#if packet.storyFacts.scoring?.benchExplosion}
        <article class="story-card">
          <span>
            Bench Explosion
          </span>

          <strong>
            {packet.storyFacts.scoring.benchExplosion.player.name}
          </strong>

          <small>
            {packet.storyFacts.scoring.benchExplosion.player.fantasyPoints}
            pts on
            {packet.storyFacts.scoring.benchExplosion.teamName}'s bench
          </small>
        </article>
      {/if}
    </div>

    {#if packet.storyFacts.weeklyAwards?.all?.length}
      <div class="award-list">
        <div class="section-label">
          Weekly Badge Facts
        </div>

        {#each packet.storyFacts.weeklyAwards.all as award}
          <article class="award-row">
            <div>
              <strong>
                {award.badgeTitle}
              </strong>

              <small>
                {award.teamName}
              </small>
            </div>

            <p>
              {award.reason}
            </p>
          </article>
        {/each}
      </div>
    {:else}
      <div class="notice">
        No badge preview data was available for this build.
      </div>
    {/if}

    {#if packet.enrichment?.warnings?.length}
      <div class="warning-box">
        {#each packet.enrichment.warnings as warning}
          <p>
            {warning}
          </p>
        {/each}
      </div>
    {/if}
  </section>
{/if}
    <section class="card">
      <div class="section-label">
        Raw authoritative packet
      </div>

      <p class="muted">
        This is what the AI writer will eventually receive.
      </p>

      <pre>{pretty(packet)}</pre>
    </section>
  {/if}
</div>

<style>
  .page-stack {
    display: grid;
    gap: 18px;
    max-width: 1280px;
    margin: 0 auto;
    padding-bottom: 48px;
  }

  .hero,
  .card,
  .stat {
    border: 2px solid #070808;
    border-radius: 16px;
    background:
      linear-gradient(
        180deg,
        rgba(255,255,255,.11),
        rgba(255,255,255,.025) 18%,
        rgba(0,0,0,.14)
      ),
      linear-gradient(
        180deg,
        var(--bug-gray),
        var(--bug-charcoal) 48%,
        var(--bug-black)
      );
    box-shadow: var(--shadow-panel);
  }

  .hero,
  .card {
    padding: 22px;
  }

  .eyebrow,
  .section-label,
  label span,
  .stat span,
  .highlight-grid span {
    color: var(--bug-yellow);
    font-family: var(--font-score);
    font-size: .7rem;
    font-weight: 950;
    letter-spacing: .15em;
    text-transform: uppercase;
  }

  h1,
  h2,
  p {
    margin: 0;
  }

  h1 {
    margin-top: 8px;
    font-family: var(--font-display);
    font-size: clamp(2.5rem, 6vw, 4.5rem);
    line-height: .95;
  }

  h2 {
    margin-top: 8px;
  }

  .hero p,
  .card p {
    margin-top: 10px;
    color: var(--muted);
  }

  .controls {
    display: grid;
    grid-template-columns:
      minmax(120px, 180px)
      minmax(120px, 180px)
      minmax(200px, 1fr);
    gap: 12px;
    align-items: end;
    margin-top: 18px;
  }

  label {
    display: grid;
    gap: 7px;
  }

  .story-grid {
  display: grid;
  grid-template-columns:
    repeat(
      4,
      minmax(0, 1fr)
    );
  gap: 10px;
  margin-top: 18px;
}

.story-card {
  display: grid;
  gap: 7px;
  padding: 16px;
  border:
    1px solid
    rgba(255,255,255,.12);
  border-radius: 10px;
  background:
    rgba(0,0,0,.22);
}

.story-card span {
  color:
    var(--bug-yellow);
  font-family:
    var(--font-score);
  font-size:
    .68rem;
  font-weight:
    950;
  letter-spacing:
    .12em;
  text-transform:
    uppercase;
}

.story-card strong {
  font-size:
    1rem;
}

.story-card small {
  color:
    var(--muted);
  line-height:
    1.35;
}

.award-list {
  display: grid;
  gap: 8px;
  margin-top: 24px;
}

.award-list > .section-label {
  margin-bottom: 4px;
}

.award-row {
  display: grid;
  grid-template-columns:
    minmax(180px, 260px)
    1fr;
  gap: 18px;
  align-items: center;
  padding: 12px 14px;
  border:
    1px solid
    rgba(255,255,255,.1);
  border-radius: 9px;
  background:
    rgba(0,0,0,.18);
}

.award-row > div {
  display: grid;
  gap: 3px;
}

.award-row small {
  color:
    var(--muted);
}

.award-row p {
  margin: 0;
}

.warning-box,
.notice {
  margin-top: 18px;
  padding: 12px 14px;
  border:
    1px solid
    rgba(244,220,123,.35);
  border-radius: 9px;
  background:
    rgba(244,220,123,.06);
}

.warning-box p {
  margin: 0;
}

.warning-box p + p {
  margin-top: 6px;
}

@media (max-width: 1000px) {
  .story-grid {
    grid-template-columns:
      repeat(2, 1fr);
  }
}

@media (max-width: 700px) {
  .story-grid,
  .award-row {
    grid-template-columns:
      1fr;
  }
}

  input {
    min-height: 44px;
    border: 2px solid #070808;
    border-radius: 7px;
    padding: 0 12px;
    background: #f1f0e6;
    color: #111;
    font-family: var(--font-score);
    font-size: 1rem;
    font-weight: 900;
  }

  button {
    min-height: 44px;
    appearance: none;
    border: 2px solid #070808;
    border-radius: 7px;
    padding: 0 18px;
    background:
      linear-gradient(
        180deg,
        #f4dc7b,
        #d7a62e
      );
    color: #111;
    font-family: var(--font-score);
    font-weight: 950;
    text-transform: uppercase;
    cursor: pointer;
  }

  button:hover {
    filter: brightness(1.08);
  }

  .stats {
    display: grid;
    grid-template-columns:
      repeat(
        6,
        minmax(0, 1fr)
      );
    gap: 10px;
  }
  .standings-table {
  display: grid;
  margin-top: 18px;
  overflow-x: auto;
}

.standings-head,
.standings-row {
  display: grid;
  grid-template-columns:
    60px
    minmax(220px, 1.5fr)
    minmax(120px, .8fr)
    80px
    80px
    70px
    90px;
  gap: 12px;
  align-items: center;
  min-width: 850px;
}

.standings-head {
  padding: 10px 12px;
  color: var(--bug-yellow);
  font-family: var(--font-score);
  font-size: .68rem;
  font-weight: 950;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.standings-row {
  min-height: 58px;
  padding: 9px 12px;
  border-top:
    1px solid
    rgba(255,255,255,.1);
}

.standings-row:hover {
  background:
    rgba(255,255,255,.035);
}

.team-cell {
  display: grid;
  gap: 2px;
}

.team-cell small {
  color: var(--muted);
}

.move-up {
  color: #69db8b;
}

.move-down {
  color: #ff7676;
}
  .stat {
    display: grid;
    gap: 7px;
    padding: 16px;
  }

  .stat strong {
    font-family: var(--font-display);
    font-size: 2rem;
  }

  .highlight-grid {
    display: grid;
    grid-template-columns:
      repeat(
        5,
        minmax(0, 1fr)
      );
    gap: 10px;
    margin-top: 16px;
  }

  .highlight-grid > div {
    display: grid;
    gap: 6px;
    padding: 14px;
    border: 1px solid rgba(255,255,255,.12);
    border-radius: 10px;
    background: rgba(0,0,0,.22);
  }

  .highlight-grid strong {
    line-height: 1.2;
  }

  .highlight-grid small {
    color: var(--muted);
  }

  .success-card {
    border-color: rgba(65, 210, 125, .65);
  }

  .error-card {
    border-color: rgba(225, 75, 75, .7);
  }

  pre {
    max-height: 800px;
    overflow: auto;
    margin: 18px 0 0;
    padding: 18px;
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 12px;
    background: rgba(0,0,0,.42);
    color: #eee;
    font-size: .82rem;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .muted {
    color: var(--muted);
  }

  @media (max-width: 1000px) {
    .stats {
      grid-template-columns:
        repeat(3, 1fr);
    }

    .highlight-grid {
      grid-template-columns:
        repeat(2, 1fr);
    }
  }

  @media (max-width: 700px) {
    .controls,
    .stats,
    .highlight-grid {
      grid-template-columns: 1fr;
    }
  }
</style>